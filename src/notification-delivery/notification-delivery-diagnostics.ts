/**
 * Notification Delivery Foundation — diagnostics tracker.
 */

import { listStoredDeliveryRecords, listStoredDeliveryLifecycleEvents } from './notification-delivery-store.js';
import { detectDeliveryNotificationMismatch } from './notification-delivery-notification-bridge.js';
import { detectDeliveryInboxMismatch } from './notification-delivery-inbox-bridge.js';
import { detectDeliveryCrossDeviceMismatch } from './notification-delivery-cross-device-bridge.js';
import { detectDeliveryCloudMismatch } from './notification-delivery-cloud-bridge.js';
import { detectDeliveryCommandMismatch } from './notification-delivery-command-bridge.js';
import { detectDeliveryChatMismatch } from './notification-delivery-chat-bridge.js';
import { detectDeliveryPreviewMismatch } from './notification-delivery-preview-bridge.js';
import { detectDeliveryApprovalMismatch } from './notification-delivery-approval-bridge.js';
import type { DeliveryDiagnostics, DeliveryState } from './notification-delivery-types.js';

let diagnostics: DeliveryDiagnostics = {
  deliveryPlanningActive: true,
  registeredDeliveryCount: 0,
  plannedDeliveryCount: 0,
  eligibilityCheckedCount: 0,
  routedDeliveryCount: 0,
  targetSelectedCount: 0,
  blockedDeliveryCount: 0,
  deferredDeliveryCount: 0,
  readyDeliveryCount: 0,
  completedDeliveryCount: 0,
  failedDeliveryCount: 0,
  archivedDeliveryCount: 0,
  duplicateRiskCount: 0,
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

export function getDeliveryDiagnostics(): DeliveryDiagnostics {
  return { ...diagnostics };
}

export function updateDeliveryDiagnostics(
  query: string,
  lastState: DeliveryState | null,
  duplicateRiskCount = 0,
): DeliveryDiagnostics {
  const records = listStoredDeliveryRecords();
  diagnostics = {
    deliveryPlanningActive: true,
    registeredDeliveryCount: records.length,
    plannedDeliveryCount: records.filter((r) =>
      ['PLANNED', 'ELIGIBILITY_CHECKED', 'ROUTED', 'TARGET_SELECTED', 'READY', 'COMPLETED'].includes(r.deliveryState),
    ).length,
    eligibilityCheckedCount: records.filter((r) =>
      ['ELIGIBILITY_CHECKED', 'ROUTED', 'TARGET_SELECTED', 'READY', 'COMPLETED'].includes(r.deliveryState),
    ).length,
    routedDeliveryCount: records.filter((r) =>
      ['ROUTED', 'TARGET_SELECTED', 'READY', 'COMPLETED'].includes(r.deliveryState),
    ).length,
    targetSelectedCount: records.filter((r) =>
      ['TARGET_SELECTED', 'READY', 'COMPLETED'].includes(r.deliveryState),
    ).length,
    blockedDeliveryCount: records.filter((r) => r.deliveryState === 'BLOCKED').length,
    deferredDeliveryCount: records.filter((r) => r.deliveryState === 'DEFERRED').length,
    readyDeliveryCount: records.filter((r) => r.deliveryState === 'READY' || r.deliveryState === 'COMPLETED').length,
    completedDeliveryCount: records.filter((r) => r.deliveryState === 'COMPLETED').length,
    failedDeliveryCount: records.filter((r) => r.deliveryState === 'FAILED').length,
    archivedDeliveryCount: records.filter((r) => r.deliveryState === 'ARCHIVED').length,
    duplicateRiskCount,
    notificationMismatchCount: records.filter((r) => detectDeliveryNotificationMismatch(r.deliveryId)).length,
    inboxMismatchCount: records.filter((r) => detectDeliveryInboxMismatch(r.deliveryId)).length,
    crossDeviceMismatchCount: records.filter((r) => detectDeliveryCrossDeviceMismatch(r.deliveryId)).length,
    cloudMismatchCount: records.filter((r) => detectDeliveryCloudMismatch(r.deliveryId)).length,
    commandMismatchCount: records.filter((r) => detectDeliveryCommandMismatch(r.deliveryId)).length,
    chatMismatchCount: records.filter((r) => detectDeliveryChatMismatch(r.deliveryId)).length,
    previewMismatchCount: records.filter((r) => detectDeliveryPreviewMismatch(r.deliveryId)).length,
    approvalMismatchCount: records.filter((r) => detectDeliveryApprovalMismatch(r.deliveryId)).length,
    lastQuery: query,
    lastState,
  };
  return getDeliveryDiagnostics();
}

export function resetDeliveryDiagnosticsForTests(): void {
  diagnostics = {
    deliveryPlanningActive: true,
    registeredDeliveryCount: 0,
    plannedDeliveryCount: 0,
    eligibilityCheckedCount: 0,
    routedDeliveryCount: 0,
    targetSelectedCount: 0,
    blockedDeliveryCount: 0,
    deferredDeliveryCount: 0,
    readyDeliveryCount: 0,
    completedDeliveryCount: 0,
    failedDeliveryCount: 0,
    archivedDeliveryCount: 0,
    duplicateRiskCount: 0,
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

export function runDeliveryDiagnosticsScan(): DeliveryDiagnostics {
  return updateDeliveryDiagnostics(diagnostics.lastQuery ?? 'scan', diagnostics.lastState);
}

export function getDeliveryLifecycleEventCount(): number {
  return listStoredDeliveryLifecycleEvents().length;
}
