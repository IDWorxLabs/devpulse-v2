/**
 * DevPulse V2 Phase 18.9 — Mobile Push Foundation public API.
 */

import { resetMobilePushStoreForTests } from './mobile-push-store.js';
import { resetPushDiagnosticsForTests } from './mobile-push-diagnostics.js';
import { resetMobilePushReportCounterForTests } from './mobile-push-report-builder.js';
import { resetMobilePushBootstrapForTests } from './mobile-push-registry.js';
import { resetMobilePushReadCacheForTests } from './read-cache.js';

export {
  MOBILE_PUSH_FOUNDATION_PASS_TOKEN,
  MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
  DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK_PREFIX,
  TRACKED_PUSH_CATEGORIES,
  TRACKED_PUSH_PLATFORMS,
  TRACKED_TOKEN_STATES,
  FORBIDDEN_MOBILE_PUSH_DUPLICATES,
  MOBILE_PUSH_COMPANION_DOMAINS,
  MOBILE_PUSH_QUESTION_SIGNALS,
  RAW_TOKEN_RISK_PATTERNS,
  isMobilePushFoundationQuestion,
  isDuplicateMobilePushExecutorQuestion,
  isValidPushStateTransition,
  validatePushState,
  resolveDefaultPlatformForCategory,
  detectRawTokenRisk,
  type PushCategory,
  type PushPlatform,
  type TokenState,
  type PushState,
  type PushStatus,
  type PushLifecycleEventType,
  type PushReportType,
  type PushOwnership,
  type PushVisibility,
  type PushContext,
  type PushTokenMetadata,
  type PushPlatformMeta,
  type PushPayload,
  type PushDeviceTarget,
  type PushRoute,
  type PushEligibility,
  type PushPolicy,
  type PushBlockingRecord,
  type PushDeferralRecord,
  type PushDeliveryLink,
  type PushNotificationLink,
  type PushInboxLink,
  type PushCrossDeviceLink,
  type PushCloudLink,
  type PushCommandLink,
  type PushChatLink,
  type PushPreviewLink,
  type PushApprovalLink,
  type PushOperatorFeedLink,
  type PushProjectVaultLink,
  type PushMetadata,
  type PushProvenance,
  type MobilePushRecord,
  type PushLifecycleEvent,
  type PushHistoryEntry,
  type PushStateHistoryEntry,
  type PushReport,
  type PushDiagnostics,
  type PushValidationResult,
  type RegisterPushRecordInput,
  type RegisterPushRecordResult,
  type PrepareMobilePushFoundationInput,
  type PrepareMobilePushFoundationResult,
  type DuplicateMobilePushRiskContext,
} from './mobile-push-types.js';

