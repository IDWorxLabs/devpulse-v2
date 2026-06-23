/**
 * Planning Gate transition validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  recordIntakeCompletionBoundaryOperation,
  recordPlanningGateStarted,
} from '../src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import {
  PLANNING_GATE_PASSED_MESSAGE,
  PLANNING_GATE_PASSED_OPERATION_ID,
  PLANNING_GATE_TRANSITION_PASS,
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  completeFounderTestRuntimeStage,
  emitFounderTestRuntimeTrace,
  getFounderTestRuntimeStatus,
  markFounderTestHandlerAlive,
  reconcilePlanningGateTransitionOnSnapshot,
  resetFounderTestRuntimeMonitorForTests,
  shouldAutoCompletePlanningGate,
} from '../src/founder-test-runtime-monitor/index.js';
import type {
  FounderTestRuntimeStageRecord,
  FounderTestRuntimeTraceEvent,
} from '../src/founder-test-runtime-monitor/founder-test-runtime-types.js';
import {
  BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  INTAKE_VALIDATION_COMPLETE,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
} from '../src/intake-validation-stage-transition-repair/intake-validation-stage-transition-repair-registry.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-planning-gate-transition';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-test-runtime-monitor/planning-gate-transition.ts',
  'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const monitorSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts'),
  'utf8',
);
const transitionSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/planning-gate-transition.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert(
  'runtime monitor wires planning gate transition',
  monitorSource.includes('reconcilePlanningGateTransitionOnSnapshot'),
  'missing wire',
);
assert(
  'no new authority module added',
  !existsSync(join(ROOT, 'src/planning-gate-transition-authority')),
  'unexpected authority',
);
assert(
  'package script registered',
  packageJson.includes(`validate:planning-gate-transition": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);
assert(
  'pass token defined',
  transitionSource.includes(PLANNING_GATE_TRANSITION_PASS),
  'missing token',
);

function buildMockStages(): FounderTestRuntimeStageRecord[] {
  return [
    { readOnly: true, stageId: 'FOUNDER_TEST_STARTED', label: 'Started', order: 1, status: 'PASSED', startedAt: null, endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
    { readOnly: true, stageId: 'INTAKE_VALIDATION', label: 'Intake Validation', order: 2, status: 'PASSED', startedAt: null, endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
    { readOnly: true, stageId: 'PLANNING_GATE', label: 'Planning Gate', order: 3, status: 'RUNNING', startedAt: new Date().toISOString(), endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
    { readOnly: true, stageId: 'PLANNING_BRIEF', label: 'Planning Brief', order: 4, status: 'PENDING', startedAt: null, endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
  ];
}

function buildMockTrace(): FounderTestRuntimeTraceEvent[] {
  const timestamp = new Date().toISOString();
  return [
    {
      readOnly: true,
      traceEventId: 'planning-gate-entered',
      operationId: 'planning-gate-entered',
      stageId: 'PLANNING_GATE',
      stageOrder: 3,
      stageLabel: 'Planning Gate',
      operationLabel: 'Planning gate entered',
      status: 'RUNNING',
      timestamp,
      displayTime: timestamp,
      displayLine: 'planning-gate-entered RUNNING',
    },
    {
      readOnly: true,
      traceEventId: 'planning-gate-started',
      operationId: 'planning-gate-started',
      stageId: 'PLANNING_GATE',
      stageOrder: 3,
      stageLabel: 'Planning Gate',
      operationLabel: 'Planning gate started',
      status: 'PASSED',
      timestamp,
      displayTime: timestamp,
      displayLine: 'planning-gate-started PASSED',
    },
  ];
}

let completeCount = 0;
let advanceBriefCount = 0;

assert(
  '1. should auto-complete when intake passed and planning gate idle',
  shouldAutoCompletePlanningGate({
    state: 'RUNNING',
    stages: buildMockStages(),
    traceEvents: buildMockTrace(),
    activeArtifactBuildSubstep: null,
    missingCompletionBoundary: null,
    handlerAlive: true,
  }),
  'not eligible',
);

assert(
  '2. blocked when handler not alive',
  !shouldAutoCompletePlanningGate({
    state: 'RUNNING',
    stages: buildMockStages(),
    traceEvents: buildMockTrace(),
    activeArtifactBuildSubstep: null,
    missingCompletionBoundary: null,
    handlerAlive: false,
  }),
  'unexpected eligible',
);

assert(
  '3. blocked when planning gate already passed trace exists',
  !shouldAutoCompletePlanningGate({
    state: 'RUNNING',
    stages: buildMockStages(),
    traceEvents: [
      ...buildMockTrace(),
      {
        readOnly: true,
        traceEventId: 'planning-gate-passed',
        operationId: PLANNING_GATE_PASSED_OPERATION_ID,
        stageId: 'PLANNING_GATE',
        stageOrder: 3,
        stageLabel: 'Planning Gate',
        operationLabel: PLANNING_GATE_PASSED_MESSAGE,
        status: 'PASSED',
        timestamp: new Date().toISOString(),
        displayTime: new Date().toISOString(),
        displayLine: 'planning-gate-passed PASSED',
      },
    ],
    activeArtifactBuildSubstep: null,
    missingCompletionBoundary: null,
    handlerAlive: true,
  }),
  'unexpected eligible',
);

completeCount = 0;
advanceBriefCount = 0;
const reconciled = reconcilePlanningGateTransitionOnSnapshot(
  {
    state: 'RUNNING',
    stages: buildMockStages(),
    traceEvents: buildMockTrace(),
    activeArtifactBuildSubstep: null,
    missingCompletionBoundary: null,
    handlerAlive: true,
  },
  {
    onCompletePlanningGate: () => {
      completeCount += 1;
    },
    onAdvancePlanningBrief: () => {
      advanceBriefCount += 1;
    },
  },
);

assert('4. reconcile invokes handlers once', reconciled && completeCount === 1 && advanceBriefCount === 1, `${completeCount}/${advanceBriefCount}`);

resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'planning-gate-transition-live' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
for (const operationId of [
  'chat-stress-simulation-complete',
  'product-readiness-simulation-complete',
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
  BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  INTAKE_VALIDATION_COMPLETE,
  'intake-validation-complete-emitted',
]) {
  recordIntakeCompletionBoundaryOperation(operationId);
}
completeFounderTestRuntimeStage({
  stageId: 'INTAKE_VALIDATION',
  message: 'Intake Validation Passed',
});
emitFounderTestRuntimeTrace({
  operationId: 'planning-gate-entered',
  stageId: 'PLANNING_GATE',
  operationLabel: 'Planning gate entered',
  status: 'RUNNING',
});
emitFounderTestRuntimeTrace({
  operationId: 'planning-gate-started',
  stageId: 'PLANNING_GATE',
  operationLabel: 'Planning gate started',
  status: 'PASSED',
});
recordPlanningGateStarted();
advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE' });
markFounderTestHandlerAlive();

const settledSnap = getFounderTestRuntimeStatus();
assert(
  '5. live snapshot auto-completes planning gate when handler alive',
  settledSnap.stages.find((stage) => stage.stageId === 'PLANNING_GATE')?.status === 'PASSED' &&
    settledSnap.stages.find((stage) => stage.stageId === 'PLANNING_BRIEF')?.status !== 'PENDING' &&
    settledSnap.traceEvents.some((event) => event.operationId === PLANNING_GATE_PASSED_OPERATION_ID),
  [
    settledSnap.stages.find((stage) => stage.stageId === 'PLANNING_GATE')?.status,
    settledSnap.stages.find((stage) => stage.stageId === 'PLANNING_BRIEF')?.status,
  ].join(', '),
);

assert(
  '6. planning gate passed trace emitted exactly once',
  settledSnap.traceEvents.filter((event) => event.operationId === PLANNING_GATE_PASSED_OPERATION_ID)
    .length === 1,
  String(
    settledSnap.traceEvents.filter((event) => event.operationId === PLANNING_GATE_PASSED_OPERATION_ID)
      .length,
  ),
);

const duplicateSnap = getFounderTestRuntimeStatus();
assert(
  '7. second snapshot does not re-emit planning gate passed',
  duplicateSnap.traceEvents.filter((event) => event.operationId === PLANNING_GATE_PASSED_OPERATION_ID)
    .length === 1,
  String(
    duplicateSnap.traceEvents.filter((event) => event.operationId === PLANNING_GATE_PASSED_OPERATION_ID)
      .length,
  ),
);

assert(
  '8. composeSnapshot runs transition before stall analysis',
  monitorSource.indexOf('reconcilePlanningGateTransitionOnSnapshot') <
    monitorSource.indexOf('const stallAnalysis = analyzeRuntimeStall'),
  'ordering',
);

const failed = results.filter((entry) => !entry.passed);
const passToken = failed.length === 0 ? PLANNING_GATE_TRANSITION_PASS : null;

writeFileSync(
  join(ROOT, 'architecture/PLANNING_GATE_TRANSITION_VALIDATION.md'),
  [
    '# Planning Gate Transition Validation',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Pass token: ${passToken ?? 'NONE'}`,
    '',
    '## Checks',
    '',
    ...results.map(
      (entry) => `- [${entry.passed ? 'x' : ' '}] **${entry.name}** — ${entry.detail}`,
    ),
  ].join('\n'),
);

if (failed.length > 0) {
  console.error('Planning gate transition validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(PLANNING_GATE_TRANSITION_PASS);
