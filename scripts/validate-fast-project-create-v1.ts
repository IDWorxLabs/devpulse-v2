/**
 * Fast Project Create V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  FAST_PROJECT_CREATE_API_PATH,
  FAST_PROJECT_CREATE_CONTRACT_V1_PASS_TOKEN,
  FAST_PROJECT_CREATE_TRACE,
  FAST_PROJECT_CREATE_V1_PASS_TOKEN,
  executeFastProjectCreate,
  parseFastProjectCreateRequestBody,
  resolveFastProjectCreateRequestedName,
} from '../src/fast-project-create-v1/index.js';
import {
  invalidateProjectRegistryV1Cache,
  isUserFacingRegistryProject,
  readProjectRegistryState,
  resetProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import { readProjectSessionRecord, resolveProjectSessionFilePath } from '../src/project-session-continuity-v1/index.js';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { finishValidator, startFounderRealityValidatorServer } from './lib/validator-clean-exit.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

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
}

async function startTestServer(
  testRoot: string,
): Promise<{ server: Server; baseUrl: string; close: () => Promise<void> }> {
  return startFounderRealityValidatorServer(testRoot);
}

async function main(): Promise<void> {
  let closeTestServer: (() => Promise<void>) | null = null;
  try {
  console.log('');
  console.log('Fast Project Create V1 — Validation');
  console.log('===================================');
  console.log('');

  await resetModules();

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const clientJs = readFileSync(join(ROOT, 'public/founder-reality/command-center-fast-create-client.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const routerTs = readFileSync(join(ROOT, 'server/project-api-router.ts'), 'utf8');
  const handlerTs = readFileSync(join(ROOT, 'server/fast-project-create-handler.ts'), 'utf8');
  const contractTs = readFileSync(join(ROOT, 'src/fast-project-create-v1/fast-project-create-contract.ts'), 'utf8');
  const authorityTs = readFileSync(join(ROOT, 'src/fast-project-create-v1/fast-project-create-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:fast-project-create']), 'script');
  assert('02. module index', existsSync(join(ROOT, 'src/fast-project-create-v1/index.ts')), 'index.ts');
  assert('03. server handler', existsSync(join(ROOT, 'server/fast-project-create-handler.ts')), 'handler');
  assert('04. API path constant', FAST_PROJECT_CREATE_API_PATH === '/api/projects/fast-create', 'path');
  assert('05. router wires fast-create', routerTs.includes('handleFastProjectCreateRequest'), 'router');
  assert('06. app uses fast-create API', appJs.includes('CommandCenterFastCreateClient') && clientJs.includes("'/api/projects/fast-create'"), 'client api');
  assert('07. no hydration gate on submit', !/function guardProjectCreateSubmit[\s\S]*Loading projects/.test(appJs), 'guard');
  assert('08. 2 second timeout', clientJs.includes('FAST_PROJECT_CREATE_TIMEOUT_MS = 2000'), 'timeout');
  assert('09. shared client loaded in index', indexHtml.includes('/command-center-fast-create-client.js'), 'index client');
  assert('10. duplicate dialog html', indexHtml.includes('project-duplicate-dialog'), 'duplicate dialog');
  assert('11. resume button', indexHtml.includes('project-duplicate-resume'), 'resume');
  assert('12. fresh copy button', indexHtml.includes('project-duplicate-fresh-copy'), 'fresh copy');
  assert('13. finalize opens command center', appJs.includes("switchView('command-center')"), 'command center');
  assert('14. fast create trace', appJs.includes(FAST_PROJECT_CREATE_TRACE), 'trace');
  assert('15. authority skips build state derive', !authorityTs.includes('deriveProjectBuildState'), 'no build derive');
  assert('16. authority creates session', authorityTs.includes('ensureProjectSessionForProject'), 'session');
  assert('17. handler returns contract version', handlerTs.includes('FAST_PROJECT_CREATE_CONTRACT_VERSION'), 'contract');
  assert('18. background registry hydration', appJs.includes('loadProjectRegistryState'), 'background hydrate');

  assert(
    '39. contract resolves projectName',
    resolveFastProjectCreateRequestedName({ projectName: 'HabitFlow' }) === 'HabitFlow',
    'projectName',
  );
  assert(
    '40. contract prefers projectName over name',
    resolveFastProjectCreateRequestedName({ projectName: 'HabitFlow', name: 'Other' }) === 'HabitFlow',
    'priority',
  );
  assert(
    '41. contract accepts requestedName fallback',
    resolveFastProjectCreateRequestedName({ requestedName: 'HabitFlow' }) === 'HabitFlow',
    'requestedName',
  );
  assert(
    '42. handler uses parseFastProjectCreateRequestBody',
    handlerTs.includes('parseFastProjectCreateRequestBody'),
    'handler parse',
  );
  assert(
    '43. client sends projectName field',
    clientJs.includes('projectName: trimmed'),
    'client projectName',
  );
  assert(
    '44. modal clears timeout on response',
    /createRequestCompleted = true[\s\S]*clearTimeout\(timeoutId\)/.test(clientJs),
    'timeout clear',
  );
  assert(
    '45. contract module exports pass token',
    contractTs.includes(FAST_PROJECT_CREATE_CONTRACT_V1_PASS_TOKEN),
    'contract token',
  );

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-fast-create-'));
  resetProjectRegistryV1ForTests(TEST_ROOT);
  invalidateProjectRegistryV1Cache();

  const startedAt = Date.now();
  const direct = executeFastProjectCreate({ name: 'Fast Create Alpha', rootDir: TEST_ROOT });
  const directElapsedMs = Date.now() - startedAt;

  assert('19. direct create ok', direct.ok === true, String(direct.ok));
  assert('20. direct create under 2s', directElapsedMs < 2000, `${directElapsedMs}ms`);
  assert(
    '21. USER project kind',
    direct.ok && isUserFacingRegistryProject(direct.project),
    direct.ok ? direct.project.projectKind : 'n/a',
  );
  assert('22. active session id', direct.ok === true && Boolean(direct.activeSessionId), 'session id');
  assert(
    '23. registry activeProjectId',
    direct.ok === true && readProjectRegistryState(TEST_ROOT).activeProjectId === direct.projectId,
    'active project',
  );

  if (direct.ok) {
    const sessionPath = resolveProjectSessionFilePath(direct.projectId, direct.activeSessionId, TEST_ROOT)
      .replace(/\\/g, '/');
    assert('24. session file exists', existsSync(sessionPath), sessionPath);
    const session = readProjectSessionRecord(direct.projectId, direct.activeSessionId, TEST_ROOT);
    assert('25. empty chat messages', Boolean(session && session.chatMessages.length === 0), 'empty chat');
    assert(
      '26. project session context',
      Boolean(direct.projectSession && direct.projectSession.projectId === direct.projectId),
      'context',
    );
  } else {
    assert('24. session file exists', false, 'skipped — create failed');
    assert('25. empty chat messages', false, 'skipped');
    assert('26. project session context', false, 'skipped');
  }

  const duplicate = executeFastProjectCreate({ name: 'Fast Create Alpha', rootDir: TEST_ROOT });
  assert('27. duplicate blocked', duplicate.ok === false && 'existingProjectId' in duplicate, '409 shape');
  assert(
    '28. duplicate choices',
    duplicate.ok === false && duplicate.duplicateChoices.includes('resume'),
    'choices',
  );

  const freshCopy = executeFastProjectCreate({
    name: 'Fast Create Alpha',
    confirmFreshCopy: true,
    rootDir: TEST_ROOT,
  });
  assert('29. fresh copy ok', freshCopy.ok === true, String(freshCopy.ok));
  assert(
    '30. fresh copy unique name',
    freshCopy.ok === true && freshCopy.projectName.includes('('),
    freshCopy.ok ? freshCopy.projectName : 'n/a',
  );

  const { baseUrl, close } = await startTestServer(TEST_ROOT);
  closeTestServer = close;
  try {
    const apiStartedAt = Date.now();
    const res = await fetch(`${baseUrl}${FAST_PROJECT_CREATE_API_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ name: 'API Fast Project' }),
    });
    const apiElapsedMs = Date.now() - apiStartedAt;
    const payload = (await res.json()) as Awaited<ReturnType<typeof executeFastProjectCreate>>;

    assert('31. API HTTP 200', res.status === 200, String(res.status));
    assert('32. API under 2 seconds', apiElapsedMs < 2000, `${apiElapsedMs}ms`);
    assert('33. API returns projectId', payload.ok === true && Boolean(payload.projectId), 'projectId');
    assert(
      '34. API not audit project',
      payload.ok === true && !/^readiness-audit-/.test(payload.projectId),
      payload.ok ? payload.projectId : 'n/a',
    );

    const chatRes = await fetch(`${baseUrl}/api/project-sessions/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({
        projectId: payload.ok ? payload.projectId : '',
        sessionId: payload.ok ? payload.activeSessionId : '',
        role: 'user',
        text: 'Hello fast create',
        html: '<div class="chat-message user">Hello fast create</div>',
      }),
    });
    assert('35. chat persist HTTP 200', chatRes.status === 200, String(chatRes.status));

    if (payload.ok) {
      const persisted = readProjectSessionRecord(payload.projectId, payload.activeSessionId, TEST_ROOT);
      assert(
        '36. chat persisted',
        Boolean(persisted && persisted.chatMessages.some((m) => m.text === 'Hello fast create')),
        'message',
      );
    } else {
      assert('36. chat persisted', false, 'skipped');
    }

    const dupRes = await fetch(`${baseUrl}${FAST_PROJECT_CREATE_API_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ name: 'API Fast Project' }),
    });
    assert('37. API duplicate HTTP 409', dupRes.status === 409, String(dupRes.status));
    const dupPayload = (await dupRes.json()) as { duplicateChoices?: string[] };
    assert(
      '38. API duplicate choices',
      Array.isArray(dupPayload.duplicateChoices) && dupPayload.duplicateChoices.includes('fresh-copy'),
      'choices',
    );

    const habitFlowStartedAt = Date.now();
    const habitFlowRes = await fetch(`${baseUrl}${FAST_PROJECT_CREATE_API_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ projectName: 'HabitFlow' }),
    });
    const habitFlowElapsedMs = Date.now() - habitFlowStartedAt;
    const habitFlowPayload = (await habitFlowRes.json()) as {
      ok?: boolean;
      projectName?: string;
      existingProjectName?: string;
    };

    assert('46. projectName contract HTTP success', habitFlowRes.status === 200, String(habitFlowRes.status));
    assert('47. projectName HabitFlow under 2s', habitFlowElapsedMs < 2000, `${habitFlowElapsedMs}ms`);
    assert(
      '48. projectName HabitFlow response',
      habitFlowPayload.projectName === 'HabitFlow',
      habitFlowPayload.projectName ?? 'missing',
    );
    assert(
      '49. parseFastProjectCreateRequestBody matches handler',
      parseFastProjectCreateRequestBody({ projectName: 'HabitFlow' }).name === 'HabitFlow',
      'parsed',
    );
  } finally {
    await close();
    closeTestServer = null;
  }

  rmSync(TEST_ROOT, { recursive: true, force: true });

  let localhostContractOk = false;
  let localhostContractDetail = 'localhost:4321 not reachable';
  try {
    const localhostStartedAt = Date.now();
    const localhostRes = await fetch(`http://localhost:4321${FAST_PROJECT_CREATE_API_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ projectName: 'HabitFlow' }),
      signal: AbortSignal.timeout(2500),
    });
    const localhostElapsedMs = Date.now() - localhostStartedAt;
    const localhostPayload = (await localhostRes.json()) as {
      ok?: boolean;
      projectName?: string;
      existingProjectName?: string;
    };
    if (localhostRes.status === 200) {
      localhostContractOk =
        localhostPayload.projectName === 'HabitFlow' && localhostElapsedMs < 2000;
      localhostContractDetail = `${localhostPayload.projectName ?? 'missing'} in ${localhostElapsedMs}ms`;
    } else if (localhostRes.status === 409) {
      localhostContractOk =
        localhostPayload.existingProjectName === 'HabitFlow' && localhostElapsedMs < 2000;
      localhostContractDetail = `duplicate ${localhostPayload.existingProjectName ?? 'missing'} in ${localhostElapsedMs}ms`;
    } else {
      localhostContractDetail = `HTTP ${localhostRes.status}`;
    }
  } catch (err) {
    localhostContractDetail =
      err instanceof Error ? err.message : 'localhost:4321 not reachable';
  }
  assert('50. localhost projectName HabitFlow contract', localhostContractOk, localhostContractDetail);

  await resetModules();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log('');
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);

  if (failed.length === 0) {
    console.log('');
    console.log(FAST_PROJECT_CREATE_V1_PASS_TOKEN);
    console.log(FAST_PROJECT_CREATE_CONTRACT_V1_PASS_TOKEN);
    await finishValidator(0);
  } else {
    console.error('');
    console.error(`${failed.length} check(s) failed`);
    await finishValidator(1);
  }
  } finally {
    if (closeTestServer) {
      await closeTestServer();
    }
  }
}

main().catch(async (err) => {
  console.error(err);
  await finishValidator(1);
});
