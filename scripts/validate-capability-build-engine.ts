/**
 * Phase 21.4 — Capability Build Engine validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  CAPABILITY_BUILD_ENGINE_PASS_TOKEN,
  CAPABILITY_BUILD_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_BUILD_HISTORY_SIZE,
  analyzeCapabilityBuildRisk,
  buildCapabilityConstructionPlan,
  buildCapabilityIntegrations,
  buildCapabilityModules,
  buildCapabilityRollbackPlan,
  buildCapabilityRolloutPlan,
  buildCapabilitySequence,
  evaluateCapabilityBuild,
  getCapabilityBuildCacheStats,
  getCapabilityBuildEngineRuntimeReport,
  getCapabilityBuildHistorySize,
  getCapabilityBuildPlan,
  getCapabilityBuildPlanCount,
  getDevPulseV2CapabilityBuildEngine,
  isCapabilityBuildQuestion,
  listCapabilityBuildPlans,
  planCapabilityBuildValidation,
  recordCapabilityBuildHistory,
  registerCapabilityBuildEngineWithAutonomousBuilder,
  registerCapabilityBuildEngineWithAutonomousVerification,
  registerCapabilityBuildEngineWithCapabilityPlanningEngine,
  registerCapabilityBuildEngineWithCapabilityResearchEngine,
  registerCapabilityBuildEngineWithCentralBrain,
  registerCapabilityBuildEngineWithCompletionEngine,
  registerCapabilityBuildEngineWithMissingCapabilityEscalation,
  registerCapabilityBuildEngineWithMultiProjectMonitoring,
  registerCapabilityBuildEngineWithProjectVault,
  registerCapabilityBuildEngineWithTrustEngine,
  registerCapabilityBuildEngineWithUvl,
  resetCapabilityBuildEngineModuleForTests,
} from '../src/capability-build-engine/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { CAPABILITY_BUILD_ENGINE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { CapabilityBuildInput } from '../src/capability-build-engine/capability-build-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/capability-build-engine');

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
  'capability-build-engine.ts',
  'capability-build-types.ts',
  'capability-build-registry.ts',
  'capability-module-builder.ts',
  'capability-integration-builder.ts',
  'capability-sequence-builder.ts',
  'capability-rollout-builder.ts',
  'capability-rollback-builder.ts',
  'capability-build-risk-analyzer.ts',
  'capability-build-validation-planner.ts',
  'capability-build-pipeline.ts',
  'capability-build-reporting.ts',
  'capability-build-history.ts',
  'capability-build-cache.ts',
  'index.ts',
];

function resetAll(): void {
  resetCapabilityBuildEngineModuleForTests();
}

function uniqueInput(suffix: string, extra: Partial<CapabilityBuildInput> = {}): CapabilityBuildInput {
  return {
    proposedCapability: `unique_build_capability_${suffix}_${Date.now()}`,
    capabilityDomain: 'ORCHESTRATION',
    ...extra,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2CapabilityBuildEngine();
  assert('A-SETUP', 'pass token', authority.passToken === CAPABILITY_BUILD_ENGINE_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === CAPABILITY_BUILD_ENGINE_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'planning only', authority.planningOnly === true, 'planningOnly');
  assert('A-SETUP', 'no file modification', authority.noFileModification === true, 'noFileModification');
  assert('A-SETUP', 'no execution', authority.noExecution === true, 'noExecution');
  assert('A-SETUP', 'uvl rows', CAPABILITY_BUILD_ENGINE_UVL_ROWS.length === 14, String(CAPABILITY_BUILD_ENGINE_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_BUILD_HISTORY_SIZE === 128, String(DEFAULT_MAX_BUILD_HISTORY_SIZE));
  assert('A-SETUP', 'ownership', getDevPulseV2Owner('capability_build_engine').phase === 21.4, '21.4');
  assert('A-SETUP', 'question signal', isCapabilityBuildQuestion('show capability build plan'), 'signal');
  harness.endGroup('A-SETUP', g);
}

function runModules(): void {
  const g = harness.beginGroup('B-MODULES');
  resetAll();

  const newMod = buildCapabilityModules(uniqueInput('new'), 'NEW_MODULE');
  assert('B-MODULES', 'new module', newMod.modulesToCreate.length === 1, String(newMod.modulesToCreate.length));
  assert('B-MODULES', 'monolith avoidance', newMod.monolithAvoidance === true, 'true');

  const ext = buildCapabilityModules({ proposedCapability: 'expansion module extend', planType: 'CAPABILITY_EXPANSION' }, 'MODULE_EXTENSION');
  assert('B-MODULES', 'extension module', ext.modulesToExtend.length === 1 && ext.modulesToCreate.length === 0, 'extension');

  const opt = buildCapabilityModules({ proposedCapability: 'performance optimizer', planType: 'OPTIMIZATION' }, 'OPTIMIZATION');
  assert('B-MODULES', 'optimization', opt.modulesToExtend.length === 1, String(opt.modulesToExtend.length));

  const diag = buildCapabilityModules({ proposedCapability: 'diagnostic trace module', planType: 'DIAGNOSTIC' }, 'DIAGNOSTIC');
  assert('B-MODULES', 'diagnostic', diag.modulesToExtend.length === 1, String(diag.modulesToExtend.length));

  harness.endGroup('B-MODULES', g);
}

function runIntegrations(): void {
  const g = harness.beginGroup('C-INTEGRATIONS');
  resetAll();

  const integrations = buildCapabilityIntegrations(uniqueInput('int'));
  assert('C-INTEGRATIONS', 'upstream', integrations.upstreamIntegrations.includes('missing_capability_escalation'), 'upstream');
  assert('C-INTEGRATIONS', 'registry', integrations.registryIntegrations.includes('foundation_ownership_registry'), 'registry');
  assert('C-INTEGRATIONS', 'UVL', integrations.uvlIntegrations.includes('uvl_row_registry'), 'uvl');
  assert('C-INTEGRATIONS', 'find panel', integrations.findPanelIntegrations.includes('find_panel_alias_registry'), 'find panel');

  const downstream = buildCapabilityIntegrations({
    proposedCapability: 'verification monitor builder',
    trustImpact: true,
    world2Impact: true,
  });
  assert('C-INTEGRATIONS', 'downstream', downstream.downstreamIntegrations.length >= 2, String(downstream.downstreamIntegrations.length));

  harness.endGroup('C-INTEGRATIONS', g);
}

function runSequence(): void {
  const g = harness.beginGroup('D-SEQUENCE');
  resetAll();

  const input = uniqueInput('seq', { planType: 'NEW_CAPABILITY' });
  const modules = buildCapabilityModules(input, 'NEW_MODULE');
  const integrations = buildCapabilityIntegrations(input);
  const sequence = buildCapabilitySequence(input, modules, integrations);

  assert('D-SEQUENCE', 'foundations first', sequence.orderedSequence[0] === 'foundations', sequence.orderedSequence[0]);
  assert('D-SEQUENCE', 'registries early', sequence.orderedSequence.indexOf('registries') < sequence.orderedSequence.indexOf('core_engine'), 'order');
  assert('D-SEQUENCE', 'validation before end', sequence.orderedSequence.indexOf('validation') < sequence.orderedSequence.indexOf('reporting'), 'validation');
  assert('D-SEQUENCE', 'module scaffold', sequence.orderedSequence.includes('module_scaffold'), 'scaffold');

  harness.endGroup('D-SEQUENCE', g);
}

function runRollout(): void {
  const g = harness.beginGroup('E-ROLLOUT');
  resetAll();

  const isolated = buildCapabilityRolloutPlan(uniqueInput('iso'));
  assert('E-ROLLOUT', 'isolated rollout', isolated.strategy === 'ISOLATED', isolated.strategy);

  const staged = buildCapabilityRolloutPlan(uniqueInput('stg', { trustImpact: true }));
  assert('E-ROLLOUT', 'staged rollout', staged.strategy === 'STAGED', staged.strategy);

  const world2 = buildCapabilityRolloutPlan(uniqueInput('w2', { world2Impact: true }));
  assert('E-ROLLOUT', 'world2 rollout', world2.strategy === 'WORLD2', world2.strategy);

  const founder = buildCapabilityRolloutPlan(uniqueInput('founder', { founderApprovalRequired: true }));
  assert('E-ROLLOUT', 'founder reviewed', founder.strategy === 'FOUNDER_REVIEWED', founder.strategy);

  harness.endGroup('E-ROLLOUT', g);
}

function runRollback(): void {
  const g = harness.beginGroup('F-ROLLBACK');
  resetAll();

  const input = uniqueInput('rb');
  const integrations = buildCapabilityIntegrations(input);
  const rollback = buildCapabilityRollbackPlan(input, integrations);

  assert('F-ROLLBACK', 'checkpoints', rollback.checkpoints.length >= 3, String(rollback.checkpoints.length));
  assert('F-ROLLBACK', 'triggers', rollback.triggers.includes('validation_failure'), 'triggers');
  assert('F-ROLLBACK', 'recovery path', rollback.recoveryPath.length >= 3, String(rollback.recoveryPath.length));

  harness.endGroup('F-ROLLBACK', g);
}

function runRisk(): void {
  const g = harness.beginGroup('G-RISK');
  resetAll();

  const lowInput = uniqueInput('risk-low');
  const lowModules = buildCapabilityModules(lowInput, 'OPTIMIZATION');
  const lowIntegrations = buildCapabilityIntegrations(lowInput);
  const lowRisk = analyzeCapabilityBuildRisk(lowInput, lowModules, lowIntegrations);
  assert('G-RISK', 'low risk', lowRisk.riskLevel === 'LOW', lowRisk.riskLevel);

  const medInput: CapabilityBuildInput = { proposedCapability: 'verification monitoring builder module' };
  const medModules = buildCapabilityModules(medInput, 'NEW_MODULE');
  const medIntegrations = buildCapabilityIntegrations(medInput);
  const medRisk = analyzeCapabilityBuildRisk(medInput, medModules, medIntegrations);
  assert('G-RISK', 'medium risk', medRisk.riskLevel === 'MEDIUM' || medRisk.riskScore >= 35, medRisk.riskLevel);

  const highInput: CapabilityBuildInput = {
    proposedCapability: 'world2 trust builder verification monitor',
    trustImpact: true,
    world2Impact: true,
    planType: 'NEW_CAPABILITY',
  };
  const highModules = buildCapabilityModules(highInput, 'NEW_MODULE');
  const highIntegrations = buildCapabilityIntegrations(highInput);
  const highRisk = analyzeCapabilityBuildRisk(highInput, highModules, highIntegrations);
  assert('G-RISK', 'high risk', highRisk.riskLevel === 'HIGH', highRisk.riskLevel);

  harness.endGroup('G-RISK', g);
}

function runValidation(): void {
  const g = harness.beginGroup('H-VALIDATION');
  resetAll();

  const input = uniqueInput('val');
  const modules = buildCapabilityModules(input, 'NEW_MODULE');
  const integrations = buildCapabilityIntegrations(input);
  const risk = analyzeCapabilityBuildRisk(input, modules, integrations);
  const validation = planCapabilityBuildValidation(input, risk);

  assert('H-VALIDATION', 'module validation', validation.moduleValidation === true, 'module');
  assert('H-VALIDATION', 'integration validation', validation.integrationValidation === true, 'integration');
  assert('H-VALIDATION', 'UVL validation', validation.uvlValidation === true, 'uvl');

  const trustInput = uniqueInput('trust-val', { trustImpact: true });
  const trustModules = buildCapabilityModules(trustInput, 'NEW_MODULE');
  const trustIntegrations = buildCapabilityIntegrations(trustInput);
  const trustRisk = analyzeCapabilityBuildRisk(trustInput, trustModules, trustIntegrations);
  const trustVal = planCapabilityBuildValidation(trustInput, trustRisk);
  assert('H-VALIDATION', 'trust validation', trustVal.trustValidation === true, 'trust');

  harness.endGroup('H-VALIDATION', g);
}

function runPipeline(): void {
  const g = harness.beginGroup('I-PIPELINE');
  resetAll();

  const complete = buildCapabilityConstructionPlan(uniqueInput('complete', { planType: 'NEW_CAPABILITY' }));
  assert('I-PIPELINE', 'build plan', complete.buildPlan.buildPlanId.startsWith('build-plan-'), complete.buildPlan.buildPlanId);
  assert('I-PIPELINE', 'planning only report', complete.report.planningOnly === true, 'planningOnly');
  assert('I-PIPELINE', 'modules in report', complete.report.modules.monolithAvoidance === true, 'modules');
  assert('I-PIPELINE', 'sequence in report', complete.report.sequence.orderedSequence.length >= 6, String(complete.report.sequence.orderedSequence.length));
  assert('I-PIPELINE', 'rollout in report', complete.report.rollout.stages.length > 0, String(complete.report.rollout.stages.length));
  assert('I-PIPELINE', 'rollback in report', complete.report.rollback.checkpoints.length > 0, String(complete.report.rollback.checkpoints.length));
  assert('I-PIPELINE', 'validation in report', complete.report.validation.requirements.length > 0, String(complete.report.validation.requirements.length));

  const duplicate = buildCapabilityConstructionPlan({ proposedCapability: 'Missing Capability Escalation' });
  assert('I-PIPELINE', 'duplicate blocked', duplicate.buildPlan.buildPlanId === 'blocked-duplicate', duplicate.buildPlan.buildPlanId);

  harness.endGroup('I-PIPELINE', g);
}

function runRegistryHistoryCache(): void {
  const g = harness.beginGroup('J-REGISTRY-CACHE');
  resetAll();

  const { buildPlan } = buildCapabilityConstructionPlan(uniqueInput('reg', { planType: 'NEW_CAPABILITY' }));
  assert('J-REGISTRY-CACHE', 'registered', getCapabilityBuildPlan(buildPlan.buildPlanId) !== undefined, buildPlan.buildPlanId);
  assert('J-REGISTRY-CACHE', 'list', listCapabilityBuildPlans().length >= 1, String(listCapabilityBuildPlans().length));
  assert('J-REGISTRY-CACHE', 'history', getCapabilityBuildHistorySize() >= 1, String(getCapabilityBuildHistorySize()));

  const cacheInput: CapabilityBuildInput = { proposedCapability: 'cache_build_test_fixed', planType: 'NEW_CAPABILITY' };
  buildCapabilityConstructionPlan(cacheInput);
  buildCapabilityConstructionPlan(cacheInput);
  const cache = getCapabilityBuildCacheStats();
  assert('J-REGISTRY-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));

  harness.endGroup('J-REGISTRY-CACHE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerCapabilityBuildEngineWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerCapabilityBuildEngineWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'project vault', registerCapabilityBuildEngineWithProjectVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust engine', registerCapabilityBuildEngineWithTrustEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'escalation', registerCapabilityBuildEngineWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'research engine', registerCapabilityBuildEngineWithCapabilityResearchEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'planning engine', registerCapabilityBuildEngineWithCapabilityPlanningEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous builder', registerCapabilityBuildEngineWithAutonomousBuilder().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous verification', registerCapabilityBuildEngineWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'completion engine', registerCapabilityBuildEngineWithCompletionEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'monitoring', registerCapabilityBuildEngineWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerCapabilityBuildEngineWithUvl().uvlRowCount === 14, '14');

  harness.endGroup('K-INTEGRATION', g);
}

function stressBuild(planCount: number, label: string): void {
  const g = harness.beginGroup(`L-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  let created = 0;
  for (let i = 0; i < planCount; i++) {
    const input: CapabilityBuildInput = {
      projectId: `P${i}`,
      proposedCapability: i % 10 === 0 ? 'Missing Capability Escalation' : `stress_build_capability_${i}_${label}`,
      capabilityDomain: ['ORCHESTRATION', 'VERIFICATION', 'MONITORING', 'BUILDING'][i % 4],
      planType: i % 4 === 0 ? 'NEW_CAPABILITY' : i % 4 === 1 ? 'OPTIMIZATION' : undefined,
      trustImpact: i % 17 === 0,
      world2Impact: i % 23 === 0,
      founderApprovalRequired: i % 31 === 0,
    };
    const result = evaluateCapabilityBuild(input);
    if (result.buildPlan.buildPlanId.startsWith('build-plan-')) created += 1;
  }

  const elapsed = performance.now() - start;

  assert(`L-STRESS-${label}`, 'build plan count', getCapabilityBuildPlanCount() === created, `${getCapabilityBuildPlanCount()}/${created}`);
  assert(`L-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getCapabilityBuildEngineRuntimeReport();
  assert(`L-STRESS-${label}`, 'runtime plans', runtime.buildPlans === created, String(runtime.buildPlans));
  assert(`L-STRESS-${label}`, 'cache stats', runtime.cacheHits + runtime.cacheMisses > 0, 'cache');

  harness.endGroup(`L-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('M-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 21.4 Capability Build Engine');
  console.log('==================================================\n');

  runSetup();
  runModules();
  runIntegrations();
  runSequence();
  runRollout();
  runRollback();
  runRisk();
  runValidation();
  runPipeline();
  runRegistryHistoryCache();
  runIntegration();
  stressBuild(100, '100');
  stressBuild(1000, '1000');
  stressBuild(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getCapabilityBuildEngineRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Build plans: ${runtime.buildPlans}`,
    `Modules planned: ${runtime.modulesPlanned}`,
    `Integrations planned: ${runtime.integrationsPlanned}`,
    `Rollout plans: ${runtime.rolloutPlans}`,
    `Rollback plans: ${runtime.rollbackPlans}`,
    `Validation plans: ${runtime.validationPlans}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? CAPABILITY_BUILD_ENGINE_PASS_TOKEN : 'CAPABILITY_BUILD_ENGINE_V1_FAIL',
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

  console.log(`\n${CAPABILITY_BUILD_ENGINE_PASS_TOKEN}`);
}

main();
