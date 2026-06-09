/**
 * DevPulse V2 Phase 19.2 — Build Strategy Engine public API.
 */

import { resetBuildStrategyStoreForTests } from './build-strategy-store.js';
import { resetBuildStrategyDiagnosticsForTests } from './build-strategy-diagnostics.js';
import { resetBuildStrategyReportCounterForTests } from './build-strategy-report-builder.js';
import { resetBuildStrategyBootstrapForTests } from './build-strategy-registry.js';
import { resetBuildStrategyReadCacheForTests } from './read-cache.js';

export {
  BUILD_STRATEGY_ENGINE_PASS_TOKEN,
  BUILD_STRATEGY_ENGINE_OWNER_MODULE,
  DUPLICATE_BUILD_STRATEGY_AUTHORITY_RISK_PREFIX,
  TRACKED_BUILD_STRATEGY_CATEGORIES,
  FORBIDDEN_BUILD_STRATEGY_DUPLICATES,
  BUILD_STRATEGY_COMPANION_DOMAINS,
  BUILD_STRATEGY_QUESTION_SIGNALS,
  isBuildStrategyEngineQuestion,
  isDuplicateBuildStrategyExecutorQuestion,
  isValidBuildStrategyStateTransition,
  validateBuildStrategyState,
  resolveDefaultBuildModeForCategory,
  resolveDefaultAutonomyForCategory,
  resolveDefaultDepthForCategory,
  resolveDefaultStageNamesForCategory,
  type BuildStrategyCategory,
  type BuildMode,
  type AutonomyLevel,
  type BuildDepth,
  type BuildStrategyState,
  type BuildStrategyStatus,
  type BuildStrategyLifecycleEventType,
  type BuildStrategyReportType,
  type BuildStrategyOwnership,
  type BuildStrategyContext,
  type BuildStrategyClassification,
  type BuildStrategyModeSelection,
  type BuildStrategyAutonomySelection,
  type BuildStrategyRiskEvaluation,
  type BuildStrategyConfidenceEvaluation,
  type BuildStrategyDepthSelection,
  type BuildStrategyStageRecommendation,
  type BuildStrategyReadiness,
  type BuildStrategyConstraint,
  type BuildStrategyDependency,
  type BuildStrategyPolicy,
  type BuildStrategyAutonomousBuilderLink,
  type BuildStrategyDeliveryLink,
  type BuildStrategyPushLink,
  type BuildStrategyNotificationLink,
  type BuildStrategyInboxLink,
  type BuildStrategyCloudLink,
  type BuildStrategyWorld2Link,
  type BuildStrategyAiDevLink,
  type BuildStrategyOperatorFeedLink,
  type BuildStrategyProjectVaultLink,
  type BuildStrategyMetadata,
  type BuildStrategyProvenance,
  type BuildStrategySession,
  type BuildStrategyLifecycleEvent,
  type BuildStrategyHistoryEntry,
  type BuildStrategyStateHistoryEntry,
  type BuildStrategyReport,
  type BuildStrategyDiagnostics,
  type BuildStrategyValidationResult,
  type RegisterBuildStrategyInput,
  type RegisterBuildStrategyResult,
  type PrepareBuildStrategyEngineInput,
  type PrepareBuildStrategyEngineResult,
  type DuplicateBuildStrategyRiskContext,
} from './build-strategy-types.js';

