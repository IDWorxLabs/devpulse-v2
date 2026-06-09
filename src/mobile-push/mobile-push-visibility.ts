/**
 * Mobile Push Foundation — visibility metadata.
 */

import { getStoredPushRecord, storePushRecord } from './mobile-push-store.js';
import type { PushCategory, PushVisibility } from './mobile-push-types.js';

export function buildDefaultPushVisibility(category: PushCategory): PushVisibility {
  return {
    visibleInPlanning: true,
    visibleOnMobile:
      category === 'MOBILE_RUNTIME_PUSH' ||
      category === 'FOUNDER_ALERT_PUSH' ||
      category === 'APPROVAL_PUSH' ||
      category === 'COMMAND_PUSH' ||
      category === 'CHAT_PUSH',
    visibleOnDesktop: category !== 'MOBILE_RUNTIME_PUSH',
    visibleOnCloud: category === 'CLOUD_PUSH' || category === 'WORLD2_PUSH',
    visibleInOperatorFeed: category !== 'SYSTEM_PUSH',
    visibleInProjectVault: category === 'PROJECT_PUSH' || category === 'SYSTEM_PUSH',
    visibilityReason: `Default visibility for ${category} — planning only push`,
  };
}

export function registerPushVisibility(
  pushId: string,
  visibility: PushVisibility,
): PushVisibility | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;
  storePushRecord({ ...record, pushVisibility: visibility, updatedAt: Date.now() });
  return visibility;
}

export function getPushVisibility(pushId: string): PushVisibility | null {
  return getStoredPushRecord(pushId)?.pushVisibility ?? null;
}

export function validatePushVisibility(visibility: PushVisibility): boolean {
  return visibility.visibleInPlanning === true;
}
