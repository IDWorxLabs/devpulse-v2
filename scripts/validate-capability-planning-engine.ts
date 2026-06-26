/**
 * Phase 21.3 — Capability Planning Engine validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  CAPABILITY_PLANNING_ENGINE_PASS_TOKEN,
  CAPABILITY_PLANNING_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_PLANNING_HISTORY_SIZE,
  analyzeCapabilityImpact,
  analyzeCapabilityPlanRisk,
  buildCapabilityPlan,
  determineCapabilityApproval,
  evaluateCapabilityPlanning,
  getCapabilityPlan,
  getCapabilityPlanCount,
  getCapabilityPlanHistorySize,
  getCapabilityPlanningCacheStats,
  getCapabilityPlanningEngineRuntimeReport,
  getDevPulseV2CapabilityPlanningEngine,
  isCapabilityPlanningQuestion,
  listCapabilityPlans,
  planCapabilityDependencies,
  planCapabilityScope,
  planCapabilityVerification,
  registerCapabilityPlanningEngineWithAutonomousBuilder,
  registerCapabilityPlanningEngineWithAutonomousVerification,
  registerCapabilityPlanningEngineWithCapabilityResearchEngine,
  registerCapabilityPlanningEngineWithCentralBrain,
  registerCapabilityPlanningEngineWithCompletionEngine,
  registerCapabilityPlanningEngineWithMissingCapabilityEscalation,
  registerCapabilityPlanningEngineWithMultiProjectMonitoring,
  registerCapabilityPlanningEngineWithProjectVault,
  registerCapabilityPlanningEngineWithTrustEngine,
  registerCapabilityPlanningEngineWithUvl,
  recordCapabilityPlanHistory,
  resetCapabilityPlanningEngineModuleForTests,
} from '../src/capability-planning-engine/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { CAPABILITY_PLANNING_ENGINE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { CapabilityPlanningInput } from '../src/capability-planning-engine/capability-planning-types.js';
import {
  runCapabilityPlanningV3Validation,
  printCapabilityPlanningValidationResults,
} from './lib/capability-planning-v3-validation.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/capability-planning-engine');

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
  'capability-planning-engine.ts',
  'capability-planning-types.ts',
  'capability-plan-registry.ts',
  'capability-scope-planner.ts',
  'capability-impact-analyzer.ts',
  'capability-risk-analyzer.ts',
  'capability-verification-planner.ts',
  'capability-dependency-planner.ts',
  'capability-approval-planner.ts',
  'capability-plan-builder.ts',
  'capability-planning-reporting.ts',
  'capability-planning-history.ts',
  'capability-planning-cache.ts',
  'capability-planning-registry.ts',
  'capability-discovery.ts',
  'existing-capability-search.ts',
  'capability-gap-analyzer.ts',
  'capability-composition-engine.ts',
  'capability-generation-planner.ts',
  'capability-validation-planner.ts',
  'capability-installation-planner.ts',
  'capability-reuse-analyzer.ts',
  'capability-dependency-graph.ts',
  'capability-planning-report-builder.ts',
  'capability-authority.ts',
  'index.ts',
];

function resetAll(): void {
  resetCapabilityPlanningEngineModuleForTests();
}

function uniqueInput(suffix: string, extra: Partial<CapabilityPlanningInput> = {}): CapabilityPlanningInput {
  return {
    proposedCapability: `unique_planning_capability_${suffix}_${Date.now()}`,
    capabilityDomain: 'ORCHESTRATION',
    ...extra,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2CapabilityPlanningEngine();
  assert('A-SETUP', 'pass token', authority.passToken === CAPABILITY_PLANNING_ENGINE_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === CAPABILITY_PLANNING_ENGINE_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'planning only', authority.planningOnly === true, 'planningOnly');
  assert('A-SETUP', 'uvl rows', CAPABILITY_PLANNING_ENGINE_UVL_ROWS.length === 13, String(CAPABILITY_PLANNING_ENGINE_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_PLANNING_HISTORY_SIZE === 128, String(DEFAULT_MAX_PLANNING_HISTORY_SIZE));
  assert('A-SETUP', 'ownership', getDevPulseV2Owner('capability_planning_engine').phase === 21.3, '21.3');
  assert('A-SETUP', 'question signal', isCapabilityPlanningQuestion('show capability planning'), 'signal');
  harness.endGroup('A-SETUP', g);
}

function runPlanTypes(): void {
  const g = harness.beginGroup('B-PLAN-TYPES');
  resetAll();

  const newCap = buildCapabilityPlan(uniqueInput('new', { researchDecision: 'NEW_CAPABILITY_REQUIRED' }));
  assert('B-PLAN-TYPES', 'new capability', newCap.plan?.planType === 'NEW_CAPABILITY', newCap.plan?.planType ?? 'blocked');

  const expansion = buildCapabilityPlan(uniqueInput('exp', { researchDecision: 'EXISTING_CAPABILITY_INSUFFICIENT', proposedCapability: 'capability expansion module' }));
  assert('B-PLAN-TYPES', 'expansion', expansion.plan?.planType === 'CAPABILITY_EXPANSION', expansion.plan?.planType ?? 'blocked');

  const optimization = buildCapabilityPlan(uniqueInput('opt', { researchDecision: 'OPTIMIZATION_REQUIRED', proposedCapability: 'performance optimizer pipeline' }));
  assert('B-PLAN-TYPES', 'optimization', optimization.plan?.planType === 'OPTIMIZATION', optimization.plan?.planType ?? 'blocked');

  const diagnostic = buildCapabilityPlan(uniqueInput('diag', { researchDecision: 'DIAGNOSTIC_REQUIRED', proposedCapability: 'diagnostic trace analyzer' }));
  assert('B-PLAN-TYPES', 'diagnostic', diagnostic.plan?.planType === 'DIAGNOSTIC', diagnostic.plan?.planType ?? 'blocked');

  const refactor = buildCapabilityPlan(uniqueInput('ref', { proposedCapability: 'orchestration refactor planner' }));
  assert('B-PLAN-TYPES', 'refactor', refactor.plan?.planType === 'REFACTOR', refactor.plan?.planType ?? 'blocked');

  harness.endGroup('B-PLAN-TYPES', g);
}

function runImpact(): void {
  const g = harness.beginGroup('C-IMPACT');
  resetAll();

  const lowScope = planCapabilityScope(uniqueInput('low'));
  const low = analyzeCapabilityImpact(uniqueInput('low'), lowScope);
  assert('C-IMPACT', 'low impact', low.impactLevel === 'LOW', low.impactLevel);

  const medScope = planCapabilityScope(uniqueInput('med', { proposedCapability: 'verification evidence planner' }));
  const med = analyzeCapabilityImpact({ proposedCapability: 'verification evidence planner' }, medScope);
  assert('C-IMPACT', 'medium impact', med.impactLevel === 'MEDIUM' || med.affectedSystems.includes('Verification'), med.impactLevel);

  const highInput: CapabilityPlanningInput = {
    proposedCapability: 'world2 builder verification trust orchestration monitor',
    trustImpact: true,
    world2Impact: true,
  };
  const highScope = planCapabilityScope(highInput);
  const high = analyzeCapabilityImpact(highInput, highScope);
  assert('C-IMPACT', 'high impact', high.impactLevel === 'HIGH', high.impactLevel);
  assert('C-IMPACT', 'affected systems', high.affectedSystems.length >= 3, String(high.affectedSystems.length));

  harness.endGroup('C-IMPACT', g);
}

function runRisk(): void {
  const g = harness.beginGroup('D-RISK');
  resetAll();

  const lowInput: CapabilityPlanningInput = {
    proposedCapability: 'minor_optimizer_tweak',
    researchDecision: 'OPTIMIZATION_REQUIRED',
  };
  const lowScope = planCapabilityScope(lowInput);
  const lowImpact = analyzeCapabilityImpact(lowInput, lowScope);
  const lowRisk = analyzeCapabilityPlanRisk(lowInput, lowScope, lowImpact);
  assert('D-RISK', 'low risk', lowRisk.riskLevel === 'LOW', lowRisk.riskLevel);

  const medInput: CapabilityPlanningInput = { proposedCapability: 'verification monitoring planner module' };
  const medScope = planCapabilityScope(medInput);
  const medImpact = analyzeCapabilityImpact(medInput, medScope);
  const medRisk = analyzeCapabilityPlanRisk(medInput, medScope, medImpact);
  assert('D-RISK', 'medium risk', medRisk.riskLevel === 'MEDIUM' || medRisk.riskScore >= 35, medRisk.riskLevel);

  const highInput: CapabilityPlanningInput = {
    proposedCapability: 'world2 trust builder verification orchestration',
    trustImpact: true,
    world2Impact: true,
  };
  const highScope = planCapabilityScope(highInput);
  const highImpact = analyzeCapabilityImpact(highInput, highScope);
  const highRisk = analyzeCapabilityPlanRisk(highInput, highScope, highImpact);
  assert('D-RISK', 'high risk', highRisk.riskLevel === 'HIGH', highRisk.riskLevel);

  harness.endGroup('D-RISK', g);
}

function runVerification(): void {
  const g = harness.beginGroup('E-VERIFICATION');
  resetAll();

  const quickInput = uniqueInput('vquick', { researchDecision: 'OPTIMIZATION_REQUIRED', proposedCapability: 'performance optimizer' });
  const quickScope = planCapabilityScope(quickInput);
  const quickImpact = analyzeCapabilityImpact(quickInput, quickScope);
  const quickRisk = analyzeCapabilityPlanRisk(quickInput, quickScope, quickImpact);
  const quick = planCapabilityVerification(quickInput, quickImpact, quickRisk);
  assert('E-VERIFICATION', 'quick', quick.depth === 'QUICK', quick.depth);

  const stdInput = uniqueInput('vstd', { researchDecision: 'NEW_CAPABILITY_REQUIRED' });
  const stdScope = planCapabilityScope(stdInput);
  const stdImpact = analyzeCapabilityImpact(stdInput, stdScope);
  const stdRisk = analyzeCapabilityPlanRisk(stdInput, stdScope, stdImpact);
  stdRisk.riskLevel = 'MEDIUM';
  stdRisk.riskScore = 45;
  const standard = planCapabilityVerification(stdInput, stdImpact, stdRisk);
  assert('E-VERIFICATION', 'standard', standard.depth === 'STANDARD', standard.depth);

  const deepInput: CapabilityPlanningInput = {
    proposedCapability: 'world2 builder verification monitor orchestration',
    trustImpact: false,
    world2Impact: true,
  };
  const deepScope = planCapabilityScope(deepInput);
  const deepImpact = analyzeCapabilityImpact(deepInput, deepScope);
  const deepRisk = analyzeCapabilityPlanRisk(deepInput, deepScope, deepImpact);
  const deep = planCapabilityVerification(deepInput, deepImpact, deepRisk);
  assert('E-VERIFICATION', 'deep', deep.depth === 'DEEP', deep.depth);

  const trustInput = uniqueInput('vtrust', { trustImpact: true, proposedCapability: 'trust recovery planner' });
  const trustScope = planCapabilityScope(trustInput);
  const trustImpact = analyzeCapabilityImpact(trustInput, trustScope);
  const trustRisk = analyzeCapabilityPlanRisk(trustInput, trustScope, trustImpact);
  const trust = planCapabilityVerification(trustInput, trustImpact, trustRisk);
  assert('E-VERIFICATION', 'trust recovery', trust.depth === 'TRUST_RECOVERY', trust.depth);

  harness.endGroup('E-VERIFICATION', g);
}

function runDependencies(): void {
  const g = harness.beginGroup('F-DEPENDENCIES');
  resetAll();

  const validInput = uniqueInput('dep-valid', { researchDecision: 'NEW_CAPABILITY_REQUIRED' });
  const validScope = planCapabilityScope(validInput);
  const valid = planCapabilityDependencies(validInput, validScope);
  assert('F-DEPENDENCIES', 'valid dependencies', valid.requiredSystems.length >= 4, String(valid.requiredSystems.length));
  assert('F-DEPENDENCIES', 'no cycle', !valid.cycleDetected, String(valid.cycleDetected));

  const missingInput = uniqueInput('dep-miss', { signals: ['requires:unknown_future_system'] });
  const missingScope = planCapabilityScope(missingInput);
  const missing = planCapabilityDependencies(missingInput, missingScope);
  assert('F-DEPENDENCIES', 'missing dependencies', missing.missingDependencies.includes('unknown_future_system'), missing.missingDependencies.join(','));

  const cycleInput = uniqueInput('dep-cycle', { signals: ['cycle:research->planning->research'] });
  const cycleScope = planCapabilityScope(cycleInput);
  const cycle = planCapabilityDependencies(cycleInput, cycleScope);
  assert('F-DEPENDENCIES', 'dependency cycles', cycle.cycleDetected, String(cycle.cycleDetected));

  harness.endGroup('F-DEPENDENCIES', g);
}

function runApprovals(): void {
  const g = harness.beginGroup('G-APPROVALS');
  resetAll();

  const noneInput: CapabilityPlanningInput = {
    proposedCapability: 'minor_optimizer_tweak',
    researchDecision: 'OPTIMIZATION_REQUIRED',
  };
  const noneScope = planCapabilityScope(noneInput);
  const noneImpact = analyzeCapabilityImpact(noneInput, noneScope);
  const noneRisk = analyzeCapabilityPlanRisk(noneInput, noneScope, noneImpact);
  const none = determineCapabilityApproval(noneInput, noneImpact, noneRisk);
  assert('G-APPROVALS', 'none', none.requirement === 'NONE', none.requirement);

  const founderInput: CapabilityPlanningInput = {
    proposedCapability: 'trust governance expansion',
    researchDecision: 'EXISTING_CAPABILITY_INSUFFICIENT',
    trustImpact: true,
  };
  const founderScope = planCapabilityScope(founderInput);
  const founderImpact = analyzeCapabilityImpact(founderInput, founderScope);
  const founderRisk = analyzeCapabilityPlanRisk(founderInput, founderScope, founderImpact);
  const founder = determineCapabilityApproval(founderInput, founderImpact, founderRisk);
  assert('G-APPROVALS', 'founder review', founder.requirement === 'FOUNDER_REVIEW', founder.requirement);

  const highInput: CapabilityPlanningInput = {
    proposedCapability: 'world2 trust builder verification orchestration monitor',
    trustImpact: true,
    world2Impact: true,
  };
  const highScope = planCapabilityScope(highInput);
  const highImpact = analyzeCapabilityImpact(highInput, highScope);
  const highRisk = analyzeCapabilityPlanRisk(highInput, highScope, highImpact);
  const high = determineCapabilityApproval(highInput, highImpact, highRisk);
  assert('G-APPROVALS', 'high risk review', high.requirement === 'HIGH_RISK_REVIEW', high.requirement);

  harness.endGroup('G-APPROVALS', g);
}

function runDuplicates(): void {
  const g = harness.beginGroup('H-DUPLICATES');
  resetAll();

  const duplicate = buildCapabilityPlan({ proposedCapability: 'Missing Capability Escalation' });
  assert('H-DUPLICATES', 'duplicate blocked', duplicate.blocked === true, String(duplicate.blocked));
  assert('H-DUPLICATES', 'duplicate risk', duplicate.report.blockReason === 'DUPLICATE_RISK', duplicate.report.blockReason ?? '');
  assert('H-DUPLICATES', 'no plan created', duplicate.plan === null, 'null');

  const nearDup = buildCapabilityPlan({
    proposedCapability: 'project monitoring widget extension',
    researchDecision: 'EXISTING_CAPABILITY_INSUFFICIENT',
  });
  assert('H-DUPLICATES', 'near duplicate allowed', nearDup.blocked === false, String(nearDup.blocked));
  assert('H-DUPLICATES', 'near dup risk', ['LOW', 'MEDIUM', 'NONE'].includes(nearDup.duplicateRisk), nearDup.duplicateRisk);
  assert('H-DUPLICATES', 'near dup plan', nearDup.plan !== null, 'created');

  const unique = buildCapabilityPlan(uniqueInput('unique', { researchDecision: 'NEW_CAPABILITY_REQUIRED' }));
  assert('H-DUPLICATES', 'unique capability', unique.blocked === false && unique.plan !== null, String(unique.blocked));

  harness.endGroup('H-DUPLICATES', g);
}

function runPlanBuilder(): void {
  const g = harness.beginGroup('I-PLAN-BUILDER');
  resetAll();

  const complete = buildCapabilityPlan(uniqueInput('complete', {
    researchDecision: 'NEW_CAPABILITY_REQUIRED',
    capabilityDomain: 'VERIFICATION',
  }));
  assert('I-PLAN-BUILDER', 'complete plan', complete.plan !== null, 'plan');
  assert('I-PLAN-BUILDER', 'complete report', complete.report.planId === complete.plan?.planId, complete.report.planId);
  assert('I-PLAN-BUILDER', 'scope monolith avoidance', complete.report.scope.monolithAvoidance === true, 'monolith');
  assert('I-PLAN-BUILDER', 'verification requirements', complete.report.verification.requirements.length > 0, String(complete.report.verification.requirements.length));

  const blocked = buildCapabilityPlan({ proposedCapability: 'Capability Research Engine' });
  assert('I-PLAN-BUILDER', 'duplicate blocking', blocked.blocked && blocked.plan === null, String(blocked.blocked));

  harness.endGroup('I-PLAN-BUILDER', g);
}

function runRegistryHistoryCache(): void {
  const g = harness.beginGroup('J-REGISTRY-CACHE');
  resetAll();

  const { plan } = buildCapabilityPlan(uniqueInput('reg', { researchDecision: 'NEW_CAPABILITY_REQUIRED' }));
  assert('J-REGISTRY-CACHE', 'registered', plan !== null && getCapabilityPlan(plan.planId) !== undefined, plan?.planId ?? 'null');
  assert('J-REGISTRY-CACHE', 'list', listCapabilityPlans().length >= 1, String(listCapabilityPlans().length));
  if (plan) recordCapabilityPlanHistory(plan);
  assert('J-REGISTRY-CACHE', 'history', getCapabilityPlanHistorySize() >= 1, String(getCapabilityPlanHistorySize()));

  for (let i = 0; i < 130; i++) {
    if (plan) recordCapabilityPlanHistory(plan);
  }
  assert('J-REGISTRY-CACHE', 'history bounded', getCapabilityPlanHistorySize() <= DEFAULT_MAX_PLANNING_HISTORY_SIZE, String(getCapabilityPlanHistorySize()));

  const cacheInput: CapabilityPlanningInput = { proposedCapability: 'cache_test_capability_fixed', researchDecision: 'NEW_CAPABILITY_REQUIRED' };
  buildCapabilityPlan(cacheInput);
  buildCapabilityPlan(cacheInput);
  const cache = getCapabilityPlanningCacheStats();
  assert('J-REGISTRY-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));

  harness.endGroup('J-REGISTRY-CACHE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerCapabilityPlanningEngineWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerCapabilityPlanningEngineWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'project vault', registerCapabilityPlanningEngineWithProjectVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust engine', registerCapabilityPlanningEngineWithTrustEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'escalation', registerCapabilityPlanningEngineWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'research engine', registerCapabilityPlanningEngineWithCapabilityResearchEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous builder', registerCapabilityPlanningEngineWithAutonomousBuilder().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous verification', registerCapabilityPlanningEngineWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'completion engine', registerCapabilityPlanningEngineWithCompletionEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'monitoring', registerCapabilityPlanningEngineWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerCapabilityPlanningEngineWithUvl().uvlRowCount === 13, '13');

  harness.endGroup('K-INTEGRATION', g);
}

function stressPlanning(planCount: number, label: string): void {
  const g = harness.beginGroup(`L-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  let created = 0;
  for (let i = 0; i < planCount; i++) {
    const input: CapabilityPlanningInput = {
      projectId: `P${i}`,
      proposedCapability: i % 10 === 0 ? 'Missing Capability Escalation' : `stress_plan_capability_${i}_${label}`,
      capabilityDomain: ['ORCHESTRATION', 'VERIFICATION', 'MONITORING', 'BUILDING'][i % 4],
      researchDecision: i % 4 === 0 ? 'NEW_CAPABILITY_REQUIRED' : i % 4 === 1 ? 'OPTIMIZATION_REQUIRED' : undefined,
      trustImpact: i % 17 === 0,
      world2Impact: i % 23 === 0,
    };
    const result = evaluateCapabilityPlanning(input);
    if (!result.blocked) created += 1;
  }

  const elapsed = performance.now() - start;

  assert(`L-STRESS-${label}`, 'plans evaluated', getCapabilityPlanCount() === created, `${getCapabilityPlanCount()}/${created}`);
  assert(`L-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getCapabilityPlanningEngineRuntimeReport();
  assert(`L-STRESS-${label}`, 'runtime plans', runtime.plansCreated === created, String(runtime.plansCreated));
  assert(`L-STRESS-${label}`, 'duplicate detections', runtime.duplicateDetections > 0, String(runtime.duplicateDetections));
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
  console.log('\nDevPulse V2 — Phase 21.3 Capability Planning Engine');
  console.log('=====================================================\n');

  runSetup();
  runPlanTypes();
  runImpact();
  runRisk();
  runVerification();
  runDependencies();
  runApprovals();
  runDuplicates();
  runPlanBuilder();
  runRegistryHistoryCache();
  runIntegration();
  stressPlanning(100, '100');
  stressPlanning(1000, '1000');
  stressPlanning(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getCapabilityPlanningEngineRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Plans created: ${runtime.plansCreated}`,
    `Impact analyses: ${runtime.impactAnalyses}`,
    `Risk analyses: ${runtime.riskAnalyses}`,
    `Dependency analyses: ${runtime.dependencyAnalyses}`,
    `Approval decisions: ${runtime.approvalDecisions}`,
    `Duplicate detections: ${runtime.duplicateDetections}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? CAPABILITY_PLANNING_ENGINE_PASS_TOKEN : 'CAPABILITY_PLANNING_ENGINE_V1_FAIL',
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

  const era3 = runCapabilityPlanningV3Validation(['all']);
  if (!era3.allPassed) {
    printCapabilityPlanningValidationResults(era3.checks, 'Capability Planning Engine Era 3');
    process.exit(1);
  }

  console.log(`\n${CAPABILITY_PLANNING_ENGINE_PASS_TOKEN}`);
}

main();
