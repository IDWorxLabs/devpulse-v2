/**
 * Notification Delivery Foundation — report builder.
 */

import {
  listStoredDeliveryRecords,
  listStoredDeliveryLifecycleEvents,
  nextDeliveryReportId,
  resetNotificationDeliveryReportCounterForTests as resetStoreReportCounterForTests,
} from './notification-delivery-store.js';
import { getDeliveryHistory } from './notification-delivery-history.js';
import { getDeliveryDiagnostics, runDeliveryDiagnosticsScan } from './notification-delivery-diagnostics.js';
import { detectDeliveryNotificationMismatch } from './notification-delivery-notification-bridge.js';
import { detectDeliveryInboxMismatch } from './notification-delivery-inbox-bridge.js';
import { detectDeliveryCrossDeviceMismatch } from './notification-delivery-cross-device-bridge.js';
import { detectDeliveryCloudMismatch } from './notification-delivery-cloud-bridge.js';
import { detectDeliveryCommandMismatch } from './notification-delivery-command-bridge.js';
import { detectDeliveryChatMismatch } from './notification-delivery-chat-bridge.js';
import { detectDeliveryPreviewMismatch } from './notification-delivery-preview-bridge.js';
import { detectDeliveryApprovalMismatch } from './notification-delivery-approval-bridge.js';
import { listDeliveryLifecycleEvents } from './notification-delivery-lifecycle.js';
import { isNotificationDeliveryFoundationQuestion } from './notification-delivery-types.js';
import type { DeliveryReport, DeliveryReportType } from './notification-delivery-types.js';

export function resetNotificationDeliveryReportCounterForTests(): void {
  resetStoreReportCounterForTests();
}

function buildReport(reportType: DeliveryReportType, summary: string, findings: string[]): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const events = listStoredDeliveryLifecycleEvents();
  return {
    reportId: nextDeliveryReportId(),
    reportType,
    generatedAt: Date.now(),
    deliveryRecordCount: records.length,
    lifecycleEventCount: events.length,
    summary,
    findings,
    planningOnly: true,
  };
}

export function buildDeliveryInventoryReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) =>
      `${r.deliveryId} — ${r.deliveryMetadata.deliveryName} (${r.deliveryCategory}) state=${r.deliveryState} notification=${r.notificationId} inbox=${r.inboxEntryId}`,
  );
  return buildReport(
    'DELIVERY_INVENTORY_REPORT',
    `Delivery inventory — ${records.length} records`,
    findings.length ? findings : ['No delivery records'],
  );
}

export function buildDeliveryOwnershipReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) =>
      `${r.deliveryId}: project=${r.deliveryOwnership.projectId} notification=${r.deliveryOwnership.notificationId} inbox=${r.deliveryOwnership.inboxEntryId}`,
  );
  return buildReport('DELIVERY_OWNERSHIP_REPORT', `Ownership — ${records.length} records`, findings.length ? findings : ['No ownership records']);
}

export function buildDeliveryContextReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) => `${r.deliveryId}: project=${r.deliveryContext.projectId} approval=${r.deliveryContext.approvalId}`,
  );
  return buildReport('DELIVERY_CONTEXT_REPORT', `Context — ${records.length} records`, findings.length ? findings : ['No context']);
}

export function buildDeliveryIntentReport(): DeliveryReport {
  const records = listStoredDeliveryRecords().filter((r) => r.deliveryIntent !== null);
  const findings = records.map(
    (r) => `${r.deliveryId}: intent=${r.deliveryIntent?.intentId} channel=${r.deliveryIntent?.intentChannel}`,
  );
  return buildReport('DELIVERY_INTENT_REPORT', `Intent — ${records.length} records`, findings.length ? findings : ['No intents']);
}

export function buildDeliveryRoutingReport(): DeliveryReport {
  const records = listStoredDeliveryRecords().filter((r) => r.deliveryRoute !== null);
  const findings = records.map(
    (r) => `${r.deliveryId}: route=${r.deliveryRoute?.routeId} channel=${r.deliveryRoute?.targetChannel}`,
  );
  return buildReport('DELIVERY_ROUTING_REPORT', `Routing — ${records.length} records`, findings.length ? findings : ['No routes']);
}

