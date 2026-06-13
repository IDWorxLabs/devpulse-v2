/**
 * Phase 26.67 — Remove legacy Failed to fetch copy fallback validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REMOVE_LEGACY_FAILED_TO_FETCH_COPY_FALLBACK_V1_PASS,
  FOUNDER_TEST_HANDOFF_DIAGNOSTIC_HEADING,
  FOUNDER_TEST_RUNTIME_FAILURE_REPORT_HEADING,
  completeCopyMustIncludeHandoffDiagnosticFields,
  completeCopyMustNotIncludeGenericFailedToFetch,
  isGenericFailedToFetchMessage,
  shouldBlockRuntimeFailureReportForCompleteRun,
  shouldUseCompleteHandoffDiagnosticCopy,
} from '../src/founder-test-runtime-monitor/index.js';
import { buildResultFetchFailureDiagnosticLines } from '../src/founder-test-runtime-monitor/result-fetch-failure-diagnostic-surface.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-remove-legacy-failed-to-fetch-copy-fallback';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'public/founder-reality/app.js',
  'src/founder-test-runtime-monitor/remove-legacy-failed-to-fetch-copy-fallback.ts',
  'scripts/validate-remove-legacy-failed-to-fetch-copy-fallback.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const fallbackSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/remove-legacy-failed-to-fetch-copy-fallback.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('complete handoff builder', appJs.includes('function buildCompleteFounderTestHandoffDiagnostic'), 'builder');
assert('generic fetch detector', appJs.includes('function isGenericFailedToFetchMessage'), 'fetch detector');
assert(
  'runtime failure guard for COMPLETE',
  /function buildRuntimeFailureReportText\([\s\S]*?isFounderTestCompleteSuccessState\(snapshot\.state\)/.test(appJs),
  'runtime guard',
);
assert(
  'copy payload guards COMPLETE snapshot fallthrough',
  /lastFounderTestRuntimeSnapshot[\s\S]*?isFounderTestCompleteSuccessState\(lastFounderTestRuntimeSnapshot\.state\)/.test(
    appJs,
  ),
  'payload fallthrough',
);
assert(
  'complete fallback uses handoff diagnostic',
  /function resolveFounderTestCompleteReportFallbackText\([\s\S]*?buildCompleteFounderTestHandoffDiagnostic/.test(
    appJs,
  ),
  'complete fallback',
);
assert(
  'report delivery COMPLETE handoff branch',
  /function resolveFounderTestReportDelivery\([\s\S]*?buildCompleteFounderTestHandoffDiagnostic/.test(appJs),
  'delivery branch',
);
assert(
  'showFounderTestError COMPLETE branch',
  /function showFounderTestError\([\s\S]*?isFounderTestCompleteSuccessState\(runtime\.state\)/.test(appJs),
  'error branch',
);
assert(
  'notification copy uses handoff resolver for COMPLETE',
  /wireNotificationCopyButtons[\s\S]*?copyFounderTestReportHandoffShared/.test(appJs),
  'notification copy',
);
assert(
  'modal copy uses shared handoff resolver',
  /function copyFounderTestReport\(\)[\s\S]*?copyFounderTestReportHandoffShared/.test(appJs),
  'modal copy',
);
assert(
  'copy payload does not emit runtime failure for COMPLETE in primary branch',
  !/if \(activeRuntime && isFounderTestCompleteSuccessState\(activeRuntime\.state\)\)[\s\S]{0,400}buildRuntimeFailureReportText/.test(
    appJs,
  ),
  'no complete runtime failure',
);
assert('handoff heading present', appJs.includes(FOUNDER_TEST_HANDOFF_DIAGNOSTIC_HEADING), 'heading');
assert('requested URL in handoff', appJs.includes('Requested URL:'), 'url');
assert('routeReached in handoff', appJs.includes('result-debug routeReached:'), 'routeReached');
assert('storedRunIds in handoff', appJs.includes('storedRunIds:'), 'storedRunIds');
assert('hasStoredResult in handoff', appJs.includes('hasStoredResult:'), 'hasStoredResult');
assert('hasReportMarkdown in handoff', appJs.includes('hasReportMarkdown:'), 'hasReportMarkdown');
assert('reportMarkdownLength in handoff', appJs.includes('reportMarkdownLength:'), 'length');
assert('fallback module token', fallbackSource.includes(REMOVE_LEGACY_FAILED_TO_FETCH_COPY_FALLBACK_V1_PASS), 'token');
assert('no scoring edits', !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !appJs.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:remove-legacy-failed-to-fetch-copy-fallback": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

assert('detect generic failed to fetch', isGenericFailedToFetchMessage('Failed to fetch'), 'detect');
assert(
  'block runtime failure for COMPLETE',
  shouldBlockRuntimeFailureReportForCompleteRun({ runtimeState: 'COMPLETE', errorMessage: 'Failed to fetch' }),
  'block',
);
assert(
  'use handoff when fetch failed on COMPLETE',
  shouldUseCompleteHandoffDiagnosticCopy({
    runtimeState: 'COMPLETE',
    hasCachedFinalReport: false,
    fetchFailed: true,
    errorMessage: 'Failed to fetch',
  }),
  'handoff when failed',
);

const sampleHandoff = [
  FOUNDER_TEST_HANDOFF_DIAGNOSTIC_HEADING,
  '',
  '## Result Fetch',
  '',
  ...buildResultFetchFailureDiagnosticLines({
    requestedUrl: '/api/founder-test/result?runId=abc',
    requestedRunId: 'abc',
    fetchErrorMessage: 'Failed to fetch',
    httpStatus: null,
    responseContentType: null,
    jsonParseFailed: false,
    nonJsonResponsePreview: null,
  }),
  '',
  '## Result Debug Endpoint',
  '',
  '- result-debug routeReached: true',
  '- result-debug hasStoredResult: false',
  '- result-debug storedRunIds: none',
  '- result-debug hasReportMarkdown: false',
  '- result-debug reportMarkdownLength: 0',
  '',
].join('\n');

assert(
  'sample handoff includes required fields',
  completeCopyMustIncludeHandoffDiagnosticFields(sampleHandoff),
  'fields',
);
assert(
  'sample handoff excludes generic runtime failure shape',
  completeCopyMustNotIncludeGenericFailedToFetch(sampleHandoff),
  'no generic failure',
);
assert(
  'runtime failure heading distinct from handoff',
  FOUNDER_TEST_RUNTIME_FAILURE_REPORT_HEADING !== FOUNDER_TEST_HANDOFF_DIAGNOSTIC_HEADING,
  'headings',
);

const legacyFailure = [
  FOUNDER_TEST_RUNTIME_FAILURE_REPORT_HEADING,
  '',
  '## Error',
  '',
  'Failed to fetch',
  '',
].join('\n');
assert(
  'legacy failure detected as invalid complete copy',
  !completeCopyMustNotIncludeGenericFailedToFetch(legacyFailure),
  'legacy invalid',
);

const report = [
  '# Remove Legacy Failed To Fetch Copy Fallback Report',
  '',
  '## Root Cause',
  '',
  '- COMPLETE runs could still copy `# Founder Test Runtime Failure Report` with generic `Failed to fetch`.',
  '- Legacy fallthrough paths in copy payload, report delivery, notifications, and showFounderTestError bypassed Phase 26.64 diagnostics.',
  '',
  '## Repair',
  '',
  '- `buildCompleteFounderTestHandoffDiagnostic` is the single COMPLETE copy fallback with fetch/debug fields.',
  '- `buildRuntimeFailureReportText` redirects COMPLETE snapshots to handoff diagnostic output.',
  '- Modal, Operator Feed, notification, delivery, and error handlers forbid generic Failed to fetch for COMPLETE.',
  '',
  '## Validation',
  '',
  ...results.map((r) => `- [${r.passed ? 'x' : ' '}] ${r.name}: ${r.detail}`),
  '',
  results.every((r) => r.passed)
    ? `\nSUCCESS: ${REMOVE_LEGACY_FAILED_TO_FETCH_COPY_FALLBACK_V1_PASS}\n`
    : '\nFAILED: remove legacy failed-to-fetch copy fallback checks did not pass.\n',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'REMOVE_LEGACY_FAILED_TO_FETCH_COPY_FALLBACK_REPORT.md'),
  report,
  'utf8',
);

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.error('Remove legacy failed-to-fetch copy fallback validation FAILED:');
  for (const f of failed) {
    console.error(`  ✗ ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log(`Remove legacy failed-to-fetch copy fallback validation passed (${results.length} checks).`);
console.log(REMOVE_LEGACY_FAILED_TO_FETCH_COPY_FALLBACK_V1_PASS);
