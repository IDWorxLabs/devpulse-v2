/**
 * Mobile Push Foundation — context aggregation.
 */

import { getStoredPushRecord, storePushRecord } from './mobile-push-store.js';
import type { PushContext } from './mobile-push-types.js';

export function buildDefaultPushContext(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  approvalId: string;
  previewId: string;
  commandSessionId: string;
  chatSessionId: string;
  crossDeviceSessionId: string;
}): PushContext {
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

export function refreshPushContext(pushId: string): PushContext | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;
  const ctx = { ...record.pushContext, operatorFeedEventId: record.pushContext.operatorFeedEventId || 'pending' };
  storePushRecord({ ...record, pushContext: ctx, updatedAt: Date.now() });
  return ctx;
}

export function getPushContextById(pushId: string): PushContext | null {
  return getStoredPushRecord(pushId)?.pushContext ?? null;
}

export function validatePushContext(context: PushContext): boolean {
  return Boolean(context.projectId && context.runtimeId && context.workspaceId);
}

export function detectPushContextMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const owner = record.pushOwnership;
  return (
    owner.projectId !== record.pushContext.projectId ||
    owner.runtimeId !== record.pushContext.runtimeId
  );
}
