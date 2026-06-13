/**
 * Phase 26.64 — Result fetch failure diagnostic surface validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RESULT_FETCH_FAILURE_DIAGNOSTIC_SURFACE_V1_PASS,
  FOUNDER_TEST_RESULT_DEBUG_CONTENT_TYPE_EXPECTED,
  previewNonJsonResponseBody,
  buildFounderTestResultDebugUrl,
  buildResultFetchFailureDiagnosticLines,
  buildResultDebugResponseDiagnosticLines,
} from '../src/founder-test-runtime-monitor/index.js';
import { buildFounderTestResultDebugResponse } from '../src/founder-test-runtime-monitor/complete-report-preparing-stall.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-result-fetch-failure-diagnostic-surface';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'server/founder-testing-handler.ts',
  'server/founder-reality-server.ts',
  'src/founder-test-runtime-monitor/result-fetch-failure-diagnostic-surface.ts',
  'public/founder-reality/app.js',
  'scripts/validate-result-fetch-failure-diagnostic-surface.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const serverSource = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('result-debug handler', handlerSource.includes('handleFounderTestResultDebugRequest'), 'handler');
assert('result-debug route', serverSource.includes('/api/founder-test/result-debug'), 'route');
assert('routeReached in debug builder', handlerSource.includes('buildFounderTestResultDebugResponse'), 'builder');
assert('client records requested URL', appJs.includes('requestedUrl'), 'url');
assert('client records requested runId', appJs.includes('requestedRunId'), 'runId');
assert('client records HTTP status', appJs.includes('httpStatus'), 'status');
assert('client records content-type', appJs.includes('responseContentType'), 'content-type');
assert('JSON parse failure preview', appJs.includes('nonJsonResponsePreview'), 'preview');
assert('parse helper', appJs.includes('parseFounderTestHttpJsonResponse'), 'parse helper');
assert('debug after fetch failure', appJs.includes('attachResultFetchFailureDebug'), 'debug attach');
assert('fetch retry calls debug attach', /fetchFounderTestResultWithRetry[\s\S]*?attachResultFetchFailureDebug/.test(appJs), 'retry debug');
assert('handoff diagnostic includes fetch section', appJs.includes('## Result Fetch'), 'fetch section');
assert('handoff diagnostic includes debug section', appJs.includes('## Result Debug Endpoint'), 'debug section');
assert('diagnostic storedRunIds', appJs.includes('storedRunIds'), 'storedRunIds');
assert('diagnostic reportMarkdownLength', appJs.includes('reportMarkdownLength'), 'length');
assert('result-debug URL builder', appJs.includes('buildFounderTestResultDebugUrl'), 'debug url');
assert('no scoring edits', !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !appJs.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:result-fetch-failure-diagnostic-surface": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

const debug = buildFounderTestResultDebugResponse({
  requestedRunId: 'fetch-run',
  stored: null,
  storedRunIds: ['other-run'],
  runtime: { runId: 'fetch-run', state: 'COMPLETE' } as never,
  resultEndpointStatus: 404,
});

assert('debug routeReached true', debug.routeReached === true, 'routeReached');
assert('debug contentTypeExpected', debug.contentTypeExpected === FOUNDER_TEST_RESULT_DEBUG_CONTENT_TYPE_EXPECTED, 'content type');
assert('debug generatedAt present', typeof debug.generatedAt === 'string' && debug.generatedAt.length > 0, 'generatedAt');
assert('debug storedRunIds array', Array.isArray(debug.storedRunIds), 'storedRunIds');
assert('debug reportMarkdownLength number', typeof debug.reportMarkdownLength === 'number', 'length');

assert(
  'non-json preview capped',
  previewNonJsonResponseBody('<html>' + 'x'.repeat(200)).length <= 121,
  'preview cap',
);

assert(
  'debug url includes runId',
  buildFounderTestResultDebugUrl('founder-test-runtime-123').includes('runId=founder-test-runtime-123'),
  'debug url runId',
);

const fetchLines = buildResultFetchFailureDiagnosticLines({
  requestedUrl: '/api/founder-test/result?runId=abc',
  requestedRunId: 'abc',
  fetchErrorMessage: 'Failed to fetch',
  httpStatus: 500,
  responseContentType: 'text/html',
  jsonParseFailed: true,
  nonJsonResponsePreview: '<html>…',
});
assert('fetch lines include url', fetchLines.some((line) => line.includes('Requested URL')), 'url line');
assert('fetch lines include status', fetchLines.some((line) => line.includes('HTTP status')), 'status line');

const debugLines = buildResultDebugResponseDiagnosticLines(debug as Record<string, unknown>);
assert('debug lines include routeReached', debugLines.some((line) => line.includes('routeReached')), 'route line');
assert('debug lines include reportMarkdownLength', debugLines.some((line) => line.includes('reportMarkdownLength')), 'length line');

const report = [
  '# Result Fetch Failure Diagnostic Surface Report',
  '',
  '## Root Cause',
  '',
  '- Copy/Open handoff diagnostics only showed generic "Failed to fetch" with no proof of URL, HTTP status, content-type, or store state.',
  '',
  '## Repair',
  '',
  '- `/api/founder-test/result-debug` returns routeReached, store fields, runtimeState, generatedAt, contentTypeExpected.',
  '- Client records requested URL/runId, HTTP status, content-type, JSON parse preview, and result-debug response.',
  '- On fetch failure, client immediately calls result-debug with the same runId and embeds output in Copy Handoff Diagnostic.',
  '',
  '## Files Changed',
  '',
  '- `src/founder-test-runtime-monitor/result-fetch-failure-diagnostic-surface.ts`',
  '- `src/founder-test-runtime-monitor/complete-report-preparing-stall.ts`',
  '- `public/founder-reality/app.js`',
  '',
  '## Validation',
  '',
  ...results.map((r) => `- [${r.passed ? 'x' : ' '}] ${r.name}: ${r.detail}`),
  '',
  results.every((r) => r.passed)
    ? `\nSUCCESS: ${RESULT_FETCH_FAILURE_DIAGNOSTIC_SURFACE_V1_PASS}\n`
    : '\nFAILED: result fetch failure diagnostic surface checks did not pass.\n',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'RESULT_FETCH_FAILURE_DIAGNOSTIC_SURFACE_REPORT.md'), report, 'utf8');

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.error('Result fetch failure diagnostic surface validation FAILED:');
  for (const f of failed) {
    console.error(`  ✗ ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log(`Result fetch failure diagnostic surface validation passed (${results.length} checks).`);
console.log(RESULT_FETCH_FAILURE_DIAGNOSTIC_SURFACE_V1_PASS);
