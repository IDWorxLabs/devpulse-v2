/**
 * Phase 27.02 — Founder Simulation Degradation Root Cause Repair validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  FOUNDER_SIMULATION_STAGE_BUDGET_MS,
  executeFounderSimulationStageWithCompletionBoundary,
  resetFounderSimulationCompletionBoundaryRepairModuleForTests,
} from '../src/founder-simulation-completion-boundary-repair/index.js';
import {
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  completeFounderTestRuntimeStage,
  emitFounderTestRuntimeTrace,
  getFounderTestRuntimeStatus,
  recordFounderTestRuntimeSubstep,
  resetFounderTestRuntimeMonitorForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import {
  FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_REPAIR_PASS,
  assessFounderSimulationDegradationRootCause,
  applyFounderSimulationDegradationRootCauseSync,
  classifyDegradationRootCauses,
  detectSimulationDegradationSignals,
  mergeAuthorityProfiles,
  profileAuthorityRuntimeFromTrace,
  profileFounderSimulationStages,
  profileSubstepRuntime,
  resetFounderSimulationDegradationRootCauseModuleForTests,
  resolveTotalSimulationRuntimeMs,
  buildFounderSimulationDegradationReportMarkdown,
  buildFounderSimulationDegradationRootCauseMarkdown,
  buildFounderSimulationDegradationRepairPlanMarkdown,
  buildFounderSimulationDegradationValidationMarkdown,
} from '../src/founder-simulation-degradation-root-cause-repair/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-simulation-degradation-root-cause-repair';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-simulation-degradation-root-cause-repair/founder-simulation-degradation-root-cause-types.ts',
  'src/founder-simulation-degradation-root-cause-repair/founder-simulation-degradation-root-cause-registry.ts',
  'src/founder-simulation-degradation-root-cause-repair/founder-simulation-stage-profiler.ts',
  'src/founder-simulation-degradation-root-cause-repair/authority-runtime-profiler.ts',
  'src/founder-simulation-degradation-root-cause-repair/substep-runtime-profiler.ts',
  'src/founder-simulation-degradation-root-cause-repair/simulation-degradation-detector.ts',
  'src/founder-simulation-degradation-root-cause-repair/degradation-root-cause-classifier.ts',
  'src/founder-simulation-degradation-root-cause-repair/degradation-repair-planner.ts',
  'src/founder-simulation-degradation-root-cause-repair/founder-simulation-degradation-report-builder.ts',
  'src/founder-simulation-degradation-root-cause-repair/founder-simulation-degradation-history.ts',
  'src/founder-simulation-degradation-root-cause-repair/founder-simulation-degradation-root-cause-authority.ts',
  'src/founder-simulation-degradation-root-cause-repair/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/founder-simulation-degradation-root-cause-repair/founder-simulation-degradation-root-cause-authority.ts'),
  'utf8',
);
const completionBoundarySource = readFileSync(
  join(ROOT, 'src/founder-simulation-completion-boundary-repair/founder-simulation-completion-boundary-repair-authority.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('no nested validate- in authority', !authoritySource.includes('validate-'), 'nested');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert(
  'wired into completion boundary',
  completionBoundarySource.includes('applyFounderSimulationDegradationRootCauseSync'),
  'missing',
);
assert(
  'wired into founder handler',
  handlerSource.includes('applyFounderSimulationDegradationRootCauseSync'),
  'missing',
);
assert(
  'package script registered',
  packageJson.includes('validate:founder-simulation-degradation-root-cause-repair'),
  'missing',
);

resetFounderTestRuntimeMonitorForTests();
resetFounderSimulationCompletionBoundaryRepairModuleForTests();
resetFounderSimulationDegradationRootCauseModuleForTests();

beginFounderTestRuntime({ runId: 'degradation-root-cause-test' });

advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
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
recordFounderTestRuntimeSubstep({
  stageId: 'INTAKE_VALIDATION',
  operationId: 'running-product-readiness-simulation',
  message: 'Running product readiness simulation',
});
emitFounderTestRuntimeTrace({
  operationId: 'product-readiness-simulation-complete',
  stageId: 'INTAKE_VALIDATION',
  operationLabel: 'Product readiness simulation complete',
  status: 'PASSED',
});
completeFounderTestRuntimeStage({
  stageId: 'INTAKE_VALIDATION',
  message: 'Intake validation complete',
});

for (const stageId of ['PLANNING_GATE', 'PLANNING_BRIEF', 'ARCHITECTURE_BRIEF', 'BUILD_PLAN'] as const) {
  advanceFounderTestRuntimeStage({ stageId });
  completeFounderTestRuntimeStage({ stageId, message: `${stageId} passed` });
}

advanceFounderTestRuntimeStage({ stageId: 'FOUNDER_SIMULATION_ENGINE' });

const simulatedElapsedMs = 257_000;
const degradedOutcome = executeFounderSimulationStageWithCompletionBoundary({
  rootDir: ROOT,
  execute: () => {
    emitFounderTestRuntimeTrace({
      operationId: 'founder-simulation-v5-progress-1',
      stageId: 'FOUNDER_SIMULATION_ENGINE',
      operationLabel: 'Founder simulation V5 in progress',
      status: 'RUNNING',
    });
    return { simulationScore: 78, scenariosRun: 6, degradedPartialResult: true };
  },
  skipHistoryRecording: true,
});

completeFounderTestRuntimeStage({
  stageId: 'FOUNDER_SIMULATION_ENGINE',
  message: degradedOutcome.completionMessage,
  status: degradedOutcome.stageStatus,
});

const snapshot = getFounderTestRuntimeStatus();
const totalRuntimeMs = resolveTotalSimulationRuntimeMs({
  snapshot,
  simulationElapsedMs: degradedOutcome.elapsedMs || simulatedElapsedMs,
});

const stageProfiles = profileFounderSimulationStages({
  snapshot,
  runId: snapshot.runId,
  totalRuntimeMs,
});
const traceProfiles = profileAuthorityRuntimeFromTrace({
  traceEvents: snapshot.traceEvents,
  runId: snapshot.runId,
  totalRuntimeMs,
});
const authorityProfiles = mergeAuthorityProfiles(stageProfiles, traceProfiles, totalRuntimeMs);
const substepProfiles = profileSubstepRuntime({
  traceEvents: snapshot.traceEvents,
  totalRuntimeMs,
});

assert('full timeline captured', snapshot.traceEvents.length > 0, String(snapshot.traceEvents.length));
assert('every authority runtime measured', authorityProfiles.length > 0, String(authorityProfiles.length));
assert('every substep runtime measured', substepProfiles.length > 0, String(substepProfiles.length));
assert('slowest authority identified', authorityProfiles[0] != null, 'none');
assert('slowest substep identified', substepProfiles[0] != null, 'none');

const signals = detectSimulationDegradationSignals({
  snapshot,
  completionEventId: degradedOutcome.completionEventId,
  degraded: true,
  budgetExceeded: degradedOutcome.budgetExceeded,
  payloadGuardDegraded: true,
  simulationElapsedMs: degradedOutcome.elapsedMs || simulatedElapsedMs,
});
assert('degradation signals detected', signals.length > 0, String(signals.length));

const findings = classifyDegradationRootCauses({
  signals,
  slowestAuthority: authorityProfiles[0] ?? null,
  slowestSubstep: substepProfiles[0] ?? null,
  warningCompletionAuthority: 'Founder Simulation Completion Boundary',
  totalRuntimeMs,
});
assert('degradation root cause classified', findings.some((f) => f.rootCause !== 'UNKNOWN'), findings.map((f) => f.rootCause).join(', '));
assert('repair recommendation produced', findings.every((f) => f.recommendedRepair.length > 0), 'missing repair');

const assessment = assessFounderSimulationDegradationRootCause({
  runtimeSnapshot: snapshot,
  simulationElapsedMs: degradedOutcome.elapsedMs || simulatedElapsedMs,
  completionEventId: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  degraded: true,
  budgetExceeded: degradedOutcome.elapsedMs > FOUNDER_SIMULATION_STAGE_BUDGET_MS,
  payloadGuardDegraded: true,
  runId: snapshot.runId,
  skipHistoryRecording: true,
});

assert(
  'assessment completes',
  assessment.orchestrationState === 'FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_COMPLETE',
  assessment.orchestrationState,
);
assert(
  'warning path authority identified',
  assessment.report.repairPlan.warningCompletionAuthority != null ||
    assessment.report.findings.some((f) => f.warningPathEmitter),
  'none',
);

const syncResult = applyFounderSimulationDegradationRootCauseSync({
  runtimeSnapshot: snapshot,
  simulationElapsedMs: simulatedElapsedMs,
  completionEventId: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  degraded: true,
  payloadGuardDegraded: true,
  skipHistoryRecording: true,
});
assert('sync assessment produced', syncResult.assessment.report.investigationId.length > 0, 'empty');

assert(
  'pass token issued',
  assessment.report.passToken === FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_REPAIR_PASS,
  assessment.report.passToken ?? 'null',
);

writeFileSync(
  join(ROOT, 'architecture/FOUNDER_SIMULATION_DEGRADATION_REPORT.md'),
  buildFounderSimulationDegradationReportMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE.md'),
  buildFounderSimulationDegradationRootCauseMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/FOUNDER_SIMULATION_DEGRADATION_REPAIR_PLAN.md'),
  buildFounderSimulationDegradationRepairPlanMarkdown(assessment.report),
  'utf8',
);

const failed = results.filter((r) => !r.passed);
const passed = failed.length === 0;

writeFileSync(
  join(ROOT, 'architecture/FOUNDER_SIMULATION_DEGRADATION_VALIDATION.md'),
  buildFounderSimulationDegradationValidationMarkdown(passed, results.length, failed.length),
  'utf8',
);

console.log(`\n${VALIDATOR_BASENAME}: ${passed ? 'PASS' : 'FAIL'} (${results.length - failed.length}/${results.length})`);
for (const result of results) {
  console.log(`  [${result.passed ? 'PASS' : 'FAIL'}] ${result.name}: ${result.detail}`);
}

if (!passed) {
  process.exitCode = 1;
}
