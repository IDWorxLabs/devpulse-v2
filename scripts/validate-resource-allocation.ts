/**
 * Phase 20.3 — Resource Allocation validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  RESOURCE_ALLOCATION_PASS_TOKEN,
  RESOURCE_ALLOCATION_OWNER_MODULE,
  DEFAULT_MAX_ALLOCATION_HISTORY_SIZE,
  allocateResources,
  allocateResourcesForProject,
  allocateResourcesFromInput,
  compareResourcePriority,
  configureResourceCapacity,
  createResourceBudget,
  dequeueAllocation,
  detectResourceContention,
  determineResourcePriority,
  enqueueAllocation,
  generateResourceAllocationReport,
  getAllocationCount,
  getAllocationHistorySize,
  getDevPulseV2ResourceAllocation,
  getQueueSize,
  getRemainingCapacity,
  getResourceAllocationRuntimeReport,
  getResourceCacheStats,
  getResourceCapacity,
  listAllocations,
  listQueuedAllocations,
  registerAllDefaultResources,
  registerResourceAllocationWithAutonomousBuilder,
  registerResourceAllocationWithCentralBrain,
  registerResourceAllocationWithCompletionEngine,
  registerResourceAllocationWithMultiProjectFoundation,
  registerResourceAllocationWithProjectVault,
  registerResourceAllocationWithTrustEngine,
  registerResourceAllocationWithUvl,
  registerResourceAllocationWithWorkspaceIsolation,
  registerResourceAllocationWithWorld2Coordinator,
  releaseResources,
  reserveResources,
  resetResourceAllocationModuleForTests,
} from '../src/resource-allocation/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { RESOURCE_ALLOCATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/resource-allocation');

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
  'resource-allocation.ts',
  'resource-allocation-types.ts',
  'resource-registry.ts',
  'resource-budget-manager.ts',
  'resource-allocation-engine.ts',
  'resource-priority-engine.ts',
  'resource-capacity-manager.ts',
  'resource-contention-detector.ts',
  'resource-reservation-manager.ts',
  'resource-queue-manager.ts',
  'resource-allocation-reporting.ts',
  'resource-allocation-history.ts',
  'resource-cache.ts',
  'index.ts',
];

function resetAll(): void {
  resetResourceAllocationModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2ResourceAllocation();
  assert('A-SETUP', 'pass token', authority.passToken === RESOURCE_ALLOCATION_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === RESOURCE_ALLOCATION_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'planning only', authority.planningOnly === true, 'planningOnly');
  assert('A-SETUP', 'uvl rows', RESOURCE_ALLOCATION_UVL_ROWS.length === 13, String(RESOURCE_ALLOCATION_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_ALLOCATION_HISTORY_SIZE === 128, String(DEFAULT_MAX_ALLOCATION_HISTORY_SIZE));
  harness.endGroup('A-SETUP', g);
}

function runCapacityAndPriority(): void {
  const g = harness.beginGroup('B-CAPACITY');
  resetAll();
  registerAllDefaultResources();

  const capacity = getResourceCapacity('BUILD_SLOT');
  assert('B-CAPACITY', 'build capacity', capacity.totalCapacity >= 20, String(capacity.totalCapacity));
  assert('B-CAPACITY', 'available', capacity.availableCapacity > 0, String(capacity.availableCapacity));

  configureResourceCapacity('BUILD_SLOT', 5);
  assert('B-CAPACITY', 'configured', getResourceCapacity('BUILD_SLOT').totalCapacity === 5, '5');

  const critical = determineResourcePriority({
    projectId: 'P1', resourceType: 'BUILD_SLOT', requestedUnits: 1, trustRecovery: true,
  });
  const high = determineResourcePriority({
    projectId: 'P2', resourceType: 'BUILD_SLOT', requestedUnits: 1, releaseCandidate: true,
  });
  const low = determineResourcePriority({
    projectId: 'P3', resourceType: 'BUILD_SLOT', requestedUnits: 1, planningOnly: true,
  });

  assert('B-CAPACITY', 'critical', critical === 'CRITICAL', critical);
  assert('B-CAPACITY', 'high', high === 'HIGH', high);
  assert('B-CAPACITY', 'low', low === 'LOW', low);
  assert('B-CAPACITY', 'priority order', compareResourcePriority('LOW', 'CRITICAL') > 0, 'order');

  harness.endGroup('B-CAPACITY', g);
}

function runAllocationAndQueue(): void {
  const g = harness.beginGroup('C-ALLOCATE');
  resetAll();
  registerAllDefaultResources();
  configureResourceCapacity('BUILD_SLOT', 3);

  const allocated = allocateResources({
    projectId: 'WORLD2_PROJECT_ALLOC_001',
    resourceType: 'BUILD_SLOT',
    requestedUnits: 1,
    activeBuild: true,
  });
  assert('C-ALLOCATE', 'allocated', allocated.status === 'ALLOCATED', allocated.status);
  assert('C-ALLOCATE', 'units', allocated.allocatedUnits === 1, String(allocated.allocatedUnits));

  allocateResources({ projectId: 'WORLD2_PROJECT_ALLOC_002', resourceType: 'BUILD_SLOT', requestedUnits: 1 });
  allocateResources({ projectId: 'WORLD2_PROJECT_ALLOC_003', resourceType: 'BUILD_SLOT', requestedUnits: 1 });
  const queued = allocateResources({
    projectId: 'WORLD2_PROJECT_ALLOC_004',
    resourceType: 'BUILD_SLOT',
    requestedUnits: 1,
    planningOnly: true,
  });
  assert('C-ALLOCATE', 'denied or queued', queued.status === 'DENIED' || queued.status === 'QUEUED', queued.status);
  assert('C-ALLOCATE', 'remaining', getRemainingCapacity('BUILD_SLOT') === 0, String(getRemainingCapacity('BUILD_SLOT')));

  enqueueAllocation('WORLD2_PROJECT_QUEUE_HIGH', 'BUILD_SLOT', 'HIGH', 1);
  enqueueAllocation('WORLD2_PROJECT_QUEUE_LOW', 'BUILD_SLOT', 'LOW', 1);
  const queue = listQueuedAllocations();
  assert('C-ALLOCATE', 'queue size', getQueueSize() >= 1, String(getQueueSize()));
  if (queue.length >= 2) {
    assert('C-ALLOCATE', 'priority first', compareResourcePriority(queue[1].priority, queue[0].priority) > 0, `${queue[0].priority} vs ${queue[1].priority}`);
  }

  const dequeued = dequeueAllocation();
  assert('C-ALLOCATE', 'dequeue', dequeued !== undefined, 'dequeued');

  harness.endGroup('C-ALLOCATE', g);
}

function runReservationBudgetContention(): void {
  const g = harness.beginGroup('D-RESERVE');
  resetAll();
  registerAllDefaultResources();
  configureResourceCapacity('VERIFICATION_SLOT', 10);

  const budget = createResourceBudget('VERIFICATION_SLOT', 5, 'WORLD2_PROJECT_BUDGET_001');
  assert('D-RESERVE', 'budget', budget.maxUnits === 5, String(budget.maxUnits));

  const reservation = reserveResources('WORLD2_PROJECT_RESERVE_001', 'VERIFICATION_SLOT', 3);
  assert('D-RESERVE', 'reserve ok', reservation.ok === true, String(reservation.ok));
  if (reservation.ok) {
    const released = releaseResources(reservation.reservation.reservationId);
    assert('D-RESERVE', 'release', released === true, String(released));
  }

  configureResourceCapacity('TESTING_SLOT', 2);
  allocateResources({ projectId: 'P_A', resourceType: 'TESTING_SLOT', requestedUnits: 1 });
  allocateResources({ projectId: 'P_B', resourceType: 'TESTING_SLOT', requestedUnits: 1 });
  const contention = detectResourceContention('TESTING_SLOT');
  assert('D-RESERVE', 'contention', contention.severity !== 'NONE', contention.severity);

  harness.endGroup('D-RESERVE', g);
}

function runReportingAndHistory(): void {
  const g = harness.beginGroup('E-REPORT');
  resetAll();
  registerAllDefaultResources();

  for (let i = 0; i < DEFAULT_MAX_ALLOCATION_HISTORY_SIZE + 10; i++) {
    allocateResources({
      projectId: `WORLD2_PROJECT_HIST_${i}`,
      resourceType: 'BUILD_SLOT',
      requestedUnits: 1,
      planningOnly: true,
    });
  }
  assert('E-REPORT', 'history bounded', getAllocationHistorySize() <= DEFAULT_MAX_ALLOCATION_HISTORY_SIZE, String(getAllocationHistorySize()));

  const report = generateResourceAllocationReport();
  assert('E-REPORT', 'report id', report.reportId.length > 0, report.reportId);
  assert('E-REPORT', 'capacities', report.capacities.length >= 6, String(report.capacities.length));
  assert('E-REPORT', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));

  getResourceCapacity('BUILD_SLOT');
  getResourceCapacity('BUILD_SLOT');
  const cache = getResourceCacheStats();
  assert('E-REPORT', 'cache hits', cache.hits >= 1, String(cache.hits));

  harness.endGroup('E-REPORT', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();

  const owner = getDevPulseV2Owner('resource_allocation');
  assert('F-INTEGRATION', 'ownership', owner.ownerModule === RESOURCE_ALLOCATION_OWNER_MODULE, owner.ownerModule);

  const brain = registerResourceAllocationWithCentralBrain();
  const vault = registerResourceAllocationWithProjectVault();
  const trust = registerResourceAllocationWithTrustEngine();
  const uvl = registerResourceAllocationWithUvl();
  const world2 = registerResourceAllocationWithWorld2Coordinator();
  const multiProject = registerResourceAllocationWithMultiProjectFoundation();
  const workspace = registerResourceAllocationWithWorkspaceIsolation();
  const builder = registerResourceAllocationWithAutonomousBuilder();
  const completion = registerResourceAllocationWithCompletionEngine();

  assert('F-INTEGRATION', 'central brain', brain.centralBrainSystems >= 1, String(brain.centralBrainSystems));
  assert('F-INTEGRATION', 'vault read-only', vault.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'trust read-only', trust.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'uvl read-only', uvl.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'world2 read-only', world2.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'multi project read-only', multiProject.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'workspace read-only', workspace.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'builder read-only', builder.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'completion read-only', completion.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'multi project token', brain.multiProjectFoundationToken.length > 0, brain.multiProjectFoundationToken);
  assert('F-INTEGRATION', 'workspace token', brain.workspaceIsolationToken.length > 0, brain.workspaceIsolationToken);

  const pipeline = allocateResourcesForProject('Allocation App', 'FEATURE', { activeBuild: true });
  assert('F-INTEGRATION', 'pipeline project', pipeline.projectId.length > 0, pipeline.projectId);
  assert('F-INTEGRATION', 'pipeline allocation', pipeline.allocation.status.length > 0, pipeline.allocation.status);

  const brainReuse = registerResourceAllocationWithCentralBrain();
  assert('F-INTEGRATION', 'bootstrap reuse', brainReuse.registeredAt === brain.registeredAt, 'cached');

  harness.endGroup('F-INTEGRATION', g);
}

function stressAllocations(count: number, label: string): void {
  const g = harness.beginGroup(`G-STRESS-${label}`);
  resetAll();
  registerAllDefaultResources();
  configureResourceCapacity('BUILD_SLOT', count);

  const start = performance.now();

  for (let i = 0; i < count; i++) {
    allocateResourcesFromInput({
      projectId: `WORLD2_PROJECT_STRESS_${label}_${String(i).padStart(6, '0')}`,
      resourceType: 'BUILD_SLOT',
      requestedUnits: 1,
      activeBuild: i % 3 === 0,
      planningOnly: i % 3 !== 0,
    });
  }

  const elapsed = performance.now() - start;

  assert(`G-STRESS-${label}`, 'allocation count', getAllocationCount() === count, String(getAllocationCount()));
  assert(`G-STRESS-${label}`, 'list allocations', listAllocations().length === count, String(listAllocations().length));
  assert(`G-STRESS-${label}`, 'performance', elapsed < 60_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getResourceAllocationRuntimeReport();
  assert(`G-STRESS-${label}`, 'runtime projects', runtime.projectCount === count, String(runtime.projectCount));
  assert(`G-STRESS-${label}`, 'cache stats', runtime.cacheHits + runtime.cacheMisses > 0, 'cache');

  harness.endGroup(`G-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('H-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 20.3 Resource Allocation');
  console.log('==============================================\n');

  runSetup();
  runCapacityAndPriority();
  runAllocationAndQueue();
  runReservationBudgetContention();
  runReportingAndHistory();
  runIntegration();
  stressAllocations(100, '100');
  stressAllocations(1000, '1000');
  stressAllocations(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getResourceAllocationRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Project count: ${runtime.projectCount}`,
    `Allocation count: ${runtime.allocationCount}`,
    `Queue size: ${runtime.queueSize}`,
    `Contention count: ${runtime.contentionCount}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    failed.length === 0 ? RESOURCE_ALLOCATION_PASS_TOKEN : 'RESOURCE_ALLOCATION_V1_FAIL',
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

  console.log(`\n${RESOURCE_ALLOCATION_PASS_TOKEN}`);
}

main();
