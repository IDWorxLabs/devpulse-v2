/**
 * Phase 26.33 — Founder Simulation Engine V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_SIMULATION_ENGINE_V1_PASS,
  MAX_FOUNDER_SIMULATION_HISTORY,
  FOUNDER_SIMULATION_SCENARIO_TYPES,
  buildFounderSimulationEngineArtifacts,
  getFounderSimulationHistorySize,
  getFounderSimulationScenarioByType,
  resetFounderSimulationEngineModuleForTests,
  runFounderSimulation,
  runFounderTestButtonSimulation,
  simulateFounderJourney,
} from '../src/founder-simulation-engine/index.js';

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
  'src/founder-simulation-engine/founder-simulation-types.ts',
  'src/founder-simulation-engine/founder-simulation-registry.ts',
  'src/founder-simulation-engine/simulation-scenario-library.ts',
  'src/founder-simulation-engine/founder-journey-simulator.ts',
  'src/founder-simulation-engine/intake-chain-simulator.ts',
  'src/founder-simulation-engine/planning-chain-simulator.ts',
  'src/founder-simulation-engine/architecture-chain-simulator.ts',
  'src/founder-simulation-engine/build-plan-chain-simulator.ts',
  'src/founder-simulation-engine/cross-system-proof-analyzer.ts',
  'src/founder-simulation-engine/simulation-failure-analyzer.ts',
  'src/founder-simulation-engine/founder-simulation-history.ts',
  'src/founder-simulation-engine/founder-simulation-report-builder.ts',
  'src/founder-simulation-engine/founder-simulation-engine.ts',
  'src/founder-simulation-engine/index.ts',
  'architecture/FOUNDER_SIMULATION_ENGINE_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

resetFounderSimulationEngineModuleForTests();

const fullRun = runFounderTestButtonSimulation({ skipHistoryRecording: true });
assert('A simulation engine complete', fullRun.orchestrationState === 'FOUNDER_SIMULATION_ENGINE_COMPLETE', fullRun.orchestrationState);
assert('A advisory only', fullRun.advisoryOnly === true, String(fullRun.advisoryOnly));
assert('A ten scenarios executed', fullRun.results.length === 10, `${fullRun.results.length}`);
assert(
  'A all scenario types present',
  FOUNDER_SIMULATION_SCENARIO_TYPES.every((type) => fullRun.results.some((r) => r.scenarioType === type)),
  fullRun.results.map((r) => r.scenarioType).join(', '),
);

for (const result of fullRun.results) {
  const evaluatedStages = result.stageResults.filter((s) => s.status !== 'SKIPPED');
  assert(
    `B stages evaluated: ${result.scenarioType}`,
    evaluatedStages.length >= 4,
    `${evaluatedStages.length}`,
  );
  assert(
    `B final verdict present: ${result.scenarioType}`,
    result.finalVerdict.length > 0,
    result.finalVerdict,
  );
}

const incomplete = fullRun.results.find((r) => r.scenarioType === 'INCOMPLETE_VAGUE');
assert('C incomplete scenario ran', incomplete != null, 'missing');
assert(
  'C insufficient input blocked or needs clarification',
  incomplete != null &&
    (incomplete.finalVerdict === 'NOT_READY' ||
      incomplete.finalVerdict === 'NEEDS_CLARIFICATION' ||
      incomplete.failedStages.includes('PLANNING_GATE_AUTHORITY') ||
      incomplete.stageResults.some((s) => s.stageId === 'PLANNING_GATE_AUTHORITY' && (s.status === 'BLOCKED' || s.evidence.includes('REJECT_PLANNING')))),
  incomplete?.finalVerdict ?? 'none',
);

const conflict = fullRun.results.find((r) => r.scenarioType === 'CONFLICTING_EVIDENCE');
assert('C conflict scenario ran', conflict != null, 'missing');
assert(
  'C conflict triggers clarification or low confidence gate',
  conflict != null &&
    (conflict.finalVerdict === 'NEEDS_CLARIFICATION' ||
      conflict.stageResults.some(
        (s) =>
          s.stageId === 'PLANNING_GATE_AUTHORITY' &&
          (s.evidence.includes('REQUEST_CLARIFICATION') || s.status === 'LOW_CONFIDENCE'),
      ) ||
      conflict.stageResults.some((s) => s.stageId === 'UNIFIED_INTAKE_INTELLIGENCE' && s.status === 'LOW_CONFIDENCE')),
  conflict?.finalVerdict ?? 'none',
);

const mobileFirst = fullRun.results.find((r) => r.scenarioType === 'MOBILE_FIRST');
assert('D strong mobile scenario ran', mobileFirst != null, 'missing');
assert(
  'D strong input reaches build plan stage',
  mobileFirst != null &&
    mobileFirst.stageResults.some(
      (s) => s.stageId === 'BUILD_PLAN_GENERATOR' && (s.status === 'PASSED' || s.status === 'SKIPPED'),
    ),
  mobileFirst?.stageResults.map((s) => `${s.stageId}:${s.status}`).join(', ') ?? 'none',
);
assert(
  'D strong input high readiness',
  mobileFirst != null && mobileFirst.readinessScore >= 70,
  String(mobileFirst?.readinessScore),
);
assert(
  'D strong verdict at least planning',
  mobileFirst != null &&
    (mobileFirst.finalVerdict === 'READY_FOR_BUILD_PLAN' ||
      mobileFirst.finalVerdict === 'READY_FOR_ARCHITECTURE' ||
      mobileFirst.finalVerdict === 'READY_FOR_PLANNING' ||
      mobileFirst.finalVerdict === 'READY_FOR_EXECUTION_GATE'),
  mobileFirst?.finalVerdict ?? 'none',
);

const screenshot = fullRun.results.find((r) => r.scenarioType === 'SCREENSHOT_SUPPORTED');
assert('D screenshot scenario uses visual stage', screenshot != null && screenshot.stageResults.some((s) => s.stageId === 'VISUAL_REFERENCE_INTELLIGENCE' && s.status === 'PASSED'), 'yes');

const voice = fullRun.results.find((r) => r.scenarioType === 'VOICE_NOTE_SUPPORTED');
assert('D voice scenario uses voice stage', voice != null && voice.stageResults.some((s) => s.stageId === 'VOICE_NOTES_INTELLIGENCE' && s.status === 'PASSED'), 'yes');

assert(
  'E system integration proof',
  fullRun.report != null && fullRun.report.systemIntegrationProof.authoritiesReached.length >= 8,
  `${fullRun.report?.systemIntegrationProof.authoritiesReached.length ?? 0}`,
);

resetFounderSimulationEngineModuleForTests();
for (let i = 0; i < MAX_FOUNDER_SIMULATION_HISTORY + 4; i += 1) {
  const scenario = getFounderSimulationScenarioByType('SIMPLE_APP');
  if (scenario) {
    simulateFounderJourney({ scenario: { ...scenario, scenarioId: `history-${i}` } });
    runFounderSimulation({ scenarios: [scenario], skipHistoryRecording: false });
  }
}
assert(
  'F history bounded',
  getFounderSimulationHistorySize() <= MAX_FOUNDER_SIMULATION_HISTORY,
  `${getFounderSimulationHistorySize()}/${MAX_FOUNDER_SIMULATION_HISTORY}`,
);

const artifacts = buildFounderSimulationEngineArtifacts({
  results: fullRun.results,
  report: fullRun.report,
});
assert('G report markdown', artifacts.markdown.includes('Founder Simulation Engine Report'), 'yes');
assert('G scenario results in report', artifacts.markdown.includes('Scenario:'), 'yes');
assert('G stage chain in report', artifacts.markdown.includes('Stage Chain Proof'), 'yes');
assert('G integration proof in report', artifacts.markdown.includes('System Integration Proof'), 'yes');
assert('G aggregate readiness in report', artifacts.markdown.includes('Aggregate readiness score'), 'yes');

writeFileSync(join(ROOT, 'architecture/FOUNDER_SIMULATION_ENGINE_REPORT.md'), artifacts.markdown, 'utf8');
assert('G report written', existsSync(join(ROOT, 'architecture/FOUNDER_SIMULATION_ENGINE_REPORT.md')), 'yes');

const engineSource = readFileSync(join(ROOT, 'src/founder-simulation-engine/founder-simulation-engine.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/founder-simulation-engine/founder-simulation-registry.ts'), 'utf8');
assert(
  'H read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_PROJECT_MODIFICATION') &&
    registrySource.includes('HONEST_ASSESSMENT_ONLY') &&
    registrySource.includes('RUNTIME_BUDGET_SAFEGUARDS') &&
    !engineSource.includes('writeFileSync') &&
    !engineSource.includes('generateCode'),
  'yes',
);
assert('H advisory only', engineSource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/FOUNDER_SIMULATION_ENGINE_REPORT.md'), 'utf8');
assert('H pass token', arch.includes(FOUNDER_SIMULATION_ENGINE_V1_PASS), 'yes');

const engineHash = createHash('sha256').update(engineSource).digest('hex').slice(0, 12);
assert('I no validator recursion marker', !engineSource.includes('validate-founder-simulation-engine'), engineHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Founder Simulation Engine V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nAggregate readiness: ${fullRun.report?.aggregateReadinessScore ?? 0}/100`);
  console.log(`Scenarios run: ${fullRun.results.length}`);
  console.log(`History size: ${getFounderSimulationHistorySize()}`);
  console.log(`Report path: architecture/FOUNDER_SIMULATION_ENGINE_REPORT.md`);
  console.log(`\n${FOUNDER_SIMULATION_ENGINE_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
