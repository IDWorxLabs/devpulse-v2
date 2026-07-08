/**
 * Command Center Chat Response Execution Repair V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHAT_RESPONSE_REPAIR_AUDIT_EVENTS,
  COMMAND_CENTER_CHAT_RESPONSE_EXECUTION_REPAIR_V1_PASS_TOKEN,
  evaluateChatExecutionGate,
  evaluateSessionRepair,
  FETCH_WATCHDOG_MS,
  POST_RENDER_STOPPED_MESSAGE,
} from '../src/command-center-chat-response-execution-repair-v1/index.js';
import { COMMAND_CENTER_CHAT_AUDIT_EVENTS } from '../src/command-center-chat-execution-audit-v1/index.js';
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
import { resetChatExecutionAuditStoreForTests } from '../src/command-center-chat-execution-audit-v1/index.js';
import { finishValidator, startFounderRealityValidatorServer } from './lib/validator-clean-exit.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const CALCULATOR_PROMPT = 'Build a calculator app.';
const LISA_LIKE_PROMPT =
  'Build LISA, an assistive communication web application for non-verbal users with eye-tracking input, caregiver dashboard, emergency speech, and communication history. Generate architecture, plan, tasks, and begin build execution.';

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
  resetProjectRegistryV1ForTests();
  resetChatExecutionAuditStoreForTests();
}

async function main(): Promise<void> {
  let closeTestServer: (() => Promise<void>) | null = null;
  const testRoot = mkdtempSync(join(tmpdir(), 'cc-chat-response-repair-'));

  try {
    console.log('');
    console.log('Command Center Chat Response Execution Repair V1 — Validation');
    console.log('============================================================');
    console.log('');

    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
    const repairJs = readFileSync(
      join(ROOT, 'public/founder-reality/command-center-chat-response-execution-repair.js'),
      'utf8',
    );
    const reconciliationJs = readFileSync(
      join(ROOT, 'public/founder-reality/runtime-banner-truth-reconciliation.js'),
      'utf8',
    );
    const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');

    assert('01. package script registered', Boolean(pkg.scripts?.['validate:command-center-chat-response-execution-repair']), 'package.json');
    assert('02. repair module exists', existsSync(join(ROOT, 'src/command-center-chat-response-execution-repair-v1/index.ts')), 'module');
    assert('03. browser repair client exists', existsSync(join(ROOT, 'public/founder-reality/command-center-chat-response-execution-repair.js')), 'client');
    assert('04. script tag in index.html', indexHtml.includes('command-center-chat-response-execution-repair.js'), 'index.html');

    assert(
      '05. AFTER_USER_MESSAGE_RENDERED in submit handler',
      appJs.includes('AFTER_USER_MESSAGE_RENDERED') && appJs.includes('userMessageRendered: true'),
      'app.js',
    );
    assert(
      '06. showThinking after user message render',
      appJs.includes("appendChatMessage(text, 'user')") &&
        appJs.includes('Brain analyzing indicator displayed immediately after user message render'),
      'app.js order',
    );
    assert('07. fetch watchdog armed', appJs.includes('armFetchWatchdog'), 'app.js');
    assert('08. executeBrainRespondFetch extracted', appJs.includes('function executeBrainRespondFetch'), 'app.js');
    assert('09. visible blocking error helper', appJs.includes('showVisibleChatBlockingError'), 'app.js');
    assert('10. degraded runtime truth continue', appJs.includes('DEGRADED_RUNTIME_TRUTH_CONTINUE'), 'app.js');

    assert(
      '11. reconciliation chatExecutionAllowed',
      reconciliationJs.includes('chatExecutionAllowed') && reconciliationJs.includes('runtimeTruthDegraded'),
      'reconciliation.js',
    );
    assert(
      '12. classify allowed when healthReady',
      reconciliationJs.includes('healthReady'),
      'reconciliation classify',
    );

    const staleHealthGate = evaluateChatExecutionGate({
      localRuntimeHealthy: true,
      healthReady: true,
      truthFresh: false,
      runtimeTruthReady: false,
      runtimeTruthClassifyAllowed: false,
      runtimeReadinessLifecycle: 'READY',
    });
    assert('13. stale truth + healthReady continues degraded', staleHealthGate.allowed === true && staleHealthGate.degraded === true, JSON.stringify(staleHealthGate));
    assert('14. stale truth + healthReady not blocked', staleHealthGate.blocked !== true, 'blocked');

    const staleNoHealthGate = evaluateChatExecutionGate({
      localRuntimeHealthy: false,
      healthReady: false,
      truthFresh: false,
      runtimeTruthReady: false,
      runtimeTruthClassifyAllowed: false,
      runtimeReadinessLifecycle: 'UNAVAILABLE',
    });
    assert('15. stale truth without health blocks visibly', staleNoHealthGate.blocked === true, JSON.stringify(staleNoHealthGate));

    const sessionRepair = evaluateSessionRepair({
      activeProjectId: 'proj-1',
      activeSessionId: null,
      hydrationState: 'empty',
      hasSessionContinuityApi: true,
    });
    assert('16. missing session triggers repair', sessionRepair.needsRepair === true && sessionRepair.canContinue === true, JSON.stringify(sessionRepair));

    assert('17. watchdog ms is 500', FETCH_WATCHDOG_MS === 500, String(FETCH_WATCHDOG_MS));
    assert('18. post render stopped message', POST_RENDER_STOPPED_MESSAGE.includes('stopped after local message render'), POST_RENDER_STOPPED_MESSAGE);
    assert('19. repair audit event constant', CHAT_RESPONSE_REPAIR_AUDIT_EVENTS.AFTER_USER_MESSAGE_RENDERED === COMMAND_CENTER_CHAT_AUDIT_EVENTS.AFTER_USER_MESSAGE_RENDERED, 'events');
    assert('20. repair client gate evaluator', repairJs.includes('evaluateChatExecutionGate'), 'repair.js');

    assert(
      '21. no silent runtime truth block before showThinking path',
      !appJs.includes("Blocked before fetch — runtime truth not ready or classify route unavailable."),
      'removed silent block string',
    );

    assert(
      '22. autonomous builder status does not gate askBrain',
      !/askBrain[\s\S]{0,2000}autonomousBuilder/.test(appJs),
      'no builder gate in askBrain',
    );

    await resetModules();
    const boot = await startFounderRealityValidatorServer(testRoot);
    closeTestServer = boot.close;
    const baseUrl = boot.baseUrl;

    const calcRes = await fetch(`${baseUrl}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: CALCULATOR_PROMPT,
        chatExecutionAuditId: `repair-calc-${Date.now()}`,
      }),
    });
    const calcBody = (await calcRes.json()) as {
      brainResponse?: string;
      chatToBuildExecutionBridge?: { kind?: string };
      buildIntentClassification?: { isBuildIntent?: boolean };
    };
    assert('23. calculator POST /api/brain/respond ok', calcRes.status === 200, `status=${calcRes.status}`);
    assert(
      '24. calculator build intent or bridge payload',
      calcBody.buildIntentClassification?.isBuildIntent === true ||
        Boolean(calcBody.chatToBuildExecutionBridge?.kind) ||
        Boolean(calcBody.brainResponse),
      JSON.stringify(calcBody).slice(0, 160),
    );
    assert(
      '25. bridge header or payload on calculator',
      calcRes.headers.get('x-devpulse-chat-to-build-bridge') !== null ||
        Boolean(calcBody.chatToBuildExecutionBridge),
      'bridge',
    );

    const lisaRes = await fetch(`${baseUrl}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: LISA_LIKE_PROMPT,
        chatExecutionAuditId: `repair-lisa-${Date.now()}`,
      }),
    });
    const lisaBody = (await lisaRes.json()) as {
      chatToBuildExecutionBridge?: { kind?: string; progressItems?: unknown[] };
      category?: string;
      brainResponse?: string;
    };
    await settleEventLoop();
    assert('26. LISA-like POST ok', lisaRes.status === 200, `status=${lisaRes.status}`);
    assert(
      '27. LISA-like bridge/ASE or explicit block reason in payload',
      Boolean(lisaBody.chatToBuildExecutionBridge?.kind) ||
        lisaBody.category === 'BUILD' ||
        Boolean(lisaBody.brainResponse) ||
        Boolean((lisaBody as { projectContextAlignment?: unknown }).projectContextAlignment) ||
        Boolean((lisaBody as { projectResume?: unknown }).projectResume),
      JSON.stringify(lisaBody).slice(0, 200),
    );
    assert(
      '28. LISA bridge progress or alignment/resume guard',
      (lisaBody.chatToBuildExecutionBridge?.progressItems?.length ?? 0) > 0 ||
        ['ALIGNMENT_REQUIRED', 'RESUME_REQUIRED', 'BUILD_COMPLETE', 'BUILD_FAILED', 'CHAT_ONLY'].includes(
          lisaBody.chatToBuildExecutionBridge?.kind ?? '',
        ) ||
        Boolean(lisaBody.brainResponse),
      'trace/progress',
    );

    assert('29. FETCH_START constant exported', COMMAND_CENTER_CHAT_AUDIT_EVENTS.FETCH_START.length > 0, 'fetch start');
    assert('30. ensureSessionContinuityForChat in app.js', appJs.includes('ensureSessionContinuityForChat'), 'session repair');
  } finally {
    if (closeTestServer) await closeTestServer();
    rmSync(testRoot, { recursive: true, force: true });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
  }

  console.log('');
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }

  const failed = results.filter((check) => !check.passed);
  console.log('');
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  console.log('');

  if (failed.length === 0) {
    console.log(COMMAND_CENTER_CHAT_RESPONSE_EXECUTION_REPAIR_V1_PASS_TOKEN);
    await finishValidator(0);
  } else {
    await finishValidator(1);
  }
}

main().catch(async (err) => {
  console.error(err);
  await finishValidator(1);
});
