/**
 * Founder Notification Runtime Foundation — report builder.
 */

import {
  listStoredNotifications,
  listStoredNotificationRoutings,
  listStoredNotificationLifecycleEvents,
  nextNotificationReportId,
  resetFounderNotificationReportCounterForTests as resetStoreReportCounterForTests,
} from './founder-notification-store.js';
import { getNotificationHistory } from './founder-notification-history.js';
import { getNotificationDiagnostics, runNotificationDiagnosticsScan } from './founder-notification-diagnostics.js';
import { detectNotificationMobileMismatch } from './founder-notification-mobile-bridge.js';
import { detectNotificationCrossDeviceMismatch } from './founder-notification-cross-device-bridge.js';
import { detectNotificationCloudMismatch } from './founder-notification-cloud-bridge.js';
import { detectNotificationCommandMismatch } from './founder-notification-command-bridge.js';
import { detectNotificationChatMismatch } from './founder-notification-chat-bridge.js';
import { detectNotificationPreviewMismatch } from './founder-notification-preview-bridge.js';
import { detectNotificationApprovalMismatch } from './founder-notification-approval-bridge.js';
import { isFounderNotificationRuntimeFoundationQuestion } from './founder-notification-types.js';
import type { NotificationReport, NotificationReportType } from './founder-notification-types.js';

export function resetFounderNotificationReportCounterForTests(): void {
  resetStoreReportCounterForTests();
}

function buildReport(reportType: NotificationReportType, summary: string, findings: string[]): NotificationReport {
  const notifications = listStoredNotifications();
  const routings = listStoredNotificationRoutings();
  const events = listStoredNotificationLifecycleEvents();
  return {
    reportId: nextNotificationReportId(),
    reportType,
    generatedAt: Date.now(),
    notificationCount: notifications.length,
    routingCount: routings.length,
    lifecycleEventCount: events.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildNotificationInventoryReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId} — ${n.notificationMetadata.notificationName} (${n.notificationCategory}) state=${n.notificationState}`,
  );
  return buildReport(
    'NOTIFICATION_INVENTORY_REPORT',
    `Notification inventory — ${notifications.length} notifications`,
    findings.length ? findings : ['No notifications'],
  );
}

export function buildNotificationOwnershipReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: project=${n.notificationOwnership.projectId} crossDevice=${n.notificationOwnership.crossDeviceSessionId}`,
  );
  return buildReport(
    'NOTIFICATION_OWNERSHIP_REPORT',
    `Ownership — ${notifications.length} records`,
    findings.length ? findings : ['No ownership records'],
  );
}

