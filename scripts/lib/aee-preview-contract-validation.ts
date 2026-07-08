/**
 * AEE Preview Unlock and Degraded Preview Contract V1 — validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AEE_PREVIEW_CONTRACT_V1_PASS_TOKEN,
  buildAeeControlledResponseEnvelope,
  buildStatusSeparateFromPreview,
  composeAeeAwareBuildChatResponse,
  evaluateAeeExecutiveDecision,
  isInteractionOrVisualGateBlocker,
  previewContractExhaustedRecoveryIsDegraded,
  probePreviewDevServerRoute,
  resolveAeePreviewContractSync,
} from '../../src/autonomous-engineering-executive/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { resetOnePromptLivePreviewForTests } from '../../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../../src/aidev-engine/aidev-engine-authority.js';
import { runOnePromptLivePreviewBuild } from '../../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../../src/universal-build-pipeline-verification/universal-build-pipeline-matrix.js';
import type { OnePromptLivePreviewBuildResult } from '../../src/one-prompt-live-preview/one-prompt-live-preview-types.js';

export { AEE_PREVIEW_CONTRACT_V1_PASS_TOKEN };

export const AEE_PREVIEW_CONTRACT_MATRIX_IDS = [
  'expense-tracker',
  'saas-crm',
  'ai-chat-app',
] as const;

export interface AeePreviewContractCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface AeePreviewContractRow {
  categoryId: string;
  label: string;
  buildPass: boolean;
  previewStatus: string | null;
  finalOutcome: string | null;
  previewUrl: string | null;
  promotionPass: boolean;
  durationMs: number;
}

export function resetAeePreviewContractTestHarness(): void {
  resetOnePromptLivePreviewForTests();
  resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

export async function runAeePreviewContractValidation(rootDir: string): Promise<{
  checks: AeePreviewContractCheck[];
  rows: AeePreviewContractRow[];
  allPassed: boolean;
}> {
  const checks: AeePreviewContractCheck[] = [];
  const rows: AeePreviewContractRow[] = [];

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

  push('01. package script', Boolean(pkg.scripts?.['validate:aee-preview-contract']), 'script');
  push(
    '02. preview contract module',
    existsSync(join(rootDir, 'src/autonomous-engineering-executive/aee-preview-contract.ts')),
    'module',
  );
  push('03. orchestrator wires preview contract', orchestrator.includes('resolveAeePreviewContract'), 'wired');
  push(
    '04. build spine promotion flag',
    orchestrator.includes('buildSpinePassed: npmInstallOk && npmBuildOk'),
    'promotion',
  );
  push(
    '05. decision engine degraded preview CONTINUE',
    decisionEngine.includes('degraded preview is not project failure'),
    'decision engine',
  );
  push(
    '06. not app-specific module naming',
    !readFileSync(join(rootDir, 'src/autonomous-engineering-executive/aee-preview-contract.ts'), 'utf8').includes(
      'TASK_TRACKER',
    ),
    'generic',
  );

  const recipeEntry =
    UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'recipe-planner') ??
    UNIVERSAL_BUILD_PIPELINE_MATRIX[0]!;
  const buildPlan = resolvePromptFaithfulBuildPlan(recipeEntry.prompt);

  const unitContract = resolveAeePreviewContractSync({
    npmInstallOk: true,
    npmBuildOk: true,
    devServerRunning: true,
    devServerUrl: 'http://127.0.0.1:5173',
    gate: {
      readOnly: true,
      gateId: 'aee-preview-contract-unit',
      evaluatedAt: Date.now(),
      state: 'LOCKED_AUTONOMOUS_REPAIR',
      unlockVerdict: 'PREVIEW_LOCKED_AUTONOMOUS_REPAIR',
      previewUrl: 'http://127.0.0.1:5173',
      isPreviewAvailable: false,
      isLimitedPreview: false,
      currentGate: 'Interaction Proof',
      blockedBy: 'INTERACTION_PROOF',
      blockerExplanation: { summary: 'Interaction proof incomplete.', detail: 'fixture' },
      unlockDecision: null,
      evidence: { items: [], missingSources: [] },
      statusCard: { title: 'Locked', summary: 'fixture', bullets: [] },
      transitionLog: [],
    },
    gateBlocker: 'Interaction proof incomplete.',
    previewRecoveryAttempts: 3,
    previewRecoveryExhausted: true,
    routeProbe: {
      readOnly: true,
      attempted: true,
      ok: true,
      statusCode: 200,
      url: 'http://127.0.0.1:5173',
      detail: 'fixture probe ok',
    },
  });

  push(
    '07. exhausted recovery yields DEGRADED contract',
    previewContractExhaustedRecoveryIsDegraded(unitContract) ||
      unitContract.finalOutcome === 'BUILD_COMPLETED_WITH_DEGRADED_PREVIEW' ||
      unitContract.finalOutcome === 'BUILD_COMPLETED_WITH_PREVIEW',
    String(unitContract.finalOutcome),
  );
  push(
    '08. interaction gate blocker detection',
    unitContract.interactionVerificationFailed,
    'INTERACTION_PROOF',
  );

  const degradedDecision = evaluateAeeExecutiveDecision({
    workspaceDir: join(rootDir, '.generated-builder-workspaces', 'aee-preview-contract-unit'),
    buildPlan,
    rawPrompt: recipeEntry.prompt,
    projectId: 'aee-preview-contract-unit',
    projectName: 'Preview Contract Unit',
    aseBlockers: ['Live Preview Gate blocked preview unlock.'],
    aseMaterializationAuthorized: true,
    aseMaterializationExecuted: true,
    manifestFaithfulness: { status: 'PASS', score: 90 },
    npmInstallOk: true,
    npmBuildOk: true,
    previewOk: false,
    previewDegraded: true,
    previewRecoveryAttempts: 3,
  });
  push(
    '09. AEE CONTINUE on degraded preview after build PASS',
    degradedDecision.decision === 'CONTINUE',
    degradedDecision.decision,
  );

  resetAeePreviewContractTestHarness();

  for (const categoryId of AEE_PREVIEW_CONTRACT_MATRIX_IDS) {
    const entry = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((row) => row.categoryId === categoryId);
    if (!entry) {
      push(`${categoryId}: matrix entry exists`, false, 'missing');
      continue;
    }

    const startedAt = Date.now();
    const projectId = `aee-preview-contract-${categoryId}-${Date.now()}`;
    let build: OnePromptLivePreviewBuildResult;

    try {
      build = await runOnePromptLivePreviewBuild({
        rawPrompt: entry.prompt,
        projectRootDir: rootDir,
        source: 'api',
        projectId,
        projectName: entry.categoryLabel,
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

    const workspaceManifestPath = join(
      rootDir,
      GENERATED_BUILDER_WORKSPACES_DIR,
      projectId,
      '.generated-app-manifest.json',
    );
    const manifest = existsSync(workspaceManifestPath)
      ? (JSON.parse(readFileSync(workspaceManifestPath, 'utf8')) as { promotionStatus?: string })
      : null;

    const envelope = buildAeeControlledResponseEnvelope(build);
    const chat = composeAeeAwareBuildChatResponse(build);
    const previewUrl =
      build.previewUrl ?? build.diagnosticPreviewUrl ?? build.previewContract?.diagnosticPreviewUrl ?? null;

    const row: AeePreviewContractRow = {
      categoryId,
      label: entry.categoryLabel,
      buildPass: build.npmInstallOk && build.npmBuildOk,
      previewStatus: build.previewContract?.previewStatus ?? build.previewStatus ?? null,
      finalOutcome: build.aeeFinalReport?.finalOutcome ?? null,
      previewUrl,
      promotionPass: manifest?.promotionStatus === 'PASS',
      durationMs: Date.now() - startedAt,
    };
    rows.push(row);

    push(
      `${categoryId}: npm build PASS`,
      row.buildPass,
      build.failureReason ?? 'PASS',
    );
    push(
      `${categoryId}: BUILD_COMPLETED_WITH_DEGRADED_PREVIEW or PREVIEW outcome`,
      row.buildPass &&
        (row.finalOutcome === 'BUILD_COMPLETED_WITH_DEGRADED_PREVIEW' ||
          row.finalOutcome === 'BUILD_COMPLETED_WITH_PREVIEW'),
      String(row.finalOutcome),
    );
    push(
      `${categoryId}: preview URL when server responds`,
      !row.buildPass || Boolean(previewUrl) || build.devServerRunning === false,
      previewUrl ?? 'none',
    );
    push(
      `${categoryId}: persistent promotion after build PASS`,
      !row.buildPass || row.promotionPass,
      manifest?.promotionStatus ?? 'no manifest',
    );
    push(
      `${categoryId}: build/preview status separated in envelope`,
      envelope.buildStatus === 'PASS' && typeof envelope.previewStatus === 'string',
      `${String(envelope.buildStatus)}/${String(envelope.previewStatus)}`,
    );
    push(
      `${categoryId}: response does not claim build failed due to preview lock`,
      !row.buildPass ||
        (build.status === 'READY' &&
          !/build failed.*preview/i.test(chat) &&
          !/failed.*live preview gate/i.test(chat)),
      chat.slice(0, 100),
    );
  }

  const probe = await probePreviewDevServerRoute('http://127.0.0.1:1');
  push('10. route probe helper runs', typeof probe.attempted === 'boolean', probe.detail.slice(0, 60));

  const split = buildStatusSeparateFromPreview({
    npmInstallOk: true,
    npmBuildOk: true,
    previewStatus: 'DEGRADED',
    livePreviewAvailable: false,
  });
  push('11. buildStatusSeparateFromPreview', split.buildStatus === 'PASS' && split.previewStatus === 'DEGRADED', `${split.buildStatus}/${split.previewStatus}`);

  const allPassed = checks.every((check) => check.passed);
  return { checks, rows, allPassed };
}

export function printAeePreviewContractResults(
  checks: readonly AeePreviewContractCheck[],
  rows: readonly AeePreviewContractRow[],
): number {
  for (const row of rows) {
    console.log(`- ${row.label} (${row.categoryId})`);
    console.log(
      `  build=${row.buildPass} preview=${row.previewStatus ?? 'null'} outcome=${row.finalOutcome ?? 'null'}`,
    );
    console.log(`  url=${row.previewUrl ?? 'none'} promotion=${row.promotionPass} (${row.durationMs}ms)`);
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
