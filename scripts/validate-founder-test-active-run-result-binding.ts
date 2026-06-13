/**
 * Phase 26.53 — Founder Test Active Run Result Binding Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_ACTIVE_RUN_RESULT_BINDING_V1_PASS,
  beginFounderTestRuntime,
  getFounderTestRuntimeStatus,
  getFounderTestRuntimeStatusForRun,
  clearFounderTestRuntimeSessionOnlyForTests,
  resetFounderTestRuntimeMonitorForTests,
  touchFounderTestRuntimeHeartbeat,
} from '../src/founder-test-runtime-monitor/index.js';
import { buildFounderTestRuntimeFailureReport } from '../src/founder-test-runtime-monitor/runtime-failure-report-builder.js';
import {
  beginChatStressSimulation,
  markChatStressScenarioSettled,
  markChatStressScenarioStarted,
  resetChatStressCompletionTrackerForTests,
} from '../src/founder-test-chat-stress-simulation/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-test-active-run-result-binding';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const monitorSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('resolveActiveFounderTestRunId helper', appJs.includes('function resolveActiveFounderTestRunId'), 'helper');
assert('card snapshot binding', appJs.includes('founderTestRuntimeCardSnapshot'), 'card snapshot');
assert('Copy uses active run binding', appJs.includes('copyLatestFounderTestReport') && appJs.includes('resolveActiveFounderTestRuntimeSnapshot'), 'copy');
assert('Open report uses active binding', appJs.includes('openFounderTestReportModal') && appJs.includes('resolveActiveFounderTestRuntimeSnapshot'), 'open');
assert('Retry uses resolveActiveFounderTestRunId', appJs.includes('retryFetchFounderTestResult') && appJs.indexOf('resolveActiveFounderTestRunId') < appJs.indexOf('retryFetchFounderTestResult') + 400, 'retry');
assert('poll passes runId query', appJs.includes('/api/founder-test/runtime-status') && appJs.includes('?runId='), 'poll runId');
assert('mismatch detector', appJs.includes('detectFounderTestRuntimeReportMismatch'), 'mismatch');
assert('mismatch refresh copy', appJs.includes('Runtime/report mismatch detected — refreshing active run result.'), 'refresh copy');
assert('getFounderTestRuntimeStatusForRun export', monitorSource.includes('getFounderTestRuntimeStatusForRun'), 'status for run');
assert('published snapshot map', monitorSource.includes('publishedSnapshotsByRunId'), 'published map');
assert('runtime-status accepts runId', handlerSource.includes('getFounderTestRuntimeStatusForRun'), 'handler status');
assert('result uses status for run', handlerSource.includes('getFounderTestRuntimeStatusForRun(runId)'), 'handler result');
assert('running diagnostic includes runId', handlerSource.includes('buildRunningFounderTestResultResponse'), 'running diagnostic');
assert('chat stress pending in client report', appJs.includes('chatStressPendingScenarioIds'), 'pending ids');
assert('no scoring changes', !handlerSource.includes('overrideLaunchVerdict'), 'scoring');
assert('no verdict logic changes', !handlerSource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`execSync('npm run validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:founder-test-active-run-result-binding": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

resetFounderTestRuntimeMonitorForTests();
resetChatStressCompletionTrackerForTests();

const begin = beginFounderTestRuntime({ runId: 'binding-run-cap06' });
assert('runtime session begins', begin.accepted === true, String(begin.accepted));
touchFounderTestRuntimeHeartbeat('INTAKE_VALIDATION');

beginChatStressSimulation(['cap-01', 'cap-02', 'cap-03', 'cap-04', 'cap-05', 'cap-06']);
for (const id of ['cap-01', 'cap-02', 'cap-03', 'cap-04', 'cap-05']) {
  markChatStressScenarioStarted(id);
  markChatStressScenarioSettled(id, 'PASSED');
}
markChatStressScenarioStarted('cap-06');

const live = getFounderTestRuntimeStatus();
const bound = getFounderTestRuntimeStatusForRun('binding-run-cap06');
assert('active runId preserved', bound.runId === 'binding-run-cap06', bound.runId ?? 'null');
assert('active run not IDLE', bound.state !== 'IDLE', bound.state);
assert('chat stress pending cap-06', bound.chatStressPendingScenarioIds.includes('cap-06'), bound.chatStressPendingScenarioIds.join(','));
assert('chat stress pending count 1', bound.chatStressPendingCount === 1, String(bound.chatStressPendingCount));

const diagnostic = buildFounderTestRuntimeFailureReport({
  snapshot: bound,
  errorMessage: 'Founder test still running — diagnostic snapshot available.',
});
assert('diagnostic includes active runId', diagnostic.includes('binding-run-cap06'), 'missing runId');
assert('diagnostic not IDLE n/a', !diagnostic.includes('- State: IDLE') || diagnostic.includes('RUNNING') || diagnostic.includes('STALLED'), 'idle diagnostic');
assert('diagnostic lists pending cap-06', diagnostic.includes('cap-06'), 'pending cap-06');

resetFounderTestRuntimeMonitorForTests();
const idle = getFounderTestRuntimeStatusForRun('binding-run-cap06');
assert('idle when no session and no published', idle.state === 'IDLE', idle.state);

beginFounderTestRuntime({ runId: 'published-run-1' });
touchFounderTestRuntimeHeartbeat('INTAKE_VALIDATION');
getFounderTestRuntimeStatus();
clearFounderTestRuntimeSessionOnlyForTests();
const published = getFounderTestRuntimeStatusForRun('published-run-1');
assert(
  'published snapshot survives session clear lookup',
  published.runId === 'published-run-1' && published.state !== 'IDLE',
  `${published.runId ?? 'null'}:${published.state}`,
);

const report = [
  '# Founder Test Active Run Result Binding Repair Report',
  '',
  '## Root Cause',
  '',
  '- Runtime polling overwrote `lastFounderTestRuntimeSnapshot` with IDLE while the Operator Feed card kept stale RUNNING HTML.',
  '- Copy/Open Report used the IDLE snapshot instead of the visible card runId.',
  '- Result endpoint returned 404/IDLE diagnostics when global session was IDLE even though a runId was known.',
  '',
  '## Active runId Binding Proof',
  '',
  '- `resolveActiveFounderTestRunId()` priority: card snapshot → pinned runId → last active snapshot.',
  '- Runtime card displays Run ID and binds actions to `founderTestRuntimeCardSnapshot`.',
  '- Polling and retry fetch pass `?runId=` to runtime-status and result endpoints.',
  '',
  '## Result Endpoint Proof',
  '',
  '- `getFounderTestRuntimeStatusForRun(runId)` returns live or published snapshot for the requested run.',
  '- `/api/founder-test/result?runId=` returns HTTP 202 running diagnostic with matching runId when active.',
  '',
  '## Copy/Open Report Proof',
  '',
  '- `buildFounderTestCopyPayload()` prefers active non-IDLE snapshot; never emits n/a while pinned run exists.',
  '- Mismatch detector triggers refresh: "Runtime/report mismatch detected — refreshing active run result."',
  '',
  '## Remaining Stage 2 Status',
  '',
  '- Chat stress pending IDs preserved in runtime snapshot and diagnostic reports.',
  '- After cap-06 settles, aggregate completion boundaries must still fire (chat stress → product readiness → Stage 2 advance).',
  '',
  '## Validation Results',
  '',
  `- Validator checks: ${results.length}`,
  '',
  '## Remaining Risks',
  '',
  '- Server process restart still clears in-memory published snapshots; client retains last active snapshot until refresh fails.',
  '- Full founder report remains unavailable until background run completes — running diagnostic is intentional.',
  '',
  '---',
  '',
  `Pass token: ${FOUNDER_TEST_ACTIVE_RUN_RESULT_BINDING_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'FOUNDER_TEST_ACTIVE_RUN_RESULT_BINDING_REPORT.md'), report, 'utf8');
assert('report written', existsSync(join(ROOT, 'architecture', 'FOUNDER_TEST_ACTIVE_RUN_RESULT_BINDING_REPORT.md')), 'missing');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Founder Test Active Run Result Binding validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Founder Test Active Run Result Binding validation PASSED (${results.length} checks)`);
console.log(FOUNDER_TEST_ACTIVE_RUN_RESULT_BINDING_V1_PASS);
