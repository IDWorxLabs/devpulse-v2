/**
 * Command Center HTTP Routing Forensic Audit V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_EVENT_PATH,
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH,
} from '../src/command-center-chat-execution-audit-v1/audit-types.js';
import {
  COMMAND_CENTER_HTTP_ROUTING_FORENSIC_AUDIT_V1_PASS_TOKEN,
  HTTP_ROUTING_FORENSIC_EVENT_PATH,
  HTTP_ROUTING_FORENSIC_LATEST_PATH,
  HTTP_ROUTING_FORENSIC_REGISTRATION_PATH,
  HTTP_ROUTING_FORENSIC_EVENTS,
  HTTP_ROUTING_FORENSIC_REQUEST_HEADER,
  buildRouteRegistrationAuditReport,
  getHttpRoutingForensicTrace,
  isCommandCenterHttpPathForbidden,
  readFounderRealityServerSource,
  resetHttpRoutingForensicStoreForTests,
} from '../src/command-center-http-routing-forensic-audit-v1/index.js';
import { resetChatExecutionAuditStoreForTests } from '../src/command-center-chat-execution-audit-v1/index.js';
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
import { finishValidator, startFounderRealityValidatorServer } from './lib/validator-clean-exit.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

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
  resetChatExecutionAuditStoreForTests();
  resetHttpRoutingForensicStoreForTests();
}

function eventNames(requestId: string): string[] {
  const trace = getHttpRoutingForensicTrace(requestId);
  return trace?.events.map((event) => String(event.name)) ?? [];
}

async function main(): Promise<void> {
  console.log('');
  console.log('Command Center HTTP Routing Forensic Audit V1 — Validation');
  console.log('=========================================================');
  console.log('');

  const testRoot = mkdtempSync(join(tmpdir(), 'cc-http-forensic-'));
  let closeTestServer: (() => Promise<void>) | null = null;

  try {
    const serverSource = readFounderRealityServerSource();
    const forensicJs = readFileSync(
      join(ROOT, 'public/founder-reality/command-center-http-routing-forensic.js'),
      'utf8',
    );
    const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };

    assert('01. validator script registered', Boolean(pkg.scripts?.['validate:command-center-http-routing-forensic']), 'package.json');
    assert('02. forensic module exists', existsSync(join(ROOT, 'src/command-center-http-routing-forensic-audit-v1/index.ts')), 'module');
    assert('03. browser client exists', existsSync(join(ROOT, 'public/founder-reality/command-center-http-routing-forensic.js')), 'client');
    assert('04. no legacy exec substring guard', !/urlPath\.includes\(['"]exec['"]\)/.test(serverSource), 'server source');
    assert('05. uses prefix forbidden guard', serverSource.includes('isCommandCenterHttpPathForbidden'), 'server source');
    assert('06. audit latest route registered', serverSource.includes(COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH), 'audit route');
    assert('07. forensic latest route registered', serverSource.includes(HTTP_ROUTING_FORENSIC_LATEST_PATH), 'forensic route');
    assert('08. app.js uses HttpForensic wrapFetch', appJs.includes('CommandCenterHttpRoutingForensic'), 'app.js');
    assert('09. browser client wrapFetch', forensicJs.includes('wrapFetch'), 'client');
    assert('10. browser client request header', forensicJs.includes('X-Command-Center-Request-Id'), 'client');

    const registrationReport = buildRouteRegistrationAuditReport();
    const auditLatestEntry = registrationReport.entries.find(
      (entry) => entry.route === COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH,
    );
    assert('11. audit latest registered in report', auditLatestEntry?.registered === true, 'registration');
    assert('12. audit latest not shadowed', auditLatestEntry?.shadowed !== true, 'shadow');
    assert('13. audit latest not blocked', auditLatestEntry?.blocked !== true, 'blocked');

    assert(
      '14. chat-execution-audit path not forbidden',
      !isCommandCenterHttpPathForbidden(COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH),
      'forbidden helper',
    );

    await resetModules();
    const boot = await startFounderRealityValidatorServer(testRoot);
    closeTestServer = boot.close;
    const baseUrl = boot.baseUrl;

    // Scenario 1: GET /api/brain/respond routing (405, not forbidden)
    const brainGetRes = await fetch(`${baseUrl}/api/brain/respond`, { method: 'GET' });
    const brainGetBody = await brainGetRes.text();
    assert('15. GET /api/brain/respond not forbidden', brainGetRes.status !== 403, `status=${brainGetRes.status}`);
    assert(
      '16. GET /api/brain/respond not handled as POST route',
      brainGetRes.status === 405 || brainGetRes.status === 404,
      `status=${brainGetRes.status} body=${brainGetBody.slice(0, 80)}`,
    );

    // Scenario 2: POST /api/brain/respond
    const requestId = `cc-http-test-${Date.now()}`;
    const brainPostRes = await fetch(`${baseUrl}/api/brain/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [HTTP_ROUTING_FORENSIC_REQUEST_HEADER]: requestId,
      },
      body: JSON.stringify({
        message: LISA_LIKE_PROMPT,
        chatExecutionAuditId: `audit-${Date.now()}`,
      }),
    });
    const responseRequestId = brainPostRes.headers.get('x-command-center-request-id');
    assert('17. POST /api/brain/respond responds', brainPostRes.status === 200, `status=${brainPostRes.status}`);
    assert('18. response includes requestId header', Boolean(responseRequestId), responseRequestId ?? 'missing');
    await settleEventLoop();
    const brainTrace = getHttpRoutingForensicTrace(requestId);
    const brainEvents = eventNames(requestId);
    assert('19. trace stored for brain POST', Boolean(brainTrace), 'trace');
    assert('20. HTTP_REQUEST_RECEIVED recorded', brainEvents.includes(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_REQUEST_RECEIVED), brainEvents.join(','));
    assert('21. HTTP_ROUTE_MATCHED recorded', brainEvents.includes(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_ROUTE_MATCHED), brainEvents.join(','));
    assert('22. HANDLER_ENTER recorded', brainEvents.includes(HTTP_ROUTING_FORENSIC_EVENTS.HANDLER_ENTER), brainEvents.join(','));
    assert('23. HTTP_RESPONSE_SENT recorded', brainEvents.includes(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_RESPONSE_SENT), brainEvents.join(','));
    assert('24. forensic report present', brainTrace?.report?.reportType === 'COMMAND_CENTER_HTTP_FORENSIC_REPORT', 'report');

    // Scenario 3: GET audit endpoint
    const auditLatestRes = await fetch(`${baseUrl}${COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH}`);
    const auditLatestJson = (await auditLatestRes.json()) as { error?: string; ok?: boolean };
    assert('25. GET chat-execution-audit/latest not forbidden', auditLatestRes.status !== 403, `status=${auditLatestRes.status}`);
    assert('26. GET chat-execution-audit/latest ok', auditLatestRes.status === 200 && auditLatestJson.ok === true, JSON.stringify(auditLatestJson).slice(0, 120));

    // Scenario 4: POST audit event endpoint
    const auditEventRes = await fetch(`${baseUrl}${COMMAND_CENTER_CHAT_EXECUTION_AUDIT_EVENT_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auditId: `validator-audit-${Date.now()}`,
        start: true,
        name: 'COMMAND_CENTER_CHAT_AUDIT_FORM_SUBMIT_ENTER',
        detail: 'Validator synthetic audit event.',
      }),
    });
    assert('27. POST chat-execution-audit/event ok', auditEventRes.status === 200, `status=${auditEventRes.status}`);

    // Scenario 5: Forbidden endpoint detection
    const forbiddenRes = await fetch(`${baseUrl}/api/exec/run`);
    const forbiddenJson = (await forbiddenRes.json()) as { error?: string };
    assert('28. forbidden /api/exec returns 403', forbiddenRes.status === 403, `status=${forbiddenRes.status}`);
    assert('29. forbidden reason present', Boolean(forbiddenJson.error), forbiddenJson.error ?? 'missing');

    // Scenario 6: Missing route detection
    const missingRes = await fetch(`${baseUrl}/api/command-center/does-not-exist-route`);
    assert('30. missing route returns 404', missingRes.status === 404, `status=${missingRes.status}`);

    // Scenario 7: Duplicate route detection (static analysis)
    const duplicateCount = (serverSource.match(/urlPath === '\/api\/brain\/respond'/g) ?? []).length;
    assert('31. no duplicate brain respond registration', duplicateCount <= 1, `count=${duplicateCount}`);

    // Scenario 8: Middleware rejection detection
    const middlewareBlockedTraceId = `middleware-test-${Date.now()}`;
    const middlewareRes = await fetch(`${baseUrl}/api/exec`, {
      headers: { [HTTP_ROUTING_FORENSIC_REQUEST_HEADER]: middlewareBlockedTraceId },
    });
    assert('32. middleware rejects /api/exec', middlewareRes.status === 403, `status=${middlewareRes.status}`);
    await settleEventLoop();
    const middlewareEvents = eventNames(middlewareBlockedTraceId);
    assert('33. middleware blocked event recorded', middlewareEvents.includes(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_MIDDLEWARE_BLOCKED), middlewareEvents.join(','));

    // Scenario 9: Bridge request trace
    assert('34. bridge enter in brain trace', brainEvents.includes(HTTP_ROUTING_FORENSIC_EVENTS.BRIDGE_ENTER), brainEvents.join(','));

    // Scenario 10: Every request receives requestId
    assert('35. requestId echoed in response header', responseRequestId === requestId, `${responseRequestId} vs ${requestId}`);

    // Scenario 11: No silent HTTP termination
    assert(
      '36. failed forbidden request has forensic events',
      middlewareEvents.includes(HTTP_ROUTING_FORENSIC_EVENTS.HTTP_RESPONSE_SENT),
      middlewareEvents.join(','),
    );

    // Scenario 12: Failed request identifies blocking layer
    const middlewareTrace = getHttpRoutingForensicTrace(middlewareBlockedTraceId);
    assert('37. firstFailure identifies blocking layer', Boolean(middlewareTrace?.report?.firstFailure), 'firstFailure missing');
    assert(
      '38. blocking layer is middleware or router',
      ['Middleware reached', 'Router reached', 'Endpoint registered'].includes(
        middlewareTrace?.report?.firstFailure?.stage ?? '',
      ) || middlewareTrace?.report?.firstFailure?.status === 'FAIL',
      middlewareTrace?.report?.firstFailure?.stage ?? 'none',
    );

    // Forensic endpoints
    const regRes = await fetch(`${baseUrl}${HTTP_ROUTING_FORENSIC_REGISTRATION_PATH}`);
    const regJson = (await regRes.json()) as { report?: { entries?: unknown[] } };
    assert('39. route registration endpoint', regRes.status === 200 && Array.isArray(regJson.report?.entries), 'registration endpoint');

    await fetch(`${baseUrl}${HTTP_ROUTING_FORENSIC_EVENT_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        name: 'BROWSER_FETCH_RESPONSE',
        detail: 'Validator synthetic browser response event.',
      }),
    });
    const latestRes = await fetch(`${baseUrl}${HTTP_ROUTING_FORENSIC_LATEST_PATH}?requestId=${encodeURIComponent(requestId)}`);
    const latestJson = (await latestRes.json()) as { report?: { stages?: unknown[] } };
    assert('40. forensic latest endpoint', latestRes.status === 200 && Array.isArray(latestJson.report?.stages), 'latest endpoint');
  } finally {
    if (closeTestServer) {
      await closeTestServer();
    }
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
    console.log(COMMAND_CENTER_HTTP_ROUTING_FORENSIC_AUDIT_V1_PASS_TOKEN);
    await finishValidator(0);
  } else {
    await finishValidator(1);
  }
}

main().catch(async (err) => {
  console.error(err);
  await finishValidator(1);
});
