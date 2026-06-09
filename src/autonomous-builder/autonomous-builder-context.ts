/**
 * Autonomous Builder Foundation — context aggregation.
 */

import { getStoredAutonomousBuildRecord, storeAutonomousBuildRecord } from './autonomous-builder-store.js';
import type { AutonomousBuildContext } from './autonomous-builder-types.js';

export function buildDefaultAutonomousBuildContext(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  pushId: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  crossDeviceSessionId: string;
}): AutonomousBuildContext {
  return {
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    pushId: input.pushId,
    deliveryId: input.deliveryId,
    notificationId: input.notificationId,
    inboxEntryId: input.inboxEntryId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    operatorFeedEventId: '',
  };
}

export function refreshAutonomousBuildContext(autonomousBuildId: string): AutonomousBuildContext | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return null;
  const ctx = {
    ...record.buildContext,
    operatorFeedEventId: record.buildContext.operatorFeedEventId || 'pending',
  };
  storeAutonomousBuildRecord({ ...record, buildContext: ctx, updatedAt: Date.now() });
  return ctx;
}

export function getAutonomousBuildContextById(autonomousBuildId: string): AutonomousBuildContext | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildContext ?? null;
}

export function validateAutonomousBuildContext(context: AutonomousBuildContext): boolean {
  return Boolean(context.projectId && context.runtimeId && context.workspaceId);
}

export function detectAutonomousBuildContextMismatch(autonomousBuildId: string): boolean {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return true;
  const owner = record.buildOwnership;
  return (
    owner.projectId !== record.buildContext.projectId ||
    owner.runtimeId !== record.buildContext.runtimeId
  );
}
