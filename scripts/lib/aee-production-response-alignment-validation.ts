/**
 * AEE Production Response Alignment V1 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { EventEmitter } from 'node:events';
import { resetEngineeringAuthorityForTests } from '../../src/ase-enforcement-engine/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../../src/aidev-engine/aidev-engine-authority.js';
import { resetConnectedBuildExecutionModuleForTests } from '../../src/connected-build-execution/index.js';
import { resetWorkspaceFeatureRealityFallbackForTests } from '../../src/feature-contract-reality/index.js';
import { resetPreviewSessionManagerForTests } from '../../src/live-preview-runtime/index.js';
import {
  AEE_OVERRIDE_ASE_DENIAL_EVENT,
  AEE_PRODUCTION_RESPONSE_ALIGNMENT_V1_PASS_TOKEN,
  BUILD_RESPONSE_SOURCE_AEE_CONTROLLED,
  resetAeeRuntimeRecorderForTests,
} from '../../src/autonomous-engineering-executive/index.js';
import { applyBuildResultConversationalIntelligence } from '../../src/build-result-conversational-intelligence/index.js';
import {
  composeOnePromptBuildBrainApiPayload,
  resetOnePromptLivePreviewForTests,
  runOnePromptLivePreviewBuild,
} from '../../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetRequirementsToPlanContractModuleForTests } from '../../src/requirements-to-plan-execution-contract/index.js';
import { handleBrainRespondRequest } from '../../server/brain-api-handler.js';
import { LISA_ASSISTIVE_PROMPT } from './prompt-bounded-materialization-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

export interface AlignmentCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export function assertAlignmentCheck(
  checks: AlignmentCheck[],
  name: string,
  condition: boolean,
  detail: string,
): void {
  checks.push({ name, passed: condition, detail });
}

export async function resetAlignmentValidationModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  resetAeeRuntimeRecorderForTests();
  resetEngineeringAuthorityForTests();
  resetWorkspaceFeatureRealityFallbackForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

function mockBrainPost(body: Record<string, unknown>): {
  req: IncomingMessage;
  getResponse: () => Promise<{ status: number; headers: Record<string, string, string | string[] | undefined>; body: string }>;
} {
  const payload = JSON.stringify(body);
  const req = new EventEmitter() as IncomingMessage;
  (req as { method: string }).method = 'POST';
  (req as { url: string }).url = '/api/brain/respond';

  let status = 0;
  let headers: Record<string, string | string[] | undefined> = {};
  let responseBody = '';

  const res = {
    writeHead(code: number, hdrs?: Record<string, string | string[] | undefined>) {
      status = code;
      headers = hdrs ?? {};
    },
    end(data?: string) {
      responseBody = data ?? '';
    },
  } as unknown as ServerResponse;

  queueMicrotask(() => {
    req.emit('data', Buffer.from(payload, 'utf8'));
    req.emit('end');
  });

  return {
    req,
    getResponse: async () => {
      await handleBrainRespondRequest(req, res);
      return { status, headers, body: responseBody };
    },
  };
}

const LISA_LIVE_PROMPT = `${LISA_ASSISTIVE_PROMPT}

Generate architecture, plan, tasks, and begin build execution now.`;

function responseBlob(payload: Record<string, unknown>): string {
  return JSON.stringify(payload).toLowerCase();
}

export async function runAeeProductionResponseAlignmentValidation(): Promise<{
  checks: AlignmentCheck[];
  allPassed: boolean;
}> {
  const checks: AlignmentCheck[] = [];

  assertAlignmentCheck(
    checks,
    'aee-production-response module exists',
    existsSync(join(ROOT, 'src/autonomous-engineering-executive/aee-production-response.ts')),
    'aee-production-response.ts',
  );

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assertAlignmentCheck(
    checks,
    'package script validate:aee-production-response-alignment',
    Boolean(pkg.scripts?.['validate:aee-production-response-alignment']),
    'script',
  );

  const chatResponseSource = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-chat-response.ts'),
    'utf8',
  );
  const brainHandlerSource = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');

  assertAlignmentCheck(
    checks,
    'brain payload uses AEE controlled response source',
    chatResponseSource.includes('BUILD_RESPONSE_SOURCE_AEE_CONTROLLED'),
    'buildResponseSource',
  );
  assertAlignmentCheck(
    checks,
    'brain payload emits BUILD_RESPONSE_SOURCE trace event',
    chatResponseSource.includes('buildAeeControlledTraceEvent'),
    'trace event',
  );
  assertAlignmentCheck(
    checks,
    'brain handler sends build response source header',
    brainHandlerSource.includes('X-DevPulse-Build-Response-Source'),
    'header',
  );
  assertAlignmentCheck(
    checks,
    'structured evidence includes aeeControlledResponse',
    readFileSync(
      join(ROOT, 'src/build-result-conversational-intelligence/build-result-structured-evidence.ts'),
      'utf8',
    ).includes('aeeControlledResponse'),
    'structured evidence',
  );

  await resetAlignmentValidationModules();

  const projectId = `aee-response-${Date.now()}`;
  const buildResult = await runOnePromptLivePreviewBuild({
    rawPrompt: LISA_LIVE_PROMPT,
    projectRootDir: ROOT,
    source: 'validator',
    projectId,
    projectName: 'LISA Response Alignment',
    simulateAseMaterializationDenial: true,
  });

  const payload = composeOnePromptBuildBrainApiPayload({
    message: LISA_LIVE_PROMPT,
    buildResult,
  });
  const enriched = await applyBuildResultConversationalIntelligence({
    message: LISA_LIVE_PROMPT,
    payload,
    buildResult,
    rootDir: ROOT,
  });

  const blob = responseBlob(enriched);
  const aeeEnvelope = enriched.aeeControlledResponse as Record<string, unknown> | undefined;
  const brainResponse = String(enriched.brainResponse ?? '');

  assertAlignmentCheck(
    checks,
    'payload buildResponseSource is AEE controlled',
    enriched.buildResponseSource === BUILD_RESPONSE_SOURCE_AEE_CONTROLLED,
    String(enriched.buildResponseSource),
  );
  assertAlignmentCheck(
    checks,
    'response includes AEE final decision',
    Boolean(aeeEnvelope?.aeeFinalDecision ?? enriched.aeeFinalReport),
    String(aeeEnvelope?.aeeFinalDecision ?? 'missing'),
  );
  assertAlignmentCheck(
    checks,
    'response includes furthest stage reached',
    Boolean(aeeEnvelope?.aeeFurthestStageReached ?? (enriched.aeeFinalReport as { buildSpineStageReached?: string })?.buildSpineStageReached),
    String(aeeEnvelope?.aeeFurthestStageReached ?? 'missing'),
  );
  assertAlignmentCheck(
    checks,
    'response shows npm install attempted or reached',
    buildResult.npmInstallOk === true ||
      aeeEnvelope?.npmInstallResult === 'PASS' ||
      blob.includes('npm install'),
    String(aeeEnvelope?.npmInstallResult ?? buildResult.npmInstallOk),
  );
  assertAlignmentCheck(
    checks,
    'response shows npm build attempted or reached',
    buildResult.npmBuildOk === true ||
      aeeEnvelope?.npmBuildResult === 'PASS' ||
      blob.includes('npm build'),
    String(aeeEnvelope?.npmBuildResult ?? buildResult.npmBuildOk),
  );
  assertAlignmentCheck(
    checks,
    'response does not treat materialization authorization denied as final failure',
    !/materialization authorization denied/i.test(brainResponse) ||
      blob.includes(String(AEE_OVERRIDE_ASE_DENIAL_EVENT).toLowerCase()) ||
      aeeEnvelope?.aeeOverrideApplied === true,
    brainResponse.slice(0, 120),
  );
  assertAlignmentCheck(
    checks,
    'execution trace includes BUILD_RESPONSE_SOURCE=AEE_CONTROLLED_RESULT',
    (enriched.executionTraceEvents as Array<{ eventTitle?: string }> | undefined)?.some((event) =>
      String(event.eventTitle ?? '').includes('BUILD_RESPONSE_SOURCE=AEE_CONTROLLED_RESULT'),
    ) === true,
    'trace event',
  );
  assertAlignmentCheck(
    checks,
    'profile mismatch suppressed for GENERIC_CUSTOM with faithfulness',
    (enriched.profileAlignment as { verdict?: string })?.verdict !== 'PROFILE_MISMATCH' ||
      buildResult.generatedProfile !== 'GENERIC_CUSTOM_APP_V1',
    String((enriched.profileAlignment as { verdict?: string })?.verdict),
  );
  assertAlignmentCheck(
    checks,
    'does not claim preview failed when preview not attempted without npm spine',
    !(
      /live preview could not be generated/i.test(brainResponse) &&
      !buildResult.npmInstallOk &&
      !buildResult.npmBuildOk
    ),
    brainResponse.slice(0, 80),
  );

  await resetAlignmentValidationModules();

  const { req, getResponse } = mockBrainPost({
    message: `${LISA_LIVE_PROMPT}\n\nUnique validation run ${Date.now()}.`,
    projectName: `LISA Brain ${Date.now()}`,
    activeProjectId: `aee-brain-${Date.now()}`,
    confirmFreshCopy: true,
    confirmProjectContextAlignment: true,
  });
  const httpResult = await getResponse();
  const httpJson = JSON.parse(httpResult.body) as Record<string, unknown>;
  const httpBlob = responseBlob(httpJson);
  const httpBrain = String(httpJson.brainResponse ?? '');

  assertAlignmentCheck(
    checks,
    'POST /api/brain/respond returns 200',
    httpResult.status === 200,
    String(httpResult.status),
  );
  assertAlignmentCheck(
    checks,
    'brain route response source is AEE controlled',
    httpJson.buildResponseSource === BUILD_RESPONSE_SOURCE_AEE_CONTROLLED,
    String(httpJson.buildResponseSource),
  );
  assertAlignmentCheck(
    checks,
    'brain route includes AEE controlled envelope',
    Boolean(httpJson.aeeControlledResponse),
    'aeeControlledResponse',
  );
  assertAlignmentCheck(
    checks,
    'brain route does not use legacy ASE-only failure as final narrative',
    !/materialization authorization denied/i.test(httpBrain) ||
      httpBlob.includes(String(AEE_OVERRIDE_ASE_DENIAL_EVENT).toLowerCase()),
    httpBrain.slice(0, 120),
  );

  const allPassed = checks.every((check) => check.passed);
  return { checks, allPassed };
}

export function printAeeProductionResponseAlignmentResults(checks: AlignmentCheck[]): number {
  let passed = 0;
  for (const check of checks) {
    console.log(`${check.passed ? '[PASS]' : '[FAIL]'} ${check.name} — ${check.detail}`);
    if (check.passed) passed += 1;
  }
  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  return passed;
}

export { AEE_PRODUCTION_RESPONSE_ALIGNMENT_V1_PASS_TOKEN };
