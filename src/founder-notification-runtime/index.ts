/**
 * DevPulse V2 Phase 18.6 — Founder Notification Runtime Foundation public API.
 */

import { resetFounderNotificationStoreForTests } from './founder-notification-store.js';
import { resetNotificationDiagnosticsForTests } from './founder-notification-diagnostics.js';
import { resetFounderNotificationReportCounterForTests } from './founder-notification-report-builder.js';
import { resetFounderNotificationBootstrapForTests } from './founder-notification-registry.js';
import { resetFounderNotificationReadCacheForTests } from './read-cache.js';

export {
  FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_PASS_TOKEN,
  FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_NOTIFICATION_AUTHORITY_RISK_PREFIX,
  TRACKED_NOTIFICATION_CATEGORIES,
  TRACKED_NOTIFICATION_CHANNELS,
  TRACKED_NOTIFICATION_PRIORITIES,
  FORBIDDEN_NOTIFICATION_DUPLICATES,
  NOTIFICATION_COMPANION_DOMAINS,
  FOUNDER_NOTIFICATION_QUESTION_SIGNALS,
  isFounderNotificationRuntimeFoundationQuestion,
  isDuplicateNotificationExecutorQuestion,
  isValidNotificationStateTransition,
  validateNotificationState,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationPriority,
  type NotificationState,
  type NotificationStatus,
  type NotificationLifecycleEventType,
  type NotificationReportType,
  type NotificationOwnership,
  type NotificationVisibility,
  type NotificationRouting,
  type NotificationContext,
  type NotificationPriorityMeta,
  type NotificationChannelMeta,
  type NotificationMobileLink,
  type NotificationCrossDeviceLink,
  type NotificationCloudLink,
  type NotificationCommandLink,
  type NotificationChatLink,
  type NotificationPreviewLink,
  type NotificationApprovalLink,
  type NotificationOperatorFeedLink,
  type NotificationProjectVaultLink,
  type NotificationMetadata,
  type NotificationProvenance,
  type FounderNotification,
  type NotificationLifecycleEvent,
  type NotificationHistoryEntry,
  type NotificationStateHistoryEntry,
  type NotificationReport,
  type NotificationDiagnostics,
  type NotificationValidationResult,
  type RegisterNotificationInput,
  type RegisterNotificationResult,
  type PrepareFounderNotificationRuntimeFoundationInput,
  type PrepareFounderNotificationRuntimeFoundationResult,
  type DuplicateNotificationRiskContext,
} from './founder-notification-types.js';

