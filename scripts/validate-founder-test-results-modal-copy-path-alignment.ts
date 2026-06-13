/**
 * Phase 26.66 — Founder Test Results modal copy/open path alignment validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_RESULTS_MODAL_COPY_PATH_ALIGNMENT_V1_PASS,
  FOUNDER_TEST_RESULTS_PANEL_COPY_HANDOFF_DIAGNOSTIC,
  FOUNDER_TEST_RESULTS_PANEL_COPY_RUNTIME_DIAGNOSTIC,
  resolveFounderTestResultsPanelReportActionLabels,
  shouldAvoidRuntimeFailureReportForCompleteHandoff,
  shouldUseFounderTestHandoffDiagnosticForCompleteReport,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-test-results-modal-copy-path-alignment';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'public/founder-reality/app.js',
  'public/founder-reality/index.html',
  'src/founder-test-runtime-monitor/founder-test-results-modal-copy-path-alignment.ts',
  'scripts/validate-founder-test-results-modal-copy-path-alignment.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
const alignmentSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-results-modal-copy-path-alignment.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('shared copy resolver', appJs.includes('function copyFounderTestReportHandoffShared'), 'shared copy');
assert('shared open resolver', appJs.includes('function openFounderTestReportHandoffShared'), 'shared open');
assert('shared handoff text resolver', appJs.includes('function resolveFounderTestReportHandoffText'), 'handoff text');
assert(
  'modal copy uses shared resolver',
  /function copyFounderTestReport\(\)[\s\S]*?copyFounderTestReportHandoffShared/.test(appJs),
  'modal copy',
);
assert(
  'operator feed copy uses shared resolver',
  /function copyLatestFounderTestReport\([\s\S]*?copyFounderTestReportHandoffShared/.test(appJs),
  'operator copy',
);
assert(
  'modal open uses shared resolver',
  /function openFounderTestReportModal\(\)[\s\S]*?openFounderTestReportHandoffShared/.test(appJs),
  'modal open',
);
assert(
  'results panel open uses shared resolver',
  /function openFounderTestResultsPanelReport\(\)[\s\S]*?openFounderTestReportHandoffShared/.test(appJs),
  'panel open',
);
assert('results panel open button', indexHtml.includes('id="open-founder-test-report"'), 'open button');
assert('panel label resolver', appJs.includes('resolveFounderTestResultsPanelReportActionLabels'), 'panel labels');
assert('handoff diagnostic helper', appJs.includes('shouldUseFounderTestHandoffDiagnosticForCompleteReport'), 'handoff helper');
assert('fetch failure handoff builder', appJs.includes('buildResultFetchFailureHandoffDiagnostic'), 'handoff builder');
assert('modal copy includes requested URL', appJs.includes('Requested URL:'), 'requested url');
assert('modal copy includes requested runId', appJs.includes('Requested runId:'), 'requested runId');
assert('modal copy includes runtime card runId', appJs.includes('Runtime card runId:'), 'runtime card runId');
assert('modal copy includes resolved active runId', appJs.includes('Resolved active runId:'), 'resolved runId');
assert('modal copy includes HTTP status', appJs.includes('HTTP status:'), 'http status');
assert('modal copy includes content-type', appJs.includes('Response content-type:'), 'content-type');
assert('modal copy includes parse preview', appJs.includes('Non-JSON response preview:'), 'parse preview');
assert('modal copy includes routeReached', appJs.includes('result-debug routeReached:'), 'routeReached');
assert('modal copy includes storedRunIds', appJs.includes('storedRunIds:'), 'storedRunIds');
assert('modal copy includes hasStoredResult', appJs.includes('hasStoredResult:'), 'hasStoredResult');
assert('modal copy includes hasReportMarkdown', appJs.includes('hasReportMarkdown:'), 'hasReportMarkdown');
assert('modal copy includes reportMarkdownLength', appJs.includes('reportMarkdownLength:'), 'report length');
assert(
  'complete handoff avoids runtime failure report',
  /isFounderTestCompleteSuccessState\(activeRuntime\.state\)[\s\S]*?shouldUseFounderTestHandoffDiagnosticForCompleteReport/.test(
    appJs,
  ),
  'complete guard',
);
assert(
  'copyFounderTestReport does not call buildRuntimeFailureReportText',
  !/function copyFounderTestReport\(\)[\s\S]*?buildRuntimeFailureReportText/.test(appJs),
  'no runtime failure in modal copy',
);
assert('handoff diagnostic button label', appJs.includes('Copy Handoff Diagnostic'), 'handoff label');
assert('runtime diagnostic button label', appJs.includes('Copy Runtime Diagnostic'), 'runtime label');
assert('alignment module token', alignmentSource.includes(FOUNDER_TEST_RESULTS_MODAL_COPY_PATH_ALIGNMENT_V1_PASS), 'token');
assert('no scoring edits', !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !appJs.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(
    `validate:founder-test-results-modal-copy-path-alignment": "tsx scripts/${VALIDATOR_BASENAME}.ts"`,
  ),
  'script',
);

assert(
  'handoff diagnostic when stalled',
  shouldUseFounderTestHandoffDiagnosticForCompleteReport({
    handoffStalled: true,
    fetchFailed: false,
    hasFetchDiagnostic: false,
    hasDebugSnapshot: false,
  }),
  'stalled',
);

assert(
  'avoid runtime failure for complete handoff',
  shouldAvoidRuntimeFailureReportForCompleteHandoff({
    runtimeState: 'COMPLETE',
    handoffStalled: true,
    fetchFailed: false,
    hasFetchDiagnostic: false,
  }),
  'avoid runtime failure',
);

assert(
  'panel handoff label when stalled',
  resolveFounderTestResultsPanelReportActionLabels({
    isComplete: true,
    hasCachedReport: false,
    fetchState: 'failed',
    handoffStalled: true,
  }).copy === FOUNDER_TEST_RESULTS_PANEL_COPY_HANDOFF_DIAGNOSTIC,
  'handoff label',
);

assert(
  'panel runtime diagnostic label',
  resolveFounderTestResultsPanelReportActionLabels({
    isComplete: false,
    hasCachedReport: false,
    fetchState: 'idle',
    payloadSource: 'runtime-diagnostic',
  }).copy === FOUNDER_TEST_RESULTS_PANEL_COPY_RUNTIME_DIAGNOSTIC,
  'runtime label',
);

const report = [
  '# Founder Test Results Modal Copy Path Alignment Report',
  '',
  '## Root Cause',
  '',
  '- Founder Test Results panel copy used a modal-only path that could fall back to generic Runtime Failure Report text.',
  '- Operator Feed already used the shared handoff resolver with Phase 26.64 fetch/debug diagnostics.',
  '',
  '## Repair',
  '',
  '- `copyFounderTestReportHandoffShared` and `openFounderTestReportHandoffShared` unify modal, Operator Feed, and notifications copy/open.',
  '- Results panel labels use `resolveFounderTestResultsPanelReportActionLabels` (Final Report / Handoff Diagnostic / Runtime Diagnostic).',
  '- COMPLETE handoff stalls route through `buildResultFetchFailureHandoffDiagnostic` instead of `buildRuntimeFailureReportText`.',
  '',
  '## Validation',
  '',
  ...results.map((r) => `- [${r.passed ? 'x' : ' '}] ${r.name}: ${r.detail}`),
  '',
  results.every((r) => r.passed)
    ? `\nSUCCESS: ${FOUNDER_TEST_RESULTS_MODAL_COPY_PATH_ALIGNMENT_V1_PASS}\n`
    : '\nFAILED: founder test results modal copy path alignment checks did not pass.\n',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'FOUNDER_TEST_RESULTS_MODAL_COPY_PATH_ALIGNMENT_REPORT.md'),
  report,
  'utf8',
);

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.error('Founder Test Results modal copy path alignment validation FAILED:');
  for (const f of failed) {
    console.error(`  ✗ ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log(`Founder Test Results modal copy path alignment validation passed (${results.length} checks).`);
console.log(FOUNDER_TEST_RESULTS_MODAL_COPY_PATH_ALIGNMENT_V1_PASS);
