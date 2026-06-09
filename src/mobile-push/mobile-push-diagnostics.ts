/**
 * Mobile Push Foundation — diagnostics tracker.
 */

import { listStoredPushRecords, listStoredPushLifecycleEvents } from './mobile-push-store.js';
import { detectPushDeliveryMismatch } from './mobile-push-delivery-bridge.js';
import { detectPushNotificationMismatch } from './mobile-push-notification-bridge.js';
import { detectPushInboxMismatch } from './mobile-push-inbox-bridge.js';
import { detectPushCrossDeviceMismatch } from './mobile-push-cross-device-bridge.js';
import { detectPushCloudMismatch } from './mobile-push-cloud-bridge.js';
import { detectPushCommandMismatch } from './mobile-push-command-bridge.js';
import { detectPushChatMismatch } from './mobile-push-chat-bridge.js';
import { detectPushPreviewMismatch } from './mobile-push-preview-bridge.js';
import { detectPushApprovalMismatch } from './mobile-push-approval-bridge.js';
import type { PushDiagnostics, PushState } from './mobile-push-types.js';

let diagnostics: PushDiagnostics = {
  pushPlanningActive: true,
  registeredPushCount: 0,
  plannedPushCount: 0,
  eligibilityCheckedCount: 0,
  tokenMetadataCheckedCount: 0,
  payloadPlannedCount: 0,
  routedPushCount: 0,
  targetSelectedCount: 0,
  blockedPushCount: 0,
  deferredPushCount: 0,
  readyPushCount: 0,
  completedPushCount: 0,
  failedPushCount: 0,
  archivedPushCount: 0,
  duplicateRiskCount: 0,
  rawTokenRiskCount: 0,
  deliveryMismatchCount: 0,
  notificationMismatchCount: 0,
  inboxMismatchCount: 0,
  crossDeviceMismatchCount: 0,
  cloudMismatchCount: 0,
  commandMismatchCount: 0,
  chatMismatchCount: 0,
  previewMismatchCount: 0,
  approvalMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getPushDiagnostics(): PushDiagnostics {
  return { ...diagnostics };
}

export function updatePushDiagnostics(
  query: string,
  lastState: PushState | null,
  duplicateRiskCount = 0,
  rawTokenRiskCount = 0,
): PushDiagnostics {
  const records = listStoredPushRecords();
  diagnostics = {
    pushPlanningActive: true,
    registeredPushCount: records.length,
    plannedPushCount: records.filter((r) =>
      ['PLANNED', 'ELIGIBILITY_CHECKED', 'TOKEN_METADATA_CHECKED', 'PAYLOAD_PLANNED', 'ROUTED', 'TARGET_SELECTED', 'READY', 'COMPLETED'].includes(r.pushState),
    ).length,
    eligibilityCheckedCount: records.filter((r) =>
      ['ELIGIBILITY_CHECKED', 'TOKEN_METADATA_CHECKED', 'PAYLOAD_PLANNED', 'ROUTED', 'TARGET_SELECTED', 'READY', 'COMPLETED'].includes(r.pushState),
    ).length,
    tokenMetadataCheckedCount: records.filter((r) =>
      ['TOKEN_METADATA_CHECKED', 'PAYLOAD_PLANNED', 'ROUTED', 'TARGET_SELECTED', 'READY', 'COMPLETED'].includes(r.pushState),
    ).length,
    payloadPlannedCount: records.filter((r) =>
      ['PAYLOAD_PLANNED', 'ROUTED', 'TARGET_SELECTED', 'READY', 'COMPLETED'].includes(r.pushState),
    ).length,
    routedPushCount: records.filter((r) =>
      ['ROUTED', 'TARGET_SELECTED', 'READY', 'COMPLETED'].includes(r.pushState),
    ).length,
    targetSelectedCount: records.filter((r) =>
      ['TARGET_SELECTED', 'READY', 'COMPLETED'].includes(r.pushState),
    ).length,
    blockedPushCount: records.filter((r) => r.pushState === 'BLOCKED').length,
    deferredPushCount: records.filter((r) => r.pushState === 'DEFERRED').length,
    readyPushCount: records.filter((r) => r.pushState === 'READY' || r.pushState === 'COMPLETED').length,
    completedPushCount: records.filter((r) => r.pushState === 'COMPLETED').length,
    failedPushCount: records.filter((r) => r.pushState === 'FAILED').length,
    archivedPushCount: records.filter((r) => r.pushState === 'ARCHIVED').length,
    duplicateRiskCount,
    rawTokenRiskCount,
    deliveryMismatchCount: records.filter((r) => detectPushDeliveryMismatch(r.pushId)).length,
    notificationMismatchCount: records.filter((r) => detectPushNotificationMismatch(r.pushId)).length,
    inboxMismatchCount: records.filter((r) => detectPushInboxMismatch(r.pushId)).length,
    crossDeviceMismatchCount: records.filter((r) => detectPushCrossDeviceMismatch(r.pushId)).length,
    cloudMismatchCount: records.filter((r) => detectPushCloudMismatch(r.pushId)).length,
    commandMismatchCount: records.filter((r) => detectPushCommandMismatch(r.pushId)).length,
    chatMismatchCount: records.filter((r) => detectPushChatMismatch(r.pushId)).length,
    previewMismatchCount: records.filter((r) => detectPushPreviewMismatch(r.pushId)).length,
    approvalMismatchCount: records.filter((r) => detectPushApprovalMismatch(r.pushId)).length,
    lastQuery: query,
    lastState,
  };
  return getPushDiagnostics();
}

export function resetPushDiagnosticsForTests(): void {
  diagnostics = {
    pushPlanningActive: true,
    registeredPushCount: 0,
    plannedPushCount: 0,
    eligibilityCheckedCount: 0,
    tokenMetadataCheckedCount: 0,
    payloadPlannedCount: 0,
    routedPushCount: 0,
    targetSelectedCount: 0,
    blockedPushCount: 0,
    deferredPushCount: 0,
    readyPushCount: 0,
    completedPushCount: 0,
    failedPushCount: 0,
    archivedPushCount: 0,
    duplicateRiskCount: 0,
    rawTokenRiskCount: 0,
    deliveryMismatchCount: 0,
    notificationMismatchCount: 0,
    inboxMismatchCount: 0,
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

export function runPushDiagnosticsScan(): PushDiagnostics {
  return updatePushDiagnostics(diagnostics.lastQuery ?? 'scan', diagnostics.lastState);
}

export function getPushLifecycleEventCount(): number {
  return listStoredPushLifecycleEvents().length;
}
