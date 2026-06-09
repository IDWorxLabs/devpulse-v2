/**
 * Mobile Push Foundation — deferral metadata.
 */

import {
  nextPushDeferId,
  getStoredPushRecord,
  storePushRecord,
  storePushDeferral,
} from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import { setPushState } from './mobile-push-state-manager.js';
import type { PushDeferralRecord } from './mobile-push-types.js';

export function registerPushDeferral(input: {
  pushId: string;
  deferReason: string;
  deferredUntil?: number | null;
}): PushDeferralRecord | null {
  const record = getStoredPushRecord(input.pushId);
  if (!record) return null;

  const deferral: PushDeferralRecord = {
    deferralId: nextPushDeferId(),
    pushId: input.pushId,
    deferredAt: Date.now(),
    deferReason: input.deferReason,
    deferredUntil: input.deferredUntil ?? null,
    resumed: false,
    resumedAt: null,
  };

  storePushDeferral(deferral);
  storePushRecord({ ...record, pushDeferral: deferral, updatedAt: Date.now() });
  setPushState(input.pushId, 'DEFERRED', true);

  recordPushHistoryEntry({
    pushId: input.pushId,
    category: 'DEFERRAL',
    summary: `Deferred: ${input.deferReason}`,
    scopeUsed: deferral.deferralId,
  });

  return deferral;
}

export function deferPush(
  pushId: string,
  deferReason: string,
  deferredUntil?: number | null,
): PushDeferralRecord | null {
  return registerPushDeferral({ pushId, deferReason, deferredUntil });
}

export function getPushDeferral(pushId: string): PushDeferralRecord | null {
  return getStoredPushRecord(pushId)?.pushDeferral ?? null;
}