export function buildNotificationVisibilityReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: inbox=${n.notificationVisibility.visibleInFounderInbox} mobile=${n.notificationVisibility.visibleOnMobile}`,
  );
  return buildReport(
    'NOTIFICATION_VISIBILITY_REPORT',
    `Visibility — ${notifications.length} records`,
    findings.length ? findings : ['No visibility records'],
  );
}

export function buildNotificationRoutingReport(): NotificationReport {
  const routings = listStoredNotificationRoutings();
  const findings = routings.map((r) => `${r.routingId}: ${r.notificationId} → ${r.targetChannel} (${r.routingStatus})`);
  return buildReport(
    'NOTIFICATION_ROUTING_REPORT',
    `Routing — ${routings.length} records`,
    findings.length ? findings : ['No routing records'],
  );
}

export function buildNotificationPriorityReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) => `${n.notificationId}: ${n.notificationPriority.priority}${n.notificationPriority.escalated ? ' (escalated)' : ''}`,
  );
  return buildReport(
    'NOTIFICATION_PRIORITY_REPORT',
    `Priority — ${notifications.length} records`,
    findings.length ? findings : ['No priority records'],
  );
}

export function buildNotificationContextReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) => `${n.notificationId}: project=${n.notificationContext.projectId} approval=${n.notificationContext.approvalId}`,
  );
  return buildReport(
    'NOTIFICATION_CONTEXT_REPORT',
    `Context — ${notifications.length} records`,
    findings.length ? findings : ['No context'],
  );
}

export function buildNotificationStateReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map((n) => `${n.notificationId}: ${n.notificationState}`);
  return buildReport(
    'NOTIFICATION_STATE_REPORT',
    `State — ${notifications.length} records`,
    findings.length ? findings : ['No state records'],
  );
}

export function buildNotificationLifecycleReport(): NotificationReport {
  const events = listStoredNotificationLifecycleEvents();
  const findings = events.map((e) => `${e.notificationId}: ${e.eventType}`);
  return buildReport(
    'NOTIFICATION_LIFECYCLE_REPORT',
    `Lifecycle — ${events.length} events`,
    findings.length ? findings : ['No events'],
  );
}

export function buildNotificationChannelReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) => `${n.notificationId}: ${n.notificationChannel.primaryChannel} (delivery blocked)`,
  );
  return buildReport(
    'NOTIFICATION_CHANNEL_REPORT',
    `Channel — ${notifications.length} records`,
    findings.length ? findings : ['No channel records'],
  );
}

export function buildNotificationHistoryReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const allHistory = notifications.flatMap((n) => getNotificationHistory(n.notificationId));
  const findings = allHistory.slice(-20).map((e) => `${e.notificationId} [${e.category}]: ${e.summary}`);
  return buildReport(
    'NOTIFICATION_HISTORY_REPORT',
    `History — ${allHistory.length} entries`,
    findings.length ? findings : ['No history'],
  );
}

export function buildNotificationDiagnosticsReport(): NotificationReport {
  const diag = getNotificationDiagnostics();
  runNotificationDiagnosticsScan();
  const findings = [
    `Authority active: ${diag.notificationAuthorityActive}`,
    `Registered notifications: ${diag.registeredNotificationCount}`,
    `Routed: ${diag.routedNotificationCount}`,
    `Mobile mismatches: ${diag.mobileMismatchCount}`,
    `Cross device mismatches: ${diag.crossDeviceMismatchCount}`,
    `Approval mismatches: ${diag.approvalMismatchCount}`,
  ];
  return buildReport('NOTIFICATION_DIAGNOSTICS_REPORT', 'Diagnostics — authority validation only', findings);
}

export function buildNotificationMobileLinkReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: crossDevice=${n.notificationMobileLink.crossDeviceSessionId} mismatch=${detectNotificationMobileMismatch(n.notificationId)}`,
  );
  return buildReport(
    'NOTIFICATION_MOBILE_LINK_REPORT',
    `Mobile links — ${notifications.length}`,
    findings.length ? findings : ['No mobile links'],
  );
}

export function buildNotificationCrossDeviceReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: crossDevice=${n.notificationCrossDeviceLink.crossDeviceSessionId} mismatch=${detectNotificationCrossDeviceMismatch(n.notificationId)}`,
  );
  return buildReport(
    'NOTIFICATION_CROSS_DEVICE_REPORT',
    `Cross device links — ${notifications.length}`,
    findings.length ? findings : ['No cross device links'],
  );
}

export function buildNotificationCloudReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: runtime=${n.notificationCloudLink.runtimeId} mismatch=${detectNotificationCloudMismatch(n.notificationId)}`,
  );
  return buildReport(
    'NOTIFICATION_CLOUD_REPORT',
    `Cloud links — ${notifications.length}`,
    findings.length ? findings : ['No cloud links'],
  );
}

export function buildNotificationCommandReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: command=${n.notificationCommandLink.commandSessionId} mismatch=${detectNotificationCommandMismatch(n.notificationId)}`,
  );
  return buildReport(
    'NOTIFICATION_COMMAND_REPORT',
    `Command links — ${notifications.length}`,
    findings.length ? findings : ['No command links'],
  );
}

export function buildNotificationChatReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: chat=${n.notificationChatLink.chatSessionId} mismatch=${detectNotificationChatMismatch(n.notificationId)}`,
  );
  return buildReport(
    'NOTIFICATION_CHAT_REPORT',
    `Chat links — ${notifications.length}`,
    findings.length ? findings : ['No chat links'],
  );
}

