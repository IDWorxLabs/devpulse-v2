/**
 * Multi Project Verification — public exports.
 */

import { resetProjectVerificationRegistryForTests } from './project-verification-registry.js';
import { resetProjectVerificationCacheForTests } from './project-verification-cache.js';
import { resetProjectVerificationHistoryForTests } from './project-verification-history.js';
import { resetProjectVerificationReportCounterForTests } from './project-verification-reporting.js';
import { resetMultiProjectVerificationForTests } from './multi-project-verification.js';
import { resetParallelBuildOrchestrationModuleForTests } from '../parallel-build-orchestration/index.js';

export {
  MULTI_PROJECT_VERIFICATION_PASS_TOKEN,
  MULTI_PROJECT_VERIFICATION_OWNER_MODULE,
  DEFAULT_MAX_VERIFICATION_HISTORY_SIZE,
  MULTI_PROJECT_VERIFICATION_QUESTION_SIGNALS,
  isMultiProjectVerificationQuestion,
} from './multi-project-verification-types.js';

export type {
  ProjectVerificationStatus,
  ProjectVerificationRecord,
  PortfolioVerificationSummary,
  ProjectVerificationInput,
  ProjectVerificationEvidence,
  MultiProjectVerificationReport,
  ProjectVerificationHistoryEntry,
  MultiProjectVerificationRuntimeReport,
} from './multi-project-verification-types.js';

export {
  registerProjectVerification,
  getProjectVerification,
  listProjectVerifications,
  listProjectVerificationsByWorkspace,
  listProjectVerificationsByStatus,
  getProjectVerificationCount,
  resetProjectVerificationRegistryForTests,
} from './project-verification-registry.js';

export { analyzeProjectVerificationEvidence } from './project-verification-evidence.js';
export { calculateProjectVerificationConfidence } from './project-verification-confidence.js';
export { calculateProjectVerificationRisk } from './project-verification-risk.js';
export {
  evaluateProjectVerificationReadiness,
  isVerificationReady,
} from './project-verification-readiness.js';
export { aggregateProjectVerification, getStatusPriority } from './project-verification-aggregator.js';
export { buildPortfolioVerificationSummary } from './project-verification-portfolio.js';
export {
  coordinateProjectVerification,
  coordinatePortfolioVerification,
} from './project-verification-coordinator.js';
export type { CoordinateProjectVerificationResult } from './project-verification-coordinator.js';
export {
  recordProjectVerificationHistory,
  getProjectVerificationHistory,
  getProjectVerificationHistorySize,
  resetProjectVerificationHistoryForTests,
} from './project-verification-history.js';
export {
  generateMultiProjectVerificationReport,
  resetProjectVerificationReportCounterForTests,
} from './project-verification-reporting.js';
export { getProjectVerificationCacheStats, resetProjectVerificationCacheForTests } from './project-verification-cache.js';

export {
  getDevPulseV2MultiProjectVerification,
  registerMultiProjectVerificationWithCentralBrain,
  registerMultiProjectVerificationWithProjectVault,
  registerMultiProjectVerificationWithTrustEngine,
  registerMultiProjectVerificationWithWorld2Coordinator,
  registerMultiProjectVerificationWithUvl,
  registerMultiProjectVerificationWithMultiProjectFoundation,
  registerMultiProjectVerificationWithWorkspaceIsolation,
  registerMultiProjectVerificationWithResourceAllocation,
  registerMultiProjectVerificationWithParallelBuildOrchestration,
  registerMultiProjectVerificationWithAutonomousTesting,
  registerMultiProjectVerificationWithAutonomousFixing,
  registerMultiProjectVerificationWithAutonomousVerification,
  registerMultiProjectVerificationWithCompletionEngine,
  verifyProjectsFromCoordinatedInputs,
  getMultiProjectVerificationRuntimeReport,
  resetMultiProjectVerificationForTests,
} from './multi-project-verification.js';

export type { MultiProjectVerificationSystemSnapshot } from './multi-project-verification.js';

export function resetMultiProjectVerificationModuleForTests(): void {
  resetProjectVerificationRegistryForTests();
  resetProjectVerificationCacheForTests();
  resetProjectVerificationHistoryForTests();
  resetProjectVerificationReportCounterForTests();
  resetMultiProjectVerificationForTests();
  resetParallelBuildOrchestrationModuleForTests();
}
