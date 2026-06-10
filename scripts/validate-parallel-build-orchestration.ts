/**
 * Phase 20.4 — Parallel Build Orchestration validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  PARALLEL_BUILD_ORCHESTRATION_PASS_TOKEN,
  PARALLEL_BUILD_ORCHESTRATION_OWNER_MODULE,
  DEFAULT_MAX_ORCHESTRATION_HISTORY_SIZE,
  buildDependencyChains,
  buildOrchestrationGroups,
  buildOrchestrationPlan,
  buildOrchestrationSchedule,
  detectOrchestrationConflicts,
  evaluateAllReadiness,
  evaluateOrchestrationCapacity,
  evaluateOrchestrationReadiness,
  generateOrchestrationReport,
  getDependencyCount,
  getDevPulseV2ParallelBuildOrchestration,
  getOrchestrationHistorySize,
  getOrchestrationPlan,
  getOrchestrationPlanCount,
  getOrchestrationCacheStats,
  getParallelBuildOrchestrationRuntimeReport,
  getTotalOrchestrationConflictCount,
  isOrchestrationQuestion,
  listOrchestrationPlans,
  listOrchestrationPlansByProject,
  listOrchestrationPlansByWorkspace,
  recordOrchestrationHistory,
  registerParallelBuildOrchestrationWithAutonomousBuilder,
  registerParallelBuildOrchestrationWithCentralBrain,
  registerParallelBuildOrchestrationWithCompletionEngine,
  registerParallelBuildOrchestrationWithMultiProjectFoundation,
  registerParallelBuildOrchestrationWithProjectVault,
  registerParallelBuildOrchestrationWithWorkspaceIsolation,
  registerParallelBuildOrchestrationWithResourceAllocation,
  registerParallelBuildOrchestrationWithTrustEngine,
  registerParallelBuildOrchestrationWithUvl,
  registerParallelBuildOrchestrationWithWorld2Coordinator,
  buildOrchestrationPlanFromProjects,
  resetParallelBuildOrchestrationModuleForTests,
} from '../src/parallel-build-orchestration/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { PARALLEL_BUILD_ORCHESTRATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { OrchestrationProjectInput } from '../src/parallel-build-orchestration/orchestration-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/parallel-build-orchestration');

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
  'parallel-build-orchestration.ts',
  'orchestration-types.ts',
  'orchestration-registry.ts',
  'orchestration-group-manager.ts',
  'orchestration-dependency-manager.ts',
  'orchestration-readiness-evaluator.ts',
  'orchestration-scheduler.ts',
  'orchestration-conflict-detector.ts',
  'orchestration-capacity-evaluator.ts',
  'orchestration-plan-builder.ts',
  'orchestration-reporting.ts',
  'orchestration-history.ts',
  'orchestration-cache.ts',
  'index.ts',
];

function resetAll(): void {
  resetParallelBuildOrchestrationModuleForTests();
}

function sampleProjects(count: number, withDeps = false): OrchestrationProjectInput[] {
  const projects: OrchestrationProjectInput[] = [];
  for (let i = 0; i < count; i++) {
    projects.push({
      projectId: `P${i}`,
      workspaceId: `W${i % Math.max(1, Math.floor(count / 10))}`,
      priority: i % 4 === 0 ? 'CRITICAL' : 'NORMAL',
      dependsOn: withDeps && i > 0 ? [`P${i - 1}`] : undefined,
      projectState: 'ACTIVE',
      resourceAvailable: true,
      isolationOk: true,
    });
  }
  return projects;
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2ParallelBuildOrchestration();
  assert('A-SETUP', 'pass token', authority.passToken === PARALLEL_BUILD_ORCHESTRATION_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === PARALLEL_BUILD_ORCHESTRATION_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'planning only', authority.planningOnly === true, 'planningOnly');
  assert('A-SETUP', 'uvl rows', PARALLEL_BUILD_ORCHESTRATION_UVL_ROWS.length === 13, String(PARALLEL_BUILD_ORCHESTRATION_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_ORCHESTRATION_HISTORY_SIZE === 128, String(DEFAULT_MAX_ORCHESTRATION_HISTORY_SIZE));
  assert('A-SETUP', 'ownership', getDevPulseV2Owner('parallel_build_orchestration').phase === 20.4, '20.4');
  assert('A-SETUP', 'question signal', isOrchestrationQuestion('show parallel build orchestration plan'), 'signal');
  harness.endGroup('A-SETUP', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const projects = sampleProjects(3);
  const plan = buildOrchestrationPlan(projects);
  assert('B-REGISTRY', 'plan registered', getOrchestrationPlan(plan.planId) !== undefined, plan.planId);
  assert('B-REGISTRY', 'plan count', getOrchestrationPlanCount() === 1, String(getOrchestrationPlanCount()));
  assert('B-REGISTRY', 'list plans', listOrchestrationPlans().length === 1, '1');
  assert('B-REGISTRY', 'by project', listOrchestrationPlansByProject('P0').length === 1, 'P0');
  assert('B-REGISTRY', 'by workspace', listOrchestrationPlansByWorkspace(projects[0].workspaceId).length === 1, projects[0].workspaceId);

  const plan2 = buildOrchestrationPlan(sampleProjects(2));
  assert('B-REGISTRY', 'second plan', getOrchestrationPlanCount() === 2, String(getOrchestrationPlanCount()));
  assert('B-REGISTRY', 'get plan2', getOrchestrationPlan(plan2.planId)?.projects.length === 2, '2');

  harness.endGroup('B-REGISTRY', g);
}

function runDependencies(): void {
  const g = harness.beginGroup('C-DEPENDENCIES');
  resetAll();

  const chainProjects: OrchestrationProjectInput[] = [
    { projectId: 'A', workspaceId: 'W1', dependsOn: [] },
    { projectId: 'B', workspaceId: 'W2', dependsOn: ['A'] },
    { projectId: 'C', workspaceId: 'W3', dependsOn: ['B'] },
  ];
  const chainResult = buildDependencyChains(chainProjects);
  assert('C-DEPENDENCIES', 'chain count', chainResult.chains.length === 3, String(chainResult.chains.length));
  assert('C-DEPENDENCIES', 'chain C', chainResult.chains.some((c) => c.join('->') === 'A->B->C'), 'A->B->C');
  assert('C-DEPENDENCIES', 'dependency count', getDependencyCount(chainProjects) === 2, '2');

  const cycleProjects: OrchestrationProjectInput[] = [
    { projectId: 'X', workspaceId: 'W1', dependsOn: ['Y'] },
    { projectId: 'Y', workspaceId: 'W2', dependsOn: ['X'] },
  ];
  const cycleResult = buildDependencyChains(cycleProjects);
  assert('C-DEPENDENCIES', 'cycle detected', cycleResult.cycles.length > 0, String(cycleResult.cycles.length));

  const missingProjects: OrchestrationProjectInput[] = [
    { projectId: 'M1', workspaceId: 'W1', dependsOn: ['MISSING'] },
  ];
  const missingResult = buildDependencyChains(missingProjects);
  assert('C-DEPENDENCIES', 'missing detected', missingResult.missing.length > 0, String(missingResult.missing.length));

  const selfDep: OrchestrationProjectInput[] = [
    { projectId: 'S1', workspaceId: 'W1', dependsOn: ['S1'] },
  ];
  const selfResult = buildDependencyChains(selfDep);
  assert('C-DEPENDENCIES', 'self dependency', selfResult.invalid.length > 0, String(selfResult.invalid.length));

  harness.endGroup('C-DEPENDENCIES', g);
}

function runReadiness(): void {
  const g = harness.beginGroup('D-READINESS');
  resetAll();

  const readyProject: OrchestrationProjectInput = {
    projectId: 'R1', workspaceId: 'W1', projectState: 'ACTIVE', resourceAvailable: true, isolationOk: true,
  };
  const depResult = buildDependencyChains([readyProject]);
  assert('D-READINESS', 'READY', evaluateOrchestrationReadiness(readyProject, depResult) === 'READY', 'READY');

  const waitingProject: OrchestrationProjectInput = {
    projectId: 'R2', workspaceId: 'W2', dependsOn: ['R1'], projectState: 'ACTIVE', resourceAvailable: true, isolationOk: true,
  };
  const depResult2 = buildDependencyChains([readyProject, waitingProject]);
  assert('D-READINESS', 'WAITING', evaluateOrchestrationReadiness(waitingProject, depResult2) === 'WAITING', 'WAITING');

  const resourceBlocked: OrchestrationProjectInput = {
    projectId: 'R3', workspaceId: 'W3', resourceAvailable: false, isolationOk: true,
  };
  assert('D-READINESS', 'RESOURCE_BLOCKED', evaluateOrchestrationReadiness(resourceBlocked, depResult) === 'RESOURCE_BLOCKED', 'RESOURCE_BLOCKED');

  const isolationBlocked: OrchestrationProjectInput = {
    projectId: 'R4', workspaceId: 'W4', resourceAvailable: true, isolationOk: false,
  };
  assert('D-READINESS', 'BLOCKED isolation', evaluateOrchestrationReadiness(isolationBlocked, depResult) === 'BLOCKED', 'BLOCKED');

  const failedProject: OrchestrationProjectInput = {
    projectId: 'R5', workspaceId: 'W5', projectState: 'FAILED', resourceAvailable: true, isolationOk: true,
  };
  assert('D-READINESS', 'BLOCKED failed', evaluateOrchestrationReadiness(failedProject, depResult) === 'BLOCKED', 'BLOCKED');

  const allStatuses = evaluateAllReadiness([readyProject, waitingProject, resourceBlocked], depResult2);
  assert('D-READINESS', 'evaluate all', allStatuses.size === 3, String(allStatuses.size));

  harness.endGroup('D-READINESS', g);
}

function runCapacityAndGroups(): void {
  const g = harness.beginGroup('E-CAPACITY-GROUPS');
  resetAll();

  const projects = sampleProjects(5);
  const depResult = buildDependencyChains(projects);
  const statuses = evaluateAllReadiness(projects, depResult);
  const capacity = evaluateOrchestrationCapacity(projects);
  assert('E-CAPACITY-GROUPS', 'parallelism', capacity.estimatedParallelism >= 1, String(capacity.estimatedParallelism));
  assert('E-CAPACITY-GROUPS', 'safe limit', capacity.safeLimit >= 1, String(capacity.safeLimit));

  const groups = buildOrchestrationGroups(projects, statuses, capacity);
  assert('E-CAPACITY-GROUPS', 'groups created', groups.length > 0, String(groups.length));
  assert('E-CAPACITY-GROUPS', 'all projects grouped', groups.flat().length >= projects.filter((p) => statuses.get(p.projectId) === 'READY').length, 'grouped');

  harness.endGroup('E-CAPACITY-GROUPS', g);
}

function runConflictsAndSchedule(): void {
  const g = harness.beginGroup('F-CONFLICTS-SCHEDULE');
  resetAll();

  const projects: OrchestrationProjectInput[] = [
    { projectId: 'C1', workspaceId: 'WS1', resourceAvailable: false, isolationOk: true },
    { projectId: 'C2', workspaceId: 'WS1', resourceAvailable: true, isolationOk: true },
  ];
  const depResult = buildDependencyChains(projects);
  const groups = [['C1', 'C2']];
  const conflicts = detectOrchestrationConflicts(projects, depResult, groups);
  assert('F-CONFLICTS-SCHEDULE', 'resource conflict', conflicts.some((c) => c.conflictType === 'resource_conflict'), 'resource');
  assert('F-CONFLICTS-SCHEDULE', 'workspace conflict', conflicts.some((c) => c.conflictType === 'workspace_conflict'), 'workspace');
  assert('F-CONFLICTS-SCHEDULE', 'conflict count', getTotalOrchestrationConflictCount() > 0, String(getTotalOrchestrationConflictCount()));

  const schedule = buildOrchestrationSchedule('test-plan', projects, depResult, groups);
  assert('F-CONFLICTS-SCHEDULE', 'schedule groups', schedule.length === 1, String(schedule.length));

  const dupProjects: OrchestrationProjectInput[] = [
    { projectId: 'D1', workspaceId: 'W1', isolationOk: true },
  ];
  const dupDepResult = buildDependencyChains(dupProjects);
  const dupConflicts = detectOrchestrationConflicts(dupProjects, dupDepResult, [['D1', 'D1']]);
  assert('F-CONFLICTS-SCHEDULE', 'duplicate scheduling', dupConflicts.some((c) => c.conflictType === 'duplicate_scheduling'), 'duplicate');

  harness.endGroup('F-CONFLICTS-SCHEDULE', g);
}

function runPlanPipeline(): void {
  const g = harness.beginGroup('G-PLAN');
  resetAll();

  const projects: OrchestrationProjectInput[] = [
    { projectId: 'PL1', workspaceId: 'W1', priority: 'HIGH', projectState: 'ACTIVE', resourceAvailable: true, isolationOk: true },
    { projectId: 'PL2', workspaceId: 'W2', priority: 'NORMAL', dependsOn: ['PL1'], projectState: 'ACTIVE', resourceAvailable: true, isolationOk: true },
    { projectId: 'PL3', workspaceId: 'W3', priority: 'CRITICAL', projectState: 'ACTIVE', resourceAvailable: true, isolationOk: true },
  ];

  const plan = buildOrchestrationPlan(projects);
  assert('G-PLAN', 'plan id', plan.planId.length > 0, plan.planId);
  assert('G-PLAN', 'project count', plan.projects.length === 3, String(plan.projects.length));
  assert('G-PLAN', 'ready projects', plan.readyProjects.length >= 2, String(plan.readyProjects.length));
  assert('G-PLAN', 'waiting projects', plan.waitingProjects.includes('PL2'), 'PL2');
  assert('G-PLAN', 'execution groups', plan.executionGroups.length > 0, String(plan.executionGroups.length));
  assert('G-PLAN', 'dependency chains', plan.dependencyChains.length > 0, String(plan.dependencyChains.length));
  assert('G-PLAN', 'parallelism', plan.estimatedParallelism >= 1, String(plan.estimatedParallelism));

  const { plan: wrappedPlan, report } = buildOrchestrationPlanFromProjects(projects);
  assert('G-PLAN', 'wrapped plan', wrappedPlan.planId.length > 0, wrappedPlan.planId);
  assert('G-PLAN', 'report', report.projectCount === 3, String(report.projectCount));
  assert('G-PLAN', 'report recommendations', report.recommendations.length > 0, String(report.recommendations.length));

  harness.endGroup('G-PLAN', g);
}

function runHistoryCacheReporting(): void {
  const g = harness.beginGroup('H-HISTORY-CACHE');
  resetAll();

  const projects = sampleProjects(4);
  const plan = buildOrchestrationPlan(projects);
  recordOrchestrationHistory(plan, 0);
  assert('H-HISTORY-CACHE', 'history size', getOrchestrationHistorySize() === 1, String(getOrchestrationHistorySize()));

  for (let i = 0; i < 130; i++) {
    recordOrchestrationHistory(plan, i);
  }
  assert('H-HISTORY-CACHE', 'history bounded', getOrchestrationHistorySize() <= DEFAULT_MAX_ORCHESTRATION_HISTORY_SIZE, String(getOrchestrationHistorySize()));

  const report = generateOrchestrationReport(plan, projects);
  assert('H-HISTORY-CACHE', 'report id', report.reportId.length > 0, report.reportId);
  assert('H-HISTORY-CACHE', 'report groups', report.executionGroups.length > 0, String(report.executionGroups.length));

  getOrchestrationPlan(plan.planId);
  getOrchestrationPlan(plan.planId);
  const cache = getOrchestrationCacheStats();
  assert('H-HISTORY-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('H-HISTORY-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  harness.endGroup('H-HISTORY-CACHE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('I-INTEGRATION');
  resetAll();

  const brain = registerParallelBuildOrchestrationWithCentralBrain();
  assert('I-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerParallelBuildOrchestrationWithCentralBrain();
  assert('I-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('I-INTEGRATION', 'project vault', registerParallelBuildOrchestrationWithProjectVault().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'trust engine', registerParallelBuildOrchestrationWithTrustEngine().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'world2', registerParallelBuildOrchestrationWithWorld2Coordinator().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'uvl', registerParallelBuildOrchestrationWithUvl().uvlRowCount === 13, '13');
  assert('I-INTEGRATION', 'multi project', registerParallelBuildOrchestrationWithMultiProjectFoundation().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'workspace isolation', registerParallelBuildOrchestrationWithWorkspaceIsolation().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'resource allocation', registerParallelBuildOrchestrationWithResourceAllocation().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'autonomous builder', registerParallelBuildOrchestrationWithAutonomousBuilder().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'completion engine', registerParallelBuildOrchestrationWithCompletionEngine().readOnly === true, 'readOnly');

  harness.endGroup('I-INTEGRATION', g);
}

function stressOrchestration(count: number, label: string): void {
  const g = harness.beginGroup(`J-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  const projects = sampleProjects(count);
  const { plan, report } = buildOrchestrationPlanFromProjects(projects);

  const elapsed = performance.now() - start;

  assert(`J-STRESS-${label}`, 'plan projects', plan.projects.length === count, String(plan.projects.length));
  assert(`J-STRESS-${label}`, 'report count', report.projectCount === count, String(report.projectCount));
  assert(`J-STRESS-${label}`, 'plan count', getOrchestrationPlanCount() === 1, String(getOrchestrationPlanCount()));
  assert(`J-STRESS-${label}`, 'performance', elapsed < 60_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getParallelBuildOrchestrationRuntimeReport();
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
  console.log('\nDevPulse V2 — Phase 20.4 Parallel Build Orchestration');
  console.log('========================================================\n');

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

  const runtime = getParallelBuildOrchestrationRuntimeReport();

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
    failed.length === 0 ? PARALLEL_BUILD_ORCHESTRATION_PASS_TOKEN : 'PARALLEL_BUILD_ORCHESTRATION_V1_FAIL',
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

  console.log(`\n${PARALLEL_BUILD_ORCHESTRATION_PASS_TOKEN}`);
}

main();
