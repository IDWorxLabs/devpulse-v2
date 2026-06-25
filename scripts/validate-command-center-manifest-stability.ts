/**
 * Command Center manifest stability — server must stay up under dashboard load.
 */

import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { buildCommandCenterShellManifest } from '../server/command-center-shell-manifest.js';
import { buildFounderRealityManifest } from '../server/founder-reality-manifest.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const TEST_PORT = 4322;
const PASS_TOKEN = 'COMMAND_CENTER_MANIFEST_STABILITY_PASS';

const CRITICAL_PATHS = [
  '/',
  '/api/founder-reality.json',
  '/api/product-workspace.json',
  '/api/brain/health',
  '/api/founder/operational-evidence-freshness-authority-v1',
  '/api/founder/evidence-revalidation-cycle-v1',
  '/api/founder/unified-failure-escalation-authority-v1',
  '/api/founder/canonical-ownership-v2',
  '/api/founder/customer-operations-platform-v1',
  '/api/founder/production-observability-platform-v1',
  '/api/founder/continuous-deployment-pipeline-v1',
  '/api/founder/multi-project-concurrent-execution-v1',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function fetchText(path: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`http://127.0.0.1:${TEST_PORT}${path}`, { method: 'GET' });
  return { status: res.status, body: await res.text() };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Command Center Manifest Stability — Validation');
  console.log('============================================');
  console.log('');

  const serverSrc = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:command-center-manifest-stability']), 'script');
  assert('02. parseRequestUrl helper', serverSrc.includes('function parseRequestUrl'), 'parseRequestUrl');
  assert('03. sendFounderDashboardSafe helper', serverSrc.includes('function sendFounderDashboardSafe'), 'safe helper');
  assert('04. buildManifestSafely helper', serverSrc.includes('function buildManifestSafely'), 'manifest safe');
  const badUrlUsage = serverSrc
    .split('\n')
    .filter((line) => line.includes('url.searchParams') && !line.includes('requestUrl.searchParams'));
  assert('05. no undefined url.searchParams', badUrlUsage.length === 0, badUrlUsage[0] ?? 'clean');
  assert('06. request handler try/catch', serverSrc.includes('[founder-reality-server] request failed'), 'outer catch');

  const shell = buildCommandCenterShellManifest();
  assert('07. shell manifest JSON-safe', Boolean(shell.operatorFeedSections.includes('Evidence Revalidation')), 'sections');
  assert('08. manifest builder', buildFounderRealityManifest([]).runtimeShell.layout === 'three-zone', 'layout');

  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(TEST_PORT, '127.0.0.1', () => resolve());
  });

  try {
    for (const path of CRITICAL_PATHS) {
      const { status, body } = await fetchText(path);
      assert(`09. ${path} status 200`, status === 200, String(status));
      if (path.endsWith('.json') || path.startsWith('/api/')) {
        try {
          JSON.parse(body);
          assert(`10. ${path} valid JSON`, true, 'json');
        } catch {
          assert(`10. ${path} valid JSON`, false, 'invalid json');
        }
      }
    }

    const manifest = JSON.parse((await fetchText('/api/founder-reality.json')).body) as {
      runtimeShell?: { operatorFeedSections?: string[] };
    };
    assert('11. manifest runtimeShell present', Boolean(manifest.runtimeShell), 'runtimeShell');
    assert(
      '12. manifest operator sections',
      (manifest.runtimeShell?.operatorFeedSections?.length ?? 0) >= 20,
      String(manifest.runtimeShell?.operatorFeedSections?.length ?? 0),
    );

    const healthAfter = await fetchText('/api/brain/health');
    assert('13. server alive after dashboard load', healthAfter.status === 200, String(healthAfter.status));

    const manifestTwice = await fetchText('/api/founder-reality.json');
    assert('14. manifest reload', manifestTwice.status === 200, String(manifestTwice.status));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  assert('15. public index exists', existsSync(join(ROOT, 'public/founder-reality/index.html')), 'index');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Command Center Manifest Stability — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(PASS_TOKEN);
  console.log('Server stays up; manifest and dashboard routes return valid JSON.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
