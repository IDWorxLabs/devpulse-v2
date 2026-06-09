/**
 * Mobile Push Foundation — payload planning metadata.
 */

import {
  nextPushPayloadId,
  getStoredPushRecord,
  storePushRecord,
  storePushPayload,
} from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import { recordPushLifecycleEvent } from './mobile-push-lifecycle.js';
import type { PushCategory, PushPayload } from './mobile-push-types.js';

export function registerPushPayload(input: {
  pushId: string;
  title?: string;
  body?: string;
  category?: PushCategory;
}): PushPayload | null {
  const record = getStoredPushRecord(input.pushId);
  if (!record) return null;

  const category = input.category ?? record.pushCategory;
  const payload: PushPayload = {
    payloadId: nextPushPayloadId(),
    pushId: input.pushId,
    title: input.title ?? `${record.pushMetadata.pushName} — planning title`,
    body: input.body ?? `${record.pushMetadata.pushDescription || category} — planning body only, no real push`,
    category,
    planningOnly: true,
    plannedAt: Date.now(),
  };

  storePushPayload(payload);
  storePushRecord({ ...record, pushPayload: payload, updatedAt: Date.now() });

  recordPushHistoryEntry({
    pushId: input.pushId,
    category: 'PAYLOAD',
    summary: `Payload ${payload.payloadId}: ${payload.title}`,
    scopeUsed: payload.payloadId,
  });

  return payload;
}

export function planPushPayload(
  pushId: string,
  title?: string,
  body?: string,
): PushPayload | null {
  const payload = registerPushPayload({ pushId, title, body });
  if (payload) {
    recordPushLifecycleEvent(pushId, 'PUSH_PAYLOAD_PLANNED', `Payload planned for ${pushId}`);
  }
  return payload;
}

export function getPushPayload(pushId: string): PushPayload | null {
  return getStoredPushRecord(pushId)?.pushPayload ?? null;
}
