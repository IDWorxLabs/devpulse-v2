/**
 * Phase 26.68 — Founder Test API base URL routing validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_API_BASE_URL_ROUTING_REPAIR_V1_PASS,
  FOUNDER_TEST_DEFAULT_API_ORIGIN,
  buildFounderTestApiRoutingDiagnosticLines,
  buildFounderTestApiUrl,
  buildFounderTestResultDebugUrl,
  buildFounderTestResultFetchUrl,
  buildFounderTestRuntimeStatusUrl,
  founderTestResultAndRuntimeStatusShareBase,
  resolveFounderTestApiBaseUrl,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-test-api-base-url-routing';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'public/founder-reality/app.js',
  'server/founder-reality-manifest.ts',
  'src/founder-test-runtime-monitor/founder-test-api-base-url-routing.ts',
  'scripts/validate-founder-test-api-base-url-routing.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const manifestSource = readFileSync(join(ROOT, 'server/founder-reality-manifest.ts'), 'utf8');
const routingSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-api-base-url-routing.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('shared API URL builder', appJs.includes('function buildFounderTestApiUrl'), 'builder');
assert('API base resolver', appJs.includes('function resolveFounderTestApiBaseUrl'), 'resolver');
assert('result fetch uses builder', appJs.includes('function buildFounderTestResultFetchUrl'), 'result url');
assert('result-debug uses builder', appJs.includes('function buildFounderTestResultDebugUrl'), 'debug url');
assert('runtime-status uses builder', appJs.includes('function buildFounderTestRuntimeStatusUrl'), 'status url');
assert(
  'poll uses runtime-status builder',
  /pollFounderTestRuntimeStatusOnce[\s\S]*?buildFounderTestRuntimeStatusUrl/.test(appJs),
  'poll status',
);
assert(
  'result retry uses builder',
  /fetchFounderTestResultWithRetry[\s\S]*?buildFounderTestResultFetchUrl/.test(appJs),
  'retry result',
);
assert(
  'debug fetch uses builder',
  /fetchFounderTestResultDebug[\s\S]*?buildFounderTestResultDebugUrl/.test(appJs),
  'debug fetch',
);
assert(
  'run endpoint uses builder',
  /runFounderTest[\s\S]*?buildFounderTestRunUrl/.test(appJs),
  'run url',
);
assert(
  'no hardcoded result path in fetch calls',
  !appJs.includes("fetch('/api/founder-test/result"),
  'no hardcoded result fetch',
);
assert(
  'no hardcoded debug path in fetch calls',
  !appJs.includes("fetch('/api/founder-test/result-debug"),
  'no hardcoded debug fetch',
);
assert('routing diagnostic lines', appJs.includes('function buildFounderTestApiRoutingDiagnosticLines'), 'routing lines');
assert('handoff includes API Routing section', appJs.includes('## API Routing'), 'api routing section');
assert('handoff includes frontend origin', appJs.includes('- Frontend origin:'), 'frontend origin');
assert('handoff includes resolved API base', appJs.includes('- Resolved API base:'), 'resolved base');
assert('handoff includes runtime-status URL', appJs.includes('- Runtime-status URL:'), 'status url line');
assert('handoff includes result URL line', appJs.includes('- Result URL:'), 'result url line');
assert('handoff includes result-debug URL line', appJs.includes('- Result-debug URL:'), 'debug url line');
assert('manifest exposes apiBaseUrl', manifestSource.includes('apiBaseUrl: FOUNDER_REALITY_URL'), 'manifest base');
assert('applyManifest reads apiBaseUrl', appJs.includes('data.apiBaseUrl'), 'manifest apply');
assert('vite port fallback', appJs.includes("'5173'"), 'vite fallback');
assert('routing module token', routingSource.includes(FOUNDER_TEST_API_BASE_URL_ROUTING_REPAIR_V1_PASS), 'token');
assert('no scoring edits', !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !appJs.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:founder-test-api-base-url-routing": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

const viteBase = resolveFounderTestApiBaseUrl({
  frontendPort: '5173',
  frontendOrigin: 'http://localhost:5173',
});
assert('vite port resolves API base', viteBase === FOUNDER_TEST_DEFAULT_API_ORIGIN, viteBase);

const resultUrl = buildFounderTestResultFetchUrl('run-123', FOUNDER_TEST_DEFAULT_API_ORIGIN);
const statusUrl = buildFounderTestRuntimeStatusUrl(FOUNDER_TEST_DEFAULT_API_ORIGIN, 'run-123');
assert(
  'result and runtime-status share base',
  founderTestResultAndRuntimeStatusShareBase({ resultUrl, runtimeStatusUrl: statusUrl }),
  'shared base',
);
assert('result url absolute', resultUrl.startsWith('http://localhost:4321/api/founder-test/result'), resultUrl);
assert(
  'debug url uses builder',
  buildFounderTestResultDebugUrl('run-123', FOUNDER_TEST_DEFAULT_API_ORIGIN).includes('result-debug?runId=run-123'),
  'debug url',
);

const routingLines = buildFounderTestApiRoutingDiagnosticLines({
  frontendOrigin: 'http://localhost:5173',
  apiBaseUrl: FOUNDER_TEST_DEFAULT_API_ORIGIN,
  runId: 'run-123',
});
assert('routing lines include frontend origin', routingLines.some((line) => line.includes('Frontend origin')), 'origin line');
assert('routing lines include result URL', routingLines.some((line) => line.includes('Result URL:')), 'result line');

assert(
  'same-origin relative when base empty',
  buildFounderTestApiUrl('', '/api/founder-test/result', { runId: 'abc' }) ===
    '/api/founder-test/result?runId=abc',
  'relative',
);

const report = [
  '# Founder Test API Base URL Routing Report',
  '',
  '## Root Cause',
  '',
  '- Result/result-debug fetches used relative `/api/...` paths while the UI could be served from a Vite dev port.',
  '- Browser requests never reached the Founder Reality API server on port 4321 (`Failed to fetch`, HTTP n/a, routeReached false).',
  '',
  '## Repair',
  '',
  '- `buildFounderTestApiUrl` resolves the same API base as runtime-status/run polling.',
  '- Manifest publishes `apiBaseUrl`; Vite ports fall back to `http://localhost:4321`.',
  '- Result, result-debug, runtime-status, and run endpoints all use the shared builder.',
  '- Handoff diagnostics include frontend origin and resolved API URLs.',
  '',
  '## Validation',
  '',
  ...results.map((r) => `- [${r.passed ? 'x' : ' '}] ${r.name}: ${r.detail}`),
  '',
  results.every((r) => r.passed)
    ? `\nSUCCESS: ${FOUNDER_TEST_API_BASE_URL_ROUTING_REPAIR_V1_PASS}\n`
    : '\nFAILED: founder test API base URL routing checks did not pass.\n',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'FOUNDER_TEST_API_BASE_URL_ROUTING_REPORT.md'), report, 'utf8');

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.error('Founder Test API base URL routing validation FAILED:');
  for (const f of failed) {
    console.error(`  ✗ ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log(`Founder Test API base URL routing validation passed (${results.length} checks).`);
console.log(FOUNDER_TEST_API_BASE_URL_ROUTING_REPAIR_V1_PASS);
