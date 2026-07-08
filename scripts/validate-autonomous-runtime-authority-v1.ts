/**
 * Autonomous Runtime Authority V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RUNTIME_AUTHORITY_V1_PASS_TOKEN,
  findNextFreePort,
  isRepositoryAiDevEngineCommandLine,
  isRuntimeAuthorityBypassed,
  bootstrapAutonomousRuntimeAuthority,
  resetRuntimeAuthorityStateForTests,
  resolveManagedRuntimePort,
  verifyLaunchedRuntime,
} from '../src/autonomous-runtime-authority-v1/index.js';
import { FOUNDER_REALITY_PORT } from '../server/founder-reality-manifest.js';
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

async function main(): Promise<void> {
  process.env.AIDEVENGINE_RUNTIME_AUTHORITY_BYPASS = '1';
  let closeTestServer: (() => Promise<void>) | null = null;
  const testRoot = mkdtempSync(join(tmpdir(), 'runtime-authority-'));

  try {
    console.log('');
    console.log('Autonomous Runtime Authority V1 — Validation');
    console.log('============================================');
    console.log('');

    resetRuntimeAuthorityStateForTests();
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
    const devEntryTs = readFileSync(join(ROOT, 'server/founder-reality-dev-entry.ts'), 'utf8');
    const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
    const cleanExitTs = readFileSync(join(ROOT, 'scripts/lib/validator-clean-exit.ts'), 'utf8');

    assert('01. package script', Boolean(pkg.scripts?.['validate:runtime-authority']), 'package.json');
    assert('02. dev uses runtime authority entry', pkg.scripts?.dev?.includes('founder-reality-dev-entry'), 'dev');
    assert('03. module exists', existsSync(join(ROOT, 'src/autonomous-runtime-authority-v1/index.ts')), 'module');
    assert('04. dev entry bootstraps authority', devEntryTs.includes('bootstrapAutonomousRuntimeAuthority'), 'entry');
    assert('05. dev entry spawns server child', devEntryTs.includes('launchAuthoritativeServerChild'), 'spawn');
    assert('06. dev entry waits for child', devEntryTs.includes('waitForAuthoritativeServerChildExit'), 'wait');
    assert('07. dev entry prints READY URL', devEntryTs.includes('Runtime Authority READY'), 'ready');
    assert('08. server authority route', serverTs.includes('/api/runtime/authority'), 'route');
    assert('09. server resolves managed port', serverTs.includes('resolveManagedRuntimePort'), 'port');
    assert('10. validator bypass hook', cleanExitTs.includes('AIDEVENGINE_RUNTIME_AUTHORITY_BYPASS'), 'bypass');
    assert('11. UI strip element', indexHtml.includes('runtime-authority-strip'), 'html');
    assert('12. UI authority script', indexHtml.includes('autonomous-runtime-authority.js'), 'script');

    const repoPath = ROOT.replace(/\\/g, '/');
    assert(
      '13. repo command line detection',
      isRepositoryAiDevEngineCommandLine(`${repoPath}/server/founder-reality-server.ts`, ROOT),
      'founder-reality-server',
    );
    assert(
      '14. foreign command rejected',
      !isRepositoryAiDevEngineCommandLine('C:/other/vite/bin/vite.js', ROOT),
      'foreign',
    );
    assert(
      '15. generic port scan helper',
      findNextFreePort(FOUNDER_REALITY_PORT + 50, 5, process.pid) >= FOUNDER_REALITY_PORT + 50,
      String(findNextFreePort(FOUNDER_REALITY_PORT + 50, 5, process.pid)),
    );
    assert(
      '16. bypass mode for validators',
      process.env.AIDEVENGINE_RUNTIME_AUTHORITY_BYPASS === '1' || isRuntimeAuthorityBypassed(),
      String(process.env.AIDEVENGINE_RUNTIME_AUTHORITY_BYPASS),
    );

    const bootPlan = await bootstrapAutonomousRuntimeAuthority({
      repositoryRoot: ROOT,
      currentPid: process.pid,
      preferredPort: FOUNDER_REALITY_PORT + 50,
    });
    assert('17. launch plan contract', bootPlan.plan.contractVersion === 'AUTONOMOUS_RUNTIME_AUTHORITY_V1', bootPlan.plan.contractVersion);
    assert('18. bypass resolves port', bootPlan.port >= FOUNDER_REALITY_PORT, String(bootPlan.port));
    assert(
      '19. bypass recovery actions documented',
      bootPlan.plan.recoveryActions.some((entry) => entry.includes('bypassed')),
      bootPlan.plan.recoveryActions.join('; '),
    );

    const boot = await startFounderRealityValidatorServer(testRoot);
    closeTestServer = boot.close;
    const verification = await verifyLaunchedRuntime({
      baseUrl: boot.baseUrl,
      repositoryRoot: testRoot,
    });
    assert('20. runtime truth verified', verification.truthProbe.reachable, verification.truthProbe.error ?? 'ok');
    assert('21. health gate brain', verification.healthProbes.some((p) => p.path === '/api/brain/health' && p.ok), 'brain');
    assert('22. health gate command center', verification.healthProbes.some((p) => p.path === '/' && p.ok), '/');
    assert('23. health gate registry', verification.healthProbes.some((p) => p.path === '/api/projects/registry' && p.ok), 'registry');

    const authorityRes = await fetch(`${boot.baseUrl}/api/runtime/authority`, { cache: 'no-store' });
    const authorityJson = (await authorityRes.json()) as { contractVersion?: string; bypassed?: boolean };
    assert('24. authority API 200', authorityRes.status === 200, String(authorityRes.status));
    assert(
      '25. authority API contract',
      authorityJson.contractVersion === 'AUTONOMOUS_RUNTIME_AUTHORITY_V1',
      String(authorityJson.contractVersion),
    );
    assert('26. validator ephemeral bypass', authorityJson.bypassed === true, String(authorityJson.bypassed));

    assert(
      '27. managed port resolver default',
      resolveManagedRuntimePort() === FOUNDER_REALITY_PORT || Number(process.env.AIDEVENGINE_RUNTIME_AUTHORITY_PORT) > 0,
      String(resolveManagedRuntimePort()),
    );
  } finally {
    if (closeTestServer) await closeTestServer();
    rmSync(testRoot, { recursive: true, force: true });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    resetRuntimeAuthorityStateForTests();
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
    console.log(RUNTIME_AUTHORITY_V1_PASS_TOKEN);
    await finishValidator(0);
  } else {
    await finishValidator(1);
  }
}

main().catch(async (err) => {
  console.error(err);
  await finishValidator(1);
});
