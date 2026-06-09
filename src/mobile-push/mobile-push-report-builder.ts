/**
 * Mobile Push Foundation — report builder.
 */

import {
  listStoredPushRecords,
  listStoredPushLifecycleEvents,
  nextPushReportId,
  resetMobilePushReportCounterForTests as resetStoreReportCounterForTests,
} from './mobile-push-store.js';
import { getPushHistory } from './mobile-push-history.js';
import { getPushDiagnostics, runPushDiagnosticsScan } from './mobile-push-diagnostics.js';
import { detectPushDeliveryMismatch } from './mobile-push-delivery-bridge.js';
import { detectPushNotificationMismatch } from './mobile-push-notification-bridge.js';
import { detectPushInboxMismatch } from './mobile-push-inbox-bridge.js';
import { detectPushCrossDeviceMismatch } from './mobile-push-cross-device-bridge.js';
import { detectPushCloudMismatch } from './mobile-push-cloud-bridge.js';
import { detectPushCommandMismatch } from './mobile-push-command-bridge.js';
import { detectPushChatMismatch } from './mobile-push-chat-bridge.js';
import { detectPushPreviewMismatch } from './mobile-push-preview-bridge.js';
import { detectPushApprovalMismatch } from './mobile-push-approval-bridge.js';
import { listPushLifecycleEvents } from './mobile-push-lifecycle.js';
import { isMobilePushFoundationQuestion } from './mobile-push-types.js';
import type { PushReport, PushReportType } from './mobile-push-types.js';

export function resetMobilePushReportCounterForTests(): void {
  resetStoreReportCounterForTests();
}

function buildReport(reportType: PushReportType, summary: string, findings: string[]): PushReport {
  const records = listStoredPushRecords();
  const events = listStoredPushLifecycleEvents();
  return {
    reportId: nextPushReportId(),
    reportType,
    generatedAt: Date.now(),
    pushRecordCount: records.length,
    lifecycleEventCount: events.length,
    summary,
    findings,
    planningOnly: true,
  };
}

export function buildMobilePushInventoryReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) =>
      `${r.pushId} — ${r.pushMetadata.pushName} (${r.pushCategory}) state=${r.pushState} delivery=${r.deliveryId}`,
  );
  return buildReport(
    'MOBILE_PUSH_INVENTORY_REPORT',
    `Mobile push inventory — ${records.length} records`,
    findings.length ? findings : ['No push records'],
  );
}

export function buildMobilePushOwnershipReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) =>
      `${r.pushId}: project=${r.pushOwnership.projectId} delivery=${r.pushOwnership.deliveryId} notification=${r.pushOwnership.notificationId}`,
  );
  return buildReport('MOBILE_PUSH_OWNERSHIP_REPORT', `Ownership — ${records.length} records`, findings.length ? findings : ['No ownership records']);
}

export function buildMobilePushContextReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) => `${r.pushId}: project=${r.pushContext.projectId} approval=${r.pushContext.approvalId}`,
  );
  return buildReport('MOBILE_PUSH_CONTEXT_REPORT', `Context — ${records.length} records`, findings.length ? findings : ['No context']);
}

export function buildMobilePushTokenMetadataReport(): PushReport {
  const records = listStoredPushRecords().filter((r) => r.pushTokenMetadata !== null);
  const findings = records.map(
    (r) => `${r.pushId}: token=${r.pushTokenMetadata?.tokenId} alias=${r.pushTokenMetadata?.tokenAlias}`,
  );
  return buildReport('MOBILE_PUSH_TOKEN_METADATA_REPORT', `Token metadata — ${records.length} records`, findings.length ? findings : ['No token metadata']);
}

export function buildMobilePushPlatformReport(): PushReport {
  const records = listStoredPushRecords().filter((r) => r.pushPlatform !== null);
  const findings = records.map(
    (r) => `${r.pushId}: platform=${r.pushPlatform?.platformId} ${r.pushPlatform?.platform}`,
  );
  return buildReport('MOBILE_PUSH_PLATFORM_REPORT', `Platform — ${records.length} records`, findings.length ? findings : ['No platforms']);
}

