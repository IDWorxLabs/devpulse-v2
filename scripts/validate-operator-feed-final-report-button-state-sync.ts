/**
 * Phase 26.62 — Operator Feed final report button state sync validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OPERATOR_FEED_FINAL_REPORT_BUTTON_STATE_SYNC_V1_PASS,
  FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT,
  FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT,
  resolveFounderTestFinalReportFetchState,
  shouldApplyFailedFetchState,
  resolveFounderTestOperatorFeedReportButtonLabels,
  shouldShowOperatorFeedFetchingReportLabel,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-operator-feed-final-report-button-state-sync';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'public/founder-reality/app.js',
  'src/founder-test-runtime-monitor/operator-feed-final-report-button-state-sync.ts',
  'scripts/validate-operator-feed-final-report-button-state-sync.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('applyFounderTestFinalReport bridge', appJs.includes('function applyFounderTestFinalReport'), 'bridge');
assert('per-run fetch state map', appJs.includes('founderTestFinalReportFetchStateByRunId'), 'map');
assert('fetch state getter', appJs.includes('getFounderTestFinalReportFetchState'), 'getter');
assert('fetch state setter', appJs.includes('setFounderTestFinalReportFetchState'), 'setter');
assert('apply clears fetch state', /applyFounderTestFinalReport[\s\S]*?setFounderTestFinalReportFetchState\(runId, 'available'\)/.test(appJs), 'clear');
assert('apply re-renders operator feed', appJs.includes('syncFounderTestOperatorFeedReportButtonState'), 'rerender');
assert('label resolver checks cache first', /resolveFounderTestOperatorFeedReportActionLabels[\s\S]*?hasLocal[\s\S]*?Copy Final Report/.test(appJs), 'cache first');
assert('fetching only without cache', /resolveFounderTestOperatorFeedReportActionLabels[\s\S]*?fetchState === 'fetching'/.test(appJs), 'fetching guard');
assert('single handoff status line', appJs.includes('fetchingStatus'), 'fetching status');
assert('cached report forces available', /getFounderTestFinalReportFetchState[\s\S]*?'available'/.test(appJs), 'available');
assert('failed fetch guard', appJs.includes('markFounderTestFinalReportFetchFailed'), 'failed guard');
assert('failed cannot override available', /setFounderTestFinalReportFetchState[\s\S]*?available/.test(appJs), 'override block');
assert('shared copy helper', appJs.includes('copyFounderTestFinalReportMarkdownShared'), 'shared copy');
assert('shared handoff copy resolver', appJs.includes('copyFounderTestReportHandoffShared'), 'handoff copy');
assert(
  'modal uses shared copy',
  /function copyFounderTestReport\(\)[\s\S]*?copyFounderTestReportHandoffShared/.test(appJs) ||
    /function copyFounderTestReport\(\)[\s\S]*?copyFounderTestFinalReportMarkdownShared/.test(appJs),
  'modal copy',
);
assert('notification uses shared copy', /wireNotificationCopyButtons[\s\S]*?copyFounderTestFinalReportMarkdownShared/.test(appJs), 'notification copy');
assert('trace key includes fetch state', appJs.includes('cardFetchState'), 'trace key');
assert('buttons enable when available', appJs.includes('enabled: true'), 'enabled');
assert('no scoring edits', !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !appJs.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(
    `validate:operator-feed-final-report-button-state-sync": "tsx scripts/${VALIDATOR_BASENAME}.ts"`,
  ),
  'script',
);

assert(
  'cache forces available state',
  resolveFounderTestFinalReportFetchState({
    hasCachedReport: true,
    currentState: 'fetching',
    fetching: true,
  }) === 'available',
  'available from cache',
);

assert(
  'failed blocked when cache exists',
  shouldApplyFailedFetchState({ hasCachedReport: true, currentState: 'fetching' }) === false,
  'failed blocked',
);

assert(
  'labels ready when cached',
  resolveFounderTestOperatorFeedReportButtonLabels({
    isComplete: true,
    hasCachedReport: true,
    fetchState: 'fetching',
  }).copy === FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT,
  'copy final',
);

const fetchingLabels = resolveFounderTestOperatorFeedReportButtonLabels({
  isComplete: true,
  hasCachedReport: false,
  fetchState: 'fetching',
});
assert(
  'fetching status line without cache',
  fetchingLabels.fetchingStatus === FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT &&
    fetchingLabels.copy === FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT,
  `${fetchingLabels.fetchingStatus}/${fetchingLabels.copy}`,
);

assert(
  'no fetching label when cached',
  shouldShowOperatorFeedFetchingReportLabel({ hasCachedReport: true, fetchState: 'fetching' }) === false,
  'no fetch label',
);

const report = [
  '# Operator Feed Final Report Button State Sync Report',
  '',
  '## Root Cause',
  '',
  '- Final report markdown existed in cache/notifications but Operator Feed buttons stayed on Fetching Report....',
  '- Global fetch flags and trace-key dedupe prevented button re-render after report delivery.',
  '',
  '## Repair',
  '',
  '- Per-run fetch state map: idle | fetching | available | failed.',
  '- `applyFounderTestFinalReport` sets available, clears fetch state, and re-renders Operator Feed card.',
  '- Label resolver checks cache before fetch state; failed fetch cannot override available.',
  '- Modal, notifications, and Operator Feed share `copyFounderTestFinalReportMarkdownShared`.',
  '',
  '## Files Changed',
  '',
  '- `src/founder-test-runtime-monitor/operator-feed-final-report-button-state-sync.ts`',
  '- `public/founder-reality/app.js`',
  '',
  '## Validation',
  '',
  ...results.map((r) => `- [${r.passed ? 'x' : ' '}] ${r.name}: ${r.detail}`),
  '',
  results.every((r) => r.passed)
    ? `\nSUCCESS: ${OPERATOR_FEED_FINAL_REPORT_BUTTON_STATE_SYNC_V1_PASS}\n`
    : '\nFAILED: operator feed final report button state sync checks did not pass.\n',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'OPERATOR_FEED_FINAL_REPORT_BUTTON_STATE_SYNC_REPORT.md'),
  report,
  'utf8',
);

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.error('Operator Feed final report button state sync validation FAILED:');
  for (const f of failed) {
    console.error(`  ✗ ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log(`Operator Feed final report button state sync validation passed (${results.length} checks).`);
console.log(OPERATOR_FEED_FINAL_REPORT_BUTTON_STATE_SYNC_V1_PASS);
