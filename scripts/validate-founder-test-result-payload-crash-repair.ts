/**
 * Phase 26.70B — Founder Test result payload crash repair validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_RESULT_PAYLOAD_CRASH_REPAIR_V1_PASS,
  FOUNDER_TEST_RESULT_INLINE_MARKDOWN_MAX_CHARS,
  FOUNDER_TEST_RESULT_REPORT_ROUTE,
  FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE,
  FOUNDER_TEST_RESULT_SERIALIZATION_FAILED,
  buildFounderTestResultMetadataResponse,
  buildBoundedFounderTestResultDebugResponse,
  buildFounderTestRunHandoffPayload,
  safeStringifyFounderTestJson,
  estimateFounderTestResultPayloadTooLarge,
} from '../src/founder-test-runtime-monitor/index.js';
import {
  resetFounderTestRunResultStoreForTests,
  storeFounderTestRunResult,
} from '../src/founder-test-runtime-monitor/founder-test-run-result-store.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-test-result-payload-crash-repair';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'server/founder-testing-handler.ts',
  'server/founder-reality-server.ts',
  'src/founder-test-runtime-monitor/founder-test-result-payload-crash-repair.ts',
  'public/founder-reality/app.js',
  'scripts/validate-founder-test-result-payload-crash-repair.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8').replace(/\r\n/g, '\n');
const serverSource = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8').replace(/\r\n/g, '\n');
const crashRepairSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-result-payload-crash-repair.ts'),
  'utf8',
);
const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('safe stringify helper', handlerSource.includes('safeStringifyFounderTestJson'), 'safe stringify');
assert('serialization failure response', handlerSource.includes('RESULT_SERIALIZATION_FAILED'), 'fail code');
assert('metadata response builder', handlerSource.includes('buildFounderTestResultMetadataResponse'), 'metadata');
assert('no payload spread in metadata', !/buildFounderTestResultMetadataResponse[\s\S]*?\.\.\.payload/.test(crashRepairSource), 'no spread');
assert('result-report route', serverSource.includes("urlPath === '/api/founder-test/result-report'"), 'report route');
assert('result-download route', serverSource.includes("urlPath === '/api/founder-test/result-download'"), 'download route');
assert('result-report handler', handlerSource.includes('handleFounderTestResultReportRequest'), 'report handler');
assert('result-download handler', handlerSource.includes('handleFounderTestResultDownloadRequest'), 'download handler');
assert('bounded debug builder', handlerSource.includes('buildBoundedFounderTestResultDebugResponse'), 'debug');
assert('text markdown sender', handlerSource.includes('sendFounderTestMarkdown'), 'markdown send');
assert('client metadata first fetch', appJs.includes('fetchFounderTestResultWithRetry'), 'fetch retry');
assert('client markdown endpoint fetch', appJs.includes('fetchFounderTestReportMarkdownFromEndpoint'), 'report fetch');
assert('client shouldFetch markdown endpoint', appJs.includes('shouldFetchFounderTestReportFromMarkdownEndpoint'), 'delivery gate');
assert('client result-report url builder', appJs.includes('buildFounderTestResultReportUrl'), 'report url');
assert('client bounded max attempts 3', appJs.includes('FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS = 3'), 'attempts');
assert('client single handoff status', appJs.includes('founder-test-report-handoff-status'), 'status el');
assert(
  'no duplicate fetching button labels',
  !/copy: 'Fetching Report\.\.\.'[\s\S]*open: 'Fetching Report\.\.\.'/.test(appJs),
  'duplicate',
);
assert(
  'ping store volatile',
  readFileSync(join(ROOT, 'server/founder-test-server-process-metadata.ts'), 'utf8').includes('storeVolatile: true'),
  'volatile',
);
assert('no scoring edits', !handlerSource.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !handlerSource.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(
    `validate:founder-test-result-payload-crash-repair": "tsx scripts/${VALIDATOR_BASENAME}.ts"`,
  ),
  'script',
);

const smallMarkdown = '# Small Report\n\nOK.';
const hugeMarkdown = '# Huge Report\n\n' + 'x'.repeat(FOUNDER_TEST_RESULT_INLINE_MARKDOWN_MAX_CHARS + 5000);

resetFounderTestRunResultStoreForTests();

const smallRunId = 'crash-repair-small';
const hugeRunId = 'crash-repair-huge';
const storedSmall = {
  readOnly: true as const,
  runId: smallRunId,
  ok: true,
  completedAt: '2026-06-12T12:00:00.000Z',
  payload: buildFounderTestRunHandoffPayload({
    runId: smallRunId,
    ok: true,
    runtime: { runId: smallRunId, state: 'COMPLETE' } as never,
    report: { reportMarkdown: smallMarkdown },
    reportMarkdown: smallMarkdown,
    finalReportReady: true,
  }),
  errorMessage: null,
};

const storedHuge = {
  readOnly: true as const,
  runId: hugeRunId,
  ok: true,
  completedAt: '2026-06-12T12:01:00.000Z',
  payload: buildFounderTestRunHandoffPayload({
    runId: hugeRunId,
    ok: true,
    runtime: { runId: hugeRunId, state: 'COMPLETE' } as never,
    report: { reportMarkdown: hugeMarkdown },
    reportMarkdown: hugeMarkdown,
    finalReportReady: true,
  }),
  errorMessage: null,
};

const smallMetadata = buildFounderTestResultMetadataResponse(storedSmall);
const hugeMetadata = buildFounderTestResultMetadataResponse(storedHuge);

assert('small inline delivery', smallMetadata.deliveryMode === 'inline-json', String(smallMetadata.deliveryMode));
assert('small includes inline markdown', smallMetadata.reportMarkdown === smallMarkdown, 'inline md');
assert('huge markdown-endpoint delivery', hugeMetadata.deliveryMode === 'markdown-endpoint', String(hugeMetadata.deliveryMode));
assert('huge payloadTooLarge flag', hugeMetadata.payloadTooLarge === true, String(hugeMetadata.payloadTooLarge));
assert('huge metadata excludes full markdown', hugeMetadata.reportMarkdown == null, 'no full md');
assert('huge preview bounded', typeof hugeMetadata.reportPreview === 'string', 'preview');

const debug = buildBoundedFounderTestResultDebugResponse({
  requestedRunId: hugeRunId,
  stored: storedHuge,
  storedRunIds: [hugeRunId],
  runtime: { runId: hugeRunId, state: 'COMPLETE' } as never,
  resultEndpointStatus: 200,
});
assert('debug excludes full markdown field', !('reportMarkdown' in debug), 'no debug md');
assert('debug payloadTooLarge', debug.payloadTooLarge === true, String(debug.payloadTooLarge));
assert('debug storeVolatile', debug.storeVolatile === true, 'volatile');

const circular: Record<string, unknown> = { ok: true };
circular.self = circular;
const circularResult = safeStringifyFounderTestJson(circular);
assert('safe stringify catches circular', circularResult.ok === false, circularResult.ok ? 'unexpected ok' : 'caught');

assert(
  'estimate payload too large',
  estimateFounderTestResultPayloadTooLarge(FOUNDER_TEST_RESULT_INLINE_MARKDOWN_MAX_CHARS + 1),
  'too large',
);

async function liveEndpointProof(): Promise<void> {
  resetFounderTestRunResultStoreForTests();
  storeFounderTestRunResult(storedHuge);

  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Could not bind ephemeral port');
  }
  const base = `http://127.0.0.1:${address.port}`;

  try {
    const resultRes = await fetch(`${base}/api/founder-test/result?runId=${hugeRunId}`);
    assert('live result HTTP 200', resultRes.status === 200, String(resultRes.status));
    const resultJson = (await resultRes.json()) as Record<string, unknown>;
    assert('live result payloadTooLarge', resultJson.payloadTooLarge === true, String(resultJson.payloadTooLarge));
    assert('live result no full markdown', resultJson.reportMarkdown == null, 'no md');
    assert('live result has length', typeof resultJson.reportMarkdownLength === 'number', 'length');
    const serialized = JSON.stringify(resultJson);
    assert('live result JSON serializes', serialized.length > 0 && serialized.length < 200_000, String(serialized.length));

    const reportRes = await fetch(`${base}${FOUNDER_TEST_RESULT_REPORT_ROUTE}?runId=${hugeRunId}`);
    const reportType = reportRes.headers.get('content-type') ?? '';
    const reportText = await reportRes.text();
    assert('live result-report HTTP 200', reportRes.status === 200, String(reportRes.status));
    assert('live result-report text/markdown', reportType.includes('text/markdown'), reportType);
    assert('live result-report full markdown', reportText.length === hugeMarkdown.length, `${reportText.length}/${hugeMarkdown.length}`);

    const downloadRes = await fetch(`${base}${FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE}?runId=${hugeRunId}`);
    const disposition = downloadRes.headers.get('content-disposition') ?? '';
    assert('live download attachment', disposition.includes('attachment'), disposition);
    assert('live download filename', disposition.includes('founder-test-report'), disposition);

    const debugRes = await fetch(`${base}/api/founder-test/result-debug?runId=${hugeRunId}`);
    const debugJson = (await debugRes.json()) as Record<string, unknown>;
    assert('live debug routeReached', debugJson.routeReached === true, String(debugJson.routeReached));
    assert('live debug no reportMarkdown key', debugJson.reportMarkdown === undefined, 'no md key');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

await liveEndpointProof();

const report = [
  '# Founder Test Result Payload Crash Repair Report',
  '',
  '## Root Cause',
  '',
  '- `handleFounderTestResultRequest` called `JSON.stringify` on `buildFounderTestResultResponse` which spread the entire stored payload (`...payload`) including massive `reportMarkdown`.',
  '- Oversized reports triggered `RangeError: Invalid string length`, crashing the Node process.',
  '- In-memory result store was wiped on crash → client stuck on Fetching Report.',
  '',
  '## Crash Proof',
  '',
  '```',
  'RangeError: Invalid string length',
  '  at sendFounderTestJson',
  '  at handleFounderTestResultRequest',
  '```',
  '',
  '## Before / After Payload Model',
  '',
  '| Endpoint | Before | After |',
  '| --- | --- | --- |',
  '| `/result` | Full payload + markdown in JSON | Bounded metadata; inline markdown only if ≤ 96KB |',
  '| `/result-report` | n/a | Full markdown as `text/markdown` |',
  '| `/result-download` | n/a | Attachment `.md` download |',
  '| `/result-debug` | Could include large fields | Length/preview only; no full markdown |',
  '',
  '## Files Changed',
  '',
  '- `src/founder-test-runtime-monitor/founder-test-result-payload-crash-repair.ts`',
  '- `server/founder-testing-handler.ts` — safe JSON + split endpoints',
  '- `server/founder-reality-server.ts` — route registration',
  '- `server/founder-test-server-process-metadata.ts` — store volatility on ping',
  '- `public/founder-reality/app.js` — metadata-first + markdown endpoint fetch',
  '',
  '## Manual Verification',
  '',
  '```bash',
  'curl http://localhost:4321/api/founder-test/result?runId=<runId>',
  'curl http://localhost:4321/api/founder-test/result-report?runId=<runId>',
  'curl -I http://localhost:4321/api/founder-test/result-download?runId=<runId>',
  'curl "http://localhost:4321/api/founder-test/result-debug?runId=<runId>"',
  '```',
  '',
  '## Remaining Limitation',
  '',
  '- Result store remains **volatile in-memory** (`storeVolatile: true`). Disk persistence not added in this phase.',
  '',
  '---',
  '',
  `Pass token: ${FOUNDER_TEST_RESULT_PAYLOAD_CRASH_REPAIR_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'FOUNDER_TEST_RESULT_PAYLOAD_CRASH_REPAIR_REPORT.md'), report, 'utf8');
assert(
  'report written',
  existsSync(join(ROOT, 'architecture', 'FOUNDER_TEST_RESULT_PAYLOAD_CRASH_REPAIR_REPORT.md')),
  'missing',
);

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Founder Test result payload crash repair validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Founder Test result payload crash repair validation PASSED (${results.length} checks)`);
console.log(FOUNDER_TEST_RESULT_PAYLOAD_CRASH_REPAIR_V1_PASS);
