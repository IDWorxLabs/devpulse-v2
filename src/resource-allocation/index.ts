/**
 * Resource Allocation — public exports.
 */

import { resetResourceRegistryForTests } from './resource-registry.js';
import { resetResourceCacheForTests } from './resource-cache.js';
import { resetResourceBudgetsForTests } from './resource-budget-manager.js';
import { resetResourceReservationsForTests } from './resource-reservation-manager.js';
import { resetResourceQueueForTests } from './resource-queue-manager.js';
import { resetContentionDetectorForTests } from './resource-contention-detector.js';
import { resetAllocationEngineForTests } from './resource-allocation-engine.js';
import { resetAllocationHistoryForTests } from './resource-allocation-history.js';
import { resetAllocationReportCounterForTests } from './resource-allocation-reporting.js';
import { resetResourceAllocationForTests } from './resource-allocation.js';
import { resetWorkspaceIsolationExpansionModuleForTests } from '../workspace-isolation-expansion/index.js';

export {
  RESOURCE_ALLOCATION_PASS_TOKEN,
  RESOURCE_ALLOCATION_OWNER_MODULE,
  DEFAULT_MAX_ALLOCATION_HISTORY_SIZE,
  RESOURCE_ALLOCATION_QUESTION_SIGNALS,
  isResourceAllocationQuestion,
} from './resource-allocation-types.js';

export type {
  ResourceType,
  ResourcePriority,
  AllocationStatus,
  ContentionSeverity,
  ResourceAllocation,
  ResourceRecord,
  ResourceCapacitySnapshot,
  ResourceBudget,
  ResourceReservation,
  QueuedAllocationRequest,
  ContentionReport,
  AllocationHistoryEntry,
  ResourceAllocationReport,
  AllocateResourcesInput,
  ResourceRuntimeReport,
} from './resource-allocation-types.js';

export {
  registerResource,
  getResource,
  listResources,
  registerAllDefaultResources,
  storeAllocation,
  getAllocation,
  listAllocations,
  listAllocationsByProject,
  getAllocationCount,
  resetResourceRegistryForTests,
} from './resource-registry.js';

export {
  configureResourceCapacity,
  getResourceCapacity,
  getRemainingCapacity,
  getAllCapacitySnapshots,
} from './resource-capacity-manager.js';

export { determineResourcePriority, compareResourcePriority } from './resource-priority-engine.js';
export { allocateResources, resetAllocationEngineForTests } from './resource-allocation-engine.js';

export {
  createResourceBudget,
  updateResourceBudget,
  getResourceBudget,
  getBudgetsForProject,
  resetResourceBudgetsForTests,
} from './resource-budget-manager.js';

export {
  reserveResources,
  releaseResources,
  listReservationsForProject,
  getReservationCount,
  resetResourceReservationsForTests,
} from './resource-reservation-manager.js';

export {
  detectResourceContention,
  getTotalContentionCount,
  resetContentionDetectorForTests,
} from './resource-contention-detector.js';

export {
  enqueueAllocation,
  dequeueAllocation,
  listQueuedAllocations,
  getQueueSize,
  resetResourceQueueForTests,
} from './resource-queue-manager.js';

export {
  recordAllocationHistory,
  getAllocationHistory,
  getAllocationHistorySize,
  resetAllocationHistoryForTests,
} from './resource-allocation-history.js';

export {
  generateResourceAllocationReport,
  resetAllocationReportCounterForTests,
} from './resource-allocation-reporting.js';

export { getResourceCacheStats, resetResourceCacheForTests } from './resource-cache.js';

export {
  getDevPulseV2ResourceAllocation,
  registerResourceAllocationWithCentralBrain,
  registerResourceAllocationWithProjectVault,
  registerResourceAllocationWithTrustEngine,
  registerResourceAllocationWithWorld2Coordinator,
  registerResourceAllocationWithUvl,
  registerResourceAllocationWithMultiProjectFoundation,
  registerResourceAllocationWithWorkspaceIsolation,
  registerResourceAllocationWithAutonomousBuilder,
  registerResourceAllocationWithCompletionEngine,
  allocateResourcesForProject,
  allocateResourcesFromInput,
  getResourceAllocationRuntimeReport,
  resetResourceAllocationForTests,
} from './resource-allocation.js';

export type { ResourceAllocationSystemSnapshot } from './resource-allocation.js';

export function resetResourceAllocationModuleForTests(): void {
  resetResourceRegistryForTests();
  resetResourceCacheForTests();
  resetResourceBudgetsForTests();
  resetResourceReservationsForTests();
  resetResourceQueueForTests();
  resetContentionDetectorForTests();
  resetAllocationEngineForTests();
  resetAllocationHistoryForTests();
  resetAllocationReportCounterForTests();
  resetResourceAllocationForTests();
  resetWorkspaceIsolationExpansionModuleForTests();
}
