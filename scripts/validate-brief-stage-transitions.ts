/**
 * Brief stage transitions validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ARCHITECTURE_BRIEF_PASSED_OPERATION_ID,
  BRIEF_STAGE_TRANSITIONS_PASS,
  BUILD_PLAN_PASSED_OPERATION_ID,
  PLANNING_BRIEF_PASSED_MESSAGE,
  PLANNING_BRIEF_PASSED_OPERATION_ID,
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  completeFounderTestRuntimeStage,
  getFounderTestRuntimeStatus,
  markFounderTestHandlerAlive,
  reconcileBriefStageTransitionsOnSnapshot,
  resetFounderTestRuntimeMonitorForTests,
  shouldAutoCompleteBriefStage,
  BRIEF_STAGE_TRANSITIONS,
} from '../src/founder-test-runtime-monitor/index.js';
import { recordIntakeCompletionBoundaryOperation } from '../src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import {
  BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  INTAKE_VALIDATION_COMPLETE,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
} from '../src/intake-validation-stage-transition-repair/intake-validation-stage-transition-repair-registry.js';
import type {
  FounderTestRuntimeStageRecord,
  FounderTestRuntimeTraceEvent,
} from '../src/founder-test-runtime-monitor/founder-test-runtime-types.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-brief-stage-transitions';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-test-runtime-monitor/brief-stage-transitions.ts',
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
  join(ROOT, 'src/founder-test-runtime-monitor/brief-stage-transitions.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert(
  'runtime monitor wires brief stage transitions',
  monitorSource.includes('reconcileBriefStageTransitionsOnSnapshot'),
  'missing wire',
);
assert(
  'no new authority module added',
  !existsSync(join(ROOT, 'src/brief-stage-transitions-authority')),
  'unexpected authority',
);
assert(
  'package script registered',
  packageJson.includes(`validate:brief-stage-transitions": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);
assert(
  'pass token defined',
  transitionSource.includes(BRIEF_STAGE_TRANSITIONS_PASS),
  'missing token',
);

function buildPlanningBriefRunningStages(): FounderTestRuntimeStageRecord[] {
  return [
    { readOnly: true, stageId: 'FOUNDER_TEST_STARTED', label: 'Started', order: 1, status: 'PASSED', startedAt: null, endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
    { readOnly: true, stageId: 'INTAKE_VALIDATION', label: 'Intake Validation', order: 2, status: 'PASSED', startedAt: null, endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
    { readOnly: true, stageId: 'PLANNING_GATE', label: 'Planning Gate', order: 3, status: 'PASSED', startedAt: null, endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
    { readOnly: true, stageId: 'PLANNING_BRIEF', label: 'Planning Brief', order: 4, status: 'RUNNING', startedAt: new Date().toISOString(), endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
    { readOnly: true, stageId: 'ARCHITECTURE_BRIEF', label: 'Architecture Brief', order: 5, status: 'PENDING', startedAt: null, endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
    { readOnly: true, stageId: 'BUILD_PLAN', label: 'Build Plan', order: 6, status: 'PENDING', startedAt: null, endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
    { readOnly: true, stageId: 'FOUNDER_SIMULATION_ENGINE', label: 'Founder Simulation Engine', order: 7, status: 'PENDING', startedAt: null, endedAt: null, lastHeartbeatAt: null, durationMs: 0 },
  ];
}

function buildPlanningBriefTrace(): FounderTestRuntimeTraceEvent[] {
  const timestamp = new Date().toISOString();
  return [
    {
      readOnly: true,
      traceEventId: 'planning-brief-started',
      operationId: 'planning-brief-started',
      stageId: 'PLANNING_BRIEF',
      stageOrder: 4,
      stageLabel: 'Planning Brief',
      operationLabel: 'Planning Brief running',
      status: 'RUNNING',
      timestamp,
      displayTime: timestamp,
      displayLine: 'planning-brief-started RUNNING',
    },
  ];
}

const planningBriefTransition = BRIEF_STAGE_TRANSITIONS[0]!;

assert(
  '1. planning brief auto-complete when gate passed and brief running',
  shouldAutoCompleteBriefStage(
    {
      state: 'RUNNING',
      stages: buildPlanningBriefRunningStages(),
      traceEvents: buildPlanningBriefTrace(),
      activeArtifactBuildSubstep: null,
      missingCompletionBoundary: null,
      handlerAlive: true,
    },
    planningBriefTransition,
  ),
  'not eligible',
);

assert(
  '2. blocked when handler not alive',
  !shouldAutoCompleteBriefStage(
    {
      state: 'RUNNING',
      stages: buildPlanningBriefRunningStages(),
      traceEvents: buildPlanningBriefTrace(),
      activeArtifactBuildSubstep: null,
      missingCompletionBoundary: null,
      handlerAlive: false,
    },
    planningBriefTransition,
  ),
  'unexpected eligible',
);

assert(
  '3. blocked when planning brief already passed trace exists',
  !shouldAutoCompleteBriefStage(
    {
      state: 'RUNNING',
      stages: buildPlanningBriefRunningStages(),
      traceEvents: [
        ...buildPlanningBriefTrace(),
        {
          readOnly: true,
          traceEventId: PLANNING_BRIEF_PASSED_OPERATION_ID,
          operationId: PLANNING_BRIEF_PASSED_OPERATION_ID,
          stageId: 'PLANNING_BRIEF',
          stageOrder: 4,
          stageLabel: 'Planning Brief',
          operationLabel: PLANNING_BRIEF_PASSED_MESSAGE,
          status: 'PASSED',
          timestamp: new Date().toISOString(),
          displayTime: new Date().toISOString(),
          displayLine: 'planning-brief-passed PASSED',
        },
      ],
      activeArtifactBuildSubstep: null,
      missingCompletionBoundary: null,
      handlerAlive: true,
    },
    planningBriefTransition,
  ),
  'unexpected eligible',
);

let completeCount = 0;
let advanceCount = 0;
const reconciled = reconcileBriefStageTransitionsOnSnapshot({
  getSnapshot: () => ({
    state: 'RUNNING',
    stages: buildPlanningBriefRunningStages(),
    traceEvents: buildPlanningBriefTrace(),
    activeArtifactBuildSubstep: null,
    missingCompletionBoundary: null,
    handlerAlive: true,
  }),
  handlers: {
    onCompleteStage: () => {
      completeCount += 1;
    },
    onAdvanceStage: () => {
      advanceCount += 1;
    },
  },
});

assert('4. reconcile invokes planning brief handlers once', reconciled && completeCount === 1 && advanceCount === 1, `${completeCount}/${advanceCount}`);

resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'brief-stage-transition-live' });
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
completeFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION', message: 'Intake Validation Passed' });
completeFounderTestRuntimeStage({ stageId: 'PLANNING_GATE', message: 'Planning Gate Passed' });
advanceFounderTestRuntimeStage({ stageId: 'PLANNING_BRIEF' });
markFounderTestHandlerAlive();

const settledSnap = getFounderTestRuntimeStatus();
assert(
  '5. live snapshot auto-completes planning brief',
  settledSnap.stages.find((stage) => stage.stageId === 'PLANNING_BRIEF')?.status === 'PASSED' &&
    settledSnap.stages.find((stage) => stage.stageId === 'ARCHITECTURE_BRIEF')?.status !== 'PENDING' &&
    settledSnap.traceEvents.some((event) => event.operationId === PLANNING_BRIEF_PASSED_OPERATION_ID),
  [
    settledSnap.stages.find((stage) => stage.stageId === 'PLANNING_BRIEF')?.status,
    settledSnap.stages.find((stage) => stage.stageId === 'ARCHITECTURE_BRIEF')?.status,
  ].join(', '),
);

const architectureSnap = getFounderTestRuntimeStatus();
assert(
  '6. live snapshot auto-completes architecture brief',
  architectureSnap.stages.find((stage) => stage.stageId === 'ARCHITECTURE_BRIEF')?.status === 'PASSED' &&
    architectureSnap.stages.find((stage) => stage.stageId === 'BUILD_PLAN')?.status !== 'PENDING' &&
    architectureSnap.traceEvents.some((event) => event.operationId === ARCHITECTURE_BRIEF_PASSED_OPERATION_ID),
  [
    architectureSnap.stages.find((stage) => stage.stageId === 'ARCHITECTURE_BRIEF')?.status,
    architectureSnap.stages.find((stage) => stage.stageId === 'BUILD_PLAN')?.status,
  ].join(', '),
);

const buildPlanSnap = getFounderTestRuntimeStatus();
assert(
  '7. live snapshot auto-completes build plan and starts founder simulation',
  buildPlanSnap.stages.find((stage) => stage.stageId === 'BUILD_PLAN')?.status === 'PASSED' &&
    buildPlanSnap.stages.find((stage) => stage.stageId === 'FOUNDER_SIMULATION_ENGINE')?.status === 'RUNNING' &&
    buildPlanSnap.traceEvents.some((event) => event.operationId === BUILD_PLAN_PASSED_OPERATION_ID),
  [
    buildPlanSnap.stages.find((stage) => stage.stageId === 'BUILD_PLAN')?.status,
    buildPlanSnap.stages.find((stage) => stage.stageId === 'FOUNDER_SIMULATION_ENGINE')?.status,
  ].join(', '),
);

assert(
  '8. planning brief passed trace emitted exactly once',
  buildPlanSnap.traceEvents.filter((event) => event.operationId === PLANNING_BRIEF_PASSED_OPERATION_ID).length === 1,
  String(buildPlanSnap.traceEvents.filter((event) => event.operationId === PLANNING_BRIEF_PASSED_OPERATION_ID).length),
);

const duplicateSnap = getFounderTestRuntimeStatus();
assert(
  '9. second snapshot does not re-emit brief passed traces',
  duplicateSnap.traceEvents.filter((event) => event.operationId === PLANNING_BRIEF_PASSED_OPERATION_ID).length === 1 &&
    duplicateSnap.traceEvents.filter((event) => event.operationId === ARCHITECTURE_BRIEF_PASSED_OPERATION_ID).length === 1 &&
    duplicateSnap.traceEvents.filter((event) => event.operationId === BUILD_PLAN_PASSED_OPERATION_ID).length === 1,
  'duplicate trace detected',
);

completeFounderTestRuntimeStage({ stageId: 'PLANNING_BRIEF', message: PLANNING_BRIEF_PASSED_MESSAGE });
const handlerCatchUpSnap = getFounderTestRuntimeStatus();
assert(
  '10. handler duplicate complete does not re-emit planning brief passed',
  handlerCatchUpSnap.traceEvents.filter((event) => event.operationId === PLANNING_BRIEF_PASSED_OPERATION_ID).length === 1,
  String(handlerCatchUpSnap.traceEvents.filter((event) => event.operationId === PLANNING_BRIEF_PASSED_OPERATION_ID).length),
);

assert(
  '11. composeSnapshot runs brief transitions before stall analysis',
  monitorSource.indexOf('reconcileBriefStageTransitionsOnSnapshot') <
    monitorSource.indexOf('const stallAnalysis = analyzeRuntimeStall'),
  'ordering',
);

const failed = results.filter((entry) => !entry.passed);
const passToken = failed.length === 0 ? BRIEF_STAGE_TRANSITIONS_PASS : null;

writeFileSync(
  join(ROOT, 'architecture/BRIEF_STAGE_TRANSITIONS_VALIDATION.md'),
  [
    '# Brief Stage Transitions Validation',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Pass token: ${passToken ?? 'NONE'}`,
    '',
    '## Checks',
    '',
    ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] **${entry.name}** — ${entry.detail}`),
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error('Brief stage transitions validation failed:');
  for (const entry of failed) {
    console.error(`- ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(passToken);
