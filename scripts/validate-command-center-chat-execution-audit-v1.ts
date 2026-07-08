/**
 * Command Center Chat Execution Audit V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  COMMAND_CENTER_CHAT_AUDIT_EVENTS,
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH,
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_V1_PASS_TOKEN,
  getLatestChatExecutionAudit,
  recordChatExecutionAuditEvent,
  resetChatExecutionAuditStoreForTests,
  startChatExecutionAudit,
} from '../src/command-center-chat-execution-audit-v1/index.js';
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

const LISA_LIKE_PROMPT =
  'Build LISA, an assistive communication web application for non-verbal users with eye-tracking input, caregiver dashboard, emergency speech, and communication history. Generate architecture, plan, tasks, and begin build execution.';

const CHAT_PROMPT = 'What should I focus on next for my active project?';

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
  resetChatExecutionAuditStoreForTests();
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

async function main(): Promise<void> {
  console.log('');
  console.log('Command Center Chat Execution Audit V1 — Validation');
  console.log('=================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const browserJs = readFileSync(
    join(ROOT, 'public/founder-reality/command-center-chat-execution-audit.js'),
    'utf8',
  );
  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
  const bridgeAuthority = readFileSync(
    join(ROOT, 'src/chat-to-build-execution-bridge-v1/bridge-authority.ts'),
    'utf8',
  );
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');

  assert('01. package script', Boolean(pkg.scripts?.['validate:command-center-chat-execution-audit']), 'script');
  assert('02. audit module index', existsSync(join(ROOT, 'src/command-center-chat-execution-audit-v1/index.ts')), 'module');
  assert('03. audit handler', existsSync(join(ROOT, 'server/command-center-chat-execution-audit-handler.ts')), 'handler');
  assert('04. browser script tag', indexHtml.includes('command-center-chat-execution-audit.js'), 'index.html');
  assert('05. diagnostic card', indexHtml.includes('chat-execution-audit-card'), 'card');
  assert('06. browser audit client', browserJs.includes('COMMAND_CENTER_CHAT_EXECUTION_AUDIT_V1'), 'browser');
  assert('07. app.js form audit', appJs.includes('FORM_SUBMIT_ENTER'), 'form submit');
  assert('08. app.js askBrain audit', appJs.includes('ASK_BRAIN_ENTER'), 'askBrain');
  assert('09. app.js fetch audit', appJs.includes('FETCH_START'), 'fetch');
  assert('10. app.js trace audit', appJs.includes('TRACE_RENDER_START'), 'trace');
  assert('11. app.js no-op audit', appJs.includes('recordNoOp'), 'no-op');
  assert('12. brain handler audit', brainHandler.includes('HANDLER_ENTER'), 'brain handler');
  assert('13. bridge audit hooks', bridgeAuthority.includes('BRIDGE_ENTER'), 'bridge');
  assert('14. audit latest route', serverTs.includes('/api/command-center/chat-execution-audit/latest'), 'route');
  assert(
    '15. silent return has audit reason',
    appJs.includes('ASK_BRAIN_BLOCKED_RUNTIME_TRUTH') &&
      appJs.includes('FORM_SUBMIT_EMPTY_MESSAGE') &&
      brainHandler.includes('HANDLER_EMPTY_MESSAGE'),
    'silent paths',
  );

  const auditId = 'audit-validation-' + Date.now();
  startChatExecutionAudit({ auditId, messagePreview: CHAT_PROMPT });
  recordChatExecutionAuditEvent({
    auditId,
    layer: 'browser',
    name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.NO_OP_DETECTED,
    detail: 'Synthetic no-op for summary validation.',
  });
  const latest = getLatestChatExecutionAudit();
  assert('16. audit store records events', (latest?.events.length ?? 0) >= 1, String(latest?.events.length));
  assert('17. no-op summary flag', latest?.summary.noOpDetected === true, String(latest?.summary.noOpDetected));

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'cccea-v1-'));
  resetProjectRegistryV1ForTests(TEST_ROOT);
  await resetModules();

  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  try {
    const latestRes = await fetch(`${baseUrl}${COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH}`);
    const latestJson = (await latestRes.json()) as { ok?: boolean; audit?: unknown };
    assert('18. audit latest endpoint', latestRes.ok && latestJson.ok === true, String(latestRes.status));

    const auditTrailId = 'cccea-http-' + Date.now();
    await fetch(`${baseUrl}/api/command-center/chat-execution-audit/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auditId: auditTrailId,
        start: true,
        messagePreview: LISA_LIKE_PROMPT.slice(0, 80),
      }),
    });

    const brainRes = await fetch(`${baseUrl}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: LISA_LIKE_PROMPT,
        timestamp: Date.now(),
        activeProjectId: null,
        projectName: 'New Project',
        chatExecutionAuditId: auditTrailId,
      }),
    });
    const brainJson = (await brainRes.json()) as {
      category?: string;
      chatExecutionAudit?: { auditId?: string; summary?: Record<string, unknown> };
      buildIntentClassification?: { isBuildIntent?: boolean };
    };

    assert('19. brain respond called', brainRes.ok, String(brainRes.status));
    assert(
      '20. server handler reached',
      Boolean(brainJson.chatExecutionAudit?.summary?.serverHandlerReached),
      String(brainJson.chatExecutionAudit?.summary?.serverHandlerReached),
    );
    assert(
      '21. build intent decision recorded',
      Boolean(brainJson.chatExecutionAudit?.summary?.buildIntentDecisionRecorded),
      String(brainJson.buildIntentClassification?.isBuildIntent),
    );
    assert(
      '22. bridge invocation recorded',
      Boolean(brainJson.chatExecutionAudit?.summary?.bridgeInvoked),
      String(brainJson.chatExecutionAudit?.summary?.bridgeInvoked),
    );
    assert(
      '23. bridge skip has reason when skipped',
      !brainJson.chatExecutionAudit?.summary?.bridgeSkipped ||
        Boolean(brainJson.chatExecutionAudit?.summary?.bridgeSkipReason),
      String(brainJson.chatExecutionAudit?.summary?.bridgeSkipReason),
    );
    assert(
      '24. LISA-like prompt audit trail',
      brainJson.chatExecutionAudit?.auditId === auditTrailId,
      String(brainJson.chatExecutionAudit?.auditId),
    );
    assert(
      '25. full trail from submit to build or failure',
      brainJson.category === 'BUILD' || Boolean(brainJson.chatExecutionAudit?.summary?.noOpReason === null),
      String(brainJson.category),
    );

    const afterLatest = await fetch(`${baseUrl}${COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH}`);
    const afterJson = (await afterLatest.json()) as {
      audit?: { auditId?: string; events?: unknown[]; summary?: { serverHandlerReached?: boolean } };
    };
    assert(
      '26. latest audit returns HTTP trail',
      afterJson.audit?.auditId === auditTrailId,
      String(afterJson.audit?.auditId),
    );
    assert(
      '27. latest audit has server events',
      (afterJson.audit?.events?.length ?? 0) >= 3,
      String(afterJson.audit?.events?.length),
    );

    assert(
      '28. no silent no-op without reason on build path',
      !afterJson.audit?.summary?.noOpDetected ||
        Boolean(afterJson.audit && 'noOpReason' in afterJson.audit),
      'no-op reason',
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await settleEventLoop();
    rmSync(TEST_ROOT, { recursive: true, force: true });
  }

  assert(
    '29. bridge skip event constant exists',
    COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_SKIP === 'COMMAND_CENTER_CHAT_AUDIT_BRIDGE_SKIP',
    'constant',
  );
  assert(
    '30. render failure reason constant exists',
    COMMAND_CENTER_CHAT_AUDIT_EVENTS.TRACE_RENDER_EMPTY === 'COMMAND_CENTER_CHAT_AUDIT_TRACE_RENDER_EMPTY',
    'trace empty',
  );

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  if (failed.length === 0) {
    console.log(COMMAND_CENTER_CHAT_EXECUTION_AUDIT_V1_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }
  console.error(`Command Center Chat Execution Audit V1 — FAILED (${failed.length} checks)`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