export function buildDeliveryTargetingReport(): DeliveryReport {
  const records = listStoredDeliveryRecords().filter((r) => r.deliveryTarget !== null);
  const findings = records.map(
    (r) => `${r.deliveryId}: target=${r.deliveryTarget?.targetId} device=${r.deliveryTarget?.targetDevice}`,
  );
  return buildReport('DELIVERY_TARGETING_REPORT', `Targeting — ${records.length} records`, findings.length ? findings : ['No targets']);
}

export function buildDeliveryChannelEligibilityReport(): DeliveryReport {
  const records = listStoredDeliveryRecords().filter((r) => r.deliveryEligibility !== null);
  const findings = records.map(
    (r) => `${r.deliveryId}: channel=${r.deliveryEligibility?.channel} eligible=${r.deliveryEligibility?.eligible}`,
  );
  return buildReport('DELIVERY_CHANNEL_ELIGIBILITY_REPORT', `Eligibility — ${records.length} records`, findings.length ? findings : ['No eligibility checks']);
}

export function buildDeliveryPolicyReport(): DeliveryReport {
  const records = listStoredDeliveryRecords().filter((r) => r.deliveryPolicy !== null);
  const findings = records.map(
    (r) => `${r.deliveryId}: policy=${r.deliveryPolicy?.policyId} allowed=${r.deliveryPolicy?.allowedChannels.join(',')}`,
  );
  return buildReport('DELIVERY_POLICY_REPORT', `Policy — ${records.length} records`, findings.length ? findings : ['No policies']);
}

export function buildDeliveryBlockingReport(): DeliveryReport {
  const records = listStoredDeliveryRecords().filter((r) => r.deliveryBlocking !== null);
  const findings = records.map(
    (r) => `${r.deliveryId}: block=${r.deliveryBlocking?.blockId} reason=${r.deliveryBlocking?.blockReason}`,
  );
  return buildReport('DELIVERY_BLOCKING_REPORT', `Blocking — ${records.length} records`, findings.length ? findings : ['No blocks']);
}

export function buildDeliveryDeferralReport(): DeliveryReport {
  const records = listStoredDeliveryRecords().filter((r) => r.deliveryDeferral !== null);
  const findings = records.map(
    (r) => `${r.deliveryId}: defer=${r.deliveryDeferral?.deferralId} reason=${r.deliveryDeferral?.deferReason}`,
  );
  return buildReport('DELIVERY_DEFERRAL_REPORT', `Deferral — ${records.length} records`, findings.length ? findings : ['No deferrals']);
}

export function buildDeliveryVisibilityReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) => `${r.deliveryId}: planning=${r.deliveryVisibility.visibleInPlanning} mobile=${r.deliveryVisibility.visibleOnMobile}`,
  );
  return buildReport('DELIVERY_VISIBILITY_REPORT', `Visibility — ${records.length} records`, findings.length ? findings : ['No visibility records']);
}

export function buildDeliveryStateReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map((r) => `${r.deliveryId}: ${r.deliveryState}`);
  return buildReport('DELIVERY_STATE_REPORT', `State — ${records.length} records`, findings.length ? findings : ['No state records']);
}

export function buildDeliveryLifecycleReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.flatMap((r) =>
    listDeliveryLifecycleEvents(r.deliveryId).map((e) => `${r.deliveryId}: ${e.eventType} → ${e.newState}`),
  );
  return buildReport('DELIVERY_LIFECYCLE_REPORT', `Lifecycle — ${findings.length} events`, findings.length ? findings : ['No lifecycle events']);
}

export function buildDeliveryHistoryReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const allHistory = records.flatMap((r) => getDeliveryHistory(r.deliveryId));
  const findings = allHistory.slice(-20).map((e) => `${e.deliveryId} [${e.category}]: ${e.summary}`);
  return buildReport('DELIVERY_HISTORY_REPORT', `History — ${allHistory.length} entries`, findings.length ? findings : ['No history']);
}

