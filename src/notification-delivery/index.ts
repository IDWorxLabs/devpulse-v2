/**
 * DevPulse V2 Phase 18.8 — Notification Delivery Foundation public API.
 */

import { resetNotificationDeliveryStoreForTests } from './notification-delivery-store.js';
import { resetDeliveryDiagnosticsForTests } from './notification-delivery-diagnostics.js';
import { resetNotificationDeliveryReportCounterForTests } from './notification-delivery-report-builder.js';
import { resetNotificationDeliveryBootstrapForTests } from './notification-delivery-registry.js';
import { resetNotificationDeliveryReadCacheForTests } from './read-cache.js';

export {
  NOTIFICATION_DELIVERY_FOUNDATION_PASS_TOKEN,
  NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
  DUPLICATE_DELIVERY_AUTHORITY_RISK_PREFIX,
  TRACKED_DELIVERY_CATEGORIES,
  TRACKED_DELIVERY_CHANNELS,
  TRACKED_DELIVERY_PRIORITIES,
  FORBIDDEN_DELIVERY_DUPLICATES,
  DELIVERY_COMPANION_DOMAINS,
  NOTIFICATION_DELIVERY_QUESTION_SIGNALS,
  isNotificationDeliveryFoundationQuestion,
  isDuplicateDeliveryExecutorQuestion,
  isValidDeliveryStateTransition,
  validateDeliveryState,
  resolveDefaultChannelForCategory,
  type DeliveryCategory,
  type DeliveryChannel,
  type DeliveryPriority,
  type DeliveryState,
  type DeliveryStatus,
  type DeliveryLifecycleEventType,
  type DeliveryReportType,
  type DeliveryOwnership,
  type DeliveryVisibility,
  type DeliveryContext,
  type DeliveryPriorityMeta,
  type DeliveryIntent,
  type DeliveryTarget,
  type DeliveryRoute,
  type DeliveryChannelEligibility,
  type DeliveryPolicy,
  type DeliveryBlockingRecord,
  type DeliveryDeferralRecord,
  type DeliveryNotificationLink,
  type DeliveryInboxLink,
  type DeliveryCrossDeviceLink,
  type DeliveryCloudLink,
  type DeliveryCommandLink,
  type DeliveryChatLink,
  type DeliveryPreviewLink,
  type DeliveryApprovalLink,
  type DeliveryOperatorFeedLink,
  type DeliveryProjectVaultLink,
  type DeliveryMetadata,
  type DeliveryProvenance,
  type NotificationDeliveryRecord,
  type DeliveryLifecycleEvent,
  type DeliveryHistoryEntry,
  type DeliveryStateHistoryEntry,
  type DeliveryReport,
  type DeliveryDiagnostics,
  type DeliveryValidationResult,
  type RegisterDeliveryRecordInput,
  type RegisterDeliveryRecordResult,
  type PrepareNotificationDeliveryFoundationInput,
  type PrepareNotificationDeliveryFoundationResult,
  type DuplicateDeliveryRiskContext,
} from './notification-delivery-types.js';

