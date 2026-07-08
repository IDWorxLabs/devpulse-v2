/**
 * LISA Real Builder Continuation V1 — production one-prompt path regression.
 * Exercises runOnePromptLivePreviewBuild (same path as /api/build/from-prompt).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetEngineeringAuthorityForTests, getLastAutonomousEngineeringResult } from '../src/ase-enforcement-engine/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import {
  collectWorkspaceFeatureRealityFallback,
  resetWorkspaceFeatureRealityFallbackForTests,
  workspaceHasGeneratedFeatureModules,
} from '../src/feature-contract-reality/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { readForensicManifest } from '../src/materialization-evidence/index.js';
import {
  resetOnePromptLivePreviewForTests,
  runOnePromptLivePreviewBuild,
} from '../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { ASE_CONTINUATION_OVERRIDE_MESSAGE } from '../src/universal-build-pipeline-verification/index.js';
import { LISA_ASSISTIVE_PROMPT } from './lib/prompt-bounded-materialization-validation.js';
import { LISA_REQUIRED_MODULES } from '../src/prompt-faithful-generation/prompt-feature-extractor.js';
import { evaluateFeatureRealityPolicy } from '../src/universal-build-pipeline-verification/index.js';

export const LISA_REAL_BUILDER_CONTINUATION_V1_PASS_TOKEN = 'LISA_REAL_BUILDER_CONTINUATION_V1_PASS';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const LISA_LIVE_PROMPT = `${LISA_ASSISTIVE_PROMPT}

Generate architecture, plan, tasks, and begin build execution now.`;

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function stageReached(
  manifest: ReturnType<typeof readForensicManifest>,
  stage: string,
): boolean {
  return (manifest?.stageHistory ?? []).some((entry) => entry.stage === stage);
}

async function resetModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  resetEngineeringAuthorityForTests();
  resetWorkspaceFeatureRealityFallbackForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('LISA Real Builder Continuation V1 — Validation');
  console.log('==============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const orchestratorSource = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const handlerSource = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  const brainHandlerSource = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:lisa-real-builder-continuation']),
    'validate:lisa-real-builder-continuation',
  );
  assert(
    '02. build-from-prompt uses orchestrator',
    handlerSource.includes('runOnePromptLivePreviewBuild'),
    'build-from-prompt-handler.ts',
  );
  assert(
    '03. brain respond uses orchestrator',
    brainHandlerSource.includes('runOnePromptLivePreviewBuild'),
    'brain-api-handler.ts',
  );
  assert(
    '04. orchestrator evaluates runtime continuation',
    orchestratorSource.includes('evaluateRuntimeBuildContinuation'),
    'evaluateRuntimeBuildContinuation',
  );
  assert(
    '05. orchestrator records ASE continuation override on manifest',
    orchestratorSource.includes('recordForensicManifestAseContinuationOverride'),
    'recordForensicManifestAseContinuationOverride',
  );
  assert(
    '06. orchestrator emits continuation override message',
    orchestratorSource.includes('ASE_CONTINUATION_OVERRIDE_MESSAGE'),
    ASE_CONTINUATION_OVERRIDE_MESSAGE,
  );

  await resetModules();

  const projectId = `lisa-continuation-${Date.now()}`;
  const build = await runOnePromptLivePreviewBuild({
    rawPrompt: LISA_LIVE_PROMPT,
    projectRootDir: ROOT,
    source: 'validator',
    projectId,
    projectName: 'LISA Continuation',
    simulateAseMaterializationDenial: true,
  });

  const workspaceDir = join(ROOT, GENERATED_BUILDER_WORKSPACES_DIR, projectId);
  const manifest = readForensicManifest(workspaceDir);
  const manifestWarnings = manifest?.warnings ?? [];
  const continuationOverridden =
    manifestWarnings.some((warning) => warning.includes(ASE_CONTINUATION_OVERRIDE_MESSAGE)) ||
    (manifest?.stageHistory ?? []).some((entry) =>
      entry.warnings.some((warning) => warning.includes(ASE_CONTINUATION_OVERRIDE_MESSAGE)),
    );
  const aseResult = getLastAutonomousEngineeringResult();

  assert(
    '07. real LISA build received prompt',
    build.prompt.includes('LISA'),
    build.prompt.slice(0, 60),
  );
  assert(
    '08. workspace materialized',
    existsSync(workspaceDir) && workspaceHasGeneratedFeatureModules(workspaceDir),
    workspaceDir,
  );
  assert(
    '09. not ExpenseTracker profile',
    build.generatedProfile !== 'EXPENSE_TRACKER_WEB_V1',
    String(build.generatedProfile),
  );
  assert(
    '10. ASE denial branch reached with simulated denial',
    aseResult?.materializationAuthorized === false,
    `materializationAuthorized=${String(aseResult?.materializationAuthorized)}`,
  );
  assert(
    '11. continuation policy overrides ASE denial',
    continuationOverridden ||
      (aseResult?.materializationAuthorized === false && build.npmInstallOk === true),
    continuationOverridden
      ? 'override message recorded'
      : `npmInstallOk=${String(build.npmInstallOk)} warnings=${manifestWarnings.join(' | ') || 'none'}`,
  );
  assert(
    '12. manifest not ABORTED at PLANNING for ASE denial',
    !(
      manifest?.status === 'ABORTED' &&
      manifest.failureStage === 'PLANNING' &&
      String(manifest.failureReason ?? '').toLowerCase().includes('ase denied')
    ),
    `${manifest?.status ?? 'no-manifest'}@${manifest?.failureStage ?? 'n/a'}`,
  );
  assert(
    '13. npm install stage reached',
    build.npmInstallOk || stageReached(manifest, 'NPM_INSTALL'),
    `npmInstallOk=${String(build.npmInstallOk)}`,
  );
  assert(
    '14. npm build stage reached',
    build.npmBuildOk || stageReached(manifest, 'NPM_BUILD'),
    `npmBuildOk=${String(build.npmBuildOk)}`,
  );
  assert(
    '15. preview stage attempted',
    stageReached(manifest, 'PREVIEW') ||
      build.devServerRunning ||
      Boolean(build.previewUrl) ||
      Boolean(build.diagnosticPreviewUrl),
    `preview stage=${stageReached(manifest, 'PREVIEW')}`,
  );
  assert(
    '16. final report / manifest completion recorded',
    Boolean(manifest) &&
      (stageReached(manifest, 'FINAL_VALIDATION') ||
        manifest.status === 'PASS' ||
        build.materializationManifest !== null),
    manifest?.currentStage ?? 'missing',
  );

  const fallback = collectWorkspaceFeatureRealityFallback({
    workspaceDir,
    requiredModuleIds: LISA_REQUIRED_MODULES,
    contractId: manifest?.projectId ?? projectId,
    previewUrl: build.previewUrl ?? 'workspace://validation',
    registerAssessment: false,
    isLisaContext: true,
  });
  const featureRealityPolicy = evaluateFeatureRealityPolicy(fallback);
  assert(
    '17. feature reality degraded is warning-only',
    featureRealityPolicy.isWarning && !featureRealityPolicy.isHardBlocker,
    `${fallback.status} hardBlocker=${featureRealityPolicy.isHardBlocker}`,
  );
  assert(
    '18. materialization quality not locked NOT_MATERIALIZED after continuation',
    !(continuationOverridden && manifest?.materializationQualityVerdict === 'NOT_MATERIALIZED'),
    String(manifest?.materializationQualityVerdict),
  );
  assert(
    '19. no ExpenseTracker fallback blocker in failure',
    !String(build.failureReason ?? '').toLowerCase().includes('expensetracker'),
    build.failureReason ?? 'none',
  );

  const failed = results.filter((entry) => !entry.passed);
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  if (failed.length) {
    console.error(`FAILED ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(LISA_REAL_BUILDER_CONTINUATION_V1_PASS_TOKEN);
}

void main();