export function buildMobilePushPayloadReport(): PushReport {
  const records = listStoredPushRecords().filter((r) => r.pushPayload !== null);
  const findings = records.map(
    (r) => `${r.pushId}: payload=${r.pushPayload?.payloadId} title=${r.pushPayload?.title}`,
  );
  return buildReport('MOBILE_PUSH_PAYLOAD_REPORT', `Payload — ${records.length} records`, findings.length ? findings : ['No payloads']);
}

export function buildMobilePushTargetingReport(): PushReport {
  const records = listStoredPushRecords().filter((r) => r.pushDeviceTarget !== null);
  const findings = records.map(
    (r) => `${r.pushId}: target=${r.pushDeviceTarget?.targetId} device=${r.pushDeviceTarget?.targetDevice}`,
  );
  return buildReport('MOBILE_PUSH_TARGETING_REPORT', `Targeting — ${records.length} records`, findings.length ? findings : ['No targets']);
}

export function buildMobilePushEligibilityReport(): PushReport {
  const records = listStoredPushRecords().filter((r) => r.pushEligibility !== null);
  const findings = records.map(
    (r) => `${r.pushId}: platform=${r.pushEligibility?.platform} eligible=${r.pushEligibility?.eligible}`,
  );
  return buildReport('MOBILE_PUSH_ELIGIBILITY_REPORT', `Eligibility — ${records.length} records`, findings.length ? findings : ['No eligibility checks']);
}

export function buildMobilePushRoutingReport(): PushReport {
  const records = listStoredPushRecords().filter((r) => r.pushRoute !== null);
  const findings = records.map(
    (r) => `${r.pushId}: route=${r.pushRoute?.routeId} platform=${r.pushRoute?.targetPlatform}`,
  );
  return buildReport('MOBILE_PUSH_ROUTING_REPORT', `Routing — ${records.length} records`, findings.length ? findings : ['No routes']);
}

export function buildMobilePushPolicyReport(): PushReport {
  const records = listStoredPushRecords().filter((r) => r.pushPolicy !== null);
  const findings = records.map(
    (r) => `${r.pushId}: policy=${r.pushPolicy?.policyId} allowed=${r.pushPolicy?.allowedPlatforms.join(',')}`,
  );
  return buildReport('MOBILE_PUSH_POLICY_REPORT', `Policy — ${records.length} records`, findings.length ? findings : ['No policies']);
}

export function buildMobilePushBlockingReport(): PushReport {
  const records = listStoredPushRecords().filter((r) => r.pushBlocking !== null);
  const findings = records.map(
    (r) => `${r.pushId}: block=${r.pushBlocking?.blockId} reason=${r.pushBlocking?.blockReason}`,
  );
  return buildReport('MOBILE_PUSH_BLOCKING_REPORT', `Blocking — ${records.length} records`, findings.length ? findings : ['No blocks']);
}

export function buildMobilePushDeferralReport(): PushReport {
  const records = listStoredPushRecords().filter((r) => r.pushDeferral !== null);
  const findings = records.map(
    (r) => `${r.pushId}: defer=${r.pushDeferral?.deferralId} reason=${r.pushDeferral?.deferReason}`,
  );
  return buildReport('MOBILE_PUSH_DEFERRAL_REPORT', `Deferral — ${records.length} records`, findings.length ? findings : ['No deferrals']);
}

export function buildMobilePushVisibilityReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) => `${r.pushId}: planning=${r.pushVisibility.visibleInPlanning} mobile=${r.pushVisibility.visibleOnMobile}`,
  );
  return buildReport('MOBILE_PUSH_VISIBILITY_REPORT', `Visibility — ${records.length} records`, findings.length ? findings : ['No visibility records']);
}

export function buildMobilePushStateReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map((r) => `${r.pushId}: ${r.pushState}`);
  return buildReport('MOBILE_PUSH_STATE_REPORT', `State — ${records.length} records`, findings.length ? findings : ['No state records']);
}

export function buildMobilePushLifecycleReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.flatMap((r) =>
    listPushLifecycleEvents(r.pushId).map((e) => `${r.pushId}: ${e.eventType} → ${e.newState}`),
  );
  return buildReport('MOBILE_PUSH_LIFECYCLE_REPORT', `Lifecycle — ${findings.length} events`, findings.length ? findings : ['No lifecycle events']);
}

