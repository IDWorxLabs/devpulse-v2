/**
 * DevPulse V2 Phase 19.1 — Autonomous Builder Foundation public API.
 */

import { resetAutonomousBuilderStoreForTests } from './autonomous-builder-store.js';
import { resetAutonomousBuildDiagnosticsForTests } from './autonomous-builder-diagnostics.js';
import { resetAutonomousBuilderReportCounterForTests } from './autonomous-builder-report-builder.js';
import { resetAutonomousBuilderBootstrapForTests } from './autonomous-builder-registry.js';
import { resetAutonomousBuilderReadCacheForTests } from './read-cache.js';

export {
  AUTONOMOUS_BUILDER_FOUNDATION_PASS_TOKEN,
  AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
  DUPLICATE_AUTONOMOUS_BUILDER_AUTHORITY_RISK_PREFIX,
  TRACKED_AUTONOMOUS_BUILD_CATEGORIES,
  FORBIDDEN_AUTONOMOUS_BUILDER_DUPLICATES,
  AUTONOMOUS_BUILDER_COMPANION_DOMAINS,
  AUTONOMOUS_BUILDER_QUESTION_SIGNALS,
  isAutonomousBuilderFoundationQuestion,
  isDuplicateAutonomousBuilderExecutorQuestion,
  isValidAutonomousBuildStateTransition,
  validateAutonomousBuildState,
  resolveDefaultStageNamesForCategory,
  type AutonomousBuildCategory,
  type AutonomousBuildState,
  type AutonomousBuildStatus,
  type AutonomousBuildLifecycleEventType,
  type AutonomousBuildReportType,
  type AutonomousBuildOwnership,
  type AutonomousBuildContext,
  type AutonomousBuildGoal,
  type AutonomousBuildPlan,
  type AutonomousBuildStage,
  type AutonomousBuildReadiness,
  type AutonomousBuildConstraint,
  type AutonomousBuildCapability,
  type AutonomousBuildDeliveryLink,
  type AutonomousBuildPushLink,
  type AutonomousBuildNotificationLink,
  type AutonomousBuildInboxLink,
  type AutonomousBuildCloudLink,
  type AutonomousBuildWorld2Link,
  type AutonomousBuildAiDevLink,
  type AutonomousBuildOperatorFeedLink,
  type AutonomousBuildProjectVaultLink,
  type AutonomousBuildMetadata,
  type AutonomousBuildProvenance,
  type AutonomousBuildSession,
  type AutonomousBuildLifecycleEvent,
  type AutonomousBuildHistoryEntry,
  type AutonomousBuildStateHistoryEntry,
  type AutonomousBuildReport,
  type AutonomousBuildDiagnostics,
  type AutonomousBuildValidationResult,
  type RegisterAutonomousBuildInput,
  type RegisterAutonomousBuildResult,
  type PrepareAutonomousBuilderFoundationInput,
  type PrepareAutonomousBuilderFoundationResult,
  type DuplicateAutonomousBuilderRiskContext,
} from './autonomous-builder-types.js';

