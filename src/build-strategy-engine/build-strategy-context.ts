/**
 * Build Strategy Engine — context aggregation.
 */

import { getStoredBuildStrategyRecord, storeBuildStrategyRecord } from './build-strategy-store.js';
import type { BuildStrategyContext } from './build-strategy-types.js';

export function buildDefaultBuildStrategyContext(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  autonomousBuildId: string;
  pushId: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  crossDeviceSessionId: string;
}): BuildStrategyContext {
  return {
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    autonomousBuildId: input.autonomousBuildId,
    pushId: input.pushId,
    deliveryId: input.deliveryId,
    notificationId: input.notificationId,
    inboxEntryId: input.inboxEntryId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    operatorFeedEventId: '',
  };
}

export function refreshBuildStrategyContext(buildStrategyId: string): BuildStrategyContext | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return null;
  const ctx = {
    ...record.strategyContext,
    operatorFeedEventId: record.strategyContext.operatorFeedEventId || 'pending',
  };
  storeBuildStrategyRecord({ ...record, strategyContext: ctx, updatedAt: Date.now() });
  return ctx;
}

export function getBuildStrategyContextById(buildStrategyId: string): BuildStrategyContext | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyContext ?? null;
}

export function validateBuildStrategyContext(context: BuildStrategyContext): boolean {
  return Boolean(context.projectId && context.runtimeId && context.workspaceId && context.autonomousBuildId);
}

export function detectBuildStrategyContextMismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  const owner = record.strategyOwnership;
  return (
    owner.projectId !== record.strategyContext.projectId ||
    owner.runtimeId !== record.strategyContext.runtimeId ||
    owner.autonomousBuildId !== record.strategyContext.autonomousBuildId
  );
}
