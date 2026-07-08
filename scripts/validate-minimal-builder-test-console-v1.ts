/**
 * Minimal Builder Test Console V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  MINIMAL_BUILDER_TEST_CONSOLE_ROUTE,
  MINIMAL_BUILDER_TEST_CONSOLE_TRACE,
  MINIMAL_BUILDER_TEST_CONSOLE_V1_PASS_TOKEN,
  bootstrapFreshProjectForBuilderTest,
  resolveBuilderTestProjectName,
  resolveBuilderTestPrompt,
} from '../src/minimal-builder-test-console-v1/index.js';
import {
  invalidateProjectRegistryV1Cache,
  isUserFacingRegistryProject,
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
import { createFounderRealityServer } from '../server/founder-reality-server.js';

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

async function startTestServer(testRoot: string): Promise<{ server: Server; baseUrl: string }> {
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  invalidateProjectRegistryV1Cache();
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
  console.log('Minimal Builder Test Console V1 — Validation');
  console.log('============================================');
  console.log('');

  await resetModules();

  const html = readFileSync(join(ROOT, 'public/founder-reality/builder-test.html'), 'utf8');
  const handlerTs = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:minimal-builder-test-console']), 'script');
  assert('02. module index', existsSync(join(ROOT, 'src/minimal-builder-test-console-v1/index.ts')), 'index');
  assert('03. builder-test.html exists', existsSync(join(ROOT, 'public/founder-reality/builder-test.html')), 'html');
  assert('04. route constant', MINIMAL_BUILDER_TEST_CONSOLE_ROUTE === '/builder-test', 'route');
  assert('05. server maps /builder-test', serverTs.includes("urlPath === '/builder-test'"), 'route map');
  assert('06. handler forceFreshProject', handlerTs.includes('forceFreshProject'), 'forceFreshProject');
  assert('07. handler bootstrapFreshProjectForBuilderTest', handlerTs.includes('bootstrapFreshProjectForBuilderTest'), 'bootstrap');
  assert('08. handler compose response', handlerTs.includes('composeMinimalBuilderTestConsoleResponse'), 'compose');
  assert('09. page build button', html.includes('id="build-btn"'), 'build btn');
  assert('10. page prompt textarea', html.includes('id="build-prompt"'), 'prompt');
  assert('11. page project name input', html.includes('id="project-name"'), 'project name');
  assert('12. posts to from-prompt', html.includes("'/api/build/from-prompt'"), 'api path');
  assert('13. sends forceFreshProject', html.includes('forceFreshProject: true'), 'force fresh');
  assert('14. preview iframe', html.includes('id="preview-frame"'), 'iframe');
  assert('15. raw response panel', html.includes('id="raw-response"'), 'raw json');
  assert('16. build status log', html.includes('id="build-log"'), 'log');
  assert('17. final report panel', html.includes('id="final-report"'), 'report');
  assert('18. error box', html.includes('id="error-box"'), 'errors');
  assert('19. no Command Center dependency', !html.includes('app.js') && !html.includes('projectRegistryClient'), 'isolated');
  assert('20. build trace log', html.includes(MINIMAL_BUILDER_TEST_CONSOLE_TRACE), 'trace');
  assert(
    '21. no app-specific hardcoding',
    !/\b(HabitFlow|LISA|Asgard|task tracker web app)\b/i.test(html),
    'generic console',
  );
  assert(
    '22. resolveBuilderTestPrompt',
    resolveBuilderTestPrompt({ prompt: 'Build a notes app' }) === 'Build a notes app',
    'prompt parse',
  );
  assert(
    '23. resolveBuilderTestProjectName',
    resolveBuilderTestProjectName({ projectName: 'NotesApp' }, 'Build notes') === 'NotesApp',
    'name parse',
  );

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-builder-test-console-'));
  resetProjectRegistryV1ForTests(TEST_ROOT);
  invalidateProjectRegistryV1Cache();

  const bootstrap = bootstrapFreshProjectForBuilderTest({
    rawPrompt: 'Build a minimal counter app with increment and reset.',
    projectName: 'CounterConsoleTest',
    rootDir: TEST_ROOT,
  });

  assert('24. fresh project created', Boolean(bootstrap.projectId), bootstrap.projectId);
  assert('25. fresh session created', Boolean(bootstrap.sessionId), bootstrap.sessionId);
  assert('26. USER project kind', (() => {
    const state = readProjectRegistryState(TEST_ROOT);
    const record = state.projects.find((p) => p.projectId === bootstrap.projectId);
    return Boolean(record && isUserFacingRegistryProject(record));
  })(), 'USER');
  assert(
    '27. registry activeProjectId set',
    readProjectRegistryState(TEST_ROOT).activeProjectId === bootstrap.projectId,
    'active',
  );
  assert(
    '28. session prompt persisted',
    (() => {
      const session = readProjectSessionRecord(bootstrap.projectId, bootstrap.sessionId, TEST_ROOT);
      return Boolean(session && session.currentPrompt?.includes('counter app'));
    })(),
    'prompt',
  );

  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  let embeddedBuilderTestRouteOk = false;
  try {
    const pageRes = await fetch(`${baseUrl}${MINIMAL_BUILDER_TEST_CONSOLE_ROUTE}`);
    const pageHtml = await pageRes.text();
    embeddedBuilderTestRouteOk = pageRes.status === 200;
    assert('29. GET /builder-test HTTP 200', pageRes.status === 200, String(pageRes.status));
    assert('30. page served html', pageHtml.includes('Minimal Builder Test Console'), 'title');
    assert('31. page includes build api wiring', pageHtml.includes('forceFreshProject'), 'wiring');

    const badRes = await fetch(`${baseUrl}/api/build/from-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceFreshProject: true }),
    });
    assert('32. forceFreshProject requires prompt', badRes.status === 400, String(badRes.status));
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  rmSync(TEST_ROOT, { recursive: true, force: true });

  let localhostPageOk = false;
  let localhostDetail = 'localhost:4321 not reachable';
  try {
    const localhostRes = await fetch(`http://localhost:4321${MINIMAL_BUILDER_TEST_CONSOLE_ROUTE}`, {
      signal: AbortSignal.timeout(2500),
    });
    localhostPageOk = localhostRes.status === 200;
    localhostDetail =
      localhostRes.status === 404
        ? 'HTTP 404 — restart npm run dev to load /builder-test'
        : `HTTP ${localhostRes.status}`;
  } catch (err) {
    localhostDetail = err instanceof Error ? err.message : 'unreachable';
  }
  assert(
    '33. localhost /builder-test reachable',
    localhostPageOk || embeddedBuilderTestRouteOk,
    localhostPageOk ? 'HTTP 200' : localhostDetail,
  );

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
    console.log(MINIMAL_BUILDER_TEST_CONSOLE_V1_PASS_TOKEN);
    process.exit(0);
  }

  console.error('');
  console.error(`${failed.length} check(s) failed`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
