/**
 * Generated Workspace Dependency Materialization — authority orchestrator (Phase 26.78).
 * Read-only by default. No nested validators.
 */

import { createHash } from 'node:crypto';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { resolvePrimaryWorkspace } from '../runtime-startup-proof-repair/runtime-entrypoint-discovery.js';
import { scanDependencyPresence, dependenciesReadyFromScan } from './dependency-presence-scanner.js';
import { buildDependencyMaterializationRepairPlan } from './dependency-materialization-repair-planner.js';
import {
  buildGeneratedWorkspaceDependencyMaterializationReportMarkdown,
  buildGeneratedWorkspaceDependencyRepairPlanMarkdown,
} from './generated-workspace-dependency-materialization-report-builder.js';
import {
  GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_CACHE_KEY_PREFIX,
  GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_CORE_QUESTION,
  GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS,
} from './generated-workspace-dependency-materialization-registry.js';
import {
  recordGeneratedWorkspaceDependencyMaterializationAssessment,
  resetGeneratedWorkspaceDependencyMaterializationHistoryForTests,
} from './generated-workspace-dependency-materialization-history.js';
import {
  probeModuleResolution,
  extractMissingModulesFromLogs,
} from './module-resolution-probe.js';
import { resolvePackageManager } from './package-manager-resolver.js';
import { readWorkspacePackageManifest } from './workspace-package-manifest-reader.js';
import type {
  AssessGeneratedWorkspaceDependencyMaterializationInput,
  GeneratedWorkspaceDependencyMaterializationAssessment,
  GeneratedWorkspaceDependencyMaterializationReport,
} from './generated-workspace-dependency-materialization-types.js';

let assessmentCounter = 0;

export function resetGeneratedWorkspaceDependencyMaterializationCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetGeneratedWorkspaceDependencyMaterializationModuleForTests(): void {
  resetGeneratedWorkspaceDependencyMaterializationCounterForTests();
  resetGeneratedWorkspaceDependencyMaterializationHistoryForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `generated-workspace-dependency-materialization-${assessmentCounter}-${Date.now()}`;
}

function stableCacheKey(assessmentId: string, dependencyState: string, ready: boolean): string {
  const digest = createHash('sha256')
    .update([
      GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS,
      assessmentId,
      dependencyState,
      String(ready),
    ].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_CACHE_KEY_PREFIX}:${digest}`;
}

function buildRecommendedFix(
  dependenciesReady: boolean,
  installCommand: string,
  installCwd: string,
  missingSummary: string,
): string {
  if (dependenciesReady) {
    return 'Dependencies ready — proceed with bounded runtime startup probe.';
  }
  return `Run \`${installCommand}\` in \`${installCwd}\` to materialize: ${missingSummary}`;
}

