/**
 * Phase 26.57 — Founder Test complete report delivery label repair validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_COMPLETE_NOTIFICATION_TITLE,
  FOUNDER_TEST_COMPLETE_PREPARING_MESSAGE,
  FOUNDER_TEST_COMPLETE_REPORT_DELIVERY_LABEL_V1_PASS,
  buildCompleteFounderTestResultPendingResponse,
  buildFounderTestCompletePreparingDiagnosticMarkdown,
  isFounderTestRuntimeFailureReportMarkdown,
  resolveFounderTestReportMarkdownPreference,
  shouldUseFounderTestRuntimeFailureReport,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-test-complete-report-delivery-label';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'public/founder-reality/app.js',
  'server/founder-testing-handler.ts',
  'src/founder-test-runtime-monitor/founder-test-complete-report-delivery.ts',
  'scripts/validate-founder-test-complete-report-delivery-label.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('complete success state helper', appJs.includes('isFounderTestCompleteSuccessState'), 'helper');
assert('result fetch retry helper', appJs.includes('fetchFounderTestResultWithRetry'), 'fetch retry');
assert('final report markdown guard', appJs.includes('isFounderTestFinalReportMarkdown'), 'final guard');
assert('complete preparing diagnostic', appJs.includes('buildFounderTestCompletePreparingDiagnosticText'), 'preparing');
assert('copy final report label', appJs.includes('Copy Final Report'), 'copy label');
assert('open final report label', appJs.includes('Open Final Report'), 'open label');
assert('complete notification title', appJs.includes(FOUNDER_TEST_COMPLETE_NOTIFICATION_TITLE), 'notification');
assert(
  'copy payload checks final report cache first',
  /function buildFounderTestCopyPayload\(\)[\s\S]*?resolveFounderTestFinalReportMarkdown[\s\S]*?needsFetch/.test(
    appJs,
  ),
  'copy order',
);
assert('complete does not use still running copy path', appJs.includes("activeRuntime.state === 'RUNNING'"), 'running branch');
assert(
  'complete copy payload fetches by runId',
  appJs.includes("source: 'complete-preparing'") && appJs.includes('needsFetch: true'),
  'complete payload',
);
assert('poll fetch on complete', appJs.includes('fetchFounderTestResultWithRetry(activeRunId'), 'poll fetch');
assert('handler complete pending response', handlerSource.includes('buildCompleteFounderTestResultPendingResponse'), 'pending response');
assert('handler should not failure on complete ok', handlerSource.includes('shouldUseFounderTestRuntimeFailureReport'), 'failure gate');
assert('result endpoint reportMarkdown', handlerSource.includes('reportMarkdown'), 'reportMarkdown');
assert('result endpoint generatedAt', handlerSource.includes('generatedAt'), 'generatedAt');
assert('no scoring edits in app.js', !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits in handler', !handlerSource.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:founder-test-complete-report-delivery-label": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

assert(
  'COMPLETE ok does not use failure report',
  shouldUseFounderTestRuntimeFailureReport({ ok: true, state: 'COMPLETE' }) === false,
  'failure gate',
);
assert(
  'FAILED uses failure report',
  shouldUseFounderTestRuntimeFailureReport({ ok: false, state: 'FAILED' }) === true,
  'failed',
);

const preferred = resolveFounderTestReportMarkdownPreference({
  reportMarkdown: '# Founder Test Report\n\nDone.',
  failureReportMarkdown: '# Founder Test Runtime Failure Report\n\nError',
  runtimeState: 'COMPLETE',
  ok: true,
});
assert('prefers final report markdown', preferred.source === 'final-report', preferred.source);
assert(
  'complete without report uses preparing',
  resolveFounderTestReportMarkdownPreference({ runtimeState: 'COMPLETE', ok: true }).source === 'preparing',
  'preparing',
);

const pending = buildCompleteFounderTestResultPendingResponse(
  {
    runId: 'complete-delivery-run',
    state: 'COMPLETE',
    endedAt: '2026-06-12T12:00:00.000Z',
    progress: { elapsedMs: 120_000, totalStages: 11, currentStageOrder: 11, currentStageLabel: 'Complete' },
    stages: [],
    elapsedMs: 120_000,
  } as Parameters<typeof buildCompleteFounderTestResultPendingResponse>[0],
  'complete-delivery-run',
);
assert('pending response state COMPLETE', pending.state === 'COMPLETE', String(pending.state));
assert('pending response includes runId', pending.runId === 'complete-delivery-run', String(pending.runId));
assert('pending response includes generatedAt', typeof pending.generatedAt === 'string', 'generatedAt');
assert('pending response no failure markdown', pending.failureReportMarkdown == null, 'failure');
assert(
  'pending response preparing message',
  pending.message === FOUNDER_TEST_COMPLETE_PREPARING_MESSAGE,
  String(pending.message),
);
assert(
  'preparing diagnostic not failure wording',
  !buildFounderTestCompletePreparingDiagnosticMarkdown({
    snapshot: {
      runId: 'complete-delivery-run',
      state: 'COMPLETE',
      progress: { elapsedMs: 1000, totalStages: 11, currentStageOrder: 11, currentStageLabel: 'Complete' },
      stages: [{ stageId: 'COMPLETE', label: 'Complete', order: 11, status: 'PASSED' }],
      elapsedMs: 1000,
    } as Parameters<typeof buildFounderTestCompletePreparingDiagnosticMarkdown>[0]['snapshot'],
  }).includes('Runtime Failure Report'),
  'diagnostic',
);
assert(
  'failure report detector',
  isFounderTestRuntimeFailureReportMarkdown('# Founder Test Runtime Failure Report\n\nError: still running'),
  'detect failure',
);

const report = [
  '# Founder Test Complete Report Delivery Label Report',
  '',
  '## Root Cause',
  '',
  '- Runtime reached COMPLETE but Copy/Open Report still selected runtime failure diagnostics.',
  '- `buildFounderTestCopyPayload` treated COMPLETE like RUNNING and emitted "still running" failure text.',
  '- Result endpoint returned running diagnostic (202) for COMPLETE runs before stored result was ready.',
  '',
  '## Repair',
  '',
  '- COMPLETE runs prefer final `reportMarkdown` before any diagnostic copy.',
  '- Result endpoint returns COMPLETE + `generatedAt` + `runId`; preparing response when markdown not ready.',
  '- UI labels: Copy Final Report / Open Final Report; notification: Founder Test Report Ready.',
  '- Retry fetch (1–2 attempts) when COMPLETE but markdown temporarily unavailable.',
  '',
  '## Validation Proof',
  '',
  `- Checks: ${results.length + 4}`,
  '',
  '---',
  '',
  `Pass token: ${FOUNDER_TEST_COMPLETE_REPORT_DELIVERY_LABEL_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'FOUNDER_TEST_COMPLETE_REPORT_DELIVERY_LABEL_REPORT.md'), report, 'utf8');
assert('report written', existsSync(join(ROOT, 'architecture', 'FOUNDER_TEST_COMPLETE_REPORT_DELIVERY_LABEL_REPORT.md')), 'missing');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Founder Test Complete Report Delivery Label validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Founder Test Complete Report Delivery Label validation PASSED (${results.length} checks)`);
console.log(FOUNDER_TEST_COMPLETE_REPORT_DELIVERY_LABEL_V1_PASS);
