/**
 * Mobile Push Foundation — device targeting metadata.
 */

import {
  nextPushTargetId,
  getStoredPushRecord,
  storePushRecord,
  storePushDeviceTarget,
} from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import { recordPushLifecycleEvent } from './mobile-push-lifecycle.js';
import type { PushPlatform, PushDeviceTarget } from './mobile-push-types.js';

export function registerPushDeviceTarget(input: {
  pushId: string;
  targetPlatform: PushPlatform;
  targetDevice: string;
  targetReason?: string;
}): PushDeviceTarget | null {
  const record = getStoredPushRecord(input.pushId);
  if (!record) return null;

  const target: PushDeviceTarget = {
    targetId: nextPushTargetId(),
    pushId: input.pushId,
    targetPlatform: input.targetPlatform,
    targetDevice: input.targetDevice,
    targetReason: input.targetReason ?? `Target ${input.targetDevice} on ${input.targetPlatform}`,
    selectedAt: Date.now(),
  };

  storePushDeviceTarget(target);
  storePushRecord({ ...record, pushDeviceTarget: target, updatedAt: Date.now() });

  recordPushHistoryEntry({
    pushId: input.pushId,
    category: 'TARGETING',
    summary: `Target selected: ${target.targetId} → ${input.targetPlatform}/${input.targetDevice}`,
    scopeUsed: target.targetId,
  });

  return target;
}

export function selectPushDeviceTarget(
  pushId: string,
  targetPlatform?: PushPlatform,
  targetDevice?: string,
): PushDeviceTarget | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;

  const platform = targetPlatform ?? record.pushRoute?.targetPlatform ?? record.pushPlatform?.platform ?? 'ANDROID';
  const device = targetDevice ?? record.pushOwnership.deviceId;

  const target = registerPushDeviceTarget({ pushId, targetPlatform: platform, targetDevice: device });
  if (target) {
    recordPushLifecycleEvent(pushId, 'PUSH_TARGET_SELECTED');
  }
  return target;
}

export function getPushDeviceTarget(pushId: string): PushDeviceTarget | null {
  return getStoredPushRecord(pushId)?.pushDeviceTarget ?? null;
}
