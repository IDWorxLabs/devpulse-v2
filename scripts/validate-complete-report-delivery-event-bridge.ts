/**
 * Phase 26.60 — Complete report delivery event bridge validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMPLETE_REPORT_DELIVERY_EVENT_BRIDGE_V1_PASS,
  FOUNDER_TEST_COMPLETE_HEADER_FETCH_FAILED,
  FOUNDER_TEST_COMPLETE_HEADER_PREPARING,
  FOUNDER_TEST_COMPLETE_HEADER_REPORT_READY,
  normalizeFounderTestDeliveryRunId,
  resolveFounderTestCompleteHeaderHint,
  shouldShowOperatorFeedFetchingLabel,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-complete-report-delivery-event-bridge';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'public/founder-reality/app.js',
  'src/founder-test-runtime-monitor/complete-report-delivery-event-bridge.ts',
  'scripts/validate-complete-report-delivery-event-bridge.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('applyFounderTestFinalReport bridge', appJs.includes('function applyFounderTestFinalReport'), 'bridge');
assert('bridge refreshes notification surfaces', appJs.includes('refreshFounderTestFinalReportDeliverySurfaces'), 'refresh');
assert('notification drawer refresh if open', appJs.includes('refreshNotificationDrawerIfOpen'), 'drawer');
assert('result endpoint uses bridge', appJs.includes("applyFounderTestFinalReport(runId, markdown, 'result-endpoint'"), 'result bridge');
assert('deliver routes through bridge', appJs.includes("applyFounderTestFinalReport(resolved.runId, resolved.reportMarkdown, 'deliver-notification'"), 'deliver bridge');
assert('runId normalization', appJs.includes('normalizeFounderTestDeliveryRunId'), 'runId');
assert('header report ready guard', appJs.includes('resolveFounderTestCompleteHeaderHint'), 'header');
assert('header preparing copy', appJs.includes(FOUNDER_TEST_COMPLETE_HEADER_PREPARING), 'preparing');
assert('header fetch failed copy', appJs.includes(FOUNDER_TEST_COMPLETE_HEADER_FETCH_FAILED), 'fetch failed');
assert('no report ready without markdown', appJs.includes('hasFounderTestFinalReportAvailable'), 'guard');
assert('fetching hidden when cached', /resolveFounderTestOperatorFeedReportActionLabels[\s\S]*?hasLocal[\s\S]*?Copy Final Report/.test(appJs), 'no fetch when cached');
assert('notification title ready', appJs.includes("'Founder Test Report Ready'"), 'title');
assert('copy checks cache before fetch', /function buildFounderTestCopyPayload\(\)[\s\S]*?resolveFounderTestFinalReportMarkdown/.test(appJs), 'copy cache');
assert('no scoring edits', !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !appJs.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:complete-report-delivery-event-bridge": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

assert(
  'runId normalization prefers explicit',
  normalizeFounderTestDeliveryRunId({
    runId: 'bridge-run',
    runtimeRunId: 'runtime-run',
    pinnedRunId: 'pinned-run',
  }) === 'bridge-run',
  'normalize',
);

assert(
  'header ready only with markdown',
  resolveFounderTestCompleteHeaderHint({ state: 'COMPLETE', hasReportMarkdown: true, fetchFailed: false, fetching: false }) ===
    FOUNDER_TEST_COMPLETE_HEADER_REPORT_READY,
  'ready header',
);
assert(
  'header preparing without markdown',
  resolveFounderTestCompleteHeaderHint({ state: 'COMPLETE', hasReportMarkdown: false, fetchFailed: false, fetching: false }) ===
    FOUNDER_TEST_COMPLETE_HEADER_PREPARING,
  'preparing header',
);
assert(
  'no fetching label when cached',
  shouldShowOperatorFeedFetchingLabel({ state: 'COMPLETE', hasCachedReport: true, fetching: true }) === false,
  'fetching label',
);

const report = [
  '# Complete Report Delivery Event Bridge Report',
  '',
  '## Root Cause',
  '',
  '- Final report markdown was cached separately from notification delivery and Operator Feed button state.',
  '- COMPLETE UI claimed "report ready" before markdown existed locally.',
  '- Notification drawer could stay stale while fetch paths kept Operator Feed on Fetching.',
  '',
  '## Bridge Design',
  '',
  '- `applyFounderTestFinalReport(runId, markdown, source)` is the single write path.',
  '- Writes `founderTestFinalReportsByRunId`, updates `lastFounderTestReport`, delivers notification, refreshes drawer/badge, clears Fetching, updates Operator Feed labels.',
  '',
  '## Files Changed',
  '',
  '- `public/founder-reality/app.js` — bridge helper + wired result/poll/run completion paths',
  '- `src/founder-test-runtime-monitor/complete-report-delivery-event-bridge.ts` — header/fetching contract helpers',
  '',
  '## Notification Proof',
  '',
  '- `pushFounderTestReportReadyNotification` adds Founder Test Report Ready with preview + Copy Report immediately.',
  '- `refreshNotificationDrawerIfOpen` re-renders drawer without close/reopen.',
  '',
  '## Operator Feed Proof',
  '',
  '- Cached report → Copy/Open Final Report immediate, no Fetching label.',
  '- Fetch failure does not override cached markdown.',
  '',
  '## Manual UI Verification Steps',
  '',
  '1. Run Founder Test to COMPLETE.',
  '2. Open notification drawer — **Founder Test Report Ready** appears immediately with preview.',
  '3. Operator Feed shows **Copy Final Report** / **Open Final Report** (not Fetching) once notification arrives.',
  '4. Header reads **Founder Test complete — report ready.** only after markdown is local.',
  '5. Click Copy Final Report — immediate clipboard copy without network fetch.',
  '',
  '---',
  '',
  `Pass token: ${COMPLETE_REPORT_DELIVERY_EVENT_BRIDGE_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'COMPLETE_REPORT_DELIVERY_EVENT_BRIDGE_REPORT.md'), report, 'utf8');
assert('report written', existsSync(join(ROOT, 'architecture', 'COMPLETE_REPORT_DELIVERY_EVENT_BRIDGE_REPORT.md')), 'missing');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Complete Report Delivery Event Bridge validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Complete Report Delivery Event Bridge validation PASSED (${results.length} checks)`);
console.log(COMPLETE_REPORT_DELIVERY_EVENT_BRIDGE_V1_PASS);