export {
  resetFounderNotificationStoreForTests,
  nextNotificationId,
  nextNotificationRoutingId,
  nextNotificationReportId,
} from './founder-notification-store.js';
export {
  buildNotificationOwnership,
  recordNotificationOwnershipHistory,
  registerNotificationOwnership,
} from './founder-notification-ownership.js';
export {
  buildDefaultNotificationContext,
  refreshNotificationContext,
  getNotificationContextById,
  validateNotificationContext,
  detectNotificationContextMismatch,
} from './founder-notification-context.js';
export {
  buildDefaultNotificationVisibility,
  registerNotificationVisibility,
  getNotificationVisibility,
  validateNotificationVisibility,
} from './founder-notification-visibility.js';
export {
  registerNotificationRouting,
  getNotificationRouting,
  listRoutingsForNotification,
} from './founder-notification-routing.js';
export {
  buildDefaultNotificationPriority,
  registerNotificationPriority,
  getNotificationPriority,
  listNotificationsByPriority,
} from './founder-notification-priority.js';
export {
  buildDefaultNotificationChannel,
  registerNotificationChannel,
  getNotificationChannel,
  listNotificationsByChannel,
} from './founder-notification-channel.js';
export {
  linkNotificationToMobile,
  getMobileForNotification,
  listNotificationsByMobile,
  detectNotificationMobileMismatch,
} from './founder-notification-mobile-bridge.js';
export {
  linkNotificationToCrossDevice,
  getCrossDeviceForNotification,
  listNotificationsByCrossDevice,
  detectNotificationCrossDeviceMismatch,
} from './founder-notification-cross-device-bridge.js';
export {
  linkNotificationToCloud,
  getCloudForNotification,
  listNotificationsByCloud,
  detectNotificationCloudMismatch,
} from './founder-notification-cloud-bridge.js';
export {
  linkNotificationToCommand,
  getCommandForNotification,
  listNotificationsByCommand,
  detectNotificationCommandMismatch,
} from './founder-notification-command-bridge.js';
export {
  linkNotificationToChat,
  getChatForNotification,
  listNotificationsByChat,
  detectNotificationChatMismatch,
} from './founder-notification-chat-bridge.js';
export {
  linkNotificationToPreview,
  getPreviewForNotification,
  listNotificationsByPreview,
  detectNotificationPreviewMismatch,
} from './founder-notification-preview-bridge.js';
export {
  linkNotificationToApproval,
  getApprovalForNotification,
  listNotificationsByApproval,
  detectNotificationApprovalMismatch,
} from './founder-notification-approval-bridge.js';
export {
  linkNotificationToOperatorFeed,
  getOperatorFeedForNotification,
  listNotificationsByOperatorFeed,
  detectNotificationOperatorFeedMismatch,
} from './founder-notification-operator-feed-bridge.js';
export {
  linkNotificationToProjectVault,
  getProjectVaultForNotification,
  listNotificationsByProjectVault,
  detectNotificationProjectVaultMismatch,
} from './founder-notification-project-vault-bridge.js';
export { setNotificationState, getNotificationState, trackNotificationStateHistory } from './founder-notification-state-manager.js';
export {
  recordNotificationLifecycleEvent,
  initializeNotification,
  routeNotification,
  makeNotificationVisible,
  markNotificationViewed,
  acknowledgeNotification,
  dismissNotification,
  archiveNotification,
  failNotification,
  listLifecycleEventsForNotification,
  completeNotificationLifecycle,
} from './founder-notification-lifecycle.js';
export {
  createNotification,
  getNotification,
  listNotifications,
  trackNotificationMetadata,
  trackNotificationOwnership,
} from './founder-notification-manager.js';
export { getNotificationHistory, listNotificationHistoryConsumers, recordNotificationHistoryEntry } from './founder-notification-history.js';
export {
  queryNotifications,
  listNotificationsAll,
  listNotificationsByProject,
  listNotificationsByRuntime,
  listNotificationsByWorkspace,
  listNotificationsByPersistentBuild,
  listNotificationsByDevice,
  listNotificationsByCrossDeviceSession,
  listNotificationsByCategory,
  countNotificationsByState,
  type NotificationQuery,
} from './founder-notification-query.js';
export {
  buildDuplicateNotificationRiskContext,
  evaluateDuplicateNotificationRisk,
  validateNotificationRegistration,
  validateNotificationRecord,
} from './founder-notification-validator.js';
export {
  getNotificationDiagnostics,
  updateNotificationDiagnostics,
  resetNotificationDiagnosticsForTests,
  runNotificationDiagnosticsScan,
} from './founder-notification-diagnostics.js';
export {
  buildAllNotificationReports,
  composeNotificationResponse,
  buildNotificationFailureContext,
  resetFounderNotificationReportCounterForTests,
  buildNotificationInventoryReport,
  buildNotificationOwnershipReport,
  buildNotificationVisibilityReport,
  buildNotificationRoutingReport,
  buildNotificationPriorityReport,
  buildNotificationContextReport,
  buildNotificationStateReport,
  buildNotificationLifecycleReport,
  buildNotificationChannelReport,
  buildNotificationHistoryReport,
  buildNotificationDiagnosticsReport,
  buildNotificationMobileLinkReport,
  buildNotificationCrossDeviceReport,
  buildNotificationCloudReport,
  buildNotificationCommandReport,
  buildNotificationChatReport,
  buildNotificationPreviewReport,
  buildNotificationApprovalReport,
  buildNotificationOperatorFeedReport,
  buildNotificationProjectVaultReport,
} from './founder-notification-report-builder.js';
export {
  registerNotification,
  registerNotificationOwnershipRecord,
  prepareFounderNotificationRuntimeFoundation,
  processFounderNotificationRequest,
  getFounderNotificationContext,
  resetFounderNotificationBootstrapForTests,
} from './founder-notification-registry.js';

export function getDevPulseV2FounderNotificationRuntimeFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_founder_notification_runtime_foundation',
    passToken: 'FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_V1_PASS',
    phase: 18.6,
    extensionOnly: true,
  };
}

export function resetFounderNotificationRuntimeFoundationForTests(): void {
  resetFounderNotificationStoreForTests();
  resetNotificationDiagnosticsForTests();
  resetFounderNotificationReportCounterForTests();
  resetFounderNotificationBootstrapForTests();
  resetFounderNotificationReadCacheForTests();
}
