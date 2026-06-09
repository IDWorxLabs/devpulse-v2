/**
 * Mobile Push Foundation — push record manager (planning only).
 */

import {
  getStoredPushRecord,
  listStoredPushRecords,
  storePushRecord,
} from './mobile-push-store.js';
import { registerPushOwnership } from './mobile-push-ownership.js';
import { registerPushPlatform } from './mobile-push-platform.js';
import { registerPushPolicy } from './mobile-push-policy.js';
import { checkPushEligibility } from './mobile-push-eligibility.js';
import { checkPushTokenMetadata } from './mobile-push-token.js';
import { planPushPayload } from './mobile-push-payload.js';
import { registerPushRoute } from './mobile-push-routing.js';
import { selectPushDeviceTarget } from './mobile-push-device-targeting.js';
import { blockPush } from './mobile-push-blocking.js';
import { deferPush } from './mobile-push-deferral.js';
import { recordPushLifecycleEvent } from './mobile-push-lifecycle.js';
import type { MobilePushRecord, PushOwnership, PushPlatform } from './mobile-push-types.js';
import { resolveDefaultPlatformForCategory } from './mobile-push-types.js';

export function createPushRecord(record: MobilePushRecord): MobilePushRecord {
  storePushRecord(record);
  registerPushOwnership(record.pushId, record.pushOwnership);
  recordPushLifecycleEvent(record.pushId, 'PUSH_CREATED', `Created ${record.pushMetadata.pushName}`);
  return record;
}

export function getPushRecord(pushId: string): MobilePushRecord | null {
  return getStoredPushRecord(pushId);
}

export function listPushRecords(): MobilePushRecord[] {
  return listStoredPushRecords();
}

export function planPush(
  pushId: string,
  platform?: PushPlatform,
): MobilePushRecord | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;

  const pushPlatform = platform ?? resolveDefaultPlatformForCategory(record.pushCategory);
  registerPushPlatform({ pushId, platform: pushPlatform });
  registerPushPolicy({ pushId });
  recordPushLifecycleEvent(pushId, 'PUSH_PLANNED', `Planned via ${pushPlatform}`);
  return getStoredPushRecord(pushId);
}

export function routePush(
  pushId: string,
  targetPlatform?: PushPlatform,
  targetDevice?: string,
): MobilePushRecord | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;

  const platform = targetPlatform ?? record.pushPlatform?.platform ?? resolveDefaultPlatformForCategory(record.pushCategory);
  const device = targetDevice ?? record.pushOwnership.deviceId;

  registerPushRoute({ pushId, targetPlatform: platform, targetDevice: device });
  recordPushLifecycleEvent(pushId, 'PUSH_ROUTED');
  return getStoredPushRecord(pushId);
}

export function markPushReady(pushId: string): MobilePushRecord | null {
  recordPushLifecycleEvent(pushId, 'PUSH_READY', 'Planning complete — metadata only');
  return getStoredPushRecord(pushId);
}

export function markPushCompleted(pushId: string): MobilePushRecord | null {
  recordPushLifecycleEvent(pushId, 'PUSH_COMPLETED', 'Planning marked complete — no real push');
  return getStoredPushRecord(pushId);
}

export function markPushFailed(pushId: string, reason = 'Planning failed'): MobilePushRecord | null {
  recordPushLifecycleEvent(pushId, 'PUSH_FAILED', reason);
  return getStoredPushRecord(pushId);
}

export function archivePush(pushId: string): MobilePushRecord | null {
  recordPushLifecycleEvent(pushId, 'PUSH_ARCHIVED');
  return getStoredPushRecord(pushId);
}

export { blockPush, deferPush, checkPushEligibility, checkPushTokenMetadata, planPushPayload, selectPushDeviceTarget };

export function trackPushMetadata(
  pushId: string,
  metadata: Partial<MobilePushRecord['pushMetadata']>,
): MobilePushRecord | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;

  const updated: MobilePushRecord = {
    ...record,
    pushMetadata: { ...record.pushMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storePushRecord(updated);
  return updated;
}

export function trackPushOwnership(
  pushId: string,
  ownership: Partial<PushOwnership>,
): MobilePushRecord | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;

  const updatedOwnership = { ...record.pushOwnership, ...ownership };
  registerPushOwnership(pushId, updatedOwnership);

  const updated: MobilePushRecord = {
    ...record,
    pushOwnership: updatedOwnership,
    updatedAt: Date.now(),
  };
  storePushRecord(updated);
  return updated;
}

export function runPushPlanningPipeline(pushId: string): MobilePushRecord | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;

  const platform = record.pushPlatform?.platform ?? resolveDefaultPlatformForCategory(record.pushCategory);
  planPush(pushId, platform);
  checkPushEligibility(pushId, platform);
  checkPushTokenMetadata(pushId, record.pushTokenMetadata?.tokenAlias, record.pushTokenMetadata?.tokenFingerprint, platform);
  planPushPayload(pushId);
  routePush(pushId, platform);
  selectPushDeviceTarget(pushId, platform);
  markPushReady(pushId);
  markPushCompleted(pushId);
  return getStoredPushRecord(pushId);
}
