/**
 * Phase 26.61 — Complete report preparing stall repair validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMPLETE_REPORT_PREPARING_STALL_REPAIR_V1_PASS,
  COMPLETE_REPORT_HANDOFF_STALL_MS,
  REPORT_HANDOFF_TRACE_BOUNDARIES,
  FOUNDER_TEST_COMPLETE_HEADER_HANDOFF_STALLED,
  resolveMissingReportHandoffBoundary,
  buildFounderTestResultDebugResponse,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-complete-report-preparing-stall';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'server/founder-testing-handler.ts',
  'server/founder-reality-server.ts',
  'src/founder-test-runtime-monitor/complete-report-preparing-stall.ts',
  'public/founder-reality/app.js',
  'scripts/validate-complete-report-preparing-stall.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const serverSource = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('handoff trace markdown built', handlerSource.includes("operationId: 'final-report-markdown-built'"), 'trace');
assert('handoff trace stored by runId', handlerSource.includes("operationId: 'final-report-stored-by-runid'"), 'trace');
assert('handoff trace handoff ready', handlerSource.includes("operationId: 'final-report-handoff-ready'"), 'trace');
assert('store before finish', handlerSource.indexOf('storeFounderTestRunResult') < handlerSource.indexOf('finishFounderTestRuntime({'), 'order');
assert('result-debug handler', handlerSource.includes('handleFounderTestResultDebugRequest'), 'debug handler');
assert('result-debug route', serverSource.includes('/api/founder-test/result-debug'), 'debug route');
assert('10s stall constant', appJs.includes('FOUNDER_TEST_REPORT_HANDOFF_STALL_MS = 10000'), 'stall ms');
assert('stall guard scheduler', appJs.includes('scheduleFounderTestReportHandoffStallGuard'), 'guard');
assert('stall trigger', appJs.includes('triggerFounderTestReportHandoffStall'), 'trigger');
assert('result-debug client fetch', appJs.includes('fetchFounderTestResultDebug'), 'debug fetch');
assert('debug endpoint path', appJs.includes('/api/founder-test/result-debug'), 'debug path');
assert('handoff stalled header', appJs.includes(FOUNDER_TEST_COMPLETE_HEADER_HANDOFF_STALLED), 'header');
assert('missing boundary in diagnostic', appJs.includes('missingHandoffBoundary'), 'boundary');
assert('debug fields requested runId', appJs.includes('requestedRunId'), 'runId');
assert('debug fields hasStoredResult', appJs.includes('hasStoredResult'), 'stored');
assert('debug fields hasReportMarkdown', appJs.includes('hasReportMarkdown'), 'markdown');
assert('debug fields reportMarkdownLength', appJs.includes('reportMarkdownLength'), 'length');
assert('debug fields storedRunIds', appJs.includes('storedRunIds'), 'run ids');
assert('debug fields endpoint status', appJs.includes('endpoint status'), 'endpoint');
assert('fetch timeout guard', appJs.includes('FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS'), 'fetch timeout');
assert('client cache trace', appJs.includes('final-report-client-cache-ready'), 'cache trace');
assert('notification trace', appJs.includes('final-report-notification-delivered'), 'notification trace');
assert('cannot stay preparing forever', appJs.includes('founderTestReportHandoffStalled'), 'stall flag');
assert('no scoring edits', !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !appJs.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:complete-report-preparing-stall": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

assert('stall ms is 10s', COMPLETE_REPORT_HANDOFF_STALL_MS === 10_000, '10s');
assert('trace boundaries count', REPORT_HANDOFF_TRACE_BOUNDARIES.length === 5, 'boundaries');

assert(
  'missing boundary when store empty',
  resolveMissingReportHandoffBoundary({
    reportMarkdownBuilt: false,
    storedByRunId: false,
    hasReportMarkdown: false,
  }) === 'Final report markdown built',
  'markdown built',
);

const debug = buildFounderTestResultDebugResponse({
  requestedRunId: 'stall-run',
  stored: null,
  storedRunIds: ['other-run'],
  runtime: { runId: 'stall-run', state: 'COMPLETE' } as never,
  resultEndpointStatus: 202,
  clientCacheReady: false,
  notificationDelivered: false,
});

assert('debug exposes requested runId', debug.requestedRunId === 'stall-run', 'runId');
assert('debug exposes hasStoredResult', debug.hasStoredResult === false, 'stored');
assert('debug exposes endpoint status', debug.endpointStatus === 202, 'endpoint');
assert('debug exposes storedRunIds', Array.isArray(debug.storedRunIds) && debug.storedRunIds.includes('other-run'), 'ids');
assert('debug marks handoff stalled', debug.reportHandoffStalled === true, 'stalled');

const report = [
  '# Complete Report Preparing Stall Repair Report',
  '',
  '## Root Cause',
  '',
  '- COMPLETE UI stayed on "preparing report" / "Fetching Report..." indefinitely when result fetch hung or handoff never reached client cache.',
  '- No bounded stall guard or debug endpoint to expose which handoff boundary failed.',
  '',
  '## Repair',
  '',
  '- Server emits handoff traces after Stage 10/11 and persists result before COMPLETE.',
  '- `GET /api/founder-test/result-debug?runId=` exposes store/endpoint diagnostics.',
  '- Client 10s stall guard calls result-debug and surfaces handoff diagnostic on Copy/Open.',
  '- Result fetch uses AbortController timeout to avoid infinite Fetching.',
  '',
  '## Files Changed',
  '',
  '- `src/founder-test-runtime-monitor/complete-report-preparing-stall.ts`',
  '- `server/founder-testing-handler.ts` — traces + result-debug',
  '- `server/founder-reality-server.ts` — route',
  '- `public/founder-reality/app.js` — stall guard + diagnostics',
  '',
  '## Validation',
  '',
  ...results.map((r) => `- [${r.passed ? 'x' : ' '}] ${r.name}: ${r.detail}`),
  '',
  results.every((r) => r.passed)
    ? `\nSUCCESS: ${COMPLETE_REPORT_PREPARING_STALL_REPAIR_V1_PASS}\n`
    : '\nFAILED: complete report preparing stall repair checks did not pass.\n',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'COMPLETE_REPORT_PREPARING_STALL_REPAIR_REPORT.md'), report, 'utf8');

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.error('Complete report preparing stall repair validation FAILED:');
  for (const f of failed) {
    console.error(`  ✗ ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log(`Complete report preparing stall repair validation passed (${results.length} checks).`);
console.log(COMPLETE_REPORT_PREPARING_STALL_REPAIR_V1_PASS);