export {
  resetBuildStrategyStoreForTests,
  nextBuildStrategyId,
  nextBuildStrategyReportId,
} from './build-strategy-store.js';
export {
  buildBuildStrategyOwnership,
  recordBuildStrategyOwnershipHistory,
  registerBuildStrategyOwnership,
} from './build-strategy-ownership.js';
export {
  buildDefaultBuildStrategyContext,
  refreshBuildStrategyContext,
  getBuildStrategyContextById,
  validateBuildStrategyContext,
  detectBuildStrategyContextMismatch,
} from './build-strategy-context.js';
export {
  classifyBuildStrategy,
  getBuildStrategyClassification,
} from './build-strategy-classifier.js';
export {
  selectBuildStrategyCategory,
  resolveCategoryFromAutonomousBuildName,
} from './build-strategy-selector.js';
export {
  selectBuildMode,
  getBuildStrategyMode,
} from './build-strategy-mode.js';
export {
  selectAutonomyLevel,
  getBuildStrategyAutonomy,
} from './build-strategy-autonomy.js';
export {
  evaluateBuildRisk,
  getBuildStrategyRisk,
} from './build-strategy-risk.js';
export {
  evaluateBuildConfidence,
  getBuildStrategyConfidence,
} from './build-strategy-confidence.js';
export {
  selectBuildDepth,
  getBuildStrategyDepth,
} from './build-strategy-depth.js';
export {
  recommendBuildStage,
  recommendBuildStages,
  getBuildStrategyStages,
} from './build-strategy-stage-recommender.js';
export {
  evaluateBuildReadiness,
  getBuildStrategyReadiness,
} from './build-strategy-readiness.js';
export {
  registerBuildConstraint,
  getBuildStrategyConstraints,
} from './build-strategy-constraint.js';
export {
  registerBuildDependency,
  getBuildStrategyDependencies,
} from './build-strategy-dependency.js';
export {
  applyBuildPolicy,
  getBuildStrategyPolicy,
} from './build-strategy-policy.js';
export {
  linkBuildStrategyToAutonomousBuilder,
  getAutonomousBuilderForBuildStrategy,
  listBuildStrategiesByAutonomousBuilder,
  detectBuildStrategyAutonomousBuilderMismatch,
  findAutonomousBuildByName,
} from './build-strategy-autonomous-builder-bridge.js';
export {
  linkBuildStrategyToDelivery,
  getDeliveryForBuildStrategy,
  listBuildStrategiesByDelivery,
  detectBuildStrategyDeliveryMismatch,
  findDeliveryByName,
} from './build-strategy-delivery-bridge.js';
export {
  linkBuildStrategyToPush,
  getPushForBuildStrategy,
  listBuildStrategiesByPush,
  detectBuildStrategyPushMismatch,
  findPushByName,
} from './build-strategy-push-bridge.js';
export {
  linkBuildStrategyToCloud,
  getCloudForBuildStrategy,
  listBuildStrategiesByCloud,
  detectBuildStrategyCloudMismatch,
} from './build-strategy-cloud-bridge.js';
export {
  linkBuildStrategyToWorld2,
  getWorld2ForBuildStrategy,
  listBuildStrategiesByWorld2,
  detectBuildStrategyWorld2Mismatch,
} from './build-strategy-world2-bridge.js';
export {
  linkBuildStrategyToAiDev,
  getAiDevForBuildStrategy,
  listBuildStrategiesByAiDev,
  detectBuildStrategyAiDevMismatch,
} from './build-strategy-aidev-bridge.js';
export {
  linkBuildStrategyToNotification,
  getNotificationForBuildStrategy,
  listBuildStrategiesByNotification,
  detectBuildStrategyNotificationMismatch,
  findNotificationByName,
} from './build-strategy-notification-bridge.js';
export {
  linkBuildStrategyToInbox,
  getInboxForBuildStrategy,
  listBuildStrategiesByInbox,
  detectBuildStrategyInboxMismatch,
  findInboxEntryByName,
} from './build-strategy-inbox-bridge.js';
export {
  linkBuildStrategyToOperatorFeed,
  getOperatorFeedForBuildStrategy,
  listBuildStrategiesByOperatorFeed,
  detectBuildStrategyOperatorFeedMismatch,
} from './build-strategy-operator-feed-bridge.js';
export {
  linkBuildStrategyToProjectVault,
  getProjectVaultForBuildStrategy,
  listBuildStrategiesByProjectVault,
  detectBuildStrategyProjectVaultMismatch,
} from './build-strategy-project-vault-bridge.js';
export {
  setBuildStrategyState,
  getBuildStrategyState,
  trackBuildStrategyStateHistory,
} from './build-strategy-state-manager.js';
export {
  recordBuildStrategyLifecycleEvent,
  listBuildStrategyLifecycleEvents,
} from './build-strategy-lifecycle.js';
export {
  createBuildStrategy,
  getBuildStrategy,
  listBuildStrategies,
  blockBuildStrategy,
  completeBuildStrategy,
  archiveBuildStrategy,
  trackBuildStrategyMetadata,
  trackBuildStrategyOwnership,
  runBuildStrategyPlanningPipeline,
} from './build-strategy-manager.js';
export {
  getBuildStrategyHistory,
  listBuildStrategyHistoryConsumers,
  recordBuildStrategyHistoryEntry,
} from './build-strategy-history.js';
export {
  queryBuildStrategyRecords,
  listBuildStrategyRecordsAll,
  listBuildStrategiesByProject,
  listBuildStrategiesByRuntime,
  listBuildStrategiesByState,
  countBuildStrategiesByState,
  type BuildStrategyQuery,
} from './build-strategy-query.js';
export {
  buildDuplicateBuildStrategyRiskContext,
  evaluateDuplicateBuildStrategyRisk,
  validateBuildStrategyRegistration,
  validateBuildStrategyRecord,
} from './build-strategy-validator.js';
export {
  getBuildStrategyDiagnostics,
  updateBuildStrategyDiagnostics,
  resetBuildStrategyDiagnosticsForTests,
  runBuildStrategyDiagnosticsScan,
} from './build-strategy-diagnostics.js';
export {
  buildAllBuildStrategyReports,
  composeBuildStrategyResponse,
  buildBuildStrategyFailureContext,
  resetBuildStrategyReportCounterForTests,
  buildBuildStrategyInventoryReport,
  buildBuildStrategyOwnershipReport,
  buildBuildStrategyClassificationReport,
  buildBuildStrategyModeReport,
  buildBuildStrategyAutonomyReport,
  buildBuildStrategyRiskReport,
  buildBuildStrategyConfidenceReport,
  buildBuildStrategyDepthReport,
  buildBuildStrategyStagesReport,
  buildBuildStrategyReadinessReport,
  buildBuildStrategyConstraintReport,
  buildBuildStrategyDependencyReport,
  buildBuildStrategyPolicyReport,
  buildBuildStrategyContextReport,
  buildBuildStrategyStateReport,
  buildBuildStrategyLifecycleReport,
  buildBuildStrategyHistoryReport,
  buildBuildStrategyDiagnosticsReport,
  buildBuildStrategyCloudReport,
  buildBuildStrategyWorld2Report,
  buildBuildStrategyAiDevReport,
  buildBuildStrategyProjectVaultReport,
  buildBuildStrategyOperatorFeedReport,
  buildBuildStrategyNotificationReport,
  buildBuildStrategyInboxReport,
  buildBuildStrategyDeliveryReport,
  buildBuildStrategyPushReport,
  buildBuildStrategyAutonomousBuilderReport,
} from './build-strategy-report-builder.js';
export {
  registerBuildStrategy,
  registerBuildStrategyOwnershipRecord,
  prepareBuildStrategyEngine,
  processBuildStrategyRequest,
  getBuildStrategyEngineContext,
  resetBuildStrategyBootstrapForTests,
  getBuildStrategyRecord,
} from './build-strategy-registry.js';

export function getDevPulseV2BuildStrategyEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_build_strategy_engine',
    passToken: 'BUILD_STRATEGY_ENGINE_V1_PASS',
    phase: 19.2,
    extensionOnly: true,
  };
}

export function resetBuildStrategyEngineForTests(): void {
  resetBuildStrategyStoreForTests();
  resetBuildStrategyDiagnosticsForTests();
  resetBuildStrategyReportCounterForTests();
  resetBuildStrategyBootstrapForTests();
  resetBuildStrategyReadCacheForTests();
}
