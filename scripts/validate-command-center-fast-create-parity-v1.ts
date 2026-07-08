/**
 * Command Center Fast Create Parity V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  COMMAND_CENTER_FAST_CREATE_CLIENT_PATH,
  COMMAND_CENTER_FAST_CREATE_PARITY_V1_PASS_TOKEN,
  COMMAND_CENTER_FAST_CREATE_SUCCESS_TRACE,
} from '../src/command-center-fast-create-parity-v1/index.js';
import {
  FAST_PROJECT_CREATE_API_PATH,
  executeFastProjectCreate,
  parseFastProjectCreateRequestBody,
} from '../src/fast-project-create-v1/index.js';
import {
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
  resetProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import { readProjectSessionRecord } from '../src/project-session-continuity-v1/index.js';
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
    console.log('Command Center Fast Create Parity V1 — Validation');
    console.log('=================================================');
    console.log('');

    await resetModules();

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const builderHtml = readFileSync(join(ROOT, 'public/founder-reality/builder-test.html'), 'utf8');
  const clientJs = readFileSync(join(ROOT, 'public/founder-reality/command-center-fast-create-client.js'), 'utf8');
  const contractTs = readFileSync(join(ROOT, 'src/fast-project-create-v1/fast-project-create-contract.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:command-center-fast-create-parity']), 'script');
  assert('02. parity module', existsSync(join(ROOT, 'src/command-center-fast-create-parity-v1/index.ts')), 'module');
  assert('03. shared client file', existsSync(join(ROOT, 'public/founder-reality/command-center-fast-create-client.js')), 'client');
  assert('04. client path constant', COMMAND_CENTER_FAST_CREATE_CLIENT_PATH === '/command-center-fast-create-client.js', 'path');
  assert('05. index loads client before app', indexHtml.indexOf('/command-center-fast-create-client.js') < indexHtml.indexOf('/app.js'), 'index order');
  assert('06. builder-test loads client', builderHtml.includes('/command-center-fast-create-client.js'), 'builder-test');
  assert('07. same fast-create endpoint', clientJs.includes(FAST_PROJECT_CREATE_API_PATH), 'endpoint');
  assert('08. app uses shared client', appJs.includes('CommandCenterFastCreateClient'), 'app client');
  assert('09. app calls postFastProjectCreate', appJs.includes('postFastProjectCreate'), 'post helper');
  assert('10. app sends forceFreshProject', appJs.includes('forceFreshProject: true'), 'forceFreshProject');
  assert('11. success trace', appJs.includes(COMMAND_CENTER_FAST_CREATE_SUCCESS_TRACE), 'trace');
  assert('12. no legacy registry create', !appJs.includes("mutateProjectRegistry('create'"), 'legacy create');
  const guardFn = appJs.match(/function guardProjectCreateSubmit\(name\) \{[\s\S]*?\n  \}/);
  assert(
    '13. no hydration gate in guard',
    Boolean(guardFn) && !guardFn[0].includes('isProjectRegistryHydrated'),
    'guard',
  );
  assert('14. instant state helper', appJs.includes('applyInstantFastCreateClientState'), 'instant state');
  assert('15. enable chat input', appJs.includes('enableCommandCenterChatInput'), 'chat input');
  assert('16. background registry refresh', appJs.includes('scheduleBackgroundRegistryRefreshAfterFastCreate'), 'background');
  assert('17. skip heavy refresh option', appJs.includes('skipHeavyRefresh'), 'skip heavy');
  assert('18. modal closes before refresh', /hideProjectNameDialog\(\)[\s\S]*scheduleBackgroundRegistryRefreshAfterFastCreate/.test(appJs), 'modal first');
  assert('19. client clears timeout on response', /createRequestCompleted = true[\s\S]*clearTimeout\(timeoutId\)/.test(clientJs), 'timeout clear');
  assert('20. client no abort controller', !clientJs.includes('AbortController'), 'no abort');
  assert('21. client forceFreshProject default', clientJs.includes('forceFreshProject: input && input.forceFreshProject !== false'), 'default fresh');
  assert('22. contract parses forceFreshProject', contractTs.includes('forceFreshProject'), 'contract');
  assert('23. no app hardcoding', !/\bLISA\b/.test(appJs.slice(appJs.indexOf('function createProjectViaFastApi'), appJs.indexOf('function loadProjectRegistryState'))), 'generic');

  const parsed = parseFastProjectCreateRequestBody({
    projectName: 'ParityApp',
    forceFreshProject: true,
  });
  assert('24. parsed forceFreshProject', parsed.forceFreshProject === true, String(parsed.forceFreshProject));
  assert('25. parsed projectName', parsed.name === 'ParityApp', parsed.name);

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-cc-fast-create-parity-'));
  process.env.AIDEVENGINE_REGISTRY_ROOT = TEST_ROOT;
  resetProjectRegistryV1ForTests(TEST_ROOT);
  invalidateProjectRegistryV1Cache();

  const startedAt = Date.now();
  const direct = executeFastProjectCreate({
    name: 'ParityApp',
    forceFreshProject: true,
    rootDir: TEST_ROOT,
  });
  const elapsedMs = Date.now() - startedAt;

  assert('26. direct create ok', direct.ok === true, String(direct.ok));
  assert('27. direct create under 2s', elapsedMs < 2000, `${elapsedMs}ms`);
  assert('28. session attached', direct.ok === true && Boolean(direct.activeSessionId), 'session');
  if (direct.ok) {
    const session = readProjectSessionRecord(direct.projectId, direct.activeSessionId, TEST_ROOT);
    assert('29. empty chat session', Boolean(session && session.chatMessages.length === 0), 'empty chat');
  } else {
    assert('29. empty chat session', false, 'skipped');
  }

    const { baseUrl, close } = await startTestServer(TEST_ROOT);
    closeTestServer = close;
    try {
      const res = await fetch(`${baseUrl}${FAST_PROJECT_CREATE_API_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Connection: 'close' },
        body: JSON.stringify({ projectName: 'ApiParityApp', forceFreshProject: true }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        projectId?: string;
        activeSessionId?: string;
        projectName?: string;
      };
      assert('30. API HTTP 200', res.status === 200, String(res.status));
      assert('31. API ok', json.ok === true, String(json.ok));
      assert('32. API projectId', Boolean(json.projectId), json.projectId ?? 'missing');
      assert('33. API sessionId', Boolean(json.activeSessionId), json.activeSessionId ?? 'missing');
      assert(
        '34. registry active project',
        readProjectRegistryState(TEST_ROOT).activeProjectId === json.projectId,
        json.projectId ?? 'missing',
      );

      const clientRes = await fetch(`${baseUrl}${COMMAND_CENTER_FAST_CREATE_CLIENT_PATH}`, {
        headers: { Connection: 'close' },
      });
      assert('35. client script served', clientRes.status === 200, String(clientRes.status));
      const clientBody = await clientRes.text();
      assert('36. served client endpoint', clientBody.includes(FAST_PROJECT_CREATE_API_PATH), 'served api');
    } finally {
      await close();
      closeTestServer = null;
    }

    rmSync(TEST_ROOT, { recursive: true, force: true });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;

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
      console.log(COMMAND_CENTER_FAST_CREATE_PARITY_V1_PASS_TOKEN);
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