export {
  resetAutonomousBuilderStoreForTests,
  nextAutonomousBuildId,
  nextAutonomousBuildReportId,
} from './autonomous-builder-store.js';
export {
  buildAutonomousBuildOwnership,
  recordAutonomousBuildOwnershipHistory,
  registerAutonomousBuildOwnership,
} from './autonomous-builder-ownership.js';
export {
  buildDefaultAutonomousBuildContext,
  refreshAutonomousBuildContext,
  getAutonomousBuildContextById,
  validateAutonomousBuildContext,
  detectAutonomousBuildContextMismatch,
} from './autonomous-builder-context.js';
export {
  createAutonomousGoal,
  getAutonomousBuildGoal,
} from './autonomous-builder-goal.js';
export {
  createAutonomousPlan,
  getAutonomousBuildPlan,
} from './autonomous-builder-plan.js';
export {
  createAutonomousStage,
  createAutonomousStagesForPlan,
  getAutonomousBuildStages,
} from './autonomous-builder-stage.js';
export {
  evaluateReadiness,
  getAutonomousBuildReadiness,
} from './autonomous-builder-readiness.js';
export {
  registerConstraint,
  getAutonomousBuildConstraints,
} from './autonomous-builder-constraint.js';
export {
  registerCapability,
  getAutonomousBuildCapabilities,
} from './autonomous-builder-capability.js';
export {
  linkAutonomousBuildToDelivery,
  getDeliveryForAutonomousBuild,
  listAutonomousBuildsByDelivery,
  detectAutonomousBuildDeliveryMismatch,
  findDeliveryByName,
} from './autonomous-builder-delivery-bridge.js';
export {
  linkAutonomousBuildToPush,
  getPushForAutonomousBuild,
  listAutonomousBuildsByPush,
  detectAutonomousBuildPushMismatch,
  findPushByName,
} from './autonomous-builder-push-bridge.js';
export {
  linkAutonomousBuildToCloud,
  getCloudForAutonomousBuild,
  listAutonomousBuildsByCloud,
  detectAutonomousBuildCloudMismatch,
} from './autonomous-builder-cloud-bridge.js';
export {
  linkAutonomousBuildToWorld2,
  getWorld2ForAutonomousBuild,
  listAutonomousBuildsByWorld2,
  detectAutonomousBuildWorld2Mismatch,
} from './autonomous-builder-world2-bridge.js';
export {
  linkAutonomousBuildToAiDev,
  getAiDevForAutonomousBuild,
  listAutonomousBuildsByAiDev,
  detectAutonomousBuildAiDevMismatch,
} from './autonomous-builder-aidev-bridge.js';
export {
  linkAutonomousBuildToNotification,
  getNotificationForAutonomousBuild,
  listAutonomousBuildsByNotification,
  detectAutonomousBuildNotificationMismatch,
  findNotificationByName,
} from './autonomous-builder-notification-bridge.js';
export {
  linkAutonomousBuildToInbox,
  getInboxForAutonomousBuild,
  listAutonomousBuildsByInbox,
  detectAutonomousBuildInboxMismatch,
  findInboxEntryByName,
} from './autonomous-builder-inbox-bridge.js';
export {
  linkAutonomousBuildToOperatorFeed,
  getOperatorFeedForAutonomousBuild,
  listAutonomousBuildsByOperatorFeed,
  detectAutonomousBuildOperatorFeedMismatch,
} from './autonomous-builder-operator-feed-bridge.js';
export {
  linkAutonomousBuildToProjectVault,
  getProjectVaultForAutonomousBuild,
  listAutonomousBuildsByProjectVault,
  detectAutonomousBuildProjectVaultMismatch,
} from './autonomous-builder-project-vault-bridge.js';
export {
  setAutonomousBuildState,
  getAutonomousBuildState,
  trackAutonomousBuildStateHistory,
} from './autonomous-builder-state-manager.js';
export {
  recordAutonomousBuildLifecycleEvent,
  listAutonomousBuildLifecycleEvents,
} from './autonomous-builder-lifecycle.js';
export {
  createAutonomousBuild,
  getAutonomousBuild,
  listAutonomousBuilds,
  pauseAutonomousBuild,
  blockAutonomousBuild,
  completeAutonomousBuild,
  archiveAutonomousBuild,
  trackAutonomousMetadata,
  trackAutonomousOwnership,
  runAutonomousBuildPlanningPipeline,
} from './autonomous-builder-manager.js';
export {
  getAutonomousBuildHistory,
  listAutonomousBuildHistoryConsumers,
  recordAutonomousBuildHistoryEntry,
} from './autonomous-builder-history.js';
export {
  queryAutonomousBuildRecords,
  listAutonomousBuildRecordsAll,
  listAutonomousBuildsByProject,
  listAutonomousBuildsByRuntime,
  listAutonomousBuildsByState,
  countAutonomousBuildsByState,
  type AutonomousBuildQuery,
} from './autonomous-builder-query.js';
export {
  buildDuplicateAutonomousBuilderRiskContext,
  evaluateDuplicateAutonomousBuilderRisk,
  validateAutonomousBuildRegistration,
  validateAutonomousBuildRecord,
} from './autonomous-builder-validator.js';
export {
  getAutonomousBuildDiagnostics,
  updateAutonomousBuildDiagnostics,
  resetAutonomousBuildDiagnosticsForTests,
  runAutonomousBuildDiagnosticsScan,
} from './autonomous-builder-diagnostics.js';
export {
  buildAllAutonomousBuilderReports,
  composeAutonomousBuilderResponse,
  buildAutonomousBuilderFailureContext,
  resetAutonomousBuilderReportCounterForTests,
  buildAutonomousBuildInventoryReport,
  buildAutonomousBuildOwnershipReport,
  buildAutonomousBuildGoalReport,
  buildAutonomousBuildPlanReport,
  buildAutonomousBuildStageReport,
  buildAutonomousBuildReadinessReport,
  buildAutonomousBuildConstraintReport,
  buildAutonomousBuildCapabilityReport,
  buildAutonomousBuildContextReport,
  buildAutonomousBuildStateReport,
  buildAutonomousBuildLifecycleReport,
  buildAutonomousBuildHistoryReport,
  buildAutonomousBuildDiagnosticsReport,
  buildAutonomousBuildCloudReport,
  buildAutonomousBuildWorld2Report,
  buildAutonomousBuildAiDevReport,
  buildAutonomousBuildProjectVaultReport,
  buildAutonomousBuildOperatorFeedReport,
  buildAutonomousBuildNotificationReport,
  buildAutonomousBuildInboxReport,
  buildAutonomousBuildDeliveryReport,
  buildAutonomousBuildPushReport,
} from './autonomous-builder-report-builder.js';
export {
  registerAutonomousBuild,
  registerAutonomousBuildOwnershipRecord,
  prepareAutonomousBuilderFoundation,
  processAutonomousBuilderRequest,
  getAutonomousBuilderContext,
  resetAutonomousBuilderBootstrapForTests,
  getAutonomousBuildRecord,
} from './autonomous-builder-registry.js';

export function getDevPulseV2AutonomousBuilderFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_autonomous_builder_foundation',
    passToken: 'AUTONOMOUS_BUILDER_FOUNDATION_V1_PASS',
    phase: 19.1,
    extensionOnly: true,
  };
}

export function resetAutonomousBuilderFoundationForTests(): void {
  resetAutonomousBuilderStoreForTests();
  resetAutonomousBuildDiagnosticsForTests();
  resetAutonomousBuilderReportCounterForTests();
  resetAutonomousBuilderBootstrapForTests();
  resetAutonomousBuilderReadCacheForTests();
}
