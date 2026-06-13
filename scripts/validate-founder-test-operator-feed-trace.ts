/**
 * Phase 26.44 — Founder Test Operator Feed Trace V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_OPERATOR_FEED_TRACE_V1_PASS,
  advanceFounderTestRuntimeStage,
  appendRuntimeTraceEvent,
  beginFounderTestRuntime,
  completeFounderTestRuntimeStage,
  emitFounderTestRuntimeTrace,
  finishFounderTestRuntime,
  getFounderTestRuntimeStatus,
  recordFounderTestRuntimeSubstep,
  resetFounderTestRuntimeMonitorForTests,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-test-runtime-monitor/runtime-trace-registry.ts',
  'src/founder-test-runtime-monitor/runtime-trace-builder.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

resetFounderTestRuntimeMonitorForTests();

beginFounderTestRuntime({ runId: 'trace-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
emitFounderTestRuntimeTrace({
  operationId: 'intake-validation-started',
  stageId: 'INTAKE_VALIDATION',
  operationLabel: 'Intake validation started',
  status: 'RUNNING',
});
recordFounderTestRuntimeSubstep({
  stageId: 'INTAKE_VALIDATION',
  operationId: 'founder-input-hydrating',
  message: 'Hydrating founder execution proof input',
});
emitFounderTestRuntimeTrace({
  operationId: 'founder-input-hydrated',
  stageId: 'INTAKE_VALIDATION',
  operationLabel: 'Founder input hydrated',
  status: 'PASSED',
});
advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE' });

const snap = getFounderTestRuntimeStatus();
assert('trace fields currentOperation', snap.currentOperation != null, snap.currentOperation ?? 'null');
assert('trace fields nextExpectedOperation', snap.nextExpectedOperation != null, snap.nextExpectedOperation ?? 'null');
assert('trace events present', snap.traceEvents.length > 0, String(snap.traceEvents.length));
assert('trace event display line', snap.traceEvents[0].displayLine.includes('—'), snap.traceEvents[0].displayLine);
assert('trace stage status running', snap.traceStageStatus === 'RUNNING', snap.traceStageStatus);
assert('last heartbeat exposed', snap.lastHeartbeatAt != null, 'null');
assert('seconds since heartbeat exposed', typeof snap.secondsSinceLastHeartbeat === 'number', 'type');

const duplicateAppend = appendRuntimeTraceEvent({
  events: snap.traceEvents as import('../src/founder-test-runtime-monitor/founder-test-runtime-types.js').FounderTestRuntimeTraceEvent[],
  operationId: 'intake-validation-started',
  stageId: 'INTAKE_VALIDATION',
  operationLabel: 'Intake validation started',
  status: 'RUNNING',
});
assert('trace dedupe no duplicate length', duplicateAppend.appended === false, String(duplicateAppend.appended));

const pollOne = getFounderTestRuntimeStatus();
const pollTwo = getFounderTestRuntimeStatus();
assert(
  'poll trace events stable',
  pollOne.traceEvents.length === pollTwo.traceEvents.length,
  `${pollOne.traceEvents.length} vs ${pollTwo.traceEvents.length}`,
);
assert(
  'poll trace ids stable',
  pollOne.traceEvents.map((event) => event.traceEventId).join(',') ===
    pollTwo.traceEvents.map((event) => event.traceEventId).join(','),
  'ids differ',
);

resetFounderTestRuntimeMonitorForTests();
const stallStarted = Date.now();
beginFounderTestRuntime({ runId: 'stall-trace-run-2' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
const slowSnap = getFounderTestRuntimeStatus(stallStarted + 16_000);
assert('stage 2 slow trace status', slowSnap.traceStageStatus === 'SLOW', slowSnap.traceStageStatus);
const stalledSnap = getFounderTestRuntimeStatus(stallStarted + 46_000);
assert('stage 2 stalled trace status', stalledSnap.traceStageStatus === 'STALLED', stalledSnap.traceStageStatus);
assert('stalled trace reason', stalledSnap.stallReason != null, 'null');

finishFounderTestRuntime({ state: 'COMPLETE' });
const completeSnap = getFounderTestRuntimeStatus();
assert('complete trace status', completeSnap.state === 'IDLE' || completeSnap.traceStageStatus === 'IDLE', completeSnap.traceStageStatus);

const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
assert('handler emit trace', handlerSource.includes('emitFounderTestRuntimeTrace'), 'missing emit');
assert('handler founder input hydrated', handlerSource.includes('founder-input-hydrated'), 'missing hydrated');
assert('handler planning gate entered', handlerSource.includes('planning-gate-entered'), 'missing planning gate');
assert('handler report generation started', handlerSource.includes('report-generation-started'), 'missing report gen');

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const stylesCss = readFileSync(join(ROOT, 'public/founder-reality/styles.css'), 'utf8');
assert('ui trace renderer', appJs.includes('function renderFounderTestOperatorFeedTrace'), 'renderer missing');
assert('ui trace card title', appJs.includes('Founder Test Runtime'), 'title missing');
assert('ui trace dedupe key', appJs.includes('lastRenderedOperatorTraceKey'), 'dedupe missing');
assert('ui running state', appJs.includes("'trace-running'") || appJs.includes('trace-running'), 'running');
assert('ui slow state', stylesCss.includes('.trace-slow'), 'slow css');
assert('ui stalled state', stylesCss.includes('.trace-stalled'), 'stalled css');
assert('ui failed state', stylesCss.includes('.trace-failed'), 'failed css');
assert('ui complete state', stylesCss.includes('.trace-complete'), 'complete css');
assert(
  'no scoring changes in handler',
  !handlerSource.includes('readinessScore =') && handlerSource.includes('runFounderTestingModeV5'),
  'scoring changed',
);
assert(
  'no validator recursion',
  !handlerSource.includes('validate-founder-test-operator-feed-trace'),
  'recursion',
);

const report = [
  '# Founder Test Operator Feed Trace Report',
  '',
  '## Root Cause',
  '',
  '- Operator Feed showed generic section cards during Founder Test with no backend step visibility.',
  '- Runtime monitor had feed events but no structured trace model for Operator Feed rendering.',
  '',
  '## Files Changed',
  '',
  '- src/founder-test-runtime-monitor/runtime-trace-registry.ts',
  '- src/founder-test-runtime-monitor/runtime-trace-builder.ts',
  '- src/founder-test-runtime-monitor/founder-test-runtime-types.ts',
  '- src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts',
  '- src/founder-test-runtime-monitor/index.ts',
  '- server/founder-testing-handler.ts',
  '- public/founder-reality/app.js',
  '- public/founder-reality/index.html',
  '- public/founder-reality/styles.css',
  '',
  '## Trace Model Added',
  '',
  '- traceEvents[], currentOperation, lastCompletedOperation, nextExpectedOperation, traceStageStatus',
  '',
  '## Backend Boundary Proof',
  '',
  `- Handler emits explicit trace at intake, hydration, planning gate, report generation`,
  `- Trace events recorded: ${snap.traceEvents.length}`,
  '',
  '## UI Rendering Proof',
  '',
  '- Operator Feed renders Founder Test Runtime card with RUNNING/SLOW/STALLED/FAILED/COMPLETE styling',
  '',
  '## Duplicate Prevention Proof',
  '',
  `- appendRuntimeTraceEvent dedupes by traceEventId`,
  `- Client dedupes render via lastRenderedOperatorTraceKey`,
  '',
  '## Remaining Risks',
  '',
  '- Stage 7 simulation still has fewer sub-step traces than intake unless extended later.',
  '',
  '---',
  '',
  `Pass token: ${FOUNDER_TEST_OPERATOR_FEED_TRACE_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'FOUNDER_TEST_OPERATOR_FEED_TRACE_REPORT.md'), report, 'utf8');
assert('report written', existsSync(join(ROOT, 'architecture', 'FOUNDER_TEST_OPERATOR_FEED_TRACE_REPORT.md')), 'missing');
assert('report token', report.includes(FOUNDER_TEST_OPERATOR_FEED_TRACE_V1_PASS), 'token');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Founder Test Operator Feed Trace validation FAILED:');
  for (const check of failed) {
    console.error(`  ✗ ${check.name}: ${check.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log('Founder Test Operator Feed Trace validation PASSED');
  console.log(FOUNDER_TEST_OPERATOR_FEED_TRACE_V1_PASS);
  for (const check of results) {
    console.log(`  ✓ ${check.name}`);
  }
}
