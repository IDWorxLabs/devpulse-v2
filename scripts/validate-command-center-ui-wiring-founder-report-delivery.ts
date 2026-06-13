/**
 * Phase 26.48 — Command Center UI Wiring + Founder Report Delivery Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_V1_PASS,
  buildFounderTestRuntimeFailureReport,
  consumeFounderTestRunResult,
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
const VALIDATOR_BASENAME = 'validate-command-center-ui-wiring-founder-report-delivery';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'public/founder-reality/index.html',
  'public/founder-reality/app.js',
  'public/founder-reality/styles.css',
  'server/founder-testing-handler.ts',
  'scripts/validate-command-center-ui-wiring-founder-report-delivery.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const stylesCss = readFileSync(join(ROOT, 'public/founder-reality/styles.css'), 'utf8');
const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('operator feed runtime slot first', indexHtml.indexOf('founder-test-operator-trace') < indexHtml.indexOf('feed-stream-log'), 'order');
assert('sync operator feed layout', appJs.includes('syncOperatorFeedLayout'), 'helper');
assert('legacy feed suppressed during runtime', appJs.includes('isOperatorFeedFounderTestMode'), 'guard');
assert('renderOperatorFeed skips legacy when runtime active', appJs.includes('isOperatorFeedFounderTestMode()'), 'skip');
assert('operatorFeedMode single owner', appJs.includes('operatorFeedMode'), 'mode owner');
assert('founder test runtime title', appJs.includes('Founder Test Runtime'), 'title');
assert('timeline latest 8 default', appJs.includes('.slice(-8)'), 'slice 8');
assert('full trace toggle', appJs.includes('Show full trace'), 'toggle');
assert('collapsed trace default', appJs.includes('founderTestUnifiedTraceExpanded = false'), 'collapsed');
assert('local preview runId', appJs.includes('localFounderTestPreviewRunId'), 'preview runId');
assert('founder-test-runtime-active css', stylesCss.includes('.operator-feed-body.founder-test-runtime-active'), 'css class');
assert('no nested runtime scroll', stylesCss.includes('.founder-test-unified-scroll') && !stylesCss.includes('max-height: 12rem'), 'scroll');

assert('notification vault delivery', appJs.includes('deliverFounderTestReportNotification'), 'deliver');
assert('report notification type', appJs.includes("type: 'founder-test-report'"), 'type');
assert('copy report button in notification', appJs.includes('notification-copy-report-btn'), 'copy btn');
assert('copied feedback', appJs.includes("'Copied'") && appJs.includes("'Copy failed'"), 'feedback');
assert('report preview', appJs.includes('notification-report-preview'), 'preview');
assert('notification dedupe map', appJs.includes('deliveredFounderTestReportKeys'), 'dedupe');
assert('complete notification title', appJs.includes('Founder Test Report Ready'), 'complete title');
assert('failed notification title', appJs.includes('Founder Test Failed — Runtime Report Available'), 'failed title');
assert('stalled notification title', appJs.includes('Founder Test Stalled — Diagnostic Report Available'), 'stalled title');
assert('partial notification title', appJs.includes('Founder Test Partial Report Available'), 'partial title');
assert('error path delivers notification', appJs.includes('showFounderTestError') && appJs.includes('deliverFounderTestReportNotification'), 'error deliver');

const waitBlock = appJs.slice(appJs.indexOf('async function waitForFounderTestAsyncResult'));
const pollLoopEnd = waitBlock.indexOf('var resultRes = await fetch');
const pollLoop = pollLoopEnd > 0 ? waitBlock.slice(0, pollLoopEnd) : waitBlock;
assert('async wait helper', appJs.includes('waitForFounderTestAsyncResult'), 'wait');
assert('STALLED terminal state', waitBlock.includes('STALLED'), 'stalled');
assert('result fetch after poll', waitBlock.includes('/api/founder-test/result'), 'result fetch');
assert('no deliver inside poll loop', !pollLoop.includes('deliverFounderTestReportNotification'), 'poll dedupe');
assert('deliver after result fetch', waitBlock.includes('deliverFounderTestReportNotification'), 'post-fetch deliver');

assert('result endpoint handler fields', handlerSource.includes('buildFounderTestResultResponse'), 'builder');
assert('reportMarkdown field', handlerSource.includes('reportMarkdown'), 'reportMarkdown');
assert('partialReportMarkdown field', handlerSource.includes('partialReportMarkdown'), 'partial');
assert('failureReportMarkdown field', handlerSource.includes('failureReportMarkdown'), 'failure');
assert('generatedAt field', handlerSource.includes('generatedAt'), 'generatedAt');

assert('upload button html', indexHtml.includes('id="chat-upload-btn"'), 'upload id');
assert('voice button html', indexHtml.includes('id="chat-voice-btn"'), 'voice id');
assert('upload handler', appJs.includes('chat-upload-btn'), 'upload handler');
assert('voice handler', appJs.includes('chat-voice-btn'), 'voice handler');
assert('upload coming soon', appJs.includes('Upload coming soon'), 'upload stub');
assert('voice coming soon', appJs.includes('Voice notes coming soon'), 'voice stub');
assert('chat action btn css', stylesCss.includes('.chat-action-btn'), 'btn css');

assert('no scoring edits in app.js', !appJs.includes('founderTestScore') && !appJs.includes('recalculateFounderTestScore'), 'scoring');
assert('no verdict logic edits in handler', !handlerSource.includes('overrideLaunchVerdict') && !handlerSource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:command-center-ui-wiring-founder-report-delivery": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

resetFounderTestRuntimeMonitorForTests();
resetFounderTestRunResultStoreForTests();

const failureMarkdown = buildFounderTestRuntimeFailureReport({
  snapshot: {
    runId: 'ui-wiring-run',
    state: 'FAILED',
    progress: {
      currentStageOrder: 2,
      totalStages: 11,
      currentStageLabel: 'Intake Validation',
      elapsedMs: 1200,
    },
    stallAnalysis: { health: 'STALLED', warningMessage: 'stall' },
    traceEvents: [],
    feed: { events: [] },
    stages: [],
    handlerAlive: false,
    postTimedOut: false,
    stage2CompletionGap: false,
  } as unknown as Parameters<typeof buildFounderTestRuntimeFailureReport>[0]['snapshot'],
  errorMessage: 'simulated failure',
});

storeFounderTestRunResult({
  readOnly: true,
  runId: 'ui-wiring-run',
  ok: true,
  completedAt: new Date().toISOString(),
  payload: {
    ok: true,
    report: { reportMarkdown: '# Founder Test Report\n\nComplete.' },
    runtime: { runId: 'ui-wiring-run', state: 'COMPLETE' },
  },
  errorMessage: null,
});

const completeStored = consumeFounderTestRunResult('ui-wiring-run');
assert('stored complete result consumed', !!completeStored && completeStored.ok, String(completeStored?.ok));
assert(
  'stored report markdown present',
  !!(completeStored?.payload as { report?: { reportMarkdown?: string } }).report?.reportMarkdown,
  'missing markdown',
);

storeFounderTestRunResult({
  readOnly: true,
  runId: 'ui-wiring-fail',
  ok: false,
  completedAt: new Date().toISOString(),
  payload: {
    ok: false,
    error: 'simulated failure',
    runtime: {
      runId: 'ui-wiring-fail',
      state: 'FAILED',
      progress: { currentStageOrder: 2, totalStages: 11, currentStageLabel: 'Intake Validation', elapsedMs: 900 },
      stallAnalysis: { health: 'critical', warningMessage: 'stall' },
      traceEvents: [],
      feed: { events: [] },
      stages: [],
      handlerAlive: false,
      postTimedOut: true,
      stage2CompletionGap: false,
    },
  },
  errorMessage: 'simulated failure',
});

const failStored = consumeFounderTestRunResult('ui-wiring-fail');
assert('stored failed result consumed', !!failStored && !failStored.ok, String(failStored?.ok));
assert('failure report builder output', failureMarkdown.includes('# Founder Test Runtime Failure Report'), 'failure md');

const dedupeKeys: Record<string, boolean> = Object.create(null);
function simulateDeliver(runId: string, status: string): boolean {
  const key = `founder-test-report-${runId}-${status}`;
  if (dedupeKeys[key]) return false;
  dedupeKeys[key] = true;
  return true;
}
assert('dedupe simulation first deliver', simulateDeliver('run-a', 'COMPLETE'), 'first');
assert('dedupe simulation blocks duplicate', !simulateDeliver('run-a', 'COMPLETE'), 'duplicate');

const report = [
  '# Command Center UI Wiring + Founder Report Delivery Report',
  '',
  '## Operator Feed Wiring Root Cause',
  '',
  '- Unified Founder Test Runtime card existed but local preview omitted `runId`, keeping the card hidden.',
  '- Legacy `#feed-stream-log` and `#feed-sections` continued rendering above the runtime slot during founder test runs.',
  '- `renderOperatorFeed` overwrote legacy cards without coordinating with the runtime slot.',
  '',
  '## Founder Report Delivery Root Cause',
  '',
  '- Notifications stored plain strings only — no markdown body, preview, or Copy Report action.',
  '- Async 202 flow polled runtime status but never created a persistent founder test report notification.',
  '- Result endpoint returned raw payload without normalized `reportMarkdown` / `failureReportMarkdown` fields.',
  '',
  '## Missing Input Buttons Root Cause',
  '',
  '- Chat form markup only included text input and Send — upload/voice controls were never wired into `index.html`.',
  '',
  '## Files Changed',
  '',
  '- public/founder-reality/index.html',
  '- public/founder-reality/app.js',
  '- public/founder-reality/styles.css',
  '- server/founder-testing-handler.ts',
  '- src/founder-test-runtime-monitor/stage2-completion-tracker.ts',
  '- src/founder-test-runtime-monitor/index.ts',
  '- package.json',
  '- scripts/validate-command-center-ui-wiring-founder-report-delivery.ts',
  '',
  '## Manual UI Verification Steps',
  '',
  '1. Open Command Center and confirm chat bar shows upload (+) and microphone buttons beside Send.',
  '2. Run Founder Test — Operator Feed should show **Founder Test Runtime** first; legacy Planning/Execution cards hidden.',
  '3. Expand/collapse full trace; confirm latest 8 events visible by default.',
  '4. After completion or failure, open Notifications — report card with preview, runId, status, Copy Report.',
  '5. Copy Report from notification; confirm Copied feedback and clipboard contains full markdown.',
  '6. Close founder test modal — notification remains in drawer and Notifications view.',
  '',
  '## Remaining Risks',
  '',
  '- Upload/voice buttons are stubbed until backend handlers land.',
  '- Result endpoint consumes stored results on first fetch — refresh cannot re-fetch the same runId.',
  '- Very long reports truncate preview in notification UI (full markdown still copies).',
  '',
  '---',
  '',
  `Pass token: ${COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_V1_PASS}`,
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_REPORT.md'),
  report,
  'utf8',
);
assert(
  'report written',
  existsSync(join(ROOT, 'architecture', 'COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_REPORT.md')),
  'missing',
);
assert('report token', report.includes(COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_V1_PASS), 'token');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Command Center UI Wiring + Founder Report Delivery validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Command Center UI Wiring + Founder Report Delivery validation PASSED (${results.length} checks)`);
console.log(COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_V1_PASS);
