/**
 * Mobile Push Foundation — Cross Device bridge.
 */

import { getCrossDeviceSession } from '../cross-device-runtime/index.js';
import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushCrossDeviceLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToCrossDevice(
  pushId: string,
  crossDeviceSessionId: string,
): PushCrossDeviceLink | null {
  const record = getStoredPushRecord(pushId);
  const crossDevice = getCrossDeviceSession(crossDeviceSessionId);
  if (!record || !crossDevice) return null;

  const mismatch = crossDevice.crossDeviceOwner.projectId !== record.pushOwnership.projectId;
  const link: PushCrossDeviceLink = {
    crossDeviceSessionId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePushRecord({
    ...record,
    pushCrossDeviceLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'CROSS_DEVICE',
    summary: `Linked to cross device ${crossDeviceSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: crossDeviceSessionId,
  });

  return link;
}

export function getCrossDeviceForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushCrossDeviceLink.crossDeviceSessionId ?? null;
}

export function listPushRecordsByCrossDevice(crossDeviceSessionId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter(
    (r) => r.pushCrossDeviceLink.crossDeviceSessionId === crossDeviceSessionId,
  );
}

export function detectPushCrossDeviceMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const crossDevice = getCrossDeviceSession(record.pushCrossDeviceLink.crossDeviceSessionId);
  if (!crossDevice) return true;
  return (
    crossDevice.crossDeviceOwner.projectId !== record.pushOwnership.projectId ||
    record.pushCrossDeviceLink.mismatchDetected
  );
}
