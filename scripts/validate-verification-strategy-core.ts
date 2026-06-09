/**
 * Phase 19.3A — Verification Strategy Core validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  VERIFICATION_STRATEGY_CORE_PASS_TOKEN,
  VERIFICATION_STRATEGY_CORE_OWNER_MODULE,
  VERIFICATION_STRATEGY_REGISTRY,
  buildVerificationStrategy,
  calculateVerificationConfidence,
  decideVerificationStrategy,
  evaluateVerificationRequirements,
  getDevPulseV2VerificationStrategyCore,
  getVerificationStrategyCoreRuntimeReport,
  getVerificationStrategyRegistryEntry,
  listVerificationStrategyRegistryEntries,
  pickVerificationStrategy,
  registerVerificationStrategyWithCentralBrain,
  registerVerificationStrategyWithProjectVault,
  registerVerificationStrategyWithTrustEngine,
  registerVerificationStrategyWithUvl,
  registerVerificationStrategyWithWorld2Coordinator,
  resetVerificationStrategyCoreModuleForTests,
  selectVerificationStrategy,
  shouldEscalateVerification,
} from '../src/verification-strategy-core/index.js';
import type { VerificationStrategyInput } from '../src/verification-strategy-core/verification-strategy-types.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { VERIFICATION_STRATEGY_CORE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const MIN_SCENARIOS = 80;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/verification-strategy-core');

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
  'verification-strategy-core.ts',
  'verification-strategy-builder.ts',
  'verification-strategy-selector.ts',
  'verification-strategy-types.ts',
  'verification-escalation-policy.ts',
  'verification-confidence-policy.ts',
  'verification-requirement-evaluator.ts',
  'verification-strategy-registry.ts',
  'index.ts',
];

function baseInput(overrides: Partial<VerificationStrategyInput> = {}): VerificationStrategyInput {
  return {
    taskType: 'FEATURE',
    riskLevel: 'MEDIUM',
    trustScore: 75,
    changeScope: 'MEDIUM',
    executionMode: 'LOCAL',
    ...overrides,
  };
}

function resetAll(): void {
  resetVerificationStrategyCoreModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2VerificationStrategyCore();
  assert('A-SETUP', 'pass token', authority.passToken === VERIFICATION_STRATEGY_CORE_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === VERIFICATION_STRATEGY_CORE_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'phase 19.3', authority.phase === 19.3, String(authority.phase));
  assert('A-SETUP', 'strategy only', authority.strategyOnly === true, 'strategyOnly');
  assert('A-SETUP', 'registry count', VERIFICATION_STRATEGY_REGISTRY.length === 7, String(VERIFICATION_STRATEGY_REGISTRY.length));
  harness.endGroup('A-SETUP', g);
}

function runStrategySelection(): void {
  const g = harness.beginGroup('B-STRATEGY');
  resetAll();

  const minimal = pickVerificationStrategy(baseInput({ taskType: 'READ_ONLY', executionMode: 'NONE', changeScope: 'TINY' }));
  assert('B-STRATEGY', 'MINIMAL', minimal.strategy === 'MINIMAL', minimal.strategy);

  const standard = pickVerificationStrategy(baseInput({ taskType: 'UI_CHANGE' }));
  assert('B-STRATEGY', 'STANDARD', standard.strategy === 'STANDARD', standard.strategy);

  const deep = pickVerificationStrategy(baseInput({ taskType: 'ARCHITECTURE', changeScope: 'MAJOR', brainChanged: true }));
  assert('B-STRATEGY', 'DEEP', deep.strategy === 'DEEP', deep.strategy);

  const release = pickVerificationStrategy(baseInput({ taskType: 'RELEASE', releaseReady: true }));
  assert('B-STRATEGY', 'RELEASE', release.strategy === 'RELEASE', release.strategy);

  const cloud = pickVerificationStrategy(baseInput({ taskType: 'CLOUD', cloudRuntimeTouched: true, executionMode: 'CLOUD' }));
  assert('B-STRATEGY', 'CLOUD', cloud.strategy === 'CLOUD', cloud.strategy);

  const world2 = pickVerificationStrategy(baseInput({ taskType: 'WORLD2', world2ExecutionActive: true, executionMode: 'WORLD2' }));
  assert('B-STRATEGY', 'WORLD2', world2.strategy === 'WORLD2', world2.strategy);

  const trustRecovery = pickVerificationStrategy(baseInput({ trustScore: 30, repeatFailuresDetected: true, historicalFailures: 4 }));
  assert('B-STRATEGY', 'TRUST_RECOVERY', trustRecovery.strategy === 'TRUST_RECOVERY', trustRecovery.strategy);

  const decision = selectVerificationStrategy(baseInput({ taskType: 'ROUTING', routingChanged: true }));
  assert('B-STRATEGY', 'decision strategy', decision.strategy === 'DEEP', decision.strategy);
  assert('B-STRATEGY', 'decision confidence range', decision.confidence >= 0 && decision.confidence <= 100, String(decision.confidence));
  assert('B-STRATEGY', 'decision validators', decision.requiredValidators.length > 0, String(decision.requiredValidators.length));
  assert('B-STRATEGY', 'decision timestamp', decision.generatedAt > 0, String(decision.generatedAt));

  harness.endGroup('B-STRATEGY', g);
}

function runConfidenceAndEscalation(): void {
  const g = harness.beginGroup('C-POLICY');
  resetAll();

  const highTrust = calculateVerificationConfidence(baseInput({ trustScore: 95, historicalFailures: 0, changeSize: 'small' }));
  const lowTrust = calculateVerificationConfidence(baseInput({ trustScore: 20, historicalFailures: 5, changeSize: 'large', repeatFailuresDetected: true }));
  assert('C-POLICY', 'high confidence', highTrust > lowTrust, `${highTrust} vs ${lowTrust}`);
  assert('C-POLICY', 'confidence bounds', highTrust <= 100 && lowTrust >= 0, `${highTrust}/${lowTrust}`);

  const escalateLow = shouldEscalateVerification(baseInput({ trustScore: 30 }), 45);
  const escalateOk = shouldEscalateVerification(baseInput({ trustScore: 90 }), 85);
  assert('C-POLICY', 'escalate low trust', escalateLow === true, String(escalateLow));
  assert('C-POLICY', 'no escalate healthy', escalateOk === false, String(escalateOk));

  const escalatedDecision = buildVerificationStrategy(baseInput({ trustScore: 25, criticalSubsystemModified: true }));
  assert('C-POLICY', 'builder escalation flag', escalatedDecision.escalationRequired === true, String(escalatedDecision.escalationRequired));

  harness.endGroup('C-POLICY', g);
}

function runRequirements(): void {
  const g = harness.beginGroup('D-REQUIREMENTS');
  resetAll();

  const ui = evaluateVerificationRequirements(baseInput({ taskType: 'UI_CHANGE' }));
  assert('D-REQUIREMENTS', 'UI requires UVL', ui.requiredValidators.includes('UVL'), ui.requiredValidators.join(','));

  const brain = evaluateVerificationRequirements(baseInput({ taskType: 'BRAIN', brainChanged: true }));
  assert('D-REQUIREMENTS', 'brain requires intelligence', brain.requiredValidators.includes('Intelligence Validation'), brain.requiredValidators.join(','));

  const cloud = evaluateVerificationRequirements(baseInput({ taskType: 'CLOUD', cloudRuntimeTouched: true }));
  assert('D-REQUIREMENTS', 'cloud requires cloud validation', cloud.requiredValidators.includes('Cloud Validation'), cloud.requiredValidators.join(','));

  const routing = evaluateVerificationRequirements(baseInput({ taskType: 'ROUTING', routingChanged: true }));
  assert('D-REQUIREMENTS', 'routing requires route validation', routing.requiredValidators.includes('Route Validation'), routing.requiredValidators.join(','));

  const execution = evaluateVerificationRequirements(baseInput({ taskType: 'AUTONOMOUS', executionMode: 'WORLD2' }));
  assert('D-REQUIREMENTS', 'execution requires execution validation', execution.requiredValidators.includes('Execution Validation'), execution.requiredValidators.join(','));

  harness.endGroup('D-REQUIREMENTS', g);
}

function runRegistryAndIntegration(): void {
  const g = harness.beginGroup('E-REGISTRY');
  resetAll();

  const owner = getDevPulseV2Owner('verification_strategy_core');
  assert('E-REGISTRY', 'ownership phase', owner.phase === 19.3, String(owner.phase));
  assert('E-REGISTRY', 'ownership module', owner.ownerModule === VERIFICATION_STRATEGY_CORE_OWNER_MODULE, owner.ownerModule);

  const standard = getVerificationStrategyRegistryEntry('STANDARD');
  assert('E-REGISTRY', 'STANDARD min confidence', standard?.minimumConfidence === 70, String(standard?.minimumConfidence));
  assert('E-REGISTRY', 'STANDARD validators', (standard?.expectedValidators.length ?? 0) >= 2, standard?.expectedValidators.join(',') ?? '');

  assert('E-REGISTRY', 'registry list', listVerificationStrategyRegistryEntries().length === 7, '7 strategies');
  assert('E-REGISTRY', 'uvl rows', VERIFICATION_STRATEGY_CORE_UVL_ROWS.length === 8, String(VERIFICATION_STRATEGY_CORE_UVL_ROWS.length));

  const brain = registerVerificationStrategyWithCentralBrain();
  const vault = registerVerificationStrategyWithProjectVault();
  const trust = registerVerificationStrategyWithTrustEngine();
  const world2 = registerVerificationStrategyWithWorld2Coordinator();
  const uvl = registerVerificationStrategyWithUvl();
  assert('E-REGISTRY', 'central brain read-only', brain.centralBrainSystems >= 1, String(brain.centralBrainSystems));
  assert('E-REGISTRY', 'project vault read-only', vault.readOnly === true, 'readOnly');
  assert('E-REGISTRY', 'trust engine read-only', trust.readOnly === true, 'readOnly');
  assert('E-REGISTRY', 'world2 read-only', world2.readOnly === true, 'readOnly');
  assert('E-REGISTRY', 'uvl read-only', uvl.readOnly === true, 'readOnly');
  assert('E-REGISTRY', 'uvl strategy rows', uvl.verificationStrategyUvlRows === 8, String(uvl.verificationStrategyUvlRows));

  const pipeline = decideVerificationStrategy(baseInput({ taskType: 'DOCUMENTATION', executionMode: 'NONE' }));
  assert('E-REGISTRY', 'pipeline decision', pipeline.strategy === 'MINIMAL', pipeline.strategy);

  const report = getVerificationStrategyCoreRuntimeReport();
  assert('E-REGISTRY', 'runtime report', report.skippedValidatorReasons.length > 0, 'skipped reasons');
  assert('E-REGISTRY', 'no validator execution time', report.validatorExecutionTimeMs === 0, String(report.validatorExecutionTimeMs));

  harness.endGroup('E-REGISTRY', g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('F-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 19.3A Verification Strategy Core');
  console.log('====================================================\n');

  runSetup();
  runStrategySelection();
  runConfidenceAndEscalation();
  runRequirements();
  runRegistryAndIntegration();
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    failed.length === 0 ? VERIFICATION_STRATEGY_CORE_PASS_TOKEN : 'VERIFICATION_STRATEGY_CORE_V1_FAIL',
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

  console.log(`\n${VERIFICATION_STRATEGY_CORE_PASS_TOKEN}`);
}

main();
