/**
 * Mobile Push Foundation — blocking metadata.
 */

import {
  nextPushBlockId,
  getStoredPushRecord,
  storePushRecord,
  storePushBlocking,
} from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import { setPushState } from './mobile-push-state-manager.js';
import type { PushBlockingRecord } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function registerPushBlocking(input: {
  pushId: string;
  blockReason: string;
  blockedBy?: string;
}): PushBlockingRecord | null {
  const record = getStoredPushRecord(input.pushId);
  if (!record) return null;

  const blocking: PushBlockingRecord = {
    blockId: nextPushBlockId(),
    pushId: input.pushId,
    blockedAt: Date.now(),
    blockReason: input.blockReason,
    blockedBy: input.blockedBy ?? MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    released: false,
    releasedAt: null,
  };

  storePushBlocking(blocking);
  storePushRecord({ ...record, pushBlocking: blocking, updatedAt: Date.now() });
  setPushState(input.pushId, 'BLOCKED', true);

  recordPushHistoryEntry({
    pushId: input.pushId,
    category: 'BLOCKING',
    summary: `Blocked: ${input.blockReason}`,
    scopeUsed: blocking.blockId,
  });

  return blocking;
}

export function blockPush(pushId: string, blockReason: string): PushBlockingRecord | null {
  return registerPushBlocking({ pushId, blockReason });
}

export function getPushBlocking(pushId: string): PushBlockingRecord | null {
  return getStoredPushRecord(pushId)?.pushBlocking ?? null;
}