export {
  resetMobilePushStoreForTests,
  nextPushId,
  nextPushReportId,
} from './mobile-push-store.js';
export {
  buildPushOwnership,
  recordPushOwnershipHistory,
  registerPushOwnership,
} from './mobile-push-ownership.js';
export {
  buildDefaultPushContext,
  refreshPushContext,
  getPushContextById,
  validatePushContext,
  detectPushContextMismatch,
} from './mobile-push-context.js';
export {
  buildDefaultPushVisibility,
  registerPushVisibility,
  getPushVisibility,
  validatePushVisibility,
} from './mobile-push-visibility.js';
export {
  registerPushTokenMetadata,
  checkPushTokenMetadata,
  getPushTokenMetadata,
} from './mobile-push-token.js';
export {
  registerPushPlatform,
  getPushPlatform,
  resolvePlatformForCategory,
  listPushesByPlatform,
} from './mobile-push-platform.js';
export {
  registerPushPayload,
  planPushPayload,
  getPushPayload,
} from './mobile-push-payload.js';
export {
  registerPushRoute,
  getPushRoute,
  listRoutesForPush,
  listPushesByPlatformRoute,
} from './mobile-push-routing.js';
export {
  registerPushDeviceTarget,
  selectPushDeviceTarget as selectPushDeviceTargetRecord,
  getPushDeviceTarget,
} from './mobile-push-device-targeting.js';
export {
  registerPushEligibility,
  checkPushEligibility,
  getPushEligibility,
} from './mobile-push-eligibility.js';
export {
  registerPushPolicy,
  getPushPolicy,
} from './mobile-push-policy.js';
export {
  registerPushBlocking,
  blockPush,
  getPushBlocking,
} from './mobile-push-blocking.js';
export {
  registerPushDeferral,
  deferPush,
  getPushDeferral,
} from './mobile-push-deferral.js';
export {
  linkPushToDelivery,
  getDeliveryForPush,
  listPushRecordsByDelivery,
  detectPushDeliveryMismatch,
  findDeliveryByName,
} from './mobile-push-delivery-bridge.js';
export {
  linkPushToNotification,
  getNotificationForPush,
  listPushRecordsByNotification,
  detectPushNotificationMismatch,
  findNotificationByName,
} from './mobile-push-notification-bridge.js';
export {
  linkPushToInbox,
  getInboxForPush,
  listPushRecordsByInbox,
  detectPushInboxMismatch,
  findInboxEntryByName,
} from './mobile-push-inbox-bridge.js';
export {
  linkPushToCrossDevice,
  getCrossDeviceForPush,
  listPushRecordsByCrossDevice,
  detectPushCrossDeviceMismatch,
} from './mobile-push-cross-device-bridge.js';
export {
  linkPushToCloud,
  getCloudForPush,
  listPushRecordsByCloud,
  detectPushCloudMismatch,
} from './mobile-push-cloud-bridge.js';
export {
  linkPushToCommand,
  getCommandForPush,
  listPushRecordsByCommand,
  listPushRecordsByCommand as listPushesByCommand,
  detectPushCommandMismatch,
} from './mobile-push-command-bridge.js';
export {
  linkPushToChat,
  getChatForPush,
  listPushRecordsByChat,
  listPushRecordsByChat as listPushesByChat,
  detectPushChatMismatch,
} from './mobile-push-chat-bridge.js';
export {
  linkPushToPreview,
  getPreviewForPush,
  listPushRecordsByPreview,
  listPushRecordsByPreview as listPushesByPreview,
  detectPushPreviewMismatch,
} from './mobile-push-preview-bridge.js';
export {
  linkPushToApproval,
  getApprovalForPush,
  listPushRecordsByApproval,
  listPushRecordsByApproval as listPushesByApproval,
  detectPushApprovalMismatch,
} from './mobile-push-approval-bridge.js';
export {
  linkPushToOperatorFeed,
  getOperatorFeedForPush,
  listPushRecordsByOperatorFeed,
  detectPushOperatorFeedMismatch,
} from './mobile-push-operator-feed-bridge.js';
export {
  linkPushToProjectVault,
  getProjectVaultForPush,
  listPushRecordsByProjectVault,
  detectPushProjectVaultMismatch,
} from './mobile-push-project-vault-bridge.js';
export {
  setPushState,
  getPushState,
  trackPushStateHistory,
} from './mobile-push-state-manager.js';
export {
  recordPushLifecycleEvent,
  listPushLifecycleEvents,
} from './mobile-push-lifecycle.js';
export {
  createPushRecord,
  getPushRecord,
  listPushRecords,
  planPush,
  routePush,
  selectPushDeviceTarget,
  markPushReady,
  markPushCompleted,
  markPushFailed,
  archivePush,
  trackPushMetadata,
  trackPushOwnership,
  runPushPlanningPipeline,
} from './mobile-push-manager.js';
export {
  getPushHistory,
  listPushHistoryConsumers,
  recordPushHistoryEntry,
} from './mobile-push-history.js';
export {
  queryPushRecords,
  listPushRecordsAll,
  listPushesByDelivery,
  listPushesByNotification,
  listPushesByInboxEntry,
  listPushesByProject,
  listPushesByRuntime,
  listPushesByWorkspace,
  listPushesByPersistentBuild,
  listPushesByDevice,
  listPushesByCrossDeviceSession,
  listPushesByState,
  countPushesByState,
  listPushesByPlatformQuery,
  type PushQuery,
} from './mobile-push-query.js';
export {
  buildDuplicateMobilePushRiskContext,
  evaluateDuplicateMobilePushRisk,
  detectRawTokenRisksInInput,
  validatePushRegistration,
  validatePushRecord,
} from './mobile-push-validator.js';
export {
  getPushDiagnostics,
  updatePushDiagnostics,
  resetPushDiagnosticsForTests,
  runPushDiagnosticsScan,
} from './mobile-push-diagnostics.js';
export {
  buildAllMobilePushReports,
  composeMobilePushResponse,
  buildMobilePushFailureContext,
  resetMobilePushReportCounterForTests,
  buildMobilePushInventoryReport,
  buildMobilePushOwnershipReport,
  buildMobilePushContextReport,
  buildMobilePushTokenMetadataReport,
  buildMobilePushPlatformReport,
  buildMobilePushPayloadReport,
  buildMobilePushTargetingReport,
  buildMobilePushEligibilityReport,
  buildMobilePushRoutingReport,
  buildMobilePushPolicyReport,
  buildMobilePushBlockingReport,
  buildMobilePushDeferralReport,
  buildMobilePushVisibilityReport,
  buildMobilePushStateReport,
  buildMobilePushLifecycleReport,
  buildMobilePushHistoryReport,
  buildMobilePushDiagnosticsReport,
  buildMobilePushDeliveryLinkReport,
  buildMobilePushNotificationLinkReport,
  buildMobilePushInboxLinkReport,
  buildMobilePushCrossDeviceReport,
  buildMobilePushCloudReport,
  buildMobilePushCommandReport,
  buildMobilePushChatReport,
  buildMobilePushPreviewReport,
  buildMobilePushApprovalReport,
  buildMobilePushOperatorFeedReport,
  buildMobilePushProjectVaultReport,
} from './mobile-push-report-builder.js';
export {
  registerPushRecord,
  registerPushOwnershipRecord,
  prepareMobilePushFoundation,
  processMobilePushRequest,
  getMobilePushContext,
  resetMobilePushBootstrapForTests,
} from './mobile-push-registry.js';

export function getDevPulseV2MobilePushFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_mobile_push_foundation',
    passToken: 'MOBILE_PUSH_FOUNDATION_V1_PASS',
    phase: 18.9,
    extensionOnly: true,
  };
}

export function resetMobilePushFoundationForTests(): void {
  resetMobilePushStoreForTests();
  resetPushDiagnosticsForTests();
  resetMobilePushReportCounterForTests();
  resetMobilePushBootstrapForTests();
  resetMobilePushReadCacheForTests();
}
