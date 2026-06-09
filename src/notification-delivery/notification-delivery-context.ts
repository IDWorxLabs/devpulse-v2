/**
 * Notification Delivery Foundation — context aggregation.
 */

import { getStoredDeliveryRecord, storeDeliveryRecord } from './notification-delivery-store.js';
import type { DeliveryContext } from './notification-delivery-types.js';

export function buildDefaultDeliveryContext(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  approvalId: string;
  previewId: string;
  commandSessionId: string;
  chatSessionId: string;
  crossDeviceSessionId: string;
}): DeliveryContext {
  return {
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    approvalId: input.approvalId,
    previewId: input.previewId,
    commandSessionId: input.commandSessionId,
    chatSessionId: input.chatSessionId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    operatorFeedEventId: '',
  };
}

export function refreshDeliveryContext(deliveryId: string): DeliveryContext | null {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return null;
  const ctx = { ...record.deliveryContext, operatorFeedEventId: record.deliveryContext.operatorFeedEventId || 'pending' };
  storeDeliveryRecord({ ...record, deliveryContext: ctx, updatedAt: Date.now() });
  return ctx;
}

export function getDeliveryContextById(deliveryId: string): DeliveryContext | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryContext ?? null;
}

export function validateDeliveryContext(context: DeliveryContext): boolean {
  return Boolean(context.projectId && context.runtimeId && context.workspaceId);
}

export function detectDeliveryContextMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  const owner = record.deliveryOwnership;
  return (
    owner.projectId !== record.deliveryContext.projectId ||
    owner.runtimeId !== record.deliveryContext.runtimeId
  );
}
