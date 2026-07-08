/**
 * Chat-to-Build Execution Bridge V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
  CHAT_TO_BUILD_EXECUTION_BRIDGE_V1_PASS_TOKEN,
  executeChatToBuildBridge,
  isCommandCenterBuildRequest,
} from '../src/chat-to-build-execution-bridge-v1/index.js';
import { createChatToBuildStateMachine } from '../src/chat-to-build-execution-bridge-v1/execution-state-machine.js';
import { isBuildIntentRequest } from '../src/build-intent-routing/index.js';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
  settleEventLoop,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { resetProjectRegistryV1ForTests } from '../src/project-registry-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const EXPENSE_TRACKER_PROMPT =
  'Build a modern expense tracking web application with categories, receipts, monthly budgets, and spending reports. Generate architecture, plan, tasks, and begin build execution.';

const CHAT_ONLY_PROMPT = 'What is the current status of my projects and what should I focus on next?';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function resetModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

async function startTestServer(testRoot: string): Promise<{ server: Server; baseUrl: string }> {
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  const { createFounderRealityServer } = await import('../server/founder-reality-server.js');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

function buildCommandCenterPayload(message: string): Record<string, unknown> {
  return {
    message,
    timestamp: Date.now(),
    activeProjectId: null,
    projectName: 'New Project',
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Chat-to-Build Execution Bridge V1 — Validation');
  console.log('==============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const browserJs = readFileSync(join(ROOT, 'public/founder-reality/chat-to-build-execution-bridge.js'), 'utf8');
  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
  const buildHandler = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  const bridgeAuthority = readFileSync(
    join(ROOT, 'src/chat-to-build-execution-bridge-v1/bridge-authority.ts'),
    'utf8',
  );

  assert('01. package script', Boolean(pkg.scripts?.['validate:chat-to-build-execution-bridge']), 'script');
  assert('02. module index exists', existsSync(join(ROOT, 'src/chat-to-build-execution-bridge-v1/index.ts')), 'index');
  assert('03. bridge authority exists', existsSync(join(ROOT, 'src/chat-to-build-execution-bridge-v1/bridge-authority.ts')), 'authority');
  assert('04. state machine exists', existsSync(join(ROOT, 'src/chat-to-build-execution-bridge-v1/execution-state-machine.ts')), 'state machine');
  assert('05. pass token', CHAT_TO_BUILD_EXECUTION_BRIDGE_V1_PASS_TOKEN === 'CHAT_TO_BUILD_EXECUTION_BRIDGE_V1_PASS', 'token');
  assert('06. browser bridge script tag', indexHtml.includes('chat-to-build-execution-bridge.js'), 'index.html');
  assert('07. browser bridge contract', browserJs.includes('CHAT_TO_BUILD_EXECUTION_BRIDGE_V1'), 'browser');
  assert('08. brain handler uses bridge', brainHandler.includes('executeChatToBuildBridge'), 'brain-api-handler');
  assert('09. build handler uses bridge', buildHandler.includes('executeChatToBuildBridge'), 'build-from-prompt');
  assert('10. app.js bridge ticker', appJs.includes('ChatToBuildExecutionBridge'), 'app.js');
  assert('11. app.js bridge progress render', appJs.includes('renderBridgeProgressToFeed'), 'progress UI');
  assert('12. autofix path in authority', bridgeAuthority.includes("'AUTOFIX'"), 'autofix');
  assert('13. auto-continue duplicates', bridgeAuthority.includes('shouldAutoContinueDuplicate'), 'duplicate auto-continue');
  assert('14. no LISA hardcoding', !bridgeAuthority.includes('LISA'), 'generic');

  assert('15. chat-only does not detect build', !isBuildIntentRequest(CHAT_ONLY_PROMPT), 'chat-only');
  assert('16. expense tracker detected', isBuildIntentRequest(EXPENSE_TRACKER_PROMPT), 'build detect');
  assert('17. isCommandCenterBuildRequest', isCommandCenterBuildRequest(EXPENSE_TRACKER_PROMPT), 'router');

  const machine = createChatToBuildStateMachine();
  machine.transition('INTENT_ANALYSIS', { title: 'Intent understood', detail: 'test' });
  machine.completeLast();
  assert('18. state machine emits events', machine.getEvents().length >= 1, String(machine.getEvents().length));

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'ctbeb-v1-'));
  resetProjectRegistryV1ForTests(TEST_ROOT);
  await resetModules();

  const chatOnlyResult = await executeChatToBuildBridge({
    message: CHAT_ONLY_PROMPT,
    source: 'chat',
    rootDir: TEST_ROOT,
    repoRootDir: ROOT,
  });
  assert('19. normal conversation CHAT_ONLY', chatOnlyResult.kind === 'CHAT_ONLY', chatOnlyResult.kind);

  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  try {
    const chatRes = await fetch(`${baseUrl}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCommandCenterPayload(CHAT_ONLY_PROMPT)),
    });
    const chatJson = (await chatRes.json()) as { category?: string; buildIntentClassification?: { isBuildIntent: boolean } };
    assert('20. HTTP chat-only not BUILD', chatJson.category !== 'BUILD', String(chatJson.category));
    assert('21. HTTP chat-only not build intent', chatJson.buildIntentClassification?.isBuildIntent === false, 'classification');

    const buildRes = await fetch(`${baseUrl}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCommandCenterPayload(EXPENSE_TRACKER_PROMPT)),
    });
    const buildJson = (await buildRes.json()) as {
      category?: string;
      chatToBuildExecutionBridge?: {
        contractVersion: string;
        progressItems?: unknown[];
        engineeringReport?: unknown;
      };
      executionTraceEvents?: unknown[];
      engineeringReport?: unknown;
      onePromptLivePreview?: { status?: string; previewUrl?: string | null };
    };
    assert('22. HTTP build returns BUILD category', buildJson.category === 'BUILD', String(buildJson.category));
    assert(
      '23. bridge metadata present',
      buildJson.chatToBuildExecutionBridge?.contractVersion === 'CHAT_TO_BUILD_EXECUTION_BRIDGE_V1',
      'bridge meta',
    );
    assert(
      '24. execution trace streams events',
      Array.isArray(buildJson.executionTraceEvents) && buildJson.executionTraceEvents.length > 0,
      String(buildJson.executionTraceEvents?.length ?? 0),
    );
    assert('25. engineering report generated', Boolean(
      buildJson.engineeringReport ||
      buildJson.chatToBuildExecutionBridge?.engineeringReport,
    ), 'report');
    assert(
      '26. live preview payload present',
      Boolean(buildJson.onePromptLivePreview),
      String(buildJson.onePromptLivePreview?.status),
    );
    assert(
      '27. bridge trace header',
      buildRes.headers.get('x-devpulse-chat-to-build-bridge') === CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
      String(buildRes.headers.get('x-devpulse-chat-to-build-bridge')),
    );

    const duplicateRes = await fetch(`${baseUrl}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCommandCenterPayload(EXPENSE_TRACKER_PROMPT)),
    });
    const duplicateJson = (await duplicateRes.json()) as { category?: string; projectResume?: unknown };
    assert(
      '28. duplicate does not block with resume choice',
      duplicateJson.category === 'BUILD' && !duplicateJson.projectResume,
      String(duplicateJson.category),
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await settleEventLoop();
    rmSync(TEST_ROOT, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  if (failed.length === 0) {
    console.log(CHAT_TO_BUILD_EXECUTION_BRIDGE_V1_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }
  console.error(`Chat-to-Build Execution Bridge V1 — FAILED (${failed.length} checks)`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