export function buildNotificationPreviewReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: preview=${n.notificationPreviewLink.previewId} mismatch=${detectNotificationPreviewMismatch(n.notificationId)}`,
  );
  return buildReport(
    'NOTIFICATION_PREVIEW_REPORT',
    `Preview links — ${notifications.length}`,
    findings.length ? findings : ['No preview links'],
  );
}

export function buildNotificationApprovalReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: approval=${n.notificationApprovalLink.approvalId} mismatch=${detectNotificationApprovalMismatch(n.notificationId)}`,
  );
  return buildReport(
    'NOTIFICATION_APPROVAL_REPORT',
    `Approval links — ${notifications.length}`,
    findings.length ? findings : ['No approval links'],
  );
}

export function buildNotificationOperatorFeedReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: feed=${n.notificationOperatorFeedLink.feedAuthorityId} mismatch=${n.notificationOperatorFeedLink.mismatchDetected}`,
  );
  return buildReport(
    'NOTIFICATION_OPERATOR_FEED_REPORT',
    `Operator feed links — ${notifications.length}`,
    findings.length ? findings : ['No operator feed links'],
  );
}

export function buildNotificationProjectVaultReport(): NotificationReport {
  const notifications = listStoredNotifications();
  const findings = notifications.map(
    (n) =>
      `${n.notificationId}: vault=${n.notificationProjectVaultLink.vaultProjectId} mismatch=${n.notificationProjectVaultLink.mismatchDetected}`,
  );
  return buildReport(
    'NOTIFICATION_PROJECT_VAULT_REPORT',
    `Project vault links — ${notifications.length}`,
    findings.length ? findings : ['No project vault links'],
  );
}

export function buildAllNotificationReports(): NotificationReport[] {
  return [
    buildNotificationInventoryReport(),
    buildNotificationOwnershipReport(),
    buildNotificationVisibilityReport(),
    buildNotificationRoutingReport(),
    buildNotificationPriorityReport(),
    buildNotificationContextReport(),
    buildNotificationStateReport(),
    buildNotificationLifecycleReport(),
    buildNotificationChannelReport(),
    buildNotificationHistoryReport(),
    buildNotificationDiagnosticsReport(),
    buildNotificationMobileLinkReport(),
    buildNotificationCrossDeviceReport(),
    buildNotificationCloudReport(),
    buildNotificationCommandReport(),
    buildNotificationChatReport(),
    buildNotificationPreviewReport(),
    buildNotificationApprovalReport(),
    buildNotificationOperatorFeedReport(),
    buildNotificationProjectVaultReport(),
  ];
}

export function composeNotificationResponse(
  query: string,
  notification: import('./founder-notification-types.js').FounderNotification | null,
  reports: NotificationReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Founder Notification Runtime Foundation: BLOCKED' : 'Founder Notification Runtime Foundation: READY');
  lines.push(`Query: ${query}`);
  if (notification) {
    lines.push(`Notification: ${notification.notificationId} — ${notification.notificationMetadata.notificationName}`);
    lines.push(`State: ${notification.notificationState}`);
    lines.push(`Category: ${notification.notificationCategory} Priority: ${notification.notificationPriority.priority}`);
  }
  lines.push('Reports:');
  for (const r of reports) lines.push(`  ${r.reportType}: ${r.summary}`);
  lines.push('Authority only — no real delivery, push, email, or SMS.');
  return lines.join('\n');
}

export function buildNotificationFailureContext(
  query: string,
): Array<{ title: string; description: string; sourceSystem: string }> {
  if (!isFounderNotificationRuntimeFoundationQuestion(query)) return [];
  return [
    {
      title: 'Notification registration blocked',
      description: 'Registration rejected due to missing upstream links or duplicate notification authority risk.',
      sourceSystem: 'founder_notification_runtime_foundation',
    },
    {
      title: 'Notification routing blocked',
      description: 'Routing metadata blocked — inspect cross device, command, chat, preview, and approval upstream authorities.',
      sourceSystem: 'founder_notification_runtime_foundation',
    },
    {
      title: 'Notification visibility deferred',
      description: 'Visibility could not be finalized — additional context or founder review required.',
      sourceSystem: 'founder_notification_runtime_foundation',
    },
    {
      title: 'Parallel notification authority risk',
      description: 'Duplicate notification authority detected — use Founder Notification Runtime Foundation.',
      sourceSystem: 'founder_notification_runtime_foundation',
    },
  ];
}
