/**
 * Parallel Build Orchestration — public exports.
 */

import { resetOrchestrationRegistryForTests } from './orchestration-registry.js';
import { resetOrchestrationCacheForTests } from './orchestration-cache.js';
import { resetOrchestrationConflictDetectorForTests } from './orchestration-conflict-detector.js';
import { resetOrchestrationPlanCounterForTests } from './orchestration-plan-builder.js';
import { resetOrchestrationHistoryForTests } from './orchestration-history.js';
import { resetOrchestrationReportCounterForTests } from './orchestration-reporting.js';
import { resetParallelBuildOrchestrationForTests } from './parallel-build-orchestration.js';
import { resetWorkspaceIsolationExpansionModuleForTests } from '../workspace-isolation-expansion/index.js';

export {
  PARALLEL_BUILD_ORCHESTRATION_PASS_TOKEN,
  PARALLEL_BUILD_ORCHESTRATION_OWNER_MODULE,
  DEFAULT_MAX_ORCHESTRATION_HISTORY_SIZE,
  MAX_DEPENDENCY_CHAIN_DEPTH,
  ORCHESTRATION_QUESTION_SIGNALS,
  isOrchestrationQuestion,
} from './orchestration-types.js';

export type {
  OrchestrationStatus,
  OrchestrationProject,
  OrchestrationPlan,
  OrchestrationProjectInput,
  OrchestrationConflict,
  OrchestrationCapacityEvaluation,
  OrchestrationReport,
  OrchestrationHistoryEntry,
  OrchestrationRuntimeReport,
} from './orchestration-types.js';

export {
  registerOrchestrationPlan,
  getOrchestrationPlan,
  listOrchestrationPlans,
  listOrchestrationPlansByProject,
  listOrchestrationPlansByWorkspace,
  getOrchestrationPlanCount,
  resetOrchestrationRegistryForTests,
} from './orchestration-registry.js';

export { buildOrchestrationGroups } from './orchestration-group-manager.js';
export { buildDependencyChains, getDependencyCount } from './orchestration-dependency-manager.js';
export type { DependencyBuildResult } from './orchestration-dependency-manager.js';
export {
  evaluateOrchestrationReadiness,
  evaluateAllReadiness,
  getPriorityScore,
} from './orchestration-readiness-evaluator.js';
export { evaluateOrchestrationCapacity } from './orchestration-capacity-evaluator.js';
export {
  detectOrchestrationConflicts,
  getTotalOrchestrationConflictCount,
  resetOrchestrationConflictDetectorForTests,
} from './orchestration-conflict-detector.js';
export { buildOrchestrationSchedule } from './orchestration-scheduler.js';
export { buildOrchestrationPlan, resetOrchestrationPlanCounterForTests } from './orchestration-plan-builder.js';
export {
  recordOrchestrationHistory,
  getOrchestrationHistory,
  getOrchestrationHistorySize,
  resetOrchestrationHistoryForTests,
} from './orchestration-history.js';
export { generateOrchestrationReport, resetOrchestrationReportCounterForTests } from './orchestration-reporting.js';
export { getOrchestrationCacheStats, resetOrchestrationCacheForTests } from './orchestration-cache.js';

export {
  getDevPulseV2ParallelBuildOrchestration,
  registerParallelBuildOrchestrationWithCentralBrain,
  registerParallelBuildOrchestrationWithProjectVault,
  registerParallelBuildOrchestrationWithTrustEngine,
  registerParallelBuildOrchestrationWithWorld2Coordinator,
  registerParallelBuildOrchestrationWithUvl,
  registerParallelBuildOrchestrationWithMultiProjectFoundation,
  registerParallelBuildOrchestrationWithWorkspaceIsolation,
  registerParallelBuildOrchestrationWithResourceAllocation,
  registerParallelBuildOrchestrationWithAutonomousBuilder,
  registerParallelBuildOrchestrationWithCompletionEngine,
  buildOrchestrationPlanFromProjects,
  buildOrchestrationPlanFromCoordinatedProjects,
  getParallelBuildOrchestrationRuntimeReport,
  resetParallelBuildOrchestrationForTests,
} from './parallel-build-orchestration.js';

export type { ParallelBuildOrchestrationSystemSnapshot } from './parallel-build-orchestration.js';

export function resetParallelBuildOrchestrationModuleForTests(): void {
  resetOrchestrationRegistryForTests();
  resetOrchestrationCacheForTests();
  resetOrchestrationConflictDetectorForTests();
  resetOrchestrationPlanCounterForTests();
  resetOrchestrationHistoryForTests();
  resetOrchestrationReportCounterForTests();
  resetParallelBuildOrchestrationForTests();
  resetWorkspaceIsolationExpansionModuleForTests();
}
