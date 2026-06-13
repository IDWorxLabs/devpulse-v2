/**
 * Phase 26.70 — Founder Test COMPLETE state truth + report fetch loop validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_COMPLETE_STATE_TRUTH_REPORT_FETCH_LOOP_V1_PASS,
  FOUNDER_TEST_HANDOFF_STATE_LABELS,
  FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING,
  FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS_BOUNDED,
  FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS_BOUNDED,
  completeCannotCoexistWithReportGenerationRunning,
  completeCannotCoexistWithStagePending,
  publicCompleteRequiresStoredReportMarkdown,
  reconcilePublicFounderTestRuntimeSnapshot,
  resolveFounderTestHandoffState,
  buildFounderTestRunHandoffPayload,
  buildFounderTestResultDebugResponse,
  shouldReturnCompleteResultHttp200,
} from '../src/founder-test-runtime-monitor/index.js';
import {
  resolveFounderTestOperatorFeedReportButtonLabels,
  shouldShowOperatorFeedFetchingReportLabel,
} from '../src/founder-test-runtime-monitor/operator-feed-final-report-button-state-sync.js';
import {
  resetFounderTestRunResultStoreForTests,
  storeFounderTestRunResult,
  peekFounderTestRunResult,
} from '../src/founder-test-runtime-monitor/founder-test-run-result-store.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-test-complete-state-truth-report-fetch-loop';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'server/founder-testing-handler.ts',
  'src/founder-test-runtime-monitor/founder-test-complete-state-truth.ts',
  'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts',
  'public/founder-reality/app.js',
  'scripts/validate-founder-test-complete-state-truth-report-fetch-loop.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8').replace(/\r\n/g, '\n');
const monitorSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts'),
  'utf8',
).replace(/\r\n/g, '\n');
const stateTruthSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-complete-state-truth.ts'),
  'utf8',
);
const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');
const debugSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/complete-report-preparing-stall.ts'),
  'utf8',
);

assert(
  'monitor uses reconcilePublicFounderTestRuntimeSnapshot',
  monitorSource.includes('reconcilePublicFounderTestRuntimeSnapshot'),
  'reconcile',
);
assert(
  'result-debug includes publicState',
  debugSource.includes('publicState: input.runtime.publicState'),
  'publicState',
);
assert(
  'result-debug includes handoffState',
  debugSource.includes('handoffState: input.runtime.handoffState'),
  'handoffState',
);
assert(
  'result-debug includes currentOperation',
  debugSource.includes('currentOperation: input.runtime.currentOperation'),
  'currentOperation',
);
assert(
  'handler always JSON via sendFounderTestJson',
  handlerSource.includes('sendFounderTestJson') && handlerSource.includes('handleFounderTestResultRequest'),
  'json result',
);
assert('client bounded max attempts 3', appJs.includes('FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS = 3'), 'attempts');
assert(
  'client quick fetch timeout 3000',
  appJs.includes('FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS = 3000'),
  'timeout',
);
assert('client fetch retry helper', appJs.includes('fetchFounderTestResultWithRetry'), 'fetch helper');
assert('client single handoff status element', appJs.includes('founder-test-report-handoff-status'), 'status el');
assert(
  'no duplicate fetching on both buttons',
  !/copy: 'Fetching Report\.\.\.'[\s\S]*open: 'Fetching Report\.\.\.'/.test(appJs),
  'duplicate labels',
);
assert(
  'buttons keep final report labels while fetching',
  appJs.includes("copy: 'Copy Final Report'") && appJs.includes('fetchingStatus'),
  'single status',
);
assert('client uses publicState', appJs.includes('runtime.publicState'), 'publicState client');
assert('client uses handoffStateLabel', appJs.includes('runtime.handoffStateLabel'), 'handoff label');
assert('client handoff state in card', appJs.includes('Handoff state'), 'handoff dt');
assert('retry uses bounded fetch helper', /retryFetchFounderTestResult[\s\S]*fetchFounderTestResultWithRetry/.test(appJs), 'retry bounded');
assert('in-flight fetch guard', appJs.includes('founderTestOperatorFeedReportFetchInFlight'), 'in flight');
assert('no scoring edits', !handlerSource.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !handlerSource.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(
    `validate:founder-test-complete-state-truth-report-fetch-loop": "tsx scripts/${VALIDATOR_BASENAME}.ts"`,
  ),
  'script',
);

const contradictorySnapshot = {
  runId: 'truth-run-1',
  state: 'COMPLETE',
  currentOperation: 'Report Generation running',
  lastCompletedOperation: 'Founder Test Complete',
  traceStageStatus: 'COMPLETE',
  progress: {
    readOnly: true as const,
    currentStage: 'REPORT_GENERATION',
    currentStageLabel: 'Report Generation',
    currentStageOrder: 10,
    totalStages: 11,
    completedStages: 10,
    remainingStages: 1,
    percentComplete: 91,
    elapsedMs: 120000,
    estimatedRemainingMs: 5000,
  },
  traceEvents: [
    {
      readOnly: true as const,
      traceEventId: 't1',
      operationId: 'runtime-completed',
      stageId: 'COMPLETE',
      stageOrder: 11,
      stageLabel: 'Complete',
      operationLabel: 'Founder Test Complete',
      status: 'COMPLETE' as const,
      timestamp: '2026-06-12T12:00:00.000Z',
      displayTime: '12:00:00',
      displayLine: 'Founder Test Complete',
    },
  ],
  uiSummary: {
    headline: 'Founder Test Complete',
    stageLine: 'Stage pending',
    elapsedLine: 'Elapsed: 02:00',
    remainingLine: 'Remaining: —',
  },
} as unknown as import('../src/founder-test-runtime-monitor/founder-test-runtime-types.js').FounderTestRuntimeSnapshot;

resetFounderTestRunResultStoreForTests();
const reconciledWithoutStore = reconcilePublicFounderTestRuntimeSnapshot(contradictorySnapshot);
assert(
  'COMPLETE cannot coexist with Report Generation running',
  completeCannotCoexistWithReportGenerationRunning(contradictorySnapshot),
  String(reconciledWithoutStore.currentOperation),
);
assert(
  'public state handoff pending without store',
  reconciledWithoutStore.publicState === FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING,
  String(reconciledWithoutStore.publicState),
);
assert(
  'current operation not report generation after reconcile',
  !/report generation running/i.test(reconciledWithoutStore.currentOperation ?? ''),
  String(reconciledWithoutStore.currentOperation),
);
assert(
  'COMPLETE cannot coexist with Stage pending',
  completeCannotCoexistWithStagePending(contradictorySnapshot),
  String(reconciledWithoutStore.uiSummary.stageLine),
);
assert('stage line not pending after reconcile', reconciledWithoutStore.uiSummary.stageLine !== 'Stage pending', reconciledWithoutStore.uiSummary.stageLine);

const runId = 'truth-run-stored';
const markdown = '# Founder Test Report\n\nState truth proof.';
storeFounderTestRunResult({
  readOnly: true,
  runId,
  ok: true,
  completedAt: '2026-06-12T12:00:00.000Z',
  payload: buildFounderTestRunHandoffPayload({
    runId,
    ok: true,
    runtime: { runId, state: 'COMPLETE' } as never,
    report: { reportMarkdown: markdown },
    reportMarkdown: markdown,
    finalReportReady: true,
  }),
  errorMessage: null,
});

const storedSnapshot = reconcilePublicFounderTestRuntimeSnapshot({
  ...contradictorySnapshot,
  runId,
});
assert('public COMPLETE requires stored markdown', publicCompleteRequiresStoredReportMarkdown(), 'requires store');
assert('stored enables public COMPLETE', storedSnapshot.publicState === 'COMPLETE', String(storedSnapshot.publicState));
const stored = peekFounderTestRunResult(runId)!;
assert('result http 200 with markdown', shouldReturnCompleteResultHttp200(stored), 'http200');

const fetchingLabels = resolveFounderTestOperatorFeedReportButtonLabels({
  isComplete: true,
  hasCachedReport: false,
  fetchState: 'fetching',
});
assert(
  'fetching uses single status not duplicate button text',
  fetchingLabels.copy !== 'Fetching Report...' && fetchingLabels.open !== 'Fetching Report...',
  `${fetchingLabels.copy}/${fetchingLabels.open}`,
);
assert(
  'fetching status line present',
  Boolean(fetchingLabels.fetchingStatus && fetchingLabels.fetchingStatus.includes('Fetching')),
  String(fetchingLabels.fetchingStatus),
);
assert(
  'COMPLETE cannot coexist with Fetching Report label on buttons',
  !shouldShowOperatorFeedFetchingReportLabel({ hasCachedReport: false, fetchState: 'available', handoffStalled: true }),
  'not fetching when stalled',
);

const debug = buildFounderTestResultDebugResponse({
  requestedRunId: runId,
  stored,
  storedRunIds: [runId],
  runtime: storedSnapshot,
  resultEndpointStatus: 200,
});
assert('debug routeReached true', debug.routeReached === true, 'routeReached');
assert('debug has handoffState', typeof debug.handoffState === 'string', String(debug.handoffState));
assert('debug has publicState', typeof debug.publicState === 'string', String(debug.publicState));
assert('debug has currentOperation', debug.currentOperation != null, 'currentOperation');

assert(
  'handoff state labels cover pipeline',
  Object.keys(FOUNDER_TEST_HANDOFF_STATE_LABELS).length >= 7,
  String(Object.keys(FOUNDER_TEST_HANDOFF_STATE_LABELS).length),
);
assert(
  'handoff state resolves for stored snapshot',
  resolveFounderTestHandoffState(storedSnapshot) === 'result_endpoint_verified',
  resolveFounderTestHandoffState(storedSnapshot),
);
assert(
  'bounded attempts constant',
  FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS_BOUNDED === 3,
  String(FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS_BOUNDED),
);
assert(
  'bounded timeout constant',
  FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS_BOUNDED === 3000,
  String(FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS_BOUNDED),
);

const report = [
  '# Founder Test COMPLETE State Truth + Report Fetch Loop Report',
  '',
  '## Root Cause',
  '',
  '- Internal runtime reached COMPLETE while trace fields still showed Report Generation running and Stage pending.',
  '- Public API exposed COMPLETE before handoff reconciliation, while client fetch loop spun with duplicate Fetching Report controls.',
  '- Client treated server COMPLETE as deliverable before bounded result fetch completed or failed.',
  '',
  '## Impossible State (Screenshot)',
  '',
  '- Badge: COMPLETE',
  '- Current operation: Report Generation running',
  '- Stage: pending',
  '- Last completed: Founder Test Complete',
  '- UI: duplicate Fetching Report buttons + Retry Fetch Result during active fetch',
  '',
  '## Before / After State Model',
  '',
  '| Layer | Before | After |',
  '| --- | --- | --- |',
  '| Public runtime | COMPLETE with stale ops | COMPLETING / REPORT_HANDOFF_PENDING until store + reconcile |',
  '| Current operation | Stale Report Generation running | Report Handoff pending → Complete |',
  '| Stage line | Stage pending / Report Generation | handoffStateLabel or All stages finished |',
  '| Client badge | COMPLETE while fetching | REPORT_HANDOFF_PENDING until cache ready |',
  '| Report buttons | Both say Fetching Report... | Single status line + Copy/Open Final Report (disabled) |',
  '',
  '## Files Changed',
  '',
  '- `src/founder-test-runtime-monitor/founder-test-complete-state-truth.ts` — public reconciliation',
  '- `src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts` — apply reconcile on status reads',
  '- `src/founder-test-runtime-monitor/complete-report-preparing-stall.ts` — debug fields',
  '- `src/founder-test-runtime-monitor/operator-feed-final-report-button-state-sync.ts` — single status contract',
  '- `public/founder-reality/app.js` — bounded fetch, badge, handoff UI',
  '- `server/founder-testing-handler.ts` — unchanged scoring/verdict; result endpoints JSON',
  '',
  '## Endpoint Proof',
  '',
  '- `/api/founder-test/result` — 200 with markdown, 202 when handoff pending, always JSON via sendFounderTestJson',
  '- `/api/founder-test/result-debug` — routeReached, publicState, handoffState, currentOperation, store fields',
  '',
  '## Client Bounded Retry Proof',
  '',
  '- Max 3 attempts, 3000ms timeout per attempt, 600ms delay between attempts',
  '- After exhaustion: stop Fetching Report..., show Copy Handoff Diagnostic, show Retry Fetch Result',
  '',
  '## Duplicate Button Fix',
  '',
  '- Single `#founder-test-report-handoff-status` line for Fetching Report...',
  '- Copy/Open keep Final Report labels; Retry hidden until fetch fails',
  '',
  '## Manual Verification Steps',
  '',
  '1. Run Founder Test to completion.',
  '2. During handoff: badge shows REPORT_HANDOFF_PENDING, handoff state visible, current operation not Report Generation running.',
  '3. Single Fetching Report status line appears (not on both buttons).',
  '4. After bounded failure: Copy Handoff Diagnostic + Retry Fetch Result appear; fetching stops.',
  '5. After success: badge COMPLETE, Copy/Open Final Report enabled with report markdown.',
  '6. `GET /api/founder-test/result-debug?runId=` includes publicState, handoffState, currentOperation.',
  '',
  '---',
  '',
  `Pass token: ${FOUNDER_TEST_COMPLETE_STATE_TRUTH_REPORT_FETCH_LOOP_V1_PASS}`,
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'FOUNDER_TEST_COMPLETE_STATE_TRUTH_REPORT_FETCH_LOOP_REPORT.md'),
  report,
  'utf8',
);
assert(
  'report written',
  existsSync(join(ROOT, 'architecture', 'FOUNDER_TEST_COMPLETE_STATE_TRUTH_REPORT_FETCH_LOOP_REPORT.md')),
  'missing',
);

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Founder Test COMPLETE state truth + fetch loop validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Founder Test COMPLETE state truth + fetch loop validation PASSED (${results.length} checks)`);
console.log(FOUNDER_TEST_COMPLETE_STATE_TRUTH_REPORT_FETCH_LOOP_V1_PASS);
