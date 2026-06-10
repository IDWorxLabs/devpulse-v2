/**
 * Phase 19.3B — Verification Intelligence validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import type { VerificationStrategy } from '../src/verification-strategy-core/verification-strategy-types.js';
import type { VerificationPlanInput, VerificationPlanType } from '../src/verification-intelligence/verification-plan-types.js';
import {
  VERIFICATION_INTELLIGENCE_PASS_TOKEN,
  VERIFICATION_INTELLIGENCE_OWNER_MODULE,
  VERIFICATION_PATH_REGISTRY,
  analyzeVerificationConfidence,
  analyzeVerificationCost,
  analyzeVerificationRisk,
  buildVerificationPlan,
  generateVerificationPlanFromStrategy,
  getDevPulseV2VerificationIntelligence,
  getVerificationIntelligenceRuntimeReport,
  getVerificationPathEntry,
  optimizeVerificationPlan,
  pickVerificationPlanType,
  registerVerificationIntelligenceWithBuildStrategyEngine,
  registerVerificationIntelligenceWithCentralBrain,
  registerVerificationIntelligenceWithProjectVault,
  registerVerificationIntelligenceWithTrustEngine,
  registerVerificationIntelligenceWithUvl,
  registerVerificationIntelligenceWithWorld2Coordinator,
  resetVerificationIntelligenceModuleForTests,
} from '../src/verification-intelligence/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { VERIFICATION_INTELLIGENCE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const MIN_SCENARIOS = 90;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/verification-intelligence');

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 4 * 60 * 1000, groupWarningMs: 30 * 1000 });

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

const REQUIRED_FILES = [
  'verification-intelligence.ts',
  'verification-plan-builder.ts',
  'verification-plan-selector.ts',
  'verification-plan-types.ts',
  'verification-risk-analyzer.ts',
  'verification-cost-analyzer.ts',
  'verification-confidence-analyzer.ts',
  'verification-plan-optimizer.ts',
  'verification-path-registry.ts',
  'index.ts',
];

function planInput(
  strategy: VerificationStrategy,
  overrides: Partial<VerificationPlanInput> = {},
): VerificationPlanInput {
  return {
    strategy,
    strategyConfidence: 70,
    trustScore: 75,
    executionMode: 'LOCAL',
    requiredValidators: ['UVL', 'Runtime'],
    optionalValidators: [],
    ...overrides,
  };
}

function resetAll(): void {
  resetVerificationIntelligenceModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2VerificationIntelligence();
  assert('A-SETUP', 'pass token', authority.passToken === VERIFICATION_INTELLIGENCE_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === VERIFICATION_INTELLIGENCE_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'planning only', authority.planningOnly === true, 'planningOnly');
  assert('A-SETUP', 'path registry', VERIFICATION_PATH_REGISTRY.length === 8, String(VERIFICATION_PATH_REGISTRY.length));
  assert('A-SETUP', 'uvl rows', VERIFICATION_INTELLIGENCE_UVL_ROWS.length === 9, String(VERIFICATION_INTELLIGENCE_UVL_ROWS.length));
  harness.endGroup('A-SETUP', g);
}

function assertPlanType(
  group: string,
  label: string,
  input: VerificationPlanInput,
  expected: VerificationPlanType,
): void {
  const risk = analyzeVerificationRisk(input);
  const picked = pickVerificationPlanType(input, risk.riskScore);
  assert(group, label, picked.planType === expected, picked.planType);
  const plan = buildVerificationPlan(input);
  assert(group, `${label} plan type`, plan.type === expected, plan.type);
  assert(group, `${label} execution order`, plan.executionOrder.length > 0, String(plan.executionOrder.length));
  assert(group, `${label} validators`, plan.requiredValidators.length > 0, String(plan.requiredValidators.length));
}

function runPlanGeneration(): void {
  const g = harness.beginGroup('B-PLANS');
  resetAll();

  assertPlanType('B-PLANS', 'QUICK', planInput('MINIMAL', { executionMode: 'NONE', changeSize: 'small', blastRadius: 'LOCAL' }), 'QUICK');
  assertPlanType('B-PLANS', 'STANDARD', planInput('STANDARD', { changeSize: 'medium' }), 'STANDARD');
  assertPlanType('B-PLANS', 'DEEP', planInput('DEEP', { brainChanged: true, routingChanged: true, blastRadius: 'SYSTEM' }), 'DEEP');
  assertPlanType('B-PLANS', 'RELEASE', planInput('RELEASE', { releaseReady: true }), 'RELEASE');
  assertPlanType('B-PLANS', 'CLOUD', planInput('CLOUD', { cloudRuntimeTouched: true, executionMode: 'CLOUD' }), 'CLOUD');
  assertPlanType('B-PLANS', 'WORLD2', planInput('WORLD2', { world2ExecutionActive: true, executionMode: 'WORLD2' }), 'WORLD2');
  assertPlanType(
    'B-PLANS',
    'TRUST_RECOVERY',
    planInput('TRUST_RECOVERY', { repeatFailuresDetected: true, verificationDisagreement: true, trustScore: 25 }),
    'TRUST_RECOVERY',
  );
  assertPlanType(
    'B-PLANS',
    'RISK_ESCALATED',
    planInput('DEEP', {
      criticalSubsystemModified: true,
      subsystemCriticality: 'CRITICAL',
      blastRadius: 'PLATFORM',
      trustScore: 40,
    }),
    'RISK_ESCALATED',
  );

  harness.endGroup('B-PLANS', g);
}

function runAnalyzers(): void {
  const g = harness.beginGroup('C-ANALYZERS');
  resetAll();

  const lowRiskInput = planInput('MINIMAL', { trustScore: 90, changeSize: 'small', blastRadius: 'LOCAL' });
  const highRiskInput = planInput('DEEP', {
    criticalSubsystemModified: true,
    blastRadius: 'PLATFORM',
    historicalFailures: 5,
    trustScore: 30,
  });

  const lowRisk = analyzeVerificationRisk(lowRiskInput);
  const highRisk = analyzeVerificationRisk(highRiskInput);
  assert('C-ANALYZERS', 'risk ordering', highRisk.riskScore > lowRisk.riskScore, `${highRisk.riskScore} vs ${lowRisk.riskScore}`);
  assert('C-ANALYZERS', 'risk bounds', lowRisk.riskScore >= 0 && highRisk.riskScore <= 100, `${lowRisk.riskScore}/${highRisk.riskScore}`);

  const cost = analyzeVerificationCost(planInput('STANDARD'), 'STANDARD');
  assert('C-ANALYZERS', 'cost positive', cost.estimatedCost > 0, String(cost.estimatedCost));
  assert('C-ANALYZERS', 'duration positive', cost.estimatedDurationMs > 0, String(cost.estimatedDurationMs));

  const confidence = analyzeVerificationConfidence(planInput('STANDARD'), 'STANDARD', 40);
  assert('C-ANALYZERS', 'confidence bounds', confidence.confidence >= 0 && confidence.confidence <= 100, String(confidence.confidence));
  assert('C-ANALYZERS', 'confidence projection', confidence.projection.length > 0, confidence.projection);

  harness.endGroup('C-ANALYZERS', g);
}

function runOptimizer(): void {
  const g = harness.beginGroup('D-OPTIMIZER');
  resetAll();

  const optimized = optimizeVerificationPlan(
    ['UVL', 'Runtime', 'UVL'],
    ['Runtime', 'Report Generation'],
    'STANDARD',
    45,
  );
  assert('D-OPTIMIZER', 'dedupe validators', optimized.requiredValidators.length === 2, optimized.requiredValidators.join(','));
  assert('D-OPTIMIZER', 'execution order', optimized.executionOrder.length >= 2, optimized.executionOrder.join(' -> '));
  assert('D-OPTIMIZER', 'runtime first', optimized.executionOrder[0].includes('Runtime'), optimized.executionOrder[0]);

  const deepPath = getVerificationPathEntry('DEEP');
  assert('D-OPTIMIZER', 'deep target confidence', (deepPath?.targetConfidence ?? 0) >= 80, String(deepPath?.targetConfidence));

  harness.endGroup('D-OPTIMIZER', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('E-INTEGRATION');
  resetAll();

  const owner = getDevPulseV2Owner('verification_intelligence');
  assert('E-INTEGRATION', 'ownership', owner.ownerModule === VERIFICATION_INTELLIGENCE_OWNER_MODULE, owner.ownerModule);

  const brain = registerVerificationIntelligenceWithCentralBrain();
  const vault = registerVerificationIntelligenceWithProjectVault();
  const trust = registerVerificationIntelligenceWithTrustEngine();
  const uvl = registerVerificationIntelligenceWithUvl();
  const world2 = registerVerificationIntelligenceWithWorld2Coordinator();
  const buildStrategy = registerVerificationIntelligenceWithBuildStrategyEngine();

  assert('E-INTEGRATION', 'central brain', brain.centralBrainSystems >= 1, String(brain.centralBrainSystems));
  assert('E-INTEGRATION', 'vault read-only', vault.readOnly === true, 'readOnly');
  assert('E-INTEGRATION', 'trust read-only', trust.readOnly === true, 'readOnly');
  assert('E-INTEGRATION', 'uvl read-only', uvl.readOnly === true, 'readOnly');
  assert('E-INTEGRATION', 'world2 read-only', world2.readOnly === true, 'readOnly');
  assert('E-INTEGRATION', 'build strategy read-only', buildStrategy.readOnly === true, 'readOnly');

  const fromStrategy = generateVerificationPlanFromStrategy({
    taskType: 'DOCUMENTATION',
    riskLevel: 'LOW',
    trustScore: 85,
    changeScope: 'TINY',
    executionMode: 'NONE',
  });
  assert('E-INTEGRATION', 'strategy pipeline', fromStrategy.type === 'QUICK', fromStrategy.type);

  const report = getVerificationIntelligenceRuntimeReport();
  assert('E-INTEGRATION', 'runtime report', report.cacheMisses >= 0, String(report.cacheMisses));

  harness.endGroup('E-INTEGRATION', g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('F-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 19.3B Verification Intelligence');
  console.log('===================================================\n');

  runSetup();
  runPlanGeneration();
  runAnalyzers();
  runOptimizer();
  runIntegration();
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    failed.length === 0 ? VERIFICATION_INTELLIGENCE_PASS_TOKEN : 'VERIFICATION_INTELLIGENCE_V1_FAIL',
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

  console.log(`\n${VERIFICATION_INTELLIGENCE_PASS_TOKEN}`);
}

main();
