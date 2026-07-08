/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — orchestrator.
 */

import { join } from 'node:path';
import {
  REPO_TYPECHECK_MAX_REPAIR_CYCLES,
  type RepoTypecheckPatchRecord,
  type RepoTypecheckStabilizationReport,
  type RunRepositoryTypecheckStabilizationInput,
  type RunRepositoryTypecheckStabilizationResult,
  type RepoTypecheckVerdict,
} from './repo-typecheck-types.js';
import { classifyDiagnostics } from './repo-typecheck-classifier.js';
import { planRepoTypecheckRepair } from './repo-typecheck-repair-planner.js';
import {
  applyRepoTypecheckRepairPatch,
  capturePatchSnapshot,
  finalizePatchRecord,
  rollbackPatchSnapshot,
} from './repo-typecheck-safe-patcher.js';
import { buildRepoTypecheckStabilizationReport } from './repo-typecheck-report.js';
import { discoverRepositoryTypecheckCommand, runRepositoryTypecheckScan } from './repo-typecheck-scanner.js';
import { validateRepoTypecheckAfterRepair } from './repo-typecheck-validator.js';

export function runRepositoryTypecheckStabilization(
  input: RunRepositoryTypecheckStabilizationInput = {},
): RunRepositoryTypecheckStabilizationResult {
  const startedAt = performance.now();
  const projectRootDir = input.projectRootDir ?? process.cwd();
  const command = input.command ?? discoverRepositoryTypecheckCommand(projectRootDir);
  const maxCycles = Math.min(input.maxCycles ?? REPO_TYPECHECK_MAX_REPAIR_CYCLES, REPO_TYPECHECK_MAX_REPAIR_CYCLES);
  const dryRun = input.dryRun ?? false;

  const initialScan = runRepositoryTypecheckScan({ projectRootDir, command });
  if (initialScan.passed) {
    const report = buildRepoTypecheckStabilizationReport({
      startedAt,
      command,
      initialDiagnostics: initialScan.diagnostics,
      initialErrorCount: initialScan.errorCount,
      finalDiagnostics: initialScan.diagnostics,
      finalErrorCount: initialScan.errorCount,
      rootCauseSelected: null,
      patches: [],
      repairCycles: 0,
      verdict: 'TYPECHECK_ALREADY_CLEAN',
    });
    return { readOnly: true, report, typecheckClean: true };
  }

  let currentScan = initialScan;
  const patches: RepoTypecheckPatchRecord[] = [];
  let rootCauseSelected = null;
  let repairCycles = 0;
  let lastVerdict: RepoTypecheckVerdict | null = null;

  for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
    const plan = planRepoTypecheckRepair({
      diagnostics: currentScan.diagnostics,
      projectRootDir,
    });

    if (!plan) {
      lastVerdict = 'TYPECHECK_EXHAUSTED';
      break;
    }

    rootCauseSelected = plan.rootCause;

    if (!plan.safe) {
      const report = buildRepoTypecheckStabilizationReport({
        startedAt,
        command,
        initialDiagnostics: initialScan.diagnostics,
        initialErrorCount: initialScan.errorCount,
        finalDiagnostics: currentScan.diagnostics,
        finalErrorCount: currentScan.errorCount,
        rootCauseSelected,
        patches,
        repairCycles,
        verdict: plan.rootCause.failureClass === 'UNKNOWN_TYPESCRIPT_FAILURE' ? 'TYPECHECK_UNSAFE' : 'TYPECHECK_BLOCKED',
      });
      return { readOnly: true, report, typecheckClean: false };
    }

    if (dryRun) {
      patches.push({
        readOnly: true,
        cycle,
        plan,
        filesModified: plan.targetFiles,
        beforeErrorCount: currentScan.errorCount,
        afterErrorCount: currentScan.errorCount,
        errorsRemoved: 0,
        applied: false,
        rolledBack: false,
        detail: 'Dry run — patch not applied',
      });
      lastVerdict = 'TYPECHECK_PARTIALLY_REPAIRED';
      break;
    }

    const targetFiles = plan.targetFiles.map((file) =>
      file.startsWith(projectRootDir) ? file : join(projectRootDir, file),
    );
    const snapshot = capturePatchSnapshot(projectRootDir, plan.targetFiles);
    const patch = applyRepoTypecheckRepairPatch({
      cycle,
      plan,
      projectRootDir,
      beforeErrorCount: currentScan.errorCount,
    });

    if (!patch.applied) {
      patches.push(patch);
      lastVerdict = 'TYPECHECK_EXHAUSTED';
      break;
    }

    const validation = validateRepoTypecheckAfterRepair({
      projectRootDir,
      command,
      beforeErrorCount: currentScan.errorCount,
    });

    repairCycles += 1;
    let finalized = finalizePatchRecord(patch, validation.afterErrorCount);

    if (validation.regression) {
      rollbackPatchSnapshot(snapshot);
      finalized = {
        ...finalized,
        rolledBack: true,
        afterErrorCount: currentScan.errorCount,
        errorsRemoved: 0,
        detail: `${finalized.detail}; rolled back due to regression`,
      };
      patches.push(finalized);
      const report = buildRepoTypecheckStabilizationReport({
        startedAt,
        command,
        initialDiagnostics: initialScan.diagnostics,
        initialErrorCount: initialScan.errorCount,
        finalDiagnostics: currentScan.diagnostics,
        finalErrorCount: currentScan.errorCount,
        rootCauseSelected,
        patches,
        repairCycles,
        verdict: 'TYPECHECK_REPAIR_REGRESSION',
      });
      return { readOnly: true, report, typecheckClean: false };
    }

    patches.push(finalized);
    currentScan = validation.scan;

    if (validation.passed) {
      const report = buildRepoTypecheckStabilizationReport({
        startedAt,
        command,
        initialDiagnostics: initialScan.diagnostics,
        initialErrorCount: initialScan.errorCount,
        finalDiagnostics: currentScan.diagnostics,
        finalErrorCount: currentScan.errorCount,
        rootCauseSelected,
        patches,
        repairCycles,
        verdict: 'TYPECHECK_REPAIRED',
      });
      return { readOnly: true, report, typecheckClean: true };
    }

    lastVerdict = 'TYPECHECK_PARTIALLY_REPAIRED';
  }

  const finalVerdict: RepoTypecheckVerdict =
    currentScan.passed
      ? 'TYPECHECK_REPAIRED'
      : repairCycles > 0 && currentScan.errorCount < initialScan.errorCount
        ? 'TYPECHECK_PARTIALLY_REPAIRED'
        : lastVerdict ?? 'TYPECHECK_EXHAUSTED';

  const report = buildRepoTypecheckStabilizationReport({
    startedAt,
    command,
    initialDiagnostics: initialScan.diagnostics,
    initialErrorCount: initialScan.errorCount,
    finalDiagnostics: currentScan.diagnostics,
    finalErrorCount: currentScan.errorCount,
    rootCauseSelected,
    patches,
    repairCycles,
    verdict: finalVerdict,
  });

  return {
    readOnly: true,
    report,
    typecheckClean: currentScan.passed,
  };
}

export function summarizeRepoTypecheckFailureClasses(
  diagnostics: RunRepositoryTypecheckStabilizationResult['report']['initialDiagnostics'],
): ReturnType<typeof classifyDiagnostics> {
  return classifyDiagnostics(diagnostics);
}
