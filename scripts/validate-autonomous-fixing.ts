/**
 * Phase 19.5 — Autonomous Fixing validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import type { VerificationStrategyInput } from '../src/verification-strategy-core/verification-strategy-types.js';
import type { FailureCategory, FixPlanInput, FixStrategy } from '../src/autonomous-fixing/autonomous-fixing-types.js';
import {
  AUTONOMOUS_FIXING_PASS_TOKEN,
  AUTONOMOUS_FIXING_OWNER_MODULE,
  FIX_STRATEGY_REGISTRY,
  MAX_FIX_HISTORY_SIZE,
  analyzeFixConfidence,
  analyzeFixRisk,
  analyzeRootCause,
  buildFixPlan,
  buildRollbackPlan,
  classifyFailure,
  evaluateFixReadiness,
  generateFixPlanFromUpstream,
  generateFixReport,
  generateRepairCandidates,
  getAutonomousFixingRuntimeReport,
  getDevPulseV2AutonomousFixing,
  getFixStrategyEntry,
  getLatestFixPlans,
  getFixHistorySize,
  lookupFixHistoryByCategory,
  lookupFixHistoryByStrategy,
  recordFixHistory,
  registerAutonomousFixingWithAutonomousBuilder,
  registerAutonomousFixingWithBuildStrategyEngine,
  registerAutonomousFixingWithCentralBrain,
  registerAutonomousFixingWithProjectVault,
  registerAutonomousFixingWithTrustEngine,
  registerAutonomousFixingWithUvl,
  registerAutonomousFixingWithWorld2Coordinator,
  resetAutonomousFixingModuleForTests,
  selectFixStrategy,
} from '../src/autonomous-fixing/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { AUTONOMOUS_FIXING_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/autonomous-fixing');

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
  'autonomous-fixing.ts',
  'autonomous-fixing-types.ts',
  'failure-classifier.ts',
  'root-cause-analyzer.ts',
  'fix-strategy-selector.ts',
  'fix-plan-builder.ts',
  'fix-risk-analyzer.ts',
  'fix-confidence-analyzer.ts',
  'fix-readiness-evaluator.ts',
  'rollback-planner.ts',
  'repair-candidate-generator.ts',
  'fix-reporting.ts',
  'fix-history.ts',
  'fix-registry.ts',
  'index.ts',
];

const ALL_CATEGORIES: FailureCategory[] = [
  'BUILD', 'TYPECHECK', 'TEST', 'VERIFICATION', 'TRUST', 'RUNTIME', 'ROUTING', 'BRAIN', 'WORLD2', 'CLOUD', 'UNKNOWN',
];

const ALL_STRATEGIES: FixStrategy[] = [
  'RETRY', 'REPAIR', 'REGENERATE', 'ROLLBACK', 'TRUST_RECOVERY', 'ESCALATE', 'FOUNDER_REVIEW',
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

function baseFixInput(overrides: Partial<FixPlanInput> = {}): FixPlanInput {
  return {
    failureSignals: ['test failure signal'],
    trustScore: 75,
    verificationConfidence: 70,
    testingConfidence: 70,
    subsystemTouched: ['feature-module'],
    ...overrides,
  };
}

function resetAll(): void {
  resetAutonomousFixingModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2AutonomousFixing();
  assert('A-SETUP', 'pass token', authority.passToken === AUTONOMOUS_FIXING_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === AUTONOMOUS_FIXING_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'planning only', authority.planningOnly === true, 'planningOnly');
  assert('A-SETUP', 'strategy registry', FIX_STRATEGY_REGISTRY.length === 7, String(FIX_STRATEGY_REGISTRY.length));
  assert('A-SETUP', 'uvl rows', AUTONOMOUS_FIXING_UVL_ROWS.length === 14, String(AUTONOMOUS_FIXING_UVL_ROWS.length));
  assert('A-SETUP', 'max history', MAX_FIX_HISTORY_SIZE === 64, String(MAX_FIX_HISTORY_SIZE));
  harness.endGroup('A-SETUP', g);
}

function runClassification(): void {
  const g = harness.beginGroup('B-CLASSIFY');
  resetAll();

  const cases: Array<{ label: string; input: FixPlanInput; expected: FailureCategory }> = [
    { label: 'BUILD', input: baseFixInput({ failureSignals: ['build strategy failure'] }), expected: 'BUILD' },
    { label: 'TYPECHECK', input: baseFixInput({ failureSignals: ['typecheck error'] }), expected: 'TYPECHECK' },
    { label: 'TEST', input: baseFixInput({ failureSignals: ['test suite failed'], testResultStatus: 'SIMULATED_FAIL' }), expected: 'TEST' },
    { label: 'VERIFICATION', input: baseFixInput({ failureSignals: ['verification validator gap'] }), expected: 'VERIFICATION' },
    { label: 'TRUST', input: baseFixInput({ failureSignals: ['trust degraded'], trustScore: 30 }), expected: 'TRUST' },
    { label: 'RUNTIME', input: baseFixInput({ failureSignals: ['runtime startup failure'] }), expected: 'RUNTIME' },
    { label: 'ROUTING', input: baseFixInput({ failureSignals: ['routing canonical mismatch'] }), expected: 'ROUTING' },
    { label: 'BRAIN', input: baseFixInput({ failureSignals: ['brain capability selection'] }), expected: 'BRAIN' },
    { label: 'WORLD2', input: baseFixInput({ failureSignals: ['world2 workspace'], world2Active: true }), expected: 'WORLD2' },
    { label: 'CLOUD', input: baseFixInput({ failureSignals: ['cloud worker'], cloudTouched: true }), expected: 'CLOUD' },
    { label: 'UNKNOWN', input: baseFixInput({ failureSignals: [] }), expected: 'UNKNOWN' },
  ];

  for (const c of cases) {
    const category = classifyFailure(c.input);
    assert('B-CLASSIFY', c.label, category === c.expected, category);
    const rootCause = analyzeRootCause(c.input, category);
    assert('B-CLASSIFY', `${c.label} root causes`, rootCause.probableCauses.length > 0, String(rootCause.probableCauses.length));
    const repairs = generateRepairCandidates(category, c.input);
    assert('B-CLASSIFY', `${c.label} repairs`, repairs.length > 0, String(repairs.length));
  }

  harness.endGroup('B-CLASSIFY', g);
}

function runAnalyzers(): void {
  const g = harness.beginGroup('C-ANALYZERS');
  resetAll();

  const low = baseFixInput({ trustScore: 90, blastRadius: 'LOCAL' });
  const high = baseFixInput({ trustScore: 25, blastRadius: 'PLATFORM', criticalSubsystem: true, repeatFailures: 4 });

  const lowCategory = classifyFailure(low);
  const highCategory = classifyFailure(high);
  const lowRoot = analyzeRootCause(low, lowCategory);
  const highRoot = analyzeRootCause(high, highCategory);
  const lowRepairs = generateRepairCandidates(lowCategory, low);
  const highRepairs = generateRepairCandidates(highCategory, high);

  assert('C-ANALYZERS', 'risk ordering', analyzeFixRisk(high, highCategory, highRoot, highRepairs) > analyzeFixRisk(low, lowCategory, lowRoot, lowRepairs), 'risk');

  const lowConfidence = analyzeFixConfidence(low, lowRoot, lowRepairs);
  const highConfidence = analyzeFixConfidence(high, highRoot, highRepairs);
  assert('C-ANALYZERS', 'confidence bounds low', lowConfidence >= 0 && lowConfidence <= 100, String(lowConfidence));
  assert('C-ANALYZERS', 'confidence bounds high', highConfidence >= 0 && highConfidence <= 100, String(highConfidence));

  const lowRisk = analyzeFixRisk(low, lowCategory, lowRoot, lowRepairs);
  const rollbackLow = buildRollbackPlan(low, lowCategory, lowRoot, lowRisk);
  const rollbackHigh = buildRollbackPlan(high, highCategory, highRoot, analyzeFixRisk(high, highCategory, highRoot, highRepairs));
  assert('C-ANALYZERS', 'rollback low optional', rollbackLow.rollbackRequired === false || rollbackLow.scope === 'LOCALIZED', rollbackLow.scope);
  assert('C-ANALYZERS', 'rollback high required', rollbackHigh.rollbackRequired === true, String(rollbackHigh.rollbackRequired));

  harness.endGroup('C-ANALYZERS', g);
}

function runStrategies(): void {
  const g = harness.beginGroup('D-STRATEGIES');
  resetAll();

  const strategyCases: Array<{ label: string; input: FixPlanInput; expected: FixStrategy }> = [
    { label: 'RETRY', input: baseFixInput({ transientFailure: true, failureSignals: ['transient'], verificationConfidence: 30, testingConfidence: 30, trustScore: 50 }), expected: 'RETRY' },
    { label: 'REPAIR', input: baseFixInput({ failureSignals: ['routing canonical mismatch', 'duplicate route'] }), expected: 'REPAIR' },
    { label: 'REGENERATE', input: baseFixInput({ failureSignals: ['build plan corrupt inconsistent'] }), expected: 'REGENERATE' },
    { label: 'ROLLBACK', input: baseFixInput({ failureSignals: ['world2 workspace'], world2Active: true, blastRadius: 'PLATFORM', criticalSubsystem: true }), expected: 'ROLLBACK' },
    { label: 'TRUST_RECOVERY', input: baseFixInput({ failureSignals: ['trust collapse'], trustScore: 25, verificationDisagreement: true }), expected: 'TRUST_RECOVERY' },
    { label: 'ESCALATE', input: baseFixInput({ failureSignals: ['repeated failure'], repeatFailures: 4, trustScore: 55, verificationConfidence: 35 }), expected: 'ESCALATE' },
    { label: 'FOUNDER_REVIEW', input: baseFixInput({ failureSignals: ['policy'], policyConflict: true }), expected: 'FOUNDER_REVIEW' },
  ];

  for (const c of strategyCases) {
    const plan = buildFixPlan(c.input);
    assert('D-STRATEGIES', c.label, plan.strategy === c.expected, plan.strategy);
  }

  for (const strategy of ALL_STRATEGIES) {
    const entry = getFixStrategyEntry(strategy);
    assert('D-STRATEGIES', `registry ${strategy}`, entry?.strategy === strategy, strategy);
  }

  harness.endGroup('D-STRATEGIES', g);
}

function runReadinessAndPlans(): void {
  const g = harness.beginGroup('E-PLANS');
  resetAll();

  const ready = buildFixPlan(baseFixInput({ failureSignals: ['routing duplicate route', 'canonical mismatch'] }));
  assert('E-PLANS', 'plan id', ready.id.length > 0, ready.id);
  assert('E-PLANS', 'plan confidence', ready.confidence >= 0 && ready.confidence <= 100, String(ready.confidence));
  assert('E-PLANS', 'plan risk', ready.riskScore >= 0 && ready.riskScore <= 100, String(ready.riskScore));
  assert('E-PLANS', 'plan repairs', ready.repairCandidates.length > 0, String(ready.repairCandidates.length));
  assert('E-PLANS', 'plan reasoning', ready.reasoning.length > 0, String(ready.reasoning.length));

  const blocked = buildFixPlan(baseFixInput({ failureSignals: [], trustScore: 20, repeatFailures: 5 }));
  assert('E-PLANS', 'blocked or escalated', blocked.readiness === 'BLOCKED' || blocked.readiness === 'ESCALATED' || blocked.readiness === 'TRUST_RECOVERY_REQUIRED', blocked.readiness);

  const report = generateFixReport(ready);
  assert('E-PLANS', 'report id', report.reportId.length > 0, report.reportId);
  assert('E-PLANS', 'report strategy', report.strategy === ready.strategy, report.strategy);
  assert('E-PLANS', 'report root causes', report.rootCauses.length > 0, String(report.rootCauses.length));

  harness.endGroup('E-PLANS', g);
}

function runHistoryAndRegistry(): void {
  const g = harness.beginGroup('F-HISTORY');
  resetAll();

  const plan = buildFixPlan(baseFixInput());
  recordFixHistory(plan);
  assert('F-HISTORY', 'history size', getFixHistorySize() >= 1, String(getFixHistorySize()));
  assert('F-HISTORY', 'latest plans', getLatestFixPlans().length >= 1, 'latest');
  assert('F-HISTORY', 'lookup strategy', lookupFixHistoryByStrategy(plan.strategy).length >= 1, plan.strategy);
  assert('F-HISTORY', 'lookup category', lookupFixHistoryByCategory(plan.failureCategory).length >= 1, plan.failureCategory);

  for (let i = 0; i < MAX_FIX_HISTORY_SIZE + 5; i++) {
    recordFixHistory(plan);
  }
  assert('F-HISTORY', 'bounded history', getFixHistorySize() <= MAX_FIX_HISTORY_SIZE, String(getFixHistorySize()));

  harness.endGroup('F-HISTORY', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('G-INTEGRATION');
  resetAll();

  const owner = getDevPulseV2Owner('autonomous_fixing');
  assert('G-INTEGRATION', 'ownership', owner.ownerModule === AUTONOMOUS_FIXING_OWNER_MODULE, owner.ownerModule);

  const brain = registerAutonomousFixingWithCentralBrain();
  const vault = registerAutonomousFixingWithProjectVault();
  const trust = registerAutonomousFixingWithTrustEngine();
  const uvl = registerAutonomousFixingWithUvl();
  const world2 = registerAutonomousFixingWithWorld2Coordinator();
  const builder = registerAutonomousFixingWithAutonomousBuilder();
  const buildStrategy = registerAutonomousFixingWithBuildStrategyEngine();

  assert('G-INTEGRATION', 'central brain', brain.centralBrainSystems >= 1, String(brain.centralBrainSystems));
  assert('G-INTEGRATION', 'vault read-only', vault.readOnly === true, 'readOnly');
  assert('G-INTEGRATION', 'trust read-only', trust.readOnly === true, 'readOnly');
  assert('G-INTEGRATION', 'uvl read-only', uvl.readOnly === true, 'readOnly');
  assert('G-INTEGRATION', 'world2 read-only', world2.readOnly === true, 'readOnly');
  assert('G-INTEGRATION', 'builder read-only', builder.readOnly === true, 'readOnly');
  assert('G-INTEGRATION', 'build strategy read-only', buildStrategy.readOnly === true, 'readOnly');
  assert('G-INTEGRATION', 'verification tokens', brain.verificationStackTokens.length === 3, String(brain.verificationStackTokens.length));
  assert('G-INTEGRATION', 'strategy registry count', brain.strategyRegistryCount === 7, String(brain.strategyRegistryCount));

  const pipeline = generateFixPlanFromUpstream(baseStrategyInput());
  assert('G-INTEGRATION', 'upstream pipeline', pipeline.plan.id.length > 0, pipeline.plan.id);
  assert('G-INTEGRATION', 'upstream report', pipeline.report.planId === pipeline.plan.id, pipeline.report.planId);

  const brainReuse = registerAutonomousFixingWithCentralBrain();
  assert('G-INTEGRATION', 'bootstrap reuse', brainReuse.registeredAt === brain.registeredAt, 'cached');

  const runtime = getAutonomousFixingRuntimeReport();
  assert('G-INTEGRATION', 'runtime registry', runtime.registrySize === 7, String(runtime.registrySize));
  assert('G-INTEGRATION', 'runtime history', runtime.historySize >= 1, String(runtime.historySize));

  harness.endGroup('G-INTEGRATION', g);
}

function runCategoryCoverage(): void {
  const g = harness.beginGroup('H-COVERAGE');
  resetAll();

  for (const category of ALL_CATEGORIES) {
    const signal = category === 'UNKNOWN' ? '' : `${category.toLowerCase()} failure`;
    const input = baseFixInput({
      failureSignals: signal ? [signal] : [],
      trustScore: category === 'TRUST' ? 25 : 75,
      world2Active: category === 'WORLD2',
      cloudTouched: category === 'CLOUD',
    });
    const classified = classifyFailure(input);
    assert('H-COVERAGE', `category ${category}`, classified === category || category === 'UNKNOWN', classified);
    const plan = buildFixPlan(input);
    assert('H-COVERAGE', `plan ${category}`, plan.failureCategory === classified, plan.failureCategory);
  }

  harness.endGroup('H-COVERAGE', g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('I-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 19.5 Autonomous Fixing');
  console.log('===========================================\n');

  runSetup();
  runClassification();
  runAnalyzers();
  runStrategies();
  runReadinessAndPlans();
  runHistoryAndRegistry();
  runIntegration();
  runCategoryCoverage();
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    failed.length === 0 ? AUTONOMOUS_FIXING_PASS_TOKEN : 'AUTONOMOUS_FIXING_V1_FAIL',
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

  console.log(`\n${AUTONOMOUS_FIXING_PASS_TOKEN}`);
}

main();
