/**
 * Phase 26.96 — Founder Simulation Completion Boundary Repair validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_SIMULATION_COMPLETE,
  FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_PASS,
  assessFounderSimulationCompletionBoundary,
  auditFounderSimulationStage,
  buildFounderSimulationCompletionBoundaryReportMarkdown,
  buildFounderSimulationCompletionRepairReportMarkdown,
  buildFounderSimulationCompletionValidationMarkdown,
  detectFounderSimulationCompletion,
  emitFounderSimulationCompletionOnce,
  executeFounderSimulationStageWithCompletionBoundary,
  hasFounderSimulationCompletionEventEmitted,
  isCrossSystemOrchestrationProofEligible,
  resetFounderSimulationCompletionBoundaryRepairModuleForTests,
  resolveNextStageAfterFounderSimulation,
} from '../src/founder-simulation-completion-boundary-repair/index.js';
import {
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  completeFounderTestRuntimeStage,
  getFounderTestRuntimeStatus,
  resetFounderTestRuntimeMonitorForTests,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-simulation-completion-boundary-repair';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-simulation-completion-boundary-repair/founder-simulation-completion-boundary-repair-types.ts',
  'src/founder-simulation-completion-boundary-repair/founder-simulation-completion-boundary-repair-registry.ts',
  'src/founder-simulation-completion-boundary-repair/founder-simulation-stage-auditor.ts',
  'src/founder-simulation-completion-boundary-repair/founder-simulation-completion-detector.ts',
  'src/founder-simulation-completion-boundary-repair/founder-simulation-transition-analyzer.ts',
  'src/founder-simulation-completion-boundary-repair/founder-simulation-repair-planner.ts',
  'src/founder-simulation-completion-boundary-repair/founder-simulation-completion-report-builder.ts',
  'src/founder-simulation-completion-boundary-repair/founder-simulation-completion-history.ts',
  'src/founder-simulation-completion-boundary-repair/founder-simulation-completion-boundary-repair-authority.ts',
  'src/founder-simulation-completion-boundary-repair/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/founder-simulation-completion-boundary-repair/founder-simulation-completion-boundary-repair-authority.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');

assert('no nested runFounderTest in repair authority', !authoritySource.includes('runFounderTest'), 'nested chain');
assert('no nested assessConnectedBuildExecution in repair authority', !authoritySource.includes('assessConnectedBuildExecution'), 'nested chain');
assert('handler wired to completion boundary', handlerSource.includes('executeFounderSimulationStageWithCompletionBoundary'), 'missing wire');
assert('handler stores diagnostic markdown fallback', handlerSource.includes('simulationOutcome.diagnosticMarkdown'), 'missing diagnostic fallback');

resetFounderTestRuntimeMonitorForTests();
resetFounderSimulationCompletionBoundaryRepairModuleForTests();

beginFounderTestRuntime({ runId: 'sim-completion-boundary-test' });
for (const stageId of ['FOUNDER_TEST_STARTED', 'INTAKE_VALIDATION', 'PLANNING_GATE', 'PLANNING_BRIEF', 'ARCHITECTURE_BRIEF', 'BUILD_PLAN'] as const) {
  if (stageId !== 'FOUNDER_TEST_STARTED') {
    advanceFounderTestRuntimeStage({ stageId });
  }
  completeFounderTestRuntimeStage({ stageId, skipFeed: stageId === 'FOUNDER_TEST_STARTED' });
}

advanceFounderTestRuntimeStage({ stageId: 'FOUNDER_SIMULATION_ENGINE' });

const cleanOutcome = executeFounderSimulationStageWithCompletionBoundary({
  rootDir: ROOT,
  execute: () => ({ simulationScore: 92, scenariosRun: 4 }),
});

assert('Founder Simulation start detected', cleanOutcome.elapsedMs >= 0, String(cleanOutcome.elapsedMs));
assert('bounded result completion detected', cleanOutcome.result !== null, 'null result');
assert(
  'FOUNDER_SIMULATION_COMPLETE emits once',
  cleanOutcome.completionEventId === FOUNDER_SIMULATION_COMPLETE && hasFounderSimulationCompletionEventEmitted(),
  cleanOutcome.completionEventId,
);
const duplicate = emitFounderSimulationCompletionOnce(FOUNDER_SIMULATION_COMPLETE);
assert('no duplicate completion events', duplicate.duplicate && !duplicate.emitted, String(duplicate.emitted));
assert(
  'Cross-System Orchestration Proof becomes eligible',
  cleanOutcome.crossSystemOrchestrationEligible && resolveNextStageAfterFounderSimulation(FOUNDER_SIMULATION_COMPLETE) === 'CROSS_SYSTEM_ORCHESTRATION_PROOF',
  String(cleanOutcome.crossSystemOrchestrationEligible),
);

completeFounderTestRuntimeStage({
  stageId: 'FOUNDER_SIMULATION_ENGINE',
  message: cleanOutcome.completionMessage,
  status: cleanOutcome.stageStatus,
});

const runtimeAfterComplete = getFounderTestRuntimeStatus();
const simulationStage = runtimeAfterComplete.stages.find((s) => s.stageId === 'FOUNDER_SIMULATION_ENGINE');
assert('stage completes (not RUNNING)', simulationStage?.status === 'PASSED', simulationStage?.status ?? 'missing');
assert('runtime monitor still active before finish', runtimeAfterComplete.state === 'RUNNING', runtimeAfterComplete.state);

resetFounderSimulationCompletionBoundaryRepairModuleForTests();
beginFounderTestRuntime({ runId: 'sim-degraded-test' });
advanceFounderTestRuntimeStage({ stageId: 'FOUNDER_SIMULATION_ENGINE' });

const degradedOutcome = executeFounderSimulationStageWithCompletionBoundary({
  rootDir: ROOT,
  execute: () => {
    throw new Error('simulated V5 partial failure');
  },
});

assert(
  'degraded result completes with warnings',
  degradedOutcome.completionEventId === FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  degradedOutcome.completionEventId,
);
assert('diagnostic stored on failure', Boolean(degradedOutcome.diagnosticMarkdown), 'missing diagnostic');
assert('failure still allows next stage', isCrossSystemOrchestrationProofEligible(degradedOutcome.completionEventId), 'not eligible');

const degradedDetection = detectFounderSimulationCompletion({
  resultProduced: false,
  degraded: true,
  budgetExceeded: false,
  errorMessage: 'simulated failure',
  elapsedMs: 1000,
});
assert('completion detector handles failure', degradedDetection.complete, degradedDetection.reason);

const assessment = assessFounderSimulationCompletionBoundary({
  rootDir: ROOT,
  outcome: cleanOutcome,
  skipHistoryRecording: true,
});
assert(
  'assessment completes',
  assessment.orchestrationState === 'FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_COMPLETE',
  assessment.orchestrationState,
);
assert('pass token issued', assessment.report.passToken === FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_PASS, assessment.report.passToken ?? 'null');

const trace = auditFounderSimulationStage(cleanOutcome, true);
assert('audit: result produced', trace.resultProduced, trace.detail);
assert('audit: completion emitted', trace.completionEventEmitted, trace.detail);

writeFileSync(
  join(ROOT, 'architecture/FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPORT.md'),
  buildFounderSimulationCompletionBoundaryReportMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/FOUNDER_SIMULATION_COMPLETION_REPAIR_REPORT.md'),
  buildFounderSimulationCompletionRepairReportMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/FOUNDER_SIMULATION_COMPLETION_VALIDATION.md'),
  buildFounderSimulationCompletionValidationMarkdown(results, assessment.report.passToken),
  'utf8',
);

const failed = results.filter((r) => !r.passed);
const pass = failed.length === 0;

console.log(`\n=== ${VALIDATOR_BASENAME} ===\n`);
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
}
console.log(`\n${failed.length} failed / ${results.length} checks`);
if (pass) {
  console.log(`\n${FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_PASS}\n`);
  process.exit(0);
}
process.exit(1);
