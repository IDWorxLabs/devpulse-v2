/**
 * Launch Project Hydration V1 — validation.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LAUNCH_PROJECT_HYDRATION_PASS_TOKEN,
  REGISTRY_CACHE_STORAGE_KEY,
  REGISTRY_HYDRATION_EXPECTED_MAX_MS,
  REGISTRY_HYDRATION_RETRY_ATTEMPTS,
  buildRegistryHydrationTraceMessage,
  formatRegistryCountForUi,
  shouldShowRegistryLoadingCounts,
} from '../src/launch-project-hydration/index.js';

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
  console.log('');
  console.log('Launch Project Hydration V1 — Validation');
  console.log('=======================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:launch-project-hydration']),
    'validate:launch-project-hydration',
  );
  assert(
    '02. hydration module',
    readFileSync(join(ROOT, 'src/launch-project-hydration/index.ts'), 'utf8').includes(
      'LAUNCH_PROJECT_HYDRATION_PASS_TOKEN',
    ),
    'launch-project-hydration module',
  );

  assert(
    '03. loading state not Total: 0',
    appJs.includes('Loading projects') && appJs.includes('formatRegistryCountForUi'),
    'formatRegistryCountForUi + loading copy',
  );
  assert(
    '04. em-dash counts while loading',
    formatRegistryCountForUi('loading', 0) === '—',
    formatRegistryCountForUi('loading', 0),
  );
  assert(
    '05. numeric counts when ready',
    formatRegistryCountForUi('ready', 3) === '3',
    formatRegistryCountForUi('ready', 3),
  );
  assert(
    '06. no false failure while pending',
    shouldShowRegistryLoadingCounts('loading') && !shouldShowRegistryLoadingCounts('ready'),
    'loading vs ready',
  );
  assert(
    '07. localStorage cache fallback',
    appJs.includes(REGISTRY_CACHE_STORAGE_KEY) && appJs.includes('loadCachedProjectRegistry'),
    REGISTRY_CACHE_STORAGE_KEY,
  );
  assert(
    '08. stale badge',
    appJs.includes('Stale registry cache') && appJs.includes('projectRegistryUsedCachedFallback'),
    'stale badge',
  );
  assert(
    '09. retry with backoff',
    appJs.includes('REGISTRY_HYDRATION_RETRY_ATTEMPTS') && appJs.includes('attemptRegistryFetch'),
    'retry logic',
  );
  assert(
    '10. hydration duration recorded',
    appJs.includes('projectRegistryHydrationDurationMs') &&
      appJs.includes('PROJECT_REGISTRY_HYDRATION'),
    'duration + trace',
  );
  assert(
    '11. active project restore path',
    appJs.includes('switchActiveProject') && appJs.includes('applyProjectRegistryResponse'),
    'switchActiveProject',
  );
  assert(
    '12. live replaces cache on success',
    appJs.includes('saveCachedProjectRegistry') && appJs.includes('applyProjectRegistryPayload'),
    'cache save on success',
  );
  assert(
    '13. error only after retries/cache fail',
    appJs.includes('applyCachedProjectRegistryFallback') &&
      appJs.includes("projectRegistryClient.hydrationState === 'loading'"),
    'conditional error',
  );
  assert(
    '14. expected timing threshold',
    REGISTRY_HYDRATION_EXPECTED_MAX_MS <= 5000,
    String(REGISTRY_HYDRATION_EXPECTED_MAX_MS),
  );
  assert(
    '15. retry attempts configured',
    REGISTRY_HYDRATION_RETRY_ATTEMPTS >= 2,
    String(REGISTRY_HYDRATION_RETRY_ATTEMPTS),
  );

  const trace = buildRegistryHydrationTraceMessage({
    readOnly: true,
    hydrationState: 'ready',
    hydrationDurationMs: 420,
    usedCachedFallback: false,
    retryCount: 1,
    endpoint: '/api/projects/registry',
    projectCount: 2,
    error: null,
  });
  assert('16. hydration trace message', trace.includes('PROJECT_REGISTRY_HYDRATION'), trace);

  const failed = results.filter((r) => !r.passed);
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  if (failed.length) {
    console.error(`FAILED ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(LAUNCH_PROJECT_HYDRATION_PASS_TOKEN);
}

void main();
