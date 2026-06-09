/**
 * Founder Notification Runtime Foundation — diagnostics tracker.
 */

import { listStoredNotifications, listStoredNotificationLifecycleEvents } from './founder-notification-store.js';
import { detectNotificationMobileMismatch } from './founder-notification-mobile-bridge.js';
import { detectNotificationCrossDeviceMismatch } from './founder-notification-cross-device-bridge.js';
import { detectNotificationCloudMismatch } from './founder-notification-cloud-bridge.js';
import { detectNotificationCommandMismatch } from './founder-notification-command-bridge.js';
import { detectNotificationChatMismatch } from './founder-notification-chat-bridge.js';
import { detectNotificationPreviewMismatch } from './founder-notification-preview-bridge.js';
import { detectNotificationApprovalMismatch } from './founder-notification-approval-bridge.js';
import type { NotificationDiagnostics, NotificationState } from './founder-notification-types.js';

let diagnostics: NotificationDiagnostics = {
  notificationAuthorityActive: true,
  registeredNotificationCount: 0,
  routedNotificationCount: 0,
  visibleNotificationCount: 0,
  viewedNotificationCount: 0,
  acknowledgedNotificationCount: 0,
  dismissedNotificationCount: 0,
  archivedNotificationCount: 0,
  failedNotificationCount: 0,
  duplicateRiskCount: 0,
  mobileMismatchCount: 0,
  crossDeviceMismatchCount: 0,
  cloudMismatchCount: 0,
  commandMismatchCount: 0,
  chatMismatchCount: 0,
  previewMismatchCount: 0,
  approvalMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getNotificationDiagnostics(): NotificationDiagnostics {
  return { ...diagnostics };
}

export function updateNotificationDiagnostics(
  query: string,
  lastState: NotificationState | null,
  duplicateRiskCount = 0,
): NotificationDiagnostics {
  const notifications = listStoredNotifications();
  diagnostics = {
    notificationAuthorityActive: true,
    registeredNotificationCount: notifications.length,
    routedNotificationCount: notifications.filter((n) =>
      ['ROUTED', 'VISIBLE', 'VIEWED', 'ACKNOWLEDGED', 'DISMISSED', 'ARCHIVED'].includes(n.notificationState),
    ).length,
    visibleNotificationCount: notifications.filter((n) =>
      ['VISIBLE', 'VIEWED', 'ACKNOWLEDGED', 'DISMISSED', 'ARCHIVED'].includes(n.notificationState),
    ).length,
    viewedNotificationCount: notifications.filter((n) =>
      ['VIEWED', 'ACKNOWLEDGED', 'DISMISSED', 'ARCHIVED'].includes(n.notificationState),
    ).length,
    acknowledgedNotificationCount: notifications.filter((n) =>
      ['ACKNOWLEDGED', 'ARCHIVED'].includes(n.notificationState),
    ).length,
    dismissedNotificationCount: notifications.filter((n) => n.notificationState === 'DISMISSED').length,
    archivedNotificationCount: notifications.filter((n) => n.notificationState === 'ARCHIVED').length,
    failedNotificationCount: notifications.filter((n) => n.notificationState === 'FAILED').length,
    duplicateRiskCount,
    mobileMismatchCount: notifications.filter((n) => detectNotificationMobileMismatch(n.notificationId)).length,
    crossDeviceMismatchCount: notifications.filter((n) => detectNotificationCrossDeviceMismatch(n.notificationId)).length,
    cloudMismatchCount: notifications.filter((n) => detectNotificationCloudMismatch(n.notificationId)).length,
    commandMismatchCount: notifications.filter((n) => detectNotificationCommandMismatch(n.notificationId)).length,
    chatMismatchCount: notifications.filter((n) => detectNotificationChatMismatch(n.notificationId)).length,
    previewMismatchCount: notifications.filter((n) => detectNotificationPreviewMismatch(n.notificationId)).length,
    approvalMismatchCount: notifications.filter((n) => detectNotificationApprovalMismatch(n.notificationId)).length,
    lastQuery: query,
    lastState,
  };
  return getNotificationDiagnostics();
}

export function resetNotificationDiagnosticsForTests(): void {
  diagnostics = {
    notificationAuthorityActive: true,
    registeredNotificationCount: 0,
    routedNotificationCount: 0,
    visibleNotificationCount: 0,
    viewedNotificationCount: 0,
    acknowledgedNotificationCount: 0,
    dismissedNotificationCount: 0,
    archivedNotificationCount: 0,
    failedNotificationCount: 0,
    duplicateRiskCount: 0,
    mobileMismatchCount: 0,
    crossDeviceMismatchCount: 0,
    cloudMismatchCount: 0,
    commandMismatchCount: 0,
    chatMismatchCount: 0,
    previewMismatchCount: 0,
    approvalMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function runNotificationDiagnosticsScan(): NotificationDiagnostics {
  listStoredNotificationLifecycleEvents();
  return updateNotificationDiagnostics(diagnostics.lastQuery ?? 'scan', diagnostics.lastState);
}
