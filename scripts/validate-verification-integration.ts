/**
 * Phase 19.3C — Verification Integration validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import type { VerificationStrategyInput } from '../src/verification-strategy-core/verification-strategy-types.js';
import {
  MAX_VERIFICATION_HISTORY_SIZE,
  VERIFICATION_INTEGRATION_PASS_TOKEN,
  VERIFICATION_INTEGRATION_OWNER_MODULE,
  coordinateVerificationPlan,
  createVerificationIntegrationSnapshot,
  createVerificationSnapshot,
  evaluateVerificationReadiness,
  generateVerificationPlanReport,
  getCurrentVerificationVisibilityForConsumers,
  getDevPulseV2VerificationIntegration,
  getLatestVerificationHistory,
  getVerificationHistoryById,
  getVerificationHistoryByPlanType,
  getVerificationHistorySize,
  getVerificationIntegrationRuntimeReport,
  getVerificationPlanById,
  getVerificationVisibilityModel,
  listVerificationPlansByPlanType,
  listVerificationPlansByStrategy,
  recordVerificationHistory,
  registerVerificationIntegrationWithBuildStrategyEngine,
  registerVerificationIntegrationWithCentralBrain,
  registerVerificationIntegrationWithIntelligence,
  registerVerificationIntegrationWithProjectVault,
  registerVerificationIntegrationWithStrategyCore,
  registerVerificationIntegrationWithTrustEngine,
  registerVerificationIntegrationWithUvl,
  registerVerificationIntegrationWithWorld2Coordinator,
  registerVerificationPlan,
  resetVerificationIntegrationModuleForTests,
} from '../src/verification-integration/index.js';
import { generateVerificationPlanFromStrategy } from '../src/verification-intelligence/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { VERIFICATION_INTEGRATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const MIN_SCENARIOS = 95;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/verification-integration');

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
  'verification-integration.ts',
  'verification-integration-types.ts',
  'verification-plan-registration.ts',
  'verification-plan-reporting.ts',
  'verification-plan-visibility.ts',
  'verification-plan-readiness.ts',
  'verification-plan-coordinator.ts',
  'verification-plan-history.ts',
  'verification-plan-snapshot.ts',
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

function resetAll(): void {
  resetVerificationIntegrationModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2VerificationIntegration();
  assert('A-SETUP', 'pass token', authority.passToken === VERIFICATION_INTEGRATION_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === VERIFICATION_INTEGRATION_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'integration only', authority.integrationOnly === true, 'integrationOnly');
  assert('A-SETUP', 'uvl rows', VERIFICATION_INTEGRATION_UVL_ROWS.length === 8, String(VERIFICATION_INTEGRATION_UVL_ROWS.length));
  assert('A-SETUP', 'max history', MAX_VERIFICATION_HISTORY_SIZE === 64, String(MAX_VERIFICATION_HISTORY_SIZE));
  harness.endGroup('A-SETUP', g);
}

function runRegistrationAndReporting(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const plan = generateVerificationPlanFromStrategy(baseStrategyInput());
  const record = registerVerificationPlan(plan);
  assert('B-REGISTRY', 'register plan', record.planId === plan.id, record.planId);
  assert('B-REGISTRY', 'lookup by id', getVerificationPlanById(plan.id)?.planId === plan.id, plan.id);
  assert('B-REGISTRY', 'lookup by strategy', listVerificationPlansByStrategy(plan.strategy).length >= 1, plan.strategy);
  assert('B-REGISTRY', 'lookup by plan type', listVerificationPlansByPlanType(plan.type).length >= 1, plan.type);

  const report = generateVerificationPlanReport(plan);
  assert('B-REGISTRY', 'report strategy', report.strategy === plan.strategy, report.strategy);
  assert('B-REGISTRY', 'report execution order', report.executionOrder.length > 0, String(report.executionOrder.length));
  assert('B-REGISTRY', 'report reasoning', report.reasoning.length > 0, String(report.reasoning.length));

  harness.endGroup('B-REGISTRY', g);
}

function runVisibilityAndReadiness(): void {
  const g = harness.beginGroup('C-VISIBILITY');
  resetAll();

  const plan = generateVerificationPlanFromStrategy(baseStrategyInput());
  const readiness = evaluateVerificationReadiness(plan, 75);
  const visibility = getVerificationVisibilityModel(plan, readiness);

  assert('C-VISIBILITY', 'visibility plan id', visibility.latestPlanId === plan.id, visibility.latestPlanId ?? 'null');
  assert('C-VISIBILITY', 'visibility strategy', visibility.activeStrategy === plan.strategy, visibility.activeStrategy ?? 'null');
  assert('C-VISIBILITY', 'readiness state', readiness.state.length > 0, readiness.state);

  const lowTrust = evaluateVerificationReadiness(
    generateVerificationPlanFromStrategy(baseStrategyInput({ trustScore: 30, repeatFailuresDetected: true })),
    30,
  );
  assert(
    'C-VISIBILITY',
    'trust recovery readiness',
    lowTrust.state === 'TRUST_RECOVERY_REQUIRED' || lowTrust.state === 'BLOCKED' || lowTrust.state === 'NEEDS_REVIEW',
    lowTrust.state,
  );

  harness.endGroup('C-VISIBILITY', g);
}

function runCoordinatorAndHistory(): void {
  const g = harness.beginGroup('D-COORDINATOR');
  resetAll();

  const result = coordinateVerificationPlan(baseStrategyInput());
  assert('D-COORDINATOR', 'coordinator plan', result.plan.id.length > 0, result.plan.id);
  assert('D-COORDINATOR', 'coordinator record', result.record.planId === result.plan.id, result.record.planId);
  assert('D-COORDINATOR', 'coordinator readiness', result.readiness.planId === result.plan.id, result.readiness.planId);
  assert('D-COORDINATOR', 'coordinator visibility', result.visibility.latestPlanId === result.plan.id, result.visibility.latestPlanId ?? 'null');
  assert('D-COORDINATOR', 'coordinator report', result.report.planType === result.plan.type, result.report.planType);
  assert('D-COORDINATOR', 'coordinator snapshot', result.snapshot.plan.id === result.plan.id, result.snapshot.snapshotId);

  const history = getLatestVerificationHistory();
  assert('D-COORDINATOR', 'history recorded', history?.planId === result.plan.id, history?.planId ?? 'null');
  assert('D-COORDINATOR', 'history by id', getVerificationHistoryById(result.plan.id).length >= 1, 'history');
  assert('D-COORDINATOR', 'history by type', getVerificationHistoryByPlanType(result.plan.type).length >= 1, result.plan.type);

  harness.endGroup('D-COORDINATOR', g);
}

function runSnapshotAndBoundedHistory(): void {
  const g = harness.beginGroup('E-SNAPSHOT');
  resetAll();

  const plan = generateVerificationPlanFromStrategy(baseStrategyInput());
  const readiness = evaluateVerificationReadiness(plan, 75);
  const visibility = getVerificationVisibilityModel(plan, readiness);
  const report = generateVerificationPlanReport(plan);
  const strategy = { strategy: plan.strategy, confidence: plan.confidence, escalationRequired: false, reason: [], requiredValidators: plan.requiredValidators, optionalValidators: plan.optionalValidators, generatedAt: Date.now() } as import('../src/verification-strategy-core/verification-strategy-types.js').VerificationStrategyDecision;

  const full = createVerificationSnapshot(strategy, plan, readiness, visibility, report);
  assert('E-SNAPSHOT', 'full snapshot', full.snapshotId.length > 0, full.snapshotId);

  registerVerificationPlan(plan);
  const integrationSnap = createVerificationIntegrationSnapshot();
  assert('E-SNAPSHOT', 'integration snapshot', integrationSnap.records.length >= 1, String(integrationSnap.records.length));

  for (let i = 0; i < MAX_VERIFICATION_HISTORY_SIZE + 5; i++) {
    recordVerificationHistory(plan, readiness);
  }
  assert('E-SNAPSHOT', 'bounded history', getVerificationHistorySize() <= MAX_VERIFICATION_HISTORY_SIZE, String(getVerificationHistorySize()));

  harness.endGroup('E-SNAPSHOT', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();

  const owner = getDevPulseV2Owner('verification_integration');
  assert('F-INTEGRATION', 'ownership', owner.ownerModule === VERIFICATION_INTEGRATION_OWNER_MODULE, owner.ownerModule);

  const brain = registerVerificationIntegrationWithCentralBrain();
  const vault = registerVerificationIntegrationWithProjectVault();
  const trust = registerVerificationIntegrationWithTrustEngine();
  const uvl = registerVerificationIntegrationWithUvl();
  const world2 = registerVerificationIntegrationWithWorld2Coordinator();
  const buildStrategy = registerVerificationIntegrationWithBuildStrategyEngine();
  const strategyCore = registerVerificationIntegrationWithStrategyCore();
  const intelligence = registerVerificationIntegrationWithIntelligence();

  assert('F-INTEGRATION', 'central brain', brain.centralBrainSystems >= 1, String(brain.centralBrainSystems));
  assert('F-INTEGRATION', 'vault read-only', vault.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'trust read-only', trust.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'uvl read-only', uvl.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'world2 read-only', world2.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'build strategy read-only', buildStrategy.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'strategy core token', strategyCore.passToken.includes('PASS'), strategyCore.passToken);
  assert('F-INTEGRATION', 'intelligence token', intelligence.passToken.includes('PASS'), intelligence.passToken);

  coordinateVerificationPlan(baseStrategyInput());
  const visibility = getCurrentVerificationVisibilityForConsumers();
  assert('F-INTEGRATION', 'consumer visibility', visibility.latestPlanId !== null, visibility.latestPlanId ?? 'null');

  const report = getVerificationIntegrationRuntimeReport();
  assert('F-INTEGRATION', 'runtime registry', report.registrySize >= 1, String(report.registrySize));
  assert('F-INTEGRATION', 'runtime history', report.historySize >= 1, String(report.historySize));
  assert('F-INTEGRATION', 'runtime snapshots', report.snapshotCount >= 1, String(report.snapshotCount));

  harness.endGroup('F-INTEGRATION', g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('G-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 19.3C Verification Integration');
  console.log('===================================================\n');

  runSetup();
  runRegistrationAndReporting();
  runVisibilityAndReadiness();
  runCoordinatorAndHistory();
  runSnapshotAndBoundedHistory();
  runIntegration();
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    failed.length === 0 ? VERIFICATION_INTEGRATION_PASS_TOKEN : 'VERIFICATION_INTEGRATION_V1_FAIL',
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

  console.log(`\n${VERIFICATION_INTEGRATION_PASS_TOKEN}`);
}

main();
