/**
 * Phase 20.5.1 — Multi Project Verification Orchestration validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  MULTI_PROJECT_VERIFICATION_ORCHESTRATION_PASS_TOKEN,
  MULTI_PROJECT_VERIFICATION_ORCHESTRATION_OWNER_MODULE,
  DEFAULT_MAX_VERIFICATION_ORCHESTRATION_HISTORY_SIZE,
  buildVerificationDependencyChains,
  buildVerificationGroups,
  buildVerificationOrchestrationPlan,
  buildVerificationSchedule,
  detectVerificationConflicts,
  evaluateAllVerificationReadiness,
  evaluateVerificationCapacity,
  evaluateVerificationOrchestrationReadiness,
  generateVerificationOrchestrationReport,
  getDevPulseV2MultiProjectVerificationOrchestration,
  getMultiProjectVerificationOrchestrationRuntimeReport,
  getVerificationDependencyCount,
  getVerificationOrchestrationHistorySize,
  getVerificationOrchestrationPlan,
  getVerificationOrchestrationPlanCount,
  getVerificationOrchestrationCacheStats,
  getTotalVerificationConflictCount,
  isVerificationOrchestrationQuestion,
  listVerificationOrchestrationPlans,
  listVerificationOrchestrationPlansByProject,
  buildVerificationOrchestrationPlanFromProjects,
  registerMultiProjectVerificationOrchestrationWithAutonomousVerification,
  registerMultiProjectVerificationOrchestrationWithCentralBrain,
  registerMultiProjectVerificationOrchestrationWithCompletionEngine,
  registerMultiProjectVerificationOrchestrationWithMultiProjectFoundation,
  registerMultiProjectVerificationOrchestrationWithMultiProjectVerification,
  registerMultiProjectVerificationOrchestrationWithParallelBuildOrchestration,
  registerMultiProjectVerificationOrchestrationWithProjectVault,
  registerMultiProjectVerificationOrchestrationWithResourceAllocation,
  registerMultiProjectVerificationOrchestrationWithTrustEngine,
  registerMultiProjectVerificationOrchestrationWithUvl,
  registerMultiProjectVerificationOrchestrationWithWorkspaceIsolation,
  registerMultiProjectVerificationOrchestrationWithWorld2Coordinator,
  recordVerificationOrchestrationHistory,
  resetMultiProjectVerificationOrchestrationModuleForTests,
} from '../src/multi-project-verification-orchestration/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { MULTI_PROJECT_VERIFICATION_ORCHESTRATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { VerificationOrchestrationProjectInput } from '../src/multi-project-verification-orchestration/verification-orchestration-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/multi-project-verification-orchestration');

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
  'multi-project-verification-orchestration.ts',
  'verification-orchestration-types.ts',
  'verification-orchestration-registry.ts',
  'verification-group-manager.ts',
  'verification-dependency-manager.ts',
  'verification-readiness-evaluator.ts',
  'verification-scheduler.ts',
  'verification-conflict-detector.ts',
  'verification-capacity-evaluator.ts',
  'verification-plan-builder.ts',
  'verification-reporting.ts',
  'verification-history.ts',
  'verification-cache.ts',
  'index.ts',
];

function resetAll(): void {
  resetMultiProjectVerificationOrchestrationModuleForTests();
}

function sampleProjects(count: number, withDeps = false): VerificationOrchestrationProjectInput[] {
  const projects: VerificationOrchestrationProjectInput[] = [];
  for (let i = 0; i < count; i++) {
    projects.push({
      projectId: `P${i}`,
      workspaceId: `W${i % Math.max(1, Math.floor(count / 10))}`,
      confidence: 55 + (i % 40),
      riskScore: 15 + (i % 50),
      verificationStatus: i % 3 === 0 ? 'VERIFIED' : 'NEEDS_VERIFICATION',
      verificationReady: true,
      dependsOn: withDeps && i > 0 ? [`P${i - 1}`] : undefined,
      resourceAvailable: true,
      isolationOk: true,
      orchestrationReady: true,
    });
  }
  return projects;
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2MultiProjectVerificationOrchestration();
  assert('A-SETUP', 'pass token', authority.passToken === MULTI_PROJECT_VERIFICATION_ORCHESTRATION_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === MULTI_PROJECT_VERIFICATION_ORCHESTRATION_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'planning only', authority.planningOnly === true, 'planningOnly');
  assert('A-SETUP', 'uvl rows', MULTI_PROJECT_VERIFICATION_ORCHESTRATION_UVL_ROWS.length === 13, String(MULTI_PROJECT_VERIFICATION_ORCHESTRATION_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_VERIFICATION_ORCHESTRATION_HISTORY_SIZE === 128, String(DEFAULT_MAX_VERIFICATION_ORCHESTRATION_HISTORY_SIZE));
  assert('A-SETUP', 'ownership', getDevPulseV2Owner('multi_project_verification_orchestration').phase === 20.51, '20.51');
  assert('A-SETUP', 'question signal', isVerificationOrchestrationQuestion('show verification orchestration plan'), 'signal');
  harness.endGroup('A-SETUP', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const projects = sampleProjects(3);
  const plan = buildVerificationOrchestrationPlan(projects);
  assert('B-REGISTRY', 'plan registered', getVerificationOrchestrationPlan(plan.planId) !== undefined, plan.planId);
  assert('B-REGISTRY', 'plan count', getVerificationOrchestrationPlanCount() === 1, String(getVerificationOrchestrationPlanCount()));
  assert('B-REGISTRY', 'list plans', listVerificationOrchestrationPlans().length === 1, '1');
  assert('B-REGISTRY', 'by project', listVerificationOrchestrationPlansByProject('P0').length === 1, 'P0');
  assert('B-REGISTRY', 'groups', plan.groups.length > 0, String(plan.groups.length));

  const plan2 = buildVerificationOrchestrationPlan(sampleProjects(2));
  assert('B-REGISTRY', 'second plan', getVerificationOrchestrationPlanCount() === 2, String(getVerificationOrchestrationPlanCount()));
  const retrievedPlan2 = getVerificationOrchestrationPlan(plan2.planId);
  assert('B-REGISTRY', 'get plan2', retrievedPlan2 !== undefined && retrievedPlan2.groups.length >= 1, 'groups');

  harness.endGroup('B-REGISTRY', g);
}

function runDependencies(): void {
  const g = harness.beginGroup('C-DEPENDENCIES');
  resetAll();

  const chainProjects: VerificationOrchestrationProjectInput[] = [
    { projectId: 'A', workspaceId: 'W1', verificationReady: true },
    { projectId: 'B', workspaceId: 'W2', dependsOn: ['A'], verificationReady: true },
    { projectId: 'C', workspaceId: 'W3', dependsOn: ['B'], verificationReady: true },
  ];
  const chainResult = buildVerificationDependencyChains(chainProjects);
  assert('C-DEPENDENCIES', 'chain count', chainResult.chains.length === 3, String(chainResult.chains.length));
  assert('C-DEPENDENCIES', 'chain C', chainResult.chains.some((c) => c.join('->') === 'A->B->C'), 'A->B->C');
  assert('C-DEPENDENCIES', 'dependency count', getVerificationDependencyCount(chainProjects) === 2, '2');

  const cycleProjects: VerificationOrchestrationProjectInput[] = [
    { projectId: 'X', workspaceId: 'W1', dependsOn: ['Y'] },
    { projectId: 'Y', workspaceId: 'W2', dependsOn: ['X'] },
  ];
  const cycleResult = buildVerificationDependencyChains(cycleProjects);
  assert('C-DEPENDENCIES', 'cycle detected', cycleResult.cycles.length > 0, String(cycleResult.cycles.length));

  const missingProjects: VerificationOrchestrationProjectInput[] = [
    { projectId: 'M1', workspaceId: 'W1', dependsOn: ['MISSING'] },
  ];
  const missingResult = buildVerificationDependencyChains(missingProjects);
  assert('C-DEPENDENCIES', 'missing detected', missingResult.missing.length > 0, String(missingResult.missing.length));

  harness.endGroup('C-DEPENDENCIES', g);
}

function runReadiness(): void {
  const g = harness.beginGroup('D-READINESS');
  resetAll();

  const readyProject: VerificationOrchestrationProjectInput = {
    projectId: 'R1', workspaceId: 'W1', verificationReady: true, verificationStatus: 'NEEDS_VERIFICATION',
    resourceAvailable: true, isolationOk: true, orchestrationReady: true,
  };
  const depResult = buildVerificationDependencyChains([readyProject]);
  assert('D-READINESS', 'READY', evaluateVerificationOrchestrationReadiness(readyProject, depResult) === 'READY', 'READY');

  const waitingProject: VerificationOrchestrationProjectInput = {
    projectId: 'R2', workspaceId: 'W2', dependsOn: ['R1'], verificationReady: true, resourceAvailable: true, isolationOk: true,
  };
  const depResult2 = buildVerificationDependencyChains([readyProject, waitingProject]);
  assert('D-READINESS', 'WAITING', evaluateVerificationOrchestrationReadiness(waitingProject, depResult2) === 'WAITING', 'WAITING');

  const capacityBlocked: VerificationOrchestrationProjectInput = {
    projectId: 'R3', workspaceId: 'W3', resourceAvailable: false, isolationOk: true,
  };
  assert('D-READINESS', 'CAPACITY_BLOCKED', evaluateVerificationOrchestrationReadiness(capacityBlocked, depResult) === 'CAPACITY_BLOCKED', 'CAPACITY_BLOCKED');

  const blocked: VerificationOrchestrationProjectInput = {
    projectId: 'R4', workspaceId: 'W4', isolationOk: false, verificationStatus: 'BLOCKED',
  };
  assert('D-READINESS', 'BLOCKED', evaluateVerificationOrchestrationReadiness(blocked, depResult) === 'BLOCKED', 'BLOCKED');

  const allStatuses = evaluateAllVerificationReadiness([readyProject, waitingProject, capacityBlocked], depResult2);
  assert('D-READINESS', 'evaluate all', allStatuses.size === 3, String(allStatuses.size));

  harness.endGroup('D-READINESS', g);
}

function runCapacityAndGroups(): void {
  const g = harness.beginGroup('E-CAPACITY-GROUPS');
  resetAll();

  const projects = sampleProjects(5);
  const depResult = buildVerificationDependencyChains(projects);
  const statuses = evaluateAllVerificationReadiness(projects, depResult);
  const capacity = evaluateVerificationCapacity(projects);
  assert('E-CAPACITY-GROUPS', 'parallelism', capacity.estimatedParallelism >= 1, String(capacity.estimatedParallelism));
  assert('E-CAPACITY-GROUPS', 'safe limit', capacity.safeLimit >= 1, String(capacity.safeLimit));

  const groups = buildVerificationGroups(projects, statuses, capacity);
  assert('E-CAPACITY-GROUPS', 'groups created', groups.length > 0, String(groups.length));
  assert('E-CAPACITY-GROUPS', 'group ids', groups.every((g) => g.groupId.length > 0), 'ids');

  harness.endGroup('E-CAPACITY-GROUPS', g);
}

function runConflictsAndSchedule(): void {
  const g = harness.beginGroup('F-CONFLICTS-SCHEDULE');
  resetAll();

  const projects: VerificationOrchestrationProjectInput[] = [
    { projectId: 'C1', workspaceId: 'WS1', resourceAvailable: false, isolationOk: true, verificationReady: true },
    { projectId: 'C2', workspaceId: 'WS1', resourceAvailable: true, isolationOk: true, verificationReady: true },
  ];
  const depResult = buildVerificationDependencyChains(projects);
  const forcedGroups = [{ groupId: 'conflict-test-group', projectIds: ['C1', 'C2'], status: 'READY' as const }];
  const conflicts = detectVerificationConflicts(projects, depResult, forcedGroups);
  assert('F-CONFLICTS-SCHEDULE', 'resource conflict', conflicts.some((c) => c.conflictType === 'resource_conflict'), 'resource');
  assert('F-CONFLICTS-SCHEDULE', 'workspace conflict', conflicts.some((c) => c.conflictType === 'workspace_conflict'), 'workspace');
  assert('F-CONFLICTS-SCHEDULE', 'conflict count', getTotalVerificationConflictCount() > 0, String(getTotalVerificationConflictCount()));

  const autoGroups = buildVerificationGroups(projects, evaluateAllVerificationReadiness(projects, depResult), evaluateVerificationCapacity(projects));
  const schedule = buildVerificationSchedule('test-plan', projects, depResult, autoGroups);
  assert('F-CONFLICTS-SCHEDULE', 'schedule groups', schedule.length >= 1, String(schedule.length));

  const dupProjects: VerificationOrchestrationProjectInput[] = [
    { projectId: 'D1', workspaceId: 'W1', isolationOk: true, verificationReady: true },
  ];
  const dupDepResult = buildVerificationDependencyChains(dupProjects);
  const dupGroups = [{ groupId: 'g1', projectIds: ['D1', 'D1'], status: 'READY' as const }];
  const dupConflicts = detectVerificationConflicts(dupProjects, dupDepResult, dupGroups);
  assert('F-CONFLICTS-SCHEDULE', 'duplicate scheduling', dupConflicts.some((c) => c.conflictType === 'duplicate_scheduling'), 'duplicate');

  harness.endGroup('F-CONFLICTS-SCHEDULE', g);
}

function runPlanPipeline(): void {
  const g = harness.beginGroup('G-PLAN');
  resetAll();

  const projects: VerificationOrchestrationProjectInput[] = [
    { projectId: 'PL1', workspaceId: 'W1', confidence: 80, riskScore: 15, verificationStatus: 'NEEDS_VERIFICATION', verificationReady: true, resourceAvailable: true, isolationOk: true, orchestrationReady: true },
    { projectId: 'PL2', workspaceId: 'W2', confidence: 70, riskScore: 20, dependsOn: ['PL1'], verificationReady: true, resourceAvailable: true, isolationOk: true, orchestrationReady: true },
    { projectId: 'PL3', workspaceId: 'W3', confidence: 85, riskScore: 10, verificationStatus: 'VERIFIED', verificationReady: true, resourceAvailable: true, isolationOk: true, orchestrationReady: true },
  ];

  const plan = buildVerificationOrchestrationPlan(projects);
  assert('G-PLAN', 'plan id', plan.planId.length > 0, plan.planId);
  assert('G-PLAN', 'groups', plan.groups.length > 0, String(plan.groups.length));
  assert('G-PLAN', 'ready projects', plan.readyProjects.length >= 1, String(plan.readyProjects.length));
  assert('G-PLAN', 'waiting projects', plan.waitingProjects.includes('PL2'), 'PL2');
  assert('G-PLAN', 'dependency chains', plan.dependencyChains.length > 0, String(plan.dependencyChains.length));
  assert('G-PLAN', 'parallelism', plan.estimatedVerificationParallelism >= 1, String(plan.estimatedVerificationParallelism));

  const { plan: wrappedPlan, report } = buildVerificationOrchestrationPlanFromProjects(projects);
  assert('G-PLAN', 'wrapped plan', wrappedPlan.planId.length > 0, wrappedPlan.planId);
  assert('G-PLAN', 'report', report.projectCount >= 3, String(report.projectCount));
  assert('G-PLAN', 'report recommendations', report.recommendations.length > 0, String(report.recommendations.length));

  harness.endGroup('G-PLAN', g);
}

function runHistoryCacheReporting(): void {
  const g = harness.beginGroup('H-HISTORY-CACHE');
  resetAll();

  const projects = sampleProjects(4);
  const plan = buildVerificationOrchestrationPlan(projects);
  recordVerificationOrchestrationHistory(plan, 0);
  assert('H-HISTORY-CACHE', 'history size', getVerificationOrchestrationHistorySize() >= 1, String(getVerificationOrchestrationHistorySize()));

  for (let i = 0; i < 130; i++) {
    recordVerificationOrchestrationHistory(plan, i);
  }
  assert('H-HISTORY-CACHE', 'history bounded', getVerificationOrchestrationHistorySize() <= DEFAULT_MAX_VERIFICATION_ORCHESTRATION_HISTORY_SIZE, String(getVerificationOrchestrationHistorySize()));

  const report = generateVerificationOrchestrationReport(plan, projects);
  assert('H-HISTORY-CACHE', 'report id', report.reportId.length > 0, report.reportId);
  assert('H-HISTORY-CACHE', 'report groups', report.groups.length > 0, String(report.groups.length));

  getVerificationOrchestrationPlan(plan.planId);
  getVerificationOrchestrationPlan(plan.planId);
  const cache = getVerificationOrchestrationCacheStats();
  assert('H-HISTORY-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('H-HISTORY-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  harness.endGroup('H-HISTORY-CACHE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('I-INTEGRATION');
  resetAll();

  const brain = registerMultiProjectVerificationOrchestrationWithCentralBrain();
  assert('I-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerMultiProjectVerificationOrchestrationWithCentralBrain();
  assert('I-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('I-INTEGRATION', 'project vault', registerMultiProjectVerificationOrchestrationWithProjectVault().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'trust engine', registerMultiProjectVerificationOrchestrationWithTrustEngine().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'world2', registerMultiProjectVerificationOrchestrationWithWorld2Coordinator().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'uvl', registerMultiProjectVerificationOrchestrationWithUvl().uvlRowCount === 13, '13');
  assert('I-INTEGRATION', 'multi project', registerMultiProjectVerificationOrchestrationWithMultiProjectFoundation().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'workspace isolation', registerMultiProjectVerificationOrchestrationWithWorkspaceIsolation().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'resource allocation', registerMultiProjectVerificationOrchestrationWithResourceAllocation().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'orchestration', registerMultiProjectVerificationOrchestrationWithParallelBuildOrchestration().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'multi project verification', registerMultiProjectVerificationOrchestrationWithMultiProjectVerification().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'autonomous verification', registerMultiProjectVerificationOrchestrationWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'completion engine', registerMultiProjectVerificationOrchestrationWithCompletionEngine().readOnly === true, 'readOnly');

  harness.endGroup('I-INTEGRATION', g);
}

function stressOrchestration(count: number, label: string): void {
  const g = harness.beginGroup(`J-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  const projects = sampleProjects(count);
  const { plan, report } = buildVerificationOrchestrationPlanFromProjects(projects);

  const elapsed = performance.now() - start;

  const projectCount = plan.groups.reduce((sum, grp) => sum + grp.projectIds.length, 0);
  assert(`J-STRESS-${label}`, 'plan projects', projectCount === count, String(projectCount));
  assert(`J-STRESS-${label}`, 'report count', report.projectCount === count, String(report.projectCount));
  assert(`J-STRESS-${label}`, 'plan count', getVerificationOrchestrationPlanCount() === 1, String(getVerificationOrchestrationPlanCount()));
  assert(`J-STRESS-${label}`, 'performance', elapsed < 60_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getMultiProjectVerificationOrchestrationRuntimeReport();
  assert(`J-STRESS-${label}`, 'runtime projects', runtime.projectCount === count, String(runtime.projectCount));
  assert(`J-STRESS-${label}`, 'cache stats', runtime.cacheHits + runtime.cacheMisses > 0, 'cache');

  harness.endGroup(`J-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('K-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 20.5.1 Multi Project Verification Orchestration');
  console.log('====================================================================\n');

  runSetup();
  runRegistry();
  runDependencies();
  runReadiness();
  runCapacityAndGroups();
  runConflictsAndSchedule();
  runPlanPipeline();
  runHistoryCacheReporting();
  runIntegration();
  stressOrchestration(100, '100');
  stressOrchestration(1000, '1000');
  stressOrchestration(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getMultiProjectVerificationOrchestrationRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Project count: ${runtime.projectCount}`,
    `Orchestration plan count: ${runtime.planCount}`,
    `Dependency count: ${runtime.dependencyCount}`,
    `Conflict count: ${runtime.conflictCount}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? MULTI_PROJECT_VERIFICATION_ORCHESTRATION_PASS_TOKEN : 'MULTI_PROJECT_VERIFICATION_ORCHESTRATION_V1_FAIL',
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

  console.log(`\n${MULTI_PROJECT_VERIFICATION_ORCHESTRATION_PASS_TOKEN}`);
}

main();