export {
  resetNotificationDeliveryStoreForTests,
  nextDeliveryId,
  nextDeliveryReportId,
} from './notification-delivery-store.js';
export {
  buildDeliveryOwnership,
  recordDeliveryOwnershipHistory,
  registerDeliveryOwnership,
} from './notification-delivery-ownership.js';
export {
  buildDefaultDeliveryContext,
  refreshDeliveryContext,
  getDeliveryContextById,
  validateDeliveryContext,
  detectDeliveryContextMismatch,
} from './notification-delivery-context.js';
export {
  buildDefaultDeliveryVisibility,
  registerDeliveryVisibility,
  getDeliveryVisibility,
  validateDeliveryVisibility,
} from './notification-delivery-visibility.js';
export {
  buildDefaultDeliveryPriority,
  registerDeliveryPriority,
  getDeliveryPriority,
  listDeliveriesByPriority,
} from './notification-delivery-priority.js';
export {
  registerDeliveryIntent,
  getDeliveryIntent,
} from './notification-delivery-intent.js';
export {
  registerDeliveryRoute,
  getDeliveryRoute,
  listRoutesForDelivery,
  listDeliveriesByChannel,
} from './notification-delivery-routing.js';
export {
  registerDeliveryTarget,
  getDeliveryTarget,
  selectDeliveryTarget as selectDeliveryTargetRecord,
} from './notification-delivery-targeting.js';
export {
  registerDeliveryEligibility,
  checkChannelEligibility,
  getDeliveryEligibility,
} from './notification-delivery-channel-eligibility.js';
export {
  registerDeliveryPolicy,
  getDeliveryPolicy,
} from './notification-delivery-policy.js';
export {
  registerDeliveryBlocking,
  blockDelivery,
  getDeliveryBlocking,
} from './notification-delivery-blocking.js';
export {
  registerDeliveryDeferral,
  deferDelivery,
  getDeliveryDeferral,
} from './notification-delivery-deferral.js';
export {
  linkDeliveryToNotification,
  getNotificationForDelivery,
  listDeliveriesByNotificationBridge,
  detectDeliveryNotificationMismatch,
  findNotificationByName,
} from './notification-delivery-notification-bridge.js';
export {
  linkDeliveryToInbox,
  getInboxForDelivery,
  listDeliveriesByInbox,
  detectDeliveryInboxMismatch,
  findInboxEntryByName,
} from './notification-delivery-inbox-bridge.js';
export {
  linkDeliveryToCrossDevice,
  getCrossDeviceForDelivery,
  listDeliveriesByCrossDevice,
  detectDeliveryCrossDeviceMismatch,
} from './notification-delivery-cross-device-bridge.js';
export {
  linkDeliveryToCloud,
  getCloudForDelivery,
  listDeliveriesByCloud,
  detectDeliveryCloudMismatch,
} from './notification-delivery-cloud-bridge.js';
export {
  linkDeliveryToCommand,
  getCommandForDelivery,
  listDeliveriesByCommand,
  detectDeliveryCommandMismatch,
} from './notification-delivery-command-bridge.js';
export {
  linkDeliveryToChat,
  getChatForDelivery,
  listDeliveriesByChat,
  detectDeliveryChatMismatch,
} from './notification-delivery-chat-bridge.js';
export {
  linkDeliveryToPreview,
  getPreviewForDelivery,
  listDeliveriesByPreview,
  detectDeliveryPreviewMismatch,
} from './notification-delivery-preview-bridge.js';
export {
  linkDeliveryToApproval,
  getApprovalForDelivery,
  listDeliveriesByApproval,
  detectDeliveryApprovalMismatch,
} from './notification-delivery-approval-bridge.js';
export {
  linkDeliveryToOperatorFeed,
  getOperatorFeedForDelivery,
  listDeliveriesByOperatorFeed,
  detectDeliveryOperatorFeedMismatch,
} from './notification-delivery-operator-feed-bridge.js';
export {
  linkDeliveryToProjectVault,
  getProjectVaultForDelivery,
  listDeliveriesByProjectVault,
  detectDeliveryProjectVaultMismatch,
} from './notification-delivery-project-vault-bridge.js';
export {
  setDeliveryState,
  getDeliveryState,
  trackDeliveryStateHistory,
} from './notification-delivery-state-manager.js';
export {
  recordDeliveryLifecycleEvent,
  listDeliveryLifecycleEvents,
} from './notification-delivery-lifecycle.js';
export {
  createDeliveryRecord,
  getDeliveryRecord,
  listDeliveryRecords,
  planDelivery,
  routeDelivery,
  selectDeliveryTarget,
  markDeliveryReady,
  markDeliveryCompleted,
  markDeliveryFailed,
  archiveDelivery,
  trackDeliveryMetadata,
  trackDeliveryOwnership,
  runDeliveryPlanningPipeline,
} from './notification-delivery-manager.js';
export {
  getDeliveryHistory,
  listDeliveryHistoryConsumers,
  recordDeliveryHistoryEntry,
} from './notification-delivery-history.js';
export {
  queryDeliveryRecords,
  listDeliveryRecordsAll,
  listDeliveriesByNotification,
  listDeliveriesByInboxEntry,
  listDeliveriesByProject,
  listDeliveriesByRuntime,
  listDeliveriesByWorkspace,
  listDeliveriesByPersistentBuild,
  listDeliveriesByDevice,
  listDeliveriesByCrossDeviceSession,
  listDeliveriesByState,
  countDeliveriesByState,
  type DeliveryQuery,
} from './notification-delivery-query.js';
export {
  buildDuplicateDeliveryRiskContext,
  evaluateDuplicateDeliveryRisk,
  validateDeliveryRegistration,
  validateDeliveryRecord,
} from './notification-delivery-validator.js';
export {
  getDeliveryDiagnostics,
  updateDeliveryDiagnostics,
  resetDeliveryDiagnosticsForTests,
  runDeliveryDiagnosticsScan,
} from './notification-delivery-diagnostics.js';
export {
  buildAllDeliveryReports,
  composeDeliveryResponse,
  buildDeliveryFailureContext,
  resetNotificationDeliveryReportCounterForTests,
  buildDeliveryInventoryReport,
  buildDeliveryOwnershipReport,
  buildDeliveryContextReport,
  buildDeliveryIntentReport,
  buildDeliveryRoutingReport,
  buildDeliveryTargetingReport,
  buildDeliveryChannelEligibilityReport,
  buildDeliveryPolicyReport,
  buildDeliveryBlockingReport,
  buildDeliveryDeferralReport,
  buildDeliveryVisibilityReport,
  buildDeliveryStateReport,
  buildDeliveryLifecycleReport,
  buildDeliveryHistoryReport,
  buildDeliveryDiagnosticsReport,
  buildDeliveryNotificationLinkReport,
  buildDeliveryInboxLinkReport,
  buildDeliveryCrossDeviceReport,
  buildDeliveryCloudReport,
  buildDeliveryCommandReport,
  buildDeliveryChatReport,
  buildDeliveryPreviewReport,
  buildDeliveryApprovalReport,
  buildDeliveryOperatorFeedReport,
  buildDeliveryProjectVaultReport,
} from './notification-delivery-report-builder.js';
export {
  registerDeliveryRecord,
  registerDeliveryOwnershipRecord,
  prepareNotificationDeliveryFoundation,
  processNotificationDeliveryRequest,
  getNotificationDeliveryContext,
  resetNotificationDeliveryBootstrapForTests,
} from './notification-delivery-registry.js';

export function getDevPulseV2NotificationDeliveryFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_notification_delivery_foundation',
    passToken: 'NOTIFICATION_DELIVERY_FOUNDATION_V1_PASS',
    phase: 18.8,
    extensionOnly: true,
  };
}

export function resetNotificationDeliveryFoundationForTests(): void {
  resetNotificationDeliveryStoreForTests();
  resetDeliveryDiagnosticsForTests();
  resetNotificationDeliveryReportCounterForTests();
  resetNotificationDeliveryBootstrapForTests();
  resetNotificationDeliveryReadCacheForTests();
}