export function buildDeliveryDiagnosticsReport(): DeliveryReport {
  const diag = getDeliveryDiagnostics();
  runDeliveryDiagnosticsScan();
  const findings = [
    `Planning active: ${diag.deliveryPlanningActive}`,
    `Registered deliveries: ${diag.registeredDeliveryCount}`,
    `Completed: ${diag.completedDeliveryCount}`,
    `Notification mismatches: ${diag.notificationMismatchCount}`,
    `Inbox mismatches: ${diag.inboxMismatchCount}`,
  ];
  return buildReport('DELIVERY_DIAGNOSTICS_REPORT', 'Diagnostics — planning validation only', findings);
}

export function buildDeliveryNotificationLinkReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) =>
      `${r.deliveryId}: notification=${r.deliveryNotificationLink.notificationId} mismatch=${detectDeliveryNotificationMismatch(r.deliveryId)}`,
  );
  return buildReport('DELIVERY_NOTIFICATION_LINK_REPORT', `Notification links — ${records.length}`, findings.length ? findings : ['No notification links']);
}

export function buildDeliveryInboxLinkReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) =>
      `${r.deliveryId}: inbox=${r.deliveryInboxLink.inboxEntryId} mismatch=${detectDeliveryInboxMismatch(r.deliveryId)}`,
  );
  return buildReport('DELIVERY_INBOX_LINK_REPORT', `Inbox links — ${records.length}`, findings.length ? findings : ['No inbox links']);
}

export function buildDeliveryCrossDeviceReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) =>
      `${r.deliveryId}: crossDevice=${r.deliveryCrossDeviceLink.crossDeviceSessionId} mismatch=${detectDeliveryCrossDeviceMismatch(r.deliveryId)}`,
  );
  return buildReport('DELIVERY_CROSS_DEVICE_REPORT', `Cross device links — ${records.length}`, findings.length ? findings : ['No cross device links']);
}

export function buildDeliveryCloudReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) => `${r.deliveryId}: runtime=${r.deliveryCloudLink.runtimeId} mismatch=${detectDeliveryCloudMismatch(r.deliveryId)}`,
  );
  return buildReport('DELIVERY_CLOUD_REPORT', `Cloud links — ${records.length}`, findings.length ? findings : ['No cloud links']);
}

export function buildDeliveryCommandReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) => `${r.deliveryId}: command=${r.deliveryCommandLink.commandSessionId} mismatch=${detectDeliveryCommandMismatch(r.deliveryId)}`,
  );
  return buildReport('DELIVERY_COMMAND_REPORT', `Command links — ${records.length}`, findings.length ? findings : ['No command links']);
}

export function buildDeliveryChatReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) => `${r.deliveryId}: chat=${r.deliveryChatLink.chatSessionId} mismatch=${detectDeliveryChatMismatch(r.deliveryId)}`,
  );
  return buildReport('DELIVERY_CHAT_REPORT', `Chat links — ${records.length}`, findings.length ? findings : ['No chat links']);
}

export function buildDeliveryPreviewReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) => `${r.deliveryId}: preview=${r.deliveryPreviewLink.previewId} mismatch=${detectDeliveryPreviewMismatch(r.deliveryId)}`,
  );
  return buildReport('DELIVERY_PREVIEW_REPORT', `Preview links — ${records.length}`, findings.length ? findings : ['No preview links']);
}

export function buildDeliveryApprovalReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) => `${r.deliveryId}: approval=${r.deliveryApprovalLink.approvalId} mismatch=${detectDeliveryApprovalMismatch(r.deliveryId)}`,
  );
  return buildReport('DELIVERY_APPROVAL_REPORT', `Approval links — ${records.length}`, findings.length ? findings : ['No approval links']);
}

export function buildDeliveryOperatorFeedReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) =>
      `${r.deliveryId}: feed=${r.deliveryOperatorFeedLink.feedAuthorityId} mismatch=${r.deliveryOperatorFeedLink.mismatchDetected}`,
  );
  return buildReport('DELIVERY_OPERATOR_FEED_REPORT', `Operator feed links — ${records.length}`, findings.length ? findings : ['No operator feed links']);
}

export function buildDeliveryProjectVaultReport(): DeliveryReport {
  const records = listStoredDeliveryRecords();
  const findings = records.map(
    (r) =>
      `${r.deliveryId}: vault=${r.deliveryProjectVaultLink.vaultProjectId} mismatch=${r.deliveryProjectVaultLink.mismatchDetected}`,
  );
  return buildReport('DELIVERY_PROJECT_VAULT_REPORT', `Project vault links — ${records.length}`, findings.length ? findings : ['No project vault links']);
}

export function buildAllDeliveryReports(): DeliveryReport[] {
  return [
    buildDeliveryInventoryReport(),
    buildDeliveryOwnershipReport(),
    buildDeliveryContextReport(),
    buildDeliveryIntentReport(),
    buildDeliveryRoutingReport(),
    buildDeliveryTargetingReport(),
    buildDeliveryChannelEligibilityReport(),
    buildDeliveryPolicyReport(),
    buildDeliveryBlockingReport(),
    buildDeliveryDeferralReport(),
    buildDeliveryVisibilityReport(),
    buildDeliveryStateReport(),
    buildDeliveryLifecycleReport(),
    buildDeliveryHistoryReport(),
    buildDeliveryDiagnosticsReport(),
    buildDeliveryNotificationLinkReport(),
    buildDeliveryInboxLinkReport(),
    buildDeliveryCrossDeviceReport(),
    buildDeliveryCloudReport(),
    buildDeliveryCommandReport(),
    buildDeliveryChatReport(),
    buildDeliveryPreviewReport(),
    buildDeliveryApprovalReport(),
    buildDeliveryOperatorFeedReport(),
    buildDeliveryProjectVaultReport(),
  ];
}

export function composeDeliveryResponse(
  query: string,
  record: import('./notification-delivery-types.js').NotificationDeliveryRecord | null,
  reports: DeliveryReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Notification Delivery Foundation: BLOCKED' : 'Notification Delivery Foundation: READY');
  lines.push(`Query: ${query}`);
  if (record) {
    lines.push(`Delivery: ${record.deliveryId} — ${record.deliveryMetadata.deliveryName}`);
    lines.push(`Notification Ref: ${record.notificationId} Inbox Ref: ${record.inboxEntryId}`);
    lines.push(`State: ${record.deliveryState}`);
    lines.push(`Category: ${record.deliveryCategory} Priority: ${record.deliveryPriority.priority}`);
  }
  lines.push('Reports:');
  for (const r of reports) lines.push(`  ${r.reportType}: ${r.summary}`);
  lines.push('Planning only — no real email, SMS, push, FCM, or APNS delivery.');
  return lines.join('\n');
}

export function buildDeliveryFailureContext(
  query: string,
): Array<{ title: string; description: string; sourceSystem: string }> {
  if (!isNotificationDeliveryFoundationQuestion(query)) return [];
  return [
    {
      title: 'Delivery record registration blocked',
      description: 'Registration rejected due to missing inbox/notification reference or duplicate delivery authority risk.',
      sourceSystem: 'notification_delivery_foundation',
    },
    {
      title: 'Delivery planning blocked',
      description: 'Planning could not be finalized — inspect founder inbox and notification runtime upstream authorities.',
      sourceSystem: 'notification_delivery_foundation',
    },
    {
      title: 'Channel eligibility deferred',
      description: 'Eligibility check could not complete — real delivery channels blocked by policy.',
      sourceSystem: 'notification_delivery_foundation',
    },
    {
      title: 'Delivery routing mismatch',
      description: 'Routing metadata mismatch detected — verify cross-device and cloud links.',
      sourceSystem: 'notification_delivery_foundation',
    },
  ];
}