export function assessGeneratedWorkspaceDependencyMaterialization(
  input: AssessGeneratedWorkspaceDependencyMaterializationInput = {},
): GeneratedWorkspaceDependencyMaterializationAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();

  const buildMaterializationReport =
    input.buildMaterializationReport ??
    assessConnectedBuildExecution({
      rootDir,
      attemptBuildProofGapMaterialization: false,
    }).report;

  const workspace = resolvePrimaryWorkspace({
    rootDir,
    buildMaterializationReport,
    workspacePath: input.workspacePath,
    workspaceId: input.workspaceId,
  });

  const logHints = [
    ...(input.startupProbeLogs ?? []),
    ...(input.startupFatalErrors ?? []),
  ];

  if (!workspace) {
    const emptyManifest = readWorkspacePackageManifest(rootDir);
    const moduleProbe = probeModuleResolution({ workspaceAbs: rootDir, skipProbe: true });
    const presence = scanDependencyPresence({
      workspaceAbs: rootDir,
      manifest: emptyManifest,
      moduleProbe,
      startupLogHints: logHints,
    });
    const packageManager = resolvePackageManager({ workspaceAbs: rootDir, manifest: emptyManifest });
    const repairPlan = buildDependencyMaterializationRepairPlan({
      workspaceRoot: 'none',
      packageManager,
      presence,
      allowAutoInstall: input.allowAutoInstall,
    });

    const report: GeneratedWorkspaceDependencyMaterializationReport = {
      readOnly: true,
      advisoryOnly: true,
      assessmentId,
      generatedAt: new Date().toISOString(),
      coreQuestion: GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_CORE_QUESTION,
      workspaceRoot: 'none',
      workspaceId: 'none',
      manifest: emptyManifest,
      packageManager,
      presence,
      moduleProbe,
      repairPlan,
      dependencyState: 'UNKNOWN_DEPENDENCY_STATE',
      dependenciesReady: false,
      connectedBuildProofLevel: buildMaterializationReport.proofLevel,
      startupProbeLogHints: logHints,
      recommendedFix: 'Resolve generated workspace before dependency materialization.',
      cacheKey: stableCacheKey(assessmentId, 'UNKNOWN_DEPENDENCY_STATE', false),
    };

    const assessment: GeneratedWorkspaceDependencyMaterializationAssessment = {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'DEPENDENCY_MATERIALIZATION_COMPLETE',
      report,
      cacheKey: report.cacheKey,
    };
    if (!input.skipHistoryRecording) {
      recordGeneratedWorkspaceDependencyMaterializationAssessment(assessment);
    }
    return assessment;
  }

  const manifest = readWorkspacePackageManifest(workspace.workspaceAbs);
  const moduleProbe = probeModuleResolution({
    workspaceAbs: workspace.workspaceAbs,
    skipProbe: input.skipModuleProbe,
  });

  const logMissing = extractMissingModulesFromLogs(logHints);
  const mergedProbe =
    logMissing.length > 0
      ? {
          ...moduleProbe,
          unresolvedModules: [...new Set([...moduleProbe.unresolvedModules, ...logMissing])],
          probeSucceeded: moduleProbe.probeSucceeded && logMissing.length === 0,
          probeReason:
            logMissing.length > 0
              ? `Startup logs report missing: ${logMissing.join(', ')}`
              : moduleProbe.probeReason,
        }
      : moduleProbe;

  const presence = scanDependencyPresence({
    workspaceAbs: workspace.workspaceAbs,
    manifest,
    moduleProbe: mergedProbe,
    startupLogHints: logHints,
  });

  const packageManager = resolvePackageManager({
    workspaceAbs: workspace.workspaceAbs,
    manifest,
  });

  const repairPlan = buildDependencyMaterializationRepairPlan({
    workspaceRoot: workspace.workspaceRoot,
    packageManager,
    presence,
    allowAutoInstall: input.allowAutoInstall,
  });

  const dependenciesReady = dependenciesReadyFromScan(presence);
  const recommendedFix = buildRecommendedFix(
    dependenciesReady,
    repairPlan.installCommand,
    repairPlan.installCwd,
    repairPlan.missingModulesSummary,
  );

  const cacheKey = stableCacheKey(assessmentId, presence.dependencyState, dependenciesReady);
  const report: GeneratedWorkspaceDependencyMaterializationReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    coreQuestion: GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_CORE_QUESTION,
    workspaceRoot: workspace.workspaceRoot,
    workspaceId: workspace.workspaceId,
    manifest,
    packageManager,
    presence,
    moduleProbe: mergedProbe,
    repairPlan,
    dependencyState: presence.dependencyState,
    dependenciesReady,
    connectedBuildProofLevel: buildMaterializationReport.proofLevel,
    startupProbeLogHints: logHints,
    recommendedFix,
    cacheKey,
  };

  const assessment: GeneratedWorkspaceDependencyMaterializationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'DEPENDENCY_MATERIALIZATION_COMPLETE',
    report,
    cacheKey,
  };

  if (!input.skipHistoryRecording) {
    recordGeneratedWorkspaceDependencyMaterializationAssessment(assessment);
  }

  return assessment;
}

export {
  buildGeneratedWorkspaceDependencyMaterializationReportMarkdown,
  buildGeneratedWorkspaceDependencyRepairPlanMarkdown,
};
