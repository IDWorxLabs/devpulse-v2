/**
 * Phase 27.05 — Intake Validation Stage Transition Repair validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  recordIntakeCompletionBoundaryOperation,
  resetChatStressCompletionPropagationForTests,
} from '../src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import {
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  completeFounderTestRuntimeStage,
  emitFounderTestRuntimeTrace,
  getFounderTestRuntimeStatus,
  resetFounderTestRuntimeMonitorForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import { resolveMissingIntakeCompletionBoundary } from '../src/founder-test-runtime-monitor/stage2-completion-tracker.js';
import {
  BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  INTAKE_VALIDATION_COMPLETE,
  INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_PASS,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  PLANNING_GATE_ENTERED,
  PLANNING_GATE_STARTED,
  assessIntakeValidationStageTransitionRepair,
  auditIntakeValidationBoundary,
  emitIntakeValidationCompleteOnce,
  hasIntakeValidationCompleteRepairEmitted,
  reconcileIntakeValidationStageTransitionOnSnapshot,
  resetIntakeValidationStageTransitionRepairModuleForTests,
  buildIntakeValidationTransitionValidationMarkdown,
} from '../src/intake-validation-stage-transition-repair/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-intake-validation-stage-transition-repair';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function minimalTraceEvent(
  operationId: string,
  status: 'RUNNING' | 'PASSED' | 'FAILED',
): import('../src/founder-test-runtime-monitor/founder-test-runtime-types.js').FounderTestRuntimeTraceEvent {
  const timestamp = new Date().toISOString();
  return {
    readOnly: true,
    traceEventId: `${operationId}-${status}`,
    operationId,
    stageId: 'INTAKE_VALIDATION',
    stageOrder: 1,
    stageLabel: 'Intake Validation',
    operationLabel: operationId,
    status,
    timestamp,
    displayTime: timestamp,
    displayLine: `${operationId} ${status}`,
  };
}

const REQUIRED = [
  'src/intake-validation-stage-transition-repair/intake-validation-stage-transition-repair-types.ts',
  'src/intake-validation-stage-transition-repair/intake-validation-stage-transition-repair-registry.ts',
  'src/intake-validation-stage-transition-repair/intake-validation-boundary-auditor.ts',
  'src/intake-validation-stage-transition-repair/intake-validation-completion-detector.ts',
  'src/intake-validation-stage-transition-repair/stage-transition-propagation-analyzer.ts',
  'src/intake-validation-stage-transition-repair/planning-gate-eligibility-analyzer.ts',
  'src/intake-validation-stage-transition-repair/intake-validation-repair-planner.ts',
  'src/intake-validation-stage-transition-repair/intake-validation-stage-transition-report-builder.ts',
  'src/intake-validation-stage-transition-repair/intake-validation-stage-transition-history.ts',
  'src/intake-validation-stage-transition-repair/intake-validation-stage-transition-repair-authority.ts',
  'src/intake-validation-stage-transition-repair/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/intake-validation-stage-transition-repair/intake-validation-stage-transition-repair-authority.ts'),
  'utf8',
);
const runtimeMonitorSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('no nested validate- in authority', !authoritySource.includes('validate-'), 'nested');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert(
  'runtime monitor wired',
  runtimeMonitorSource.includes('reconcileIntakeValidationStageTransitionOnSnapshot'),
  'missing',
);
assert(
  'package script registered',
  packageJson.includes(`validate:intake-validation-stage-transition-repair": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);

resetFounderTestRuntimeMonitorForTests();
resetChatStressCompletionPropagationForTests();
resetIntakeValidationStageTransitionRepairModuleForTests();

beginFounderTestRuntime({ runId: 'intake-stage-transition-repair-test' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });

const preChainTrace = [
  minimalTraceEvent('chat-stress-simulation-complete', 'PASSED'),
  minimalTraceEvent('product-readiness-simulation-complete', 'PASSED'),
  minimalTraceEvent(LAUNCH_READINESS_ASSESSMENT_COMPLETE, 'PASSED'),
  minimalTraceEvent(BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN, 'PASSED'),
  minimalTraceEvent(LAUNCH_READINESS_ARTIFACTS_BUILT, 'PASSED'),
];

for (const event of preChainTrace) {
  emitFounderTestRuntimeTrace(event);
}
recordIntakeCompletionBoundaryOperation(LAUNCH_READINESS_ARTIFACTS_BUILT);

const preAudit = auditIntakeValidationBoundary({
  runtimeSnapshot: getFounderTestRuntimeStatus(),
});
assert(
  '1. launch readiness artifacts built detected',
  preAudit.launchReadinessArtifactsBuilt,
  String(preAudit.launchReadinessArtifactsBuilt),
);
assert(
  '2. Rule 1 satisfied makes intake validation complete true',
  preAudit.rule1Satisfied && preAudit.intakeValidationComplete,
  preAudit.reason ?? 'ok',
);

reconcileIntakeValidationStageTransitionOnSnapshot(getFounderTestRuntimeStatus(), {
  onRuntimeTrace: ({ operationId, operationLabel, stageId, status }) => {
    emitFounderTestRuntimeTrace({ operationId, operationLabel, stageId, status });
  },
  onCompleteIntakeStage: () => {
    completeFounderTestRuntimeStage({
      stageId: 'INTAKE_VALIDATION',
      message: 'Intake Validation Passed',
    });
  },
  onAdvancePlanningGate: () => {
    advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE' });
  },
});

const snap = getFounderTestRuntimeStatus();
assert(
  '3. INTAKE_VALIDATION_COMPLETE emits once',
  snap.traceEvents.filter((event) => event.operationId === INTAKE_VALIDATION_COMPLETE && event.status === 'PASSED')
    .length === 1,
  snap.traceEvents.map((event) => event.operationId).join(', '),
);
assert(
  '4. Stage 2 becomes PASSED',
  snap.stages.find((stage) => stage.stageId === 'INTAKE_VALIDATION')?.status === 'PASSED',
  snap.stages.find((stage) => stage.stageId === 'INTAKE_VALIDATION')?.status ?? 'unknown',
);
assert(
  '5. Planning Gate becomes eligible and running',
  snap.stages.find((stage) => stage.stageId === 'PLANNING_GATE')?.status === 'RUNNING' &&
    snap.traceEvents.some((event) => event.operationId === PLANNING_GATE_ENTERED),
  snap.stages.find((stage) => stage.stageId === 'PLANNING_GATE')?.status ?? 'unknown',
);
assert(
  '6. Planning Gate starts',
  snap.traceEvents.some((event) => event.operationId === PLANNING_GATE_STARTED),
  snap.traceEvents.map((event) => event.operationId).join(', '),
);

resetIntakeValidationStageTransitionRepairModuleForTests();
emitIntakeValidationCompleteOnce({
  onRuntimeTrace: ({ operationId, operationLabel, stageId, status }) => {
    emitFounderTestRuntimeTrace({ operationId, operationLabel, stageId, status });
  },
});
const duplicateAttempt = emitIntakeValidationCompleteOnce({
  onRuntimeTrace: ({ operationId, operationLabel, stageId, status }) => {
    emitFounderTestRuntimeTrace({ operationId, operationLabel, stageId, status });
  },
});
assert(
  '7. no duplicate completion events',
  duplicateAttempt === false && hasIntakeValidationCompleteRepairEmitted(),
  String(duplicateAttempt),
);

const missingBoundary = resolveMissingIntakeCompletionBoundary(getFounderTestRuntimeStatus().traceEvents);
assert(
  '8. no silent stage transition stall remains',
  missingBoundary == null || missingBoundary === 'Planning gate entered',
  missingBoundary ?? 'none',
);

const assessment = assessIntakeValidationStageTransitionRepair({
  runtimeSnapshot: getFounderTestRuntimeStatus(),
});
assert(
  'assessment recognizes repaired chain',
  assessment.report.boundaryAudit.rule1Satisfied,
  assessment.report.repairPlan.failureClass,
);

const failed = results.filter((entry) => !entry.passed);
const passToken = failed.length === 0 ? INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_PASS : null;

const validationMarkdown = buildIntakeValidationTransitionValidationMarkdown({
  passToken,
  checks: results,
});

writeFileSync(join(ROOT, 'architecture/INTAKE_VALIDATION_STAGE_TRANSITION_REPORT.md'), validationMarkdown);
writeFileSync(join(ROOT, 'architecture/INTAKE_VALIDATION_TRANSITION_REPAIR_REPORT.md'), validationMarkdown);
writeFileSync(join(ROOT, 'architecture/INTAKE_VALIDATION_TRANSITION_VALIDATION.md'), validationMarkdown);

if (failed.length > 0) {
  console.error('Intake validation stage transition repair validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_PASS);
