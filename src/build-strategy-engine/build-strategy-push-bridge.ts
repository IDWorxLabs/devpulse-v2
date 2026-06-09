/**
 * Build Strategy Engine — Mobile Push bridge.
 */

import { getPushRecord, listPushRecordsAll } from '../mobile-push/index.js';
import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategySession, BuildStrategyPushLink } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

export function linkBuildStrategyToPush(
  buildStrategyId: string,
  pushId: string,
): BuildStrategyPushLink | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  const push = getPushRecord(pushId);
  if (!record || !push) return null;

  const mismatch =
    push.pushOwnership.projectId !== record.strategyOwnership.projectId ||
    record.strategyOwnership.pushId !== pushId;

  const link: BuildStrategyPushLink = {
    pushId,
    linkedAt: Date.now(),
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeBuildStrategyRecord({
    ...record,
    pushId,
    strategyOwnership: { ...record.strategyOwnership, pushId },
    strategyPushLink: link,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'PUSH',
    summary: `Linked to push ${pushId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: pushId,
  });

  return link;
}

export function getPushForBuildStrategy(buildStrategyId: string): string | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyPushLink.pushId ?? null;
}

export function listBuildStrategiesByPush(pushId: string): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter((r) => r.strategyPushLink.pushId === pushId);
}

export function detectBuildStrategyPushMismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  const push = getPushRecord(record.strategyPushLink.pushId);
  if (!push) return true;
  return (
    push.pushOwnership.projectId !== record.strategyOwnership.projectId ||
    record.strategyPushLink.mismatchDetected
  );
}

export function resolvePushForBuildStrategyRegistration(
  pushId: string,
): { exists: boolean; projectId: string | null; deliveryId: string | null; notificationId: string | null; inboxEntryId: string | null } {
  const push = getPushRecord(pushId);
  if (!push) return { exists: false, projectId: null, deliveryId: null, notificationId: null, inboxEntryId: null };
  return {
    exists: true,
    projectId: push.pushOwnership.projectId,
    deliveryId: push.deliveryId,
    notificationId: push.notificationId,
    inboxEntryId: push.inboxEntryId,
  };
}

export function findPushByName(pushName: string): string | null {
  const match = listPushRecordsAll().find((p) => p.pushMetadata.pushName === pushName);
  return match?.pushId ?? null;
}
