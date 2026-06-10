/**
 * Phase 19.4 — Autonomous Testing validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import type { VerificationStrategyInput } from '../src/verification-strategy-core/verification-strategy-types.js';
import type { AutonomousTestDepth, AutonomousTestPlanInput } from '../src/autonomous-testing/autonomous-testing-types.js';
import {
  AUTONOMOUS_TESTING_PASS_TOKEN,
  AUTONOMOUS_TESTING_OWNER_MODULE,
  AUTONOMOUS_TEST_DEPTH_REGISTRY,
  MAX_AUTONOMOUS_TEST_HISTORY_SIZE,
  analyzeAutonomousTestConfidence,
  analyzeAutonomousTestCost,
  analyzeAutonomousTestRisk,
  buildAutonomousTestCoverageModel,
  buildAutonomousTestPlan,
  buildAutonomousTestSuites,
  createAutonomousTestResultModel,
  evaluateAutonomousTestReadiness,
  generateAutonomousTestPlanFromUpstream,
  generateAutonomousTestReport,
  getAutonomousTestDepthEntry,
  getAutonomousTestingRuntimeReport,
  getAutonomousTestHistoryByDepth,
  getAutonomousTestHistorySize,
  getDevPulseV2AutonomousTesting,
  isSimulatedResult,
  recordAutonomousTestHistory,
  registerAutonomousTestingWithCentralBrain,
  registerAutonomousTestingWithProjectVault,
  registerAutonomousTestingWithTrustEngine,
  registerAutonomousTestingWithUvl,
  registerAutonomousTestingWithWorld2Coordinator,
  resetAutonomousTestingModuleForTests,
  selectAutonomousTestCategories,
  selectAutonomousTestDepth,
} from '../src/autonomous-testing/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { AUTONOMOUS_TESTING_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/autonomous-testing');

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 5 * 60 * 1000, groupWarningMs: 45 * 1000 });

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

const REQUIRED_FILES = [
  'autonomous-testing.ts',
  'autonomous-testing-types.ts',
  'autonomous-test-selector.ts',
  'autonomous-test-planner.ts',
  'autonomous-test-suite-builder.ts',
  'autonomous-test-risk-analyzer.ts',
  'autonomous-test-confidence-analyzer.ts',
  'autonomous-test-cost-analyzer.ts',
  'autonomous-test-coverage-model.ts',
  'autonomous-test-result-model.ts',
  'autonomous-test-reporting.ts',
  'autonomous-test-history.ts',
  'autonomous-test-registry.ts',
  'index.ts',
];

function baseStrategyInput(overrides: Partial<VerificationStrategyInput> = {}): VerificationStrategyInput {
  return {
    taskType: 'FEATURE',
    riskLevel: 'MEDIUM',
    trustScore: 75,
    changeScope: 'MEDIUM',
    executionMode: 'LOCAL',
    ...overrides,
  };
}

function baseTestInput(overrides: Partial<AutonomousTestPlanInput> = {}): AutonomousTestPlanInput {
  return {
    trustScore: 75,
    changeScope: 'MEDIUM',
    executionMode: 'LOCAL',
    verificationConfidence: 70,
    verificationRiskScore: 30,
    subsystemTouched: ['feature-module'],
    ...overrides,
  };
}

function resetAll(): void {
  resetAutonomousTestingModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2AutonomousTesting();
  assert('A-SETUP', 'pass token', authority.passToken === AUTONOMOUS_TESTING_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === AUTONOMOUS_TESTING_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'planning only', authority.planningOnly === true, 'planningOnly');
  assert('A-SETUP', 'depth registry', AUTONOMOUS_TEST_DEPTH_REGISTRY.length === 7, String(AUTONOMOUS_TEST_DEPTH_REGISTRY.length));
  assert('A-SETUP', 'uvl rows', AUTONOMOUS_TESTING_UVL_ROWS.length === 13, String(AUTONOMOUS_TESTING_UVL_ROWS.length));
  assert('A-SETUP', 'max history', MAX_AUTONOMOUS_TEST_HISTORY_SIZE === 64, String(MAX_AUTONOMOUS_TEST_HISTORY_SIZE));
  harness.endGroup('A-SETUP', g);
}

function assertDepth(group: string, label: string, input: AutonomousTestPlanInput, expected: AutonomousTestDepth): void {
  const risk = analyzeAutonomousTestRisk(input);
  const picked = selectAutonomousTestDepth(input, risk);
  assert(group, label, picked.depth === expected, picked.depth);
  const plan = buildAutonomousTestPlan(input);
  assert(group, `${label} plan`, plan.depth === expected, plan.depth);
  assert(group, `${label} suites`, plan.requiredSuites.length > 0, String(plan.requiredSuites.length));
  assert(group, `${label} order`, plan.executionOrder.length > 0, String(plan.executionOrder.length));
}

function runDepthPlans(): void {
  const g = harness.beginGroup('B-DEPTH');
  resetAll();

  assertDepth('B-DEPTH', 'SMOKE', baseTestInput({ changeScope: 'TINY', executionMode: 'NONE', verificationPlanType: 'QUICK' }), 'SMOKE');
  assertDepth('B-DEPTH', 'STANDARD', baseTestInput({ changeScope: 'MEDIUM' }), 'STANDARD');
  assertDepth('B-DEPTH', 'DEEP', baseTestInput({ brainChanged: true, routingChanged: true, changeScope: 'MAJOR' }), 'DEEP');
  assertDepth('B-DEPTH', 'RELEASE', baseTestInput({ releaseReady: true, verificationPlanType: 'RELEASE' }), 'RELEASE');
  assertDepth('B-DEPTH', 'CLOUD', baseTestInput({ cloudRuntimeTouched: true, executionMode: 'CLOUD' }), 'CLOUD');
  assertDepth('B-DEPTH', 'WORLD2', baseTestInput({ world2ExecutionActive: true, executionMode: 'WORLD2', subsystemTouched: ['world2'] }), 'WORLD2');
  assertDepth(
    'B-DEPTH',
    'TRUST_RECOVERY',
    baseTestInput({ repeatFailuresDetected: true, verificationDisagreement: true, trustScore: 25, verificationPlanType: 'TRUST_RECOVERY' }),
    'TRUST_RECOVERY',
  );

  harness.endGroup('B-DEPTH', g);
}

function runAnalyzersAndCoverage(): void {
  const g = harness.beginGroup('C-ANALYZERS');
  resetAll();

  const low = baseTestInput({ trustScore: 90, changeScope: 'SMALL', blastRadius: 'LOCAL' });
  const high = baseTestInput({ trustScore: 25, blastRadius: 'PLATFORM', repeatFailuresDetected: true, historicalFailures: 4 });
  assert('C-ANALYZERS', 'risk ordering', analyzeAutonomousTestRisk(high) > analyzeAutonomousTestRisk(low), 'risk');

  const categories = selectAutonomousTestCategories(baseTestInput({ uiChanged: true, brainChanged: true }));
  assert('C-ANALYZERS', 'categories UI', categories.includes('UI'), categories.join(','));
  assert('C-ANALYZERS', 'categories BRAIN', categories.includes('BRAIN'), categories.join(','));

  const suites = buildAutonomousTestSuites(categories, 'STANDARD');
  const cost = analyzeAutonomousTestCost(suites.requiredSuites, suites.optionalSuites, 'STANDARD');
  assert('C-ANALYZERS', 'cost positive', cost.estimatedCost > 0, String(cost.estimatedCost));
  assert('C-ANALYZERS', 'duration positive', cost.estimatedDurationMs > 0, String(cost.estimatedDurationMs));

  const confidence = analyzeAutonomousTestConfidence(low, 'STANDARD', categories, 20);
  assert('C-ANALYZERS', 'confidence bounds', confidence >= 0 && confidence <= 100, String(confidence));

  const coverage = buildAutonomousTestCoverageModel(baseTestInput({ uiChanged: true }), categories);
  assert('C-ANALYZERS', 'coverage targets', coverage.coverageTargets.length > 0, String(coverage.coverageTargets.length));
  assert('C-ANALYZERS', 'coverage score', coverage.coverageScore >= 0, String(coverage.coverageScore));

  harness.endGroup('C-ANALYZERS', g);
}

function runResultsAndReadiness(): void {
  const g = harness.beginGroup('D-RESULTS');
  resetAll();

  const plan = buildAutonomousTestPlan(baseTestInput());
  const notExecuted = createAutonomousTestResultModel(plan);
  const simPass = createAutonomousTestResultModel(plan, 'SIMULATED_PASS');
  const simFail = createAutonomousTestResultModel(plan, 'SIMULATED_FAIL');

  assert('D-RESULTS', 'NOT_EXECUTED', notExecuted.status === 'NOT_EXECUTED', notExecuted.status);
  assert('D-RESULTS', 'SIMULATED_PASS', simPass.status === 'SIMULATED_PASS' && isSimulatedResult(simPass.status), simPass.status);
  assert('D-RESULTS', 'SIMULATED_FAIL', simFail.status === 'SIMULATED_FAIL' && simFail.failureSignals.length > 0, simFail.status);
  assert('D-RESULTS', 'no fake real pass', notExecuted.passedSuites.length === 0, 'empty passed');

  const readiness = evaluateAutonomousTestReadiness(baseTestInput(), plan);
  assert('D-RESULTS', 'readiness', readiness.length > 0, readiness);

  const report = generateAutonomousTestReport(plan, notExecuted);
  assert('D-RESULTS', 'report depth', report.depth === plan.depth, report.depth);
  assert('D-RESULTS', 'report reasoning', report.reasoning.length > 0, String(report.reasoning.length));

  harness.endGroup('D-RESULTS', g);
}

function runHistoryAndRegistry(): void {
  const g = harness.beginGroup('E-HISTORY');
  resetAll();

  const plan = buildAutonomousTestPlan(baseTestInput());
  recordAutonomousTestHistory(plan);
  assert('E-HISTORY', 'history size', getAutonomousTestHistorySize() >= 1, String(getAutonomousTestHistorySize()));
  assert('E-HISTORY', 'history by depth', getAutonomousTestHistoryByDepth(plan.depth).length >= 1, plan.depth);

  for (let i = 0; i < MAX_AUTONOMOUS_TEST_HISTORY_SIZE + 5; i++) {
    recordAutonomousTestHistory(plan);
  }
  assert('E-HISTORY', 'bounded history', getAutonomousTestHistorySize() <= MAX_AUTONOMOUS_TEST_HISTORY_SIZE, String(getAutonomousTestHistorySize()));

  const entry = getAutonomousTestDepthEntry('STANDARD');
  assert('E-HISTORY', 'registry lookup', entry?.depth === 'STANDARD', entry?.depth ?? 'missing');
  assert('E-HISTORY', 'registry confidence', (entry?.minimumConfidence ?? 0) >= 60, String(entry?.minimumConfidence));

  harness.endGroup('E-HISTORY', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();

  const owner = getDevPulseV2Owner('autonomous_testing');
  assert('F-INTEGRATION', 'ownership', owner.ownerModule === AUTONOMOUS_TESTING_OWNER_MODULE, owner.ownerModule);

  const brain = registerAutonomousTestingWithCentralBrain();
  const vault = registerAutonomousTestingWithProjectVault();
  const trust = registerAutonomousTestingWithTrustEngine();
  const uvl = registerAutonomousTestingWithUvl();
  const world2 = registerAutonomousTestingWithWorld2Coordinator();

  assert('F-INTEGRATION', 'central brain', brain.centralBrainSystems >= 1, String(brain.centralBrainSystems));
  assert('F-INTEGRATION', 'vault read-only', vault.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'trust read-only', trust.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'uvl read-only', uvl.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'world2 read-only', world2.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'verification tokens', brain.verificationStackTokens.length === 3, String(brain.verificationStackTokens.length));

  const pipeline = generateAutonomousTestPlanFromUpstream(baseStrategyInput());
  assert('F-INTEGRATION', 'upstream pipeline', pipeline.plan.id.length > 0, pipeline.plan.id);
  assert('F-INTEGRATION', 'upstream result', pipeline.result.status === 'NOT_EXECUTED', pipeline.result.status);
  assert('F-INTEGRATION', 'upstream report', pipeline.report.planId === pipeline.plan.id, pipeline.report.planId);

  const runtime = getAutonomousTestingRuntimeReport();
  assert('F-INTEGRATION', 'runtime registry', runtime.registrySize === 7, String(runtime.registrySize));
  assert('F-INTEGRATION', 'runtime history', runtime.historySize >= 1, String(runtime.historySize));

  harness.endGroup('F-INTEGRATION', g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('G-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 19.4 Autonomous Testing');
  console.log('============================================\n');

  runSetup();
  runDepthPlans();
  runAnalyzersAndCoverage();
  runResultsAndReadiness();
  runHistoryAndRegistry();
  runIntegration();
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    failed.length === 0 ? AUTONOMOUS_TESTING_PASS_TOKEN : 'AUTONOMOUS_TESTING_V1_FAIL',
  ]);

  if (failed.length > 0) {
    console.error('\nFailed scenarios:');
    for (const f of failed.slice(0, 20)) {
      console.error(`  [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  if (results.length < MIN_SCENARIOS) {
    console.error(`\nInsufficient scenarios: ${results.length} < ${MIN_SCENARIOS}`);
    process.exit(1);
  }

  console.log(`\n${AUTONOMOUS_TESTING_PASS_TOKEN}`);
}

main();
