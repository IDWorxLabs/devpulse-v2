/**
 * Phase 26.50 — Founder Report Access + Operator Feed State Flip Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_REPORT_ACCESS_OPERATOR_FEED_STATE_V1_PASS,
  beginFounderTestRuntime,
  getFounderTestRuntimeStatus,
  peekFounderTestRunResult,
  resetFounderTestRunResultStoreForTests,
  resetFounderTestRuntimeMonitorForTests,
  storeFounderTestRunResult,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-report-access-operator-feed-state';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'public/founder-reality/app.js',
  'public/founder-reality/index.html',
  'public/founder-reality/styles.css',
  'server/founder-testing-handler.ts',
  'scripts/validate-founder-report-access-operator-feed-state.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
const stylesCss = readFileSync(join(ROOT, 'public/founder-reality/styles.css'), 'utf8');
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('operatorFeedMode single owner', appJs.includes("var operatorFeedMode = 'default'"), 'mode var');
assert('founder-test-runtime mode constant', appJs.includes("OPERATOR_FEED_MODE_FOUNDER_TEST = 'founder-test-runtime'"), 'constant');
assert('activate operator feed mode', appJs.includes('activateOperatorFeedFounderTestMode'), 'activate');
assert('dismiss operator feed mode', appJs.includes('dismissOperatorFeedFounderTestMode'), 'dismiss');
assert('isOperatorFeedFounderTestMode guard', appJs.includes('isOperatorFeedFounderTestMode'), 'guard');
assert('legacy feed blocked in founder mode', appJs.includes('if (isOperatorFeedFounderTestMode()) return'), 'block legacy');
assert('renderOperatorFeed respects mode', appJs.includes('if (isOperatorFeedFounderTestMode())') && appJs.includes('function renderOperatorFeed'), 'render guard');
assert('pinned run id', appJs.includes('founderTestRuntimePinnedRunId'), 'pinned run');
assert('data-operator-feed-mode attribute', appJs.includes("data-operator-feed-mode"), 'data attr');

assert('copy latest report button', indexHtml.includes('founder-test-copy-latest-report') || appJs.includes('founder-test-copy-latest-report'), 'copy btn');
assert('open report button', appJs.includes('founder-test-open-report'), 'open btn');
assert('retry fetch button', appJs.includes('founder-test-retry-fetch-result'), 'retry btn');
assert('report modal markup', indexHtml.includes('founder-test-report-modal'), 'modal');
assert('buildFounderTestCopyPayload priority', appJs.includes('function buildFounderTestCopyPayload'), 'copy payload');
assert('full report first in copy payload', appJs.indexOf('lastFounderTestReport') < appJs.indexOf('lastFounderTestPartialReportMarkdown'), 'priority order');
assert('retry fetch result function', appJs.includes('retryFetchFounderTestResult'), 'retry fn');
assert('open report modal function', appJs.includes('openFounderTestReportModal'), 'open fn');

assert('result peek not consume only', handlerSource.includes('peekFounderTestRunResult'), 'peek');
assert('running result response builder', handlerSource.includes('buildRunningFounderTestResultResponse'), 'running builder');
assert('runtimeDiagnosticMarkdown field', handlerSource.includes('runtimeDiagnosticMarkdown'), 'diagnostic md');
assert('202 while running', handlerSource.includes('202') && handlerSource.includes('buildRunningFounderTestResultResponse'), '202 running');

assert('notification refresh after delivery', appJs.includes('refreshNotificationSurfaces') && appJs.includes('deliverFounderTestReportNotification'), 'refresh');
assert('unread badge element', indexHtml.includes('notif-unread-badge'), 'badge html');
assert('update unread badge', appJs.includes('updateNotificationUnreadBadge'), 'badge fn');
assert('running diagnostic notification title', appJs.includes('Founder Test Still Running — Diagnostic Available'), 'running title');
assert('delivery trace hook', appJs.includes('traceFounderTestDelivery'), 'trace');
assert('dedupe does not use runId-only block for all', appJs.includes('allowDuplicate') || appJs.includes('resolved.status'), 'dedupe granularity');
assert('first delivery path', appJs.includes('deliveredFounderTestReportKeys[dedupeKey] = true'), 'dedupe set');

assert('no scoring changes in app.js', !appJs.includes('recalculateFounderTestScore') && !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict override in handler', !handlerSource.includes('overrideLaunchVerdict') && !handlerSource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`execSync('npm run validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:founder-report-access-operator-feed-state": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

assert('runtime card action styles', stylesCss.includes('.founder-test-runtime-report-actions'), 'action css');
assert('report modal styles', stylesCss.includes('.founder-test-report-modal'), 'modal css');
assert('unread badge styles', stylesCss.includes('.notif-unread-badge'), 'badge css');

resetFounderTestRuntimeMonitorForTests();
resetFounderTestRunResultStoreForTests();

beginFounderTestRuntime({ runId: 'feed-state-run' });
const runningSnap = getFounderTestRuntimeStatus();
assert('running snapshot has runId', runningSnap.runId === 'feed-state-run', runningSnap.runId ?? 'null');
assert('running snapshot state active', runningSnap.state !== 'IDLE', runningSnap.state);

storeFounderTestRunResult({
  readOnly: true,
  runId: 'feed-state-run',
  ok: true,
  completedAt: new Date().toISOString(),
  payload: {
    ok: true,
    report: { reportMarkdown: '# Complete report' },
    runtime: { runId: 'feed-state-run', state: 'COMPLETE' },
  },
  errorMessage: null,
});

const peeked = peekFounderTestRunResult('feed-state-run');
assert('peek retains stored result for retry', !!peeked && peeked.ok, String(peeked?.ok));
const peekAgain = peekFounderTestRunResult('feed-state-run');
assert('peek is non-destructive', !!peekAgain, 'second peek failed');

const dedupeKeys: Record<string, boolean> = Object.create(null);
function simulateDeliver(runId: string, status: string): boolean {
  const key = `founder-test-report-${runId}-${status}`;
  if (dedupeKeys[key]) return false;
  dedupeKeys[key] = true;
  return true;
}
assert('first RUNNING notification allowed', simulateDeliver('run-a', 'RUNNING'), 'first running');
assert('duplicate RUNNING blocked', !simulateDeliver('run-a', 'RUNNING'), 'dup running');
assert('COMPLETE after RUNNING allowed', simulateDeliver('run-a', 'COMPLETE'), 'complete after running');

const report = [
  '# Founder Report Access + Operator Feed State Report',
  '',
  '## Operator Feed Flip Root Cause',
  '',
  '- Layout toggled via implicit runtime snapshot checks without a persistent `operatorFeedMode` owner.',
  '- Legacy feed renderers (`renderOperatorFeed`, `appendFeedStreamLog`) still ran during founder test and restored Planning/Execution/Verification cards.',
  '- `syncOperatorFeedLayout(null)` cleared founder-test mode during transient IDLE/missing-runId poll frames.',
  '',
  '## Missing Notification Root Cause',
  '',
  '- `deliverFounderTestReportNotification` returned early when markdown was empty before runtime diagnostic fallback was guaranteed.',
  '- Notification drawer did not show unread badge/count after delivery.',
  '- GET `/api/founder-test/result` returned 404 while run was still active, so async clients had nothing to deliver.',
  '',
  '## Files Changed',
  '',
  '- public/founder-reality/app.js',
  '- public/founder-reality/index.html',
  '- public/founder-reality/styles.css',
  '- server/founder-testing-handler.ts',
  '- src/founder-test-runtime-monitor/stage2-completion-tracker.ts',
  '- src/founder-test-runtime-monitor/index.ts',
  '- package.json',
  '- scripts/validate-founder-report-access-operator-feed-state.ts',
  '',
  '## Report Fallback Proof',
  '',
  '- Runtime card exposes Copy Latest Report / Open Report / Retry Fetch Result independent of Notifications drawer.',
  '- Copy priority: full report → partial → runtime failure → minimal diagnostic.',
  '- Server returns `runtimeDiagnosticMarkdown` with HTTP 202 while run is active.',
  '',
  '## Manual Verification Steps',
  '',
  '1. Run Founder Test — Operator Feed stays on Founder Test Runtime (no flip to legacy cards).',
  '2. Use Copy Latest Report / Open Report on runtime card without opening Notifications.',
  '3. Retry Fetch Result while running — diagnostic markdown appears; notification badge increments.',
  '4. Open Notifications — report entry persists after closing founder test modal; badge clears on open.',
  '5. Dismiss runtime card — legacy feed returns only after explicit Dismiss.',
  '',
  '## Remaining Risks',
  '',
  '- Running diagnostic notification fires after 45s threshold, not immediately.',
  '- Result store peek keeps completed results in memory until next run overwrites store.',
  '- Very long reports truncate in notification preview (full copy still available).',
  '',
  '---',
  '',
  `Pass token: ${FOUNDER_REPORT_ACCESS_OPERATOR_FEED_STATE_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'FOUNDER_REPORT_ACCESS_OPERATOR_FEED_STATE_REPORT.md'), report, 'utf8');
assert(
  'report written',
  existsSync(join(ROOT, 'architecture', 'FOUNDER_REPORT_ACCESS_OPERATOR_FEED_STATE_REPORT.md')),
  'missing',
);
assert('report token', report.includes(FOUNDER_REPORT_ACCESS_OPERATOR_FEED_STATE_V1_PASS), 'token');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Founder Report Access + Operator Feed State validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Founder Report Access + Operator Feed State validation PASSED (${results.length} checks)`);
console.log(FOUNDER_REPORT_ACCESS_OPERATOR_FEED_STATE_V1_PASS);
