/**
 * One-Prompt Build Response Composer Scope V1 — regression validation.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeOnePromptBuildBrainApiPayload } from '../src/one-prompt-live-preview/one-prompt-build-chat-response.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';

export const ONE_PROMPT_BUILD_RESPONSE_COMPOSER_SCOPE_V1_PASS =
  'ONE_PROMPT_BUILD_RESPONSE_COMPOSER_SCOPE_V1_PASS' as const;

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const checks: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  checks.push({ name, passed: condition, detail });
}

function sampleReadyLivePreviewBuild(): OnePromptLivePreviewBuildResult {
  return {
    readOnly: true,
    buildId: 'composer-scope-ready-001',
    projectId: 'composer-scope-proj-001',
    projectName: 'Composer Scope Probe',
    status: 'READY',
    prompt: 'Build a habit tracker with streaks and daily reminders',
    requestType: 'CHAT_BUILD',
    workspaceId: 'composer-scope-proj-001',
    workspacePath: '.generated-builder-workspaces/composer-scope-proj-001',
    generatedProfile: 'HABIT_TRACKER_WEB_V1',
    planningProofLevel: 'FULL',
    materializationProofLevel: 'FULL',
    buildResult: 'PASS',
    npmInstallOk: true,
    npmBuildOk: true,
    previewUrl: 'http://127.0.0.1:5173/',
    diagnosticPreviewUrl: null,
    limitedPreviewUrl: null,
    devServerRunning: true,
    livePreviewAvailable: true,
    previewStatus: 'UNLOCKED',
    previewRecoveryAttempts: 0,
    buildAutofixAttempts: 0,
    failureReason: null,
    featureSignals: null,
    materializationManifest: null,
    livePreviewGate: null,
    autonomousSoftwareEngineering: null,
    updatedAt: new Date().toISOString(),
  };
}

function runStaticChecks(): void {
  const source = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-chat-response.ts'),
    'utf8',
  );

  assert(
    'static.no undefined result reference in composer',
    !/\bresult\.buildAutofixAttempts\b/.test(source) &&
      !/\bresult\.previewRecoveryAttempts\b/.test(source),
    'composeOnePromptBuildBrainApiPayload uses buildResult',
  );
  assert(
    'static.buildResult scoped for autofix confirmation',
    source.includes('buildResult.buildAutofixAttempts') &&
      source.includes('buildResult.previewRecoveryAttempts'),
    'confirmation.noAutoFixPerformed reads buildResult',
  );
}

function runRuntimeChecks(): void {
  const buildResult = sampleReadyLivePreviewBuild();

  let payload: Record<string, unknown>;
  try {
    payload = composeOnePromptBuildBrainApiPayload({
      message: buildResult.prompt,
      buildResult,
    });
  } catch (error) {
    assert(
      'runtime.compose READY/LIVE_PREVIEW payload',
      false,
      error instanceof Error ? error.message : String(error),
    );
    return;
  }

  const confirmation = payload.confirmation as Record<string, unknown> | undefined;
  const buildExecution = payload.buildExecution as Record<string, unknown> | undefined;

  assert(
    'runtime.compose READY/LIVE_PREVIEW payload',
    payload.brainResponse != null && typeof payload.brainResponse === 'string',
    'brainResponse present',
  );
  assert(
    'runtime.buildExecution status READY',
    buildExecution?.status === 'READY',
    String(buildExecution?.status),
  );
  assert(
    'runtime.livePreviewAvailable true',
    buildExecution?.livePreviewAvailable === true,
    String(buildExecution?.livePreviewAvailable),
  );
  assert(
    'runtime.confirmation noAutoFixPerformed boolean',
    confirmation?.noAutoFixPerformed === true,
    String(confirmation?.noAutoFixPerformed),
  );
}

function main(): void {
  console.log('');
  console.log('One-Prompt Build Response Composer Scope V1 — Validation');
  console.log('=========================================================');
  console.log('');

  runStaticChecks();
  runRuntimeChecks();

  let passed = 0;
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
    if (check.passed) passed += 1;
  }

  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);

  if (passed === checks.length) {
    console.log(ONE_PROMPT_BUILD_RESPONSE_COMPOSER_SCOPE_V1_PASS);
    process.exit(0);
  }

  process.exit(1);
}

main();
