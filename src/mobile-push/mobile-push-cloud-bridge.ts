/**
 * Mobile Push Foundation — Cloud Runtime bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushCloudLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToCloud(
  pushId: string,
  runtimeId: string,
): PushCloudLink | null {
  const record = getStoredPushRecord(pushId);
  const runtime = getRuntime(runtimeId);
  if (!record || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== record.pushOwnership.projectId;
  const link: PushCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePushRecord({
    ...record,
    pushCloudLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'CLOUD',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushCloudLink.runtimeId ?? null;
}

export function listPushRecordsByCloud(runtimeId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter((r) => r.pushCloudLink.runtimeId === runtimeId);
}

export function detectPushCloudMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const runtime = getRuntime(record.pushCloudLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== record.pushOwnership.projectId ||
    record.pushCloudLink.mismatchDetected
  );
}
