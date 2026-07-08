/**
 * AEE Build AutoFix Loop V1 — route-level matrix validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AEE_BUILD_AUTOFIX_LOOP_V1_PASS_TOKEN,
  AEE_BUILD_AUTOFIX_MAX_ATTEMPTS,
  classifyBuildFailure,
  evaluateAeeExecutiveDecision,
  isBuildAutofixEligible,
  resolveAeeBuildOutcome,
} from '../../src/autonomous-engineering-executive/index.js';
import { resetOnePromptLivePreviewForTests } from '../../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../../src/aidev-engine/aidev-engine-authority.js';
import { runOnePromptLivePreviewBuild } from '../../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import type { OnePromptLivePreviewBuildResult } from '../../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../../src/universal-build-pipeline-verification/universal-build-pipeline-matrix.js';

export { AEE_BUILD_AUTOFIX_LOOP_V1_PASS_TOKEN };

export const AEE_BUILD_AUTOFIX_MATRIX_IDS = [
  'expense-tracker',
  'saas-crm',
  'ai-chat-app',
] as const;

export interface AeeBuildAutofixCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface AeeBuildAutofixRow {
  categoryId: string;
  label: string;
  npmBuildInitialFail: boolean;
  autofixAttempts: number;
  npmBuildFinalOk: boolean;
  aeeDecision: string | null;
  finalOutcome: string | null;
  previewReached: boolean;
  durationMs: number;
}

export function resetAeeBuildAutofixTestHarness(): void {
  resetOnePromptLivePreviewForTests();
  resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

export async function runAeeBuildAutofixLoopValidation(rootDir: string): Promise<{
  checks: AeeBuildAutofixCheck[];
  rows: AeeBuildAutofixRow[];
  allPassed: boolean;
}> {
  const checks: AeeBuildAutofixCheck[] = [];
  const rows: AeeBuildAutofixRow[] = [];

  const push = (name: string, passed: boolean, detail: string): void => {
    checks.push({ name, passed, detail });
  };

  const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const orchestrator = readFileSync(
    join(rootDir, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const decisionEngine = readFileSync(
    join(rootDir, 'src/autonomous-engineering-executive/aee-decision-engine.ts'),
    'utf8',
  );

  push('01. package script', Boolean(pkg.scripts?.['validate:aee-build-autofix-loop']), 'script');
  push(
    '02. build autofix module',
    existsSync(join(rootDir, 'src/autonomous-engineering-executive/aee-build-autofix-loop.ts')),
    'module',
  );
  push('03. orchestrator wires build autofix loop', orchestrator.includes('runAeeBuildAutofixLoop'), 'wired');
  push(
    '04. orchestrator injects validator build fault',
    orchestrator.includes('simulateBuildAutofixFailure'),
    'simulation hook',
  );
  push(
    '05. decision engine build REPAIR branch',
    decisionEngine.includes('AEE bounded build AutoFix repair loop'),
    'decision engine',
  );
  push(
    '06. not app-specific module naming',
    !readFileSync(join(rootDir, 'src/autonomous-engineering-executive/aee-build-autofix-loop.ts'), 'utf8').includes(
      'TASK_TRACKER',
    ),
    'generic module',
  );

  push(
    '07. classify typescript error',
    classifyBuildFailure('error TS2345: Argument of type string is not assignable') === 'TYPESCRIPT_ERROR',
    'TS2345',
  );
  push(
    '08. classify missing dependency',
    classifyBuildFailure("Cannot find module 'lodash'") === 'MISSING_DEPENDENCY',
    'lodash',
  );
  push(
    '09. classify missing import',
    classifyBuildFailure('TS2305: Module has no exported member Foo') === 'MISSING_IMPORT_EXPORT',
    'TS2305',
  );
  push(
    '10. build autofix eligible after install pass',
    isBuildAutofixEligible({ npmInstallOk: true, npmBuildOk: false }),
    'eligible',
  );

  resetAeeBuildAutofixTestHarness();

  for (const categoryId of AEE_BUILD_AUTOFIX_MATRIX_IDS) {
    const entry = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((row) => row.categoryId === categoryId);
    if (!entry) {
      push(`${categoryId}: matrix entry exists`, false, 'missing matrix entry');
      continue;
    }

    const startedAt = Date.now();
    const projectId = `aee-build-autofix-${categoryId}-${Date.now()}`;
    let build: OnePromptLivePreviewBuildResult;

    try {
      build = await runOnePromptLivePreviewBuild({
        rawPrompt: entry.prompt,
        projectRootDir: rootDir,
        source: 'validator',
        projectId,
        projectName: entry.categoryLabel,
        simulateBuildAutofixFailure: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      build = {
        readOnly: true,
        buildId: 'error',
        projectId,
        projectName: entry.categoryLabel,
        status: 'FAILED',
        prompt: entry.prompt,
        requestType: 'BUILD_FROM_PROMPT',
        workspaceId: projectId,
        workspacePath: null,
        generatedProfile: null,
        planningProofLevel: null,
        materializationProofLevel: null,
        buildResult: 'FAIL',
        npmInstallOk: false,
        npmBuildOk: false,
        previewUrl: null,
        diagnosticPreviewUrl: null,
        limitedPreviewUrl: null,
        devServerRunning: false,
        livePreviewAvailable: false,
        failureReason: message,
        featureSignals: null,
        materializationManifest: null,
        livePreviewGate: null,
        autonomousSoftwareEngineering: null,
        updatedAt: new Date().toISOString(),
      };
    }

    const autofixReport = build.buildAutofixLoop?.report ?? build.aeeFinalReport?.buildAutofixReport ?? null;
    const row: AeeBuildAutofixRow = {
      categoryId,
      label: entry.categoryLabel,
      npmBuildInitialFail: autofixReport?.npmBuildInitialResult === 'FAIL',
      autofixAttempts: build.buildAutofixAttempts ?? autofixReport?.autofixAttempts.length ?? 0,
      npmBuildFinalOk: build.npmBuildOk,
      aeeDecision: build.aeeExecutiveDecision?.decision ?? build.aeeFinalReport?.finalDecision ?? null,
      finalOutcome: build.aeeFinalReport?.finalOutcome ?? null,
      previewReached: build.previewStatus !== 'NOT_ATTEMPTED' || Boolean(build.previewUrl || build.devServerRunning),
      durationMs: Date.now() - startedAt,
    };
    rows.push(row);

    push(
      `${categoryId}: initial npm build failed`,
      row.npmBuildInitialFail,
      autofixReport?.initialBuildError ?? build.failureReason ?? 'no report',
    );
    push(
      `${categoryId}: AEE AutoFix attempts bounded`,
      row.autofixAttempts > 0 && row.autofixAttempts <= AEE_BUILD_AUTOFIX_MAX_ATTEMPTS,
      String(row.autofixAttempts),
    );
    push(`${categoryId}: npm build reran to PASS`, row.npmBuildFinalOk, build.failureReason ?? 'PASS');
    push(
      `${categoryId}: continues toward preview after repair`,
      row.npmBuildFinalOk && (build.status === 'READY' || build.devServerRunning || Boolean(build.previewUrl)),
      build.status,
    );
    push(
      `${categoryId}: build autofix report present`,
      Boolean(autofixReport?.summary.includes('AEE_BUILD_AUTOFIX_LOOP_V1')),
      autofixReport?.summary.slice(0, 80) ?? 'missing',
    );
  }

  const exhaustedProjectId = `aee-build-autofix-exhausted-${Date.now()}`;
  resetAeeBuildAutofixTestHarness();
  const exhaustedEntry =
    UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'recipe-planner') ??
    UNIVERSAL_BUILD_PIPELINE_MATRIX[0]!;
  let exhaustedBuild: OnePromptLivePreviewBuildResult;
  try {
    exhaustedBuild = await runOnePromptLivePreviewBuild({
      rawPrompt: exhaustedEntry.prompt,
      projectRootDir: rootDir,
      source: 'validator',
      projectId: exhaustedProjectId,
      projectName: 'Build AutoFix Exhausted Validation',
      simulateBuildAutofixFailure: true,
      simulateBuildAutofixExhausted: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    exhaustedBuild = {
      readOnly: true,
      buildId: 'error',
      projectId: exhaustedProjectId,
      projectName: 'Build AutoFix Exhausted Validation',
      status: 'FAILED',
      prompt: exhaustedEntry.prompt,
      requestType: 'BUILD_FROM_PROMPT',
      workspaceId: exhaustedProjectId,
      workspacePath: null,
      generatedProfile: null,
      planningProofLevel: null,
      materializationProofLevel: null,
      buildResult: 'FAIL',
      npmInstallOk: true,
      npmBuildOk: false,
      previewUrl: null,
      diagnosticPreviewUrl: null,
      limitedPreviewUrl: null,
      devServerRunning: false,
      livePreviewAvailable: false,
      failureReason: message,
      featureSignals: null,
      materializationManifest: null,
      livePreviewGate: null,
      autonomousSoftwareEngineering: null,
      updatedAt: new Date().toISOString(),
    };
  }

  const exhaustedOutcome =
    exhaustedBuild.aeeFinalReport?.finalOutcome ??
    resolveAeeBuildOutcome({
      workspaceExists: true,
      materialized: true,
      npmInstallOk: true,
      npmBuildOk: false,
      previewOk: false,
      previewDegraded: false,
      repairAttempts: exhaustedBuild.buildAutofixAttempts ?? AEE_BUILD_AUTOFIX_MAX_ATTEMPTS,
      concreteBlocker: false,
    });

  push(
    '11. exhausted repair returns BUILD_COMPLETED_WITH_BUILD_ERRORS',
    exhaustedOutcome === 'BUILD_COMPLETED_WITH_BUILD_ERRORS',
    String(exhaustedOutcome),
  );
  push(
    '12. exhausted repair not generic FAILED status',
    exhaustedBuild.status === 'READY' && !exhaustedBuild.npmBuildOk,
    exhaustedBuild.status,
  );
  push(
    '13. exhausted repair report lists remaining errors',
    (exhaustedBuild.buildAutofixLoop?.report.remainingErrors.length ?? 0) > 0,
    String(exhaustedBuild.buildAutofixLoop?.report.remainingErrors.length ?? 0),
  );

  const planEntry = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'expense-tracker')!;
  const repairDecision = evaluateAeeExecutiveDecision({
    workspaceDir: join(rootDir, '.generated-builder-workspaces', 'aee-build-autofix-unit'),
    buildPlan: resolvePromptFaithfulBuildPlan(planEntry.prompt),
    rawPrompt: planEntry.prompt,
    projectId: 'aee-build-autofix-unit',
    projectName: 'Build AutoFix Unit',
    aseBlockers: ['npm run build failed: TS2307'],
    aseMaterializationAuthorized: true,
    aseMaterializationExecuted: true,
    manifestFaithfulness: { status: 'PASS', score: 90 },
    npmInstallOk: true,
    npmBuildOk: false,
    repairAttempts: 0,
  });
  push('14. AEE REPAIR decision on npm build failure', repairDecision.decision === 'REPAIR', repairDecision.decision);

  const allPassed = checks.every((check) => check.passed);
  return { checks, rows, allPassed };
}

export function printAeeBuildAutofixLoopResults(
  checks: readonly AeeBuildAutofixCheck[],
  rows: readonly AeeBuildAutofixRow[],
): number {
  for (const row of rows) {
    console.log(`- ${row.label} (${row.categoryId})`);
    console.log(
      `  initialFail=${row.npmBuildInitialFail} attempts=${row.autofixAttempts} finalBuild=${row.npmBuildFinalOk}`,
    );
    console.log(`  aee=${row.aeeDecision ?? 'null'} outcome=${row.finalOutcome ?? 'null'} (${row.durationMs}ms)`);
    console.log('');
  }

  let passed = 0;
  for (const check of checks) {
    const mark = check.passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${check.name}`);
    if (!check.passed) {
      console.log(`       ${check.detail}`);
    } else {
      passed += 1;
    }
  }
  return passed;
}
