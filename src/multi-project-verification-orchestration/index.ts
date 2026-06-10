/**
 * Multi Project Verification Orchestration — public exports.
 */

import { resetVerificationOrchestrationRegistryForTests } from './verification-orchestration-registry.js';
import { resetVerificationOrchestrationCacheForTests } from './verification-cache.js';
import { resetVerificationConflictDetectorForTests } from './verification-conflict-detector.js';
import { resetVerificationOrchestrationPlanCounterForTests } from './verification-plan-builder.js';
import { resetVerificationOrchestrationHistoryForTests } from './verification-history.js';
import { resetVerificationOrchestrationReportCounterForTests } from './verification-reporting.js';
import { resetVerificationGroupCounterForTests } from './verification-group-manager.js';
import { resetMultiProjectVerificationOrchestrationForTests } from './multi-project-verification-orchestration.js';
import { resetMultiProjectVerificationModuleForTests } from '../multi-project-verification/index.js';

export {
  MULTI_PROJECT_VERIFICATION_ORCHESTRATION_PASS_TOKEN,
  MULTI_PROJECT_VERIFICATION_ORCHESTRATION_OWNER_MODULE,
  DEFAULT_MAX_VERIFICATION_ORCHESTRATION_HISTORY_SIZE,
  MAX_VERIFICATION_DEPENDENCY_CHAIN_DEPTH,
  VERIFICATION_ORCHESTRATION_QUESTION_SIGNALS,
  isVerificationOrchestrationQuestion,
} from './verification-orchestration-types.js';

export type {
  VerificationOrchestrationStatus,
  VerificationGroup,
  VerificationOrchestrationPlan,
  VerificationOrchestrationProjectInput,
  VerificationConflict,
  VerificationCapacityEvaluation,
  VerificationOrchestrationReport,
  VerificationOrchestrationHistoryEntry,
  VerificationOrchestrationRuntimeReport,
} from './verification-orchestration-types.js';

export {
  registerVerificationOrchestrationPlan,
  getVerificationOrchestrationPlan,
  listVerificationOrchestrationPlans,
  listVerificationOrchestrationPlansByProject,
  listVerificationOrchestrationPlansByGroup,
  getVerificationOrchestrationPlanCount,
  getVerificationGroupsFromPlan,
  resetVerificationOrchestrationRegistryForTests,
} from './verification-orchestration-registry.js';

export { buildVerificationGroups, resetVerificationGroupCounterForTests } from './verification-group-manager.js';
export {
  buildVerificationDependencyChains,
  getVerificationDependencyCount,
} from './verification-dependency-manager.js';
export type { VerificationDependencyBuildResult } from './verification-dependency-manager.js';
export {
  evaluateVerificationOrchestrationReadiness,
  evaluateAllVerificationReadiness,
  getConfidenceBand,
  getRiskBand,
  getVerificationPriorityScore,
} from './verification-readiness-evaluator.js';
export { evaluateVerificationCapacity } from './verification-capacity-evaluator.js';
export {
  detectVerificationConflicts,
  getTotalVerificationConflictCount,
  resetVerificationConflictDetectorForTests,
} from './verification-conflict-detector.js';
export { buildVerificationSchedule } from './verification-scheduler.js';
export {
  buildVerificationOrchestrationPlan,
  resetVerificationOrchestrationPlanCounterForTests,
} from './verification-plan-builder.js';
export {
  recordVerificationOrchestrationHistory,
  getVerificationOrchestrationHistory,
  getVerificationOrchestrationHistorySize,
  resetVerificationOrchestrationHistoryForTests,
} from './verification-history.js';
export {
  generateVerificationOrchestrationReport,
  resetVerificationOrchestrationReportCounterForTests,
} from './verification-reporting.js';
export {
  getVerificationOrchestrationCacheStats,
  resetVerificationOrchestrationCacheForTests,
} from './verification-cache.js';

export {
  getDevPulseV2MultiProjectVerificationOrchestration,
  registerMultiProjectVerificationOrchestrationWithCentralBrain,
  registerMultiProjectVerificationOrchestrationWithProjectVault,
  registerMultiProjectVerificationOrchestrationWithTrustEngine,
  registerMultiProjectVerificationOrchestrationWithWorld2Coordinator,
  registerMultiProjectVerificationOrchestrationWithUvl,
  registerMultiProjectVerificationOrchestrationWithMultiProjectFoundation,
  registerMultiProjectVerificationOrchestrationWithWorkspaceIsolation,
  registerMultiProjectVerificationOrchestrationWithResourceAllocation,
  registerMultiProjectVerificationOrchestrationWithParallelBuildOrchestration,
  registerMultiProjectVerificationOrchestrationWithMultiProjectVerification,
  registerMultiProjectVerificationOrchestrationWithAutonomousVerification,
  registerMultiProjectVerificationOrchestrationWithCompletionEngine,
  buildVerificationOrchestrationPlanFromProjects,
  buildVerificationOrchestrationPlanFromCoordinatedProjects,
  getMultiProjectVerificationOrchestrationRuntimeReport,
  resetMultiProjectVerificationOrchestrationForTests,
} from './multi-project-verification-orchestration.js';

export type { MultiProjectVerificationOrchestrationSystemSnapshot } from './multi-project-verification-orchestration.js';

export function resetMultiProjectVerificationOrchestrationModuleForTests(): void {
  resetVerificationOrchestrationRegistryForTests();
  resetVerificationOrchestrationCacheForTests();
  resetVerificationConflictDetectorForTests();
  resetVerificationOrchestrationPlanCounterForTests();
  resetVerificationOrchestrationHistoryForTests();
  resetVerificationOrchestrationReportCounterForTests();
  resetVerificationGroupCounterForTests();
  resetMultiProjectVerificationOrchestrationForTests();
  resetMultiProjectVerificationModuleForTests();
}
