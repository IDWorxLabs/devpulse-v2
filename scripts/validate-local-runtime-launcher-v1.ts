/**
 * Local Runtime Launcher V1 — validation.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  LOCAL_RUNTIME_LAUNCHER_PASS_TOKEN,
  isLocalRuntimeHealthStale,
} from '../src/local-runtime-launcher/index.js';
import { resetProjectRegistryV1ForTests } from '../src/project-registry-v1/index.js';

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
  console.log('Local Runtime Launcher V1 — Validation');
  console.log('=======================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    version?: string;
    scripts?: Record<string, string>;
  };
  const launcherPs1 = readFileSync(join(ROOT, 'scripts/start-aidevengine-local.ps1'), 'utf8');
  const launcherBat = readFileSync(join(ROOT, 'Start-AiDevEngine.bat'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
  const serverSrc = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const docPath = join(ROOT, 'architecture/LOCAL_RUNTIME_LAUNCHER_V1.md');

  assert('01. package script', Boolean(pkg.scripts?.['validate:local-runtime-launcher']), 'script');
  assert('02. launcher ps1 exists', existsSync(join(ROOT, 'scripts/start-aidevengine-local.ps1')), 'ps1');
  assert('03. launcher bat exists', existsSync(join(ROOT, 'Start-AiDevEngine.bat')), 'bat');
  assert('04. launcher checks port 4321', launcherPs1.includes('$Port = 4321'), 'port');
  assert('05. launcher probes health', launcherPs1.includes('/api/brain/health'), 'health');
  assert('06. launcher probes registry', launcherPs1.includes('/api/projects/registry.json'), 'registry');
  assert('07. launcher waits before browser', /Wait-AiDevEngineReady[\s\S]*Start-Process \$BaseUrl/.test(launcherPs1), 'wait');
  assert('08. launcher stale process handling', launcherPs1.includes('Stop-StaleAiDevEngineListeners'), 'stale');
  assert('09. launcher avoids unrelated node kill', launcherPs1.includes('non-AiDevEngine'), 'safe kill');
  assert('10. bat wraps ps1', launcherBat.includes('scripts\\start-aidevengine-local.ps1'), 'bat');
  assert('11. architecture doc', existsSync(docPath), docPath);
  assert('12. bootstrap safety', serverSrc.includes('REGISTRY_BOOTSTRAP_FAILED'), 'bootstrap');
  assert('13. startup registry bootstrap', serverSrc.includes('bootstrapLocalRuntimeRegistry'), 'bootstrap');
  assert('14. health uses local runtime payload', brainHandler.includes('buildLocalRuntimeHealthPayload'), 'health');
  assert('15. health runtime ready gate', brainHandler.includes('isLocalRuntimeReady'), 'ready gate');
  assert('16. UI banner element', indexHtml.includes('local-runtime-banner'), 'banner html');
  assert(
    '17. UI health gate blocks create',
    appJs.includes('localRuntimeHealthy') && appJs.includes('createProjectViaRegistry'),
    'create gate',
  );
  assert(
    '18. UI health gate blocks brain',
    appJs.includes('askBrain') && appJs.includes('LOCAL_RUNTIME_BANNER_TEXT'),
    'brain gate',
  );
  assert(
    '19. stale marker helper',
    launcherPs1.includes('buildIntentRouting') && typeof isLocalRuntimeHealthStale === 'function',
    'stale',
  );

  const stalePayload = {
    postAllowed: true,
    buildIntentRouting: false,
    registryLoaded: false,
    runtimeReady: false,
  };
  assert('20. stale marker detects missing routing', isLocalRuntimeHealthStale(stalePayload), 'stale detect');

  let healthCheckOnlyExit = 1;
  let healthCheckOnlyOutput = '';
  try {
    healthCheckOnlyOutput = execSync(
      'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-aidevengine-local.ps1 -HealthCheckOnly',
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
    healthCheckOnlyExit = 0;
  } catch (err) {
    const failed = err as { status?: number; stdout?: string; stderr?: string };
    healthCheckOnlyExit = failed.status ?? 1;
    healthCheckOnlyOutput = [failed.stdout, failed.stderr].filter(Boolean).join('\n').trim();
  }
  assert(
    '20b. launcher HealthCheckOnly runs',
    healthCheckOnlyExit === 0 && healthCheckOnlyOutput.includes('Launcher script parse and function check passed'),
    healthCheckOnlyOutput.slice(0, 160) || String(healthCheckOnlyExit),
  );
  assert(
    '20c. launcher ASCII only status lines',
    !/[\u2013\u2014\u2018\u2019\u201C\u201D]/.test(launcherPs1),
    'unicode punctuation',
  );

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-local-runtime-test-'));
  resetProjectRegistryV1ForTests(TEST_ROOT);
  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  try {
    const healthRes = await fetch(`${baseUrl}/api/brain/health`);
    const healthJson = (await healthRes.json()) as Record<string, unknown>;
    assert('21. health HTTP 200 when ready', healthRes.status === 200, String(healthRes.status));
    assert('22. health serverStartedAt', typeof healthJson.serverStartedAt === 'string', 'startedAt');
    assert('23. health buildIntentRouting', healthJson.buildIntentRouting === true, String(healthJson.buildIntentRouting));
    assert('24. health registryLoaded', healthJson.registryLoaded === true, String(healthJson.registryLoaded));
    assert('25. health registryPath', typeof healthJson.registryPath === 'string', String(healthJson.registryPath));
    assert('26. health projectCount number', typeof healthJson.projectCount === 'number', String(healthJson.projectCount));
    assert(
      '27. health activeProjectCount number',
      typeof healthJson.activeProjectCount === 'number',
      String(healthJson.activeProjectCount),
    );
    assert('28. health serverPid', typeof healthJson.serverPid === 'number', String(healthJson.serverPid));
    assert('29. health port', typeof healthJson.port === 'number', String(healthJson.port));
    assert('30. health runtimeReady', healthJson.runtimeReady === true, String(healthJson.runtimeReady));
    assert('31. health version', typeof healthJson.version === 'string', String(healthJson.version));

    const registryRes = await fetch(`${baseUrl}/api/projects/registry.json`);
    assert('32. registry HTTP 200', registryRes.status === 200, String(registryRes.status));
    const registryJson = (await registryRes.json()) as { registry?: unknown };
    assert('33. registry payload present', Boolean(registryJson.registry), 'registry');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    rmSync(TEST_ROOT, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Local Runtime Launcher V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(LOCAL_RUNTIME_LAUNCHER_PASS_TOKEN);
  console.log('Local runtime launcher verified.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