export function buildMobilePushHistoryReport(): PushReport {
  const records = listStoredPushRecords();
  const allHistory = records.flatMap((r) => getPushHistory(r.pushId));
  const findings = allHistory.slice(-20).map((e) => `${e.pushId} [${e.category}]: ${e.summary}`);
  return buildReport('MOBILE_PUSH_HISTORY_REPORT', `History — ${allHistory.length} entries`, findings.length ? findings : ['No history']);
}

export function buildMobilePushDiagnosticsReport(): PushReport {
  const diag = getPushDiagnostics();
  runPushDiagnosticsScan();
  const findings = [
    `Planning active: ${diag.pushPlanningActive}`,
    `Registered pushes: ${diag.registeredPushCount}`,
    `Completed: ${diag.completedPushCount}`,
    `Delivery mismatches: ${diag.deliveryMismatchCount}`,
    `Raw token risks: ${diag.rawTokenRiskCount}`,
  ];
  return buildReport('MOBILE_PUSH_DIAGNOSTICS_REPORT', 'Diagnostics — planning validation only', findings);
}

export function buildMobilePushDeliveryLinkReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) =>
      `${r.pushId}: delivery=${r.pushDeliveryLink.deliveryId} mismatch=${detectPushDeliveryMismatch(r.pushId)}`,
  );
  return buildReport('MOBILE_PUSH_DELIVERY_LINK_REPORT', `Delivery links — ${records.length}`, findings.length ? findings : ['No delivery links']);
}

export function buildMobilePushNotificationLinkReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) =>
      `${r.pushId}: notification=${r.pushNotificationLink.notificationId} mismatch=${detectPushNotificationMismatch(r.pushId)}`,
  );
  return buildReport('MOBILE_PUSH_NOTIFICATION_LINK_REPORT', `Notification links — ${records.length}`, findings.length ? findings : ['No notification links']);
}

export function buildMobilePushInboxLinkReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) =>
      `${r.pushId}: inbox=${r.pushInboxLink.inboxEntryId} mismatch=${detectPushInboxMismatch(r.pushId)}`,
  );
  return buildReport('MOBILE_PUSH_INBOX_LINK_REPORT', `Inbox links — ${records.length}`, findings.length ? findings : ['No inbox links']);
}

export function buildMobilePushCrossDeviceReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) =>
      `${r.pushId}: crossDevice=${r.pushCrossDeviceLink.crossDeviceSessionId} mismatch=${detectPushCrossDeviceMismatch(r.pushId)}`,
  );
  return buildReport('MOBILE_PUSH_CROSS_DEVICE_REPORT', `Cross device links — ${records.length}`, findings.length ? findings : ['No cross device links']);
}

export function buildMobilePushCloudReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) => `${r.pushId}: runtime=${r.pushCloudLink.runtimeId} mismatch=${detectPushCloudMismatch(r.pushId)}`,
  );
  return buildReport('MOBILE_PUSH_CLOUD_REPORT', `Cloud links — ${records.length}`, findings.length ? findings : ['No cloud links']);
}

export function buildMobilePushCommandReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) => `${r.pushId}: command=${r.pushCommandLink.commandSessionId} mismatch=${detectPushCommandMismatch(r.pushId)}`,
  );
  return buildReport('MOBILE_PUSH_COMMAND_REPORT', `Command links — ${records.length}`, findings.length ? findings : ['No command links']);
}

export function buildMobilePushChatReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) => `${r.pushId}: chat=${r.pushChatLink.chatSessionId} mismatch=${detectPushChatMismatch(r.pushId)}`,
  );
  return buildReport('MOBILE_PUSH_CHAT_REPORT', `Chat links — ${records.length}`, findings.length ? findings : ['No chat links']);
}

export function buildMobilePushPreviewReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) => `${r.pushId}: preview=${r.pushPreviewLink.previewId} mismatch=${detectPushPreviewMismatch(r.pushId)}`,
  );
  return buildReport('MOBILE_PUSH_PREVIEW_REPORT', `Preview links — ${records.length}`, findings.length ? findings : ['No preview links']);
}

export function buildMobilePushApprovalReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) => `${r.pushId}: approval=${r.pushApprovalLink.approvalId} mismatch=${detectPushApprovalMismatch(r.pushId)}`,
  );
  return buildReport('MOBILE_PUSH_APPROVAL_REPORT', `Approval links — ${records.length}`, findings.length ? findings : ['No approval links']);
}

export function buildMobilePushOperatorFeedReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) =>
      `${r.pushId}: feed=${r.pushOperatorFeedLink.feedAuthorityId} mismatch=${r.pushOperatorFeedLink.mismatchDetected}`,
  );
  return buildReport('MOBILE_PUSH_OPERATOR_FEED_REPORT', `Operator feed links — ${records.length}`, findings.length ? findings : ['No operator feed links']);
}

export function buildMobilePushProjectVaultReport(): PushReport {
  const records = listStoredPushRecords();
  const findings = records.map(
    (r) =>
      `${r.pushId}: vault=${r.pushProjectVaultLink.vaultProjectId} mismatch=${r.pushProjectVaultLink.mismatchDetected}`,
  );
  return buildReport('MOBILE_PUSH_PROJECT_VAULT_REPORT', `Project vault links — ${records.length}`, findings.length ? findings : ['No project vault links']);
}

export function buildAllMobilePushReports(): PushReport[] {
  return [
    buildMobilePushInventoryReport(),
    buildMobilePushOwnershipReport(),
    buildMobilePushContextReport(),
    buildMobilePushTokenMetadataReport(),
    buildMobilePushPlatformReport(),
    buildMobilePushPayloadReport(),
    buildMobilePushTargetingReport(),
    buildMobilePushEligibilityReport(),
    buildMobilePushRoutingReport(),
    buildMobilePushPolicyReport(),
    buildMobilePushBlockingReport(),
    buildMobilePushDeferralReport(),
    buildMobilePushVisibilityReport(),
    buildMobilePushStateReport(),
    buildMobilePushLifecycleReport(),
    buildMobilePushHistoryReport(),
    buildMobilePushDiagnosticsReport(),
    buildMobilePushDeliveryLinkReport(),
    buildMobilePushNotificationLinkReport(),
    buildMobilePushInboxLinkReport(),
    buildMobilePushCrossDeviceReport(),
    buildMobilePushCloudReport(),
    buildMobilePushCommandReport(),
    buildMobilePushChatReport(),
    buildMobilePushPreviewReport(),
    buildMobilePushApprovalReport(),
    buildMobilePushOperatorFeedReport(),
    buildMobilePushProjectVaultReport(),
  ];
}

export function composeMobilePushResponse(
  query: string,
  record: import('./mobile-push-types.js').MobilePushRecord | null,
  reports: PushReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Mobile Push Foundation: BLOCKED' : 'Mobile Push Foundation: READY');
  lines.push(`Query: ${query}`);
  if (record) {
    lines.push(`Push: ${record.pushId} — ${record.pushMetadata.pushName}`);
    lines.push(`Delivery Ref: ${record.deliveryId} Notification Ref: ${record.notificationId}`);
    lines.push(`State: ${record.pushState}`);
    lines.push(`Category: ${record.pushCategory} Platform: ${record.pushPlatform?.platform ?? 'pending'}`);
  }
  lines.push('Reports:');
  for (const r of reports) lines.push(`  ${r.reportType}: ${r.summary}`);
  lines.push('Planning only — no real push, FCM, APNS, or raw token storage.');
  return lines.join('\n');
}

export function buildMobilePushFailureContext(
  query: string,
): Array<{ title: string; description: string; sourceSystem: string }> {
  if (!isMobilePushFoundationQuestion(query)) return [];
  return [
    {
      title: 'Push record registration blocked',
      description: 'Registration rejected due to missing delivery/notification reference or duplicate mobile push authority risk.',
      sourceSystem: 'mobile_push_foundation',
    },
    {
      title: 'Push planning blocked',
      description: 'Planning could not be finalized — inspect notification delivery upstream authority.',
      sourceSystem: 'mobile_push_foundation',
    },
    {
      title: 'Token metadata deferred',
      description: 'Token metadata check could not complete — raw token risk detected or missing alias/fingerprint.',
      sourceSystem: 'mobile_push_foundation',
    },
    {
      title: 'Push routing mismatch',
      description: 'Routing metadata mismatch detected — verify delivery and cross-device links.',
      sourceSystem: 'mobile_push_foundation',
    },
  ];
}
