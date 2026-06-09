/**
 * Mobile Push Foundation — push eligibility metadata.
 */

import {
  nextPushEligibilityId,
  getStoredPushRecord,
  storePushRecord,
  storePushEligibility,
} from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import { recordPushLifecycleEvent } from './mobile-push-lifecycle.js';
import type { PushPlatform, PushEligibility } from './mobile-push-types.js';
import { FORBIDDEN_MOBILE_PUSH_DUPLICATES } from './mobile-push-types.js';

export function registerPushEligibility(input: {
  pushId: string;
  platform: PushPlatform;
  eligible?: boolean;
  eligibilityReason?: string;
}): PushEligibility | null {
  const record = getStoredPushRecord(input.pushId);
  if (!record) return null;

  const eligible =
    input.eligible ??
    (input.platform !== 'UNKNOWN_PLATFORM' &&
      !FORBIDDEN_MOBILE_PUSH_DUPLICATES.some((d) => input.platform.toLowerCase().includes(d.slice(0, 4))));

  const eligibility: PushEligibility = {
    eligibilityId: nextPushEligibilityId(),
    pushId: input.pushId,
    platform: input.platform,
    eligible,
    eligibilityReason:
      input.eligibilityReason ??
      (eligible
        ? `Platform ${input.platform} eligible for push planning metadata`
        : `Platform ${input.platform} blocked — planning only, no real FCM or APNS`),
    checkedAt: Date.now(),
  };

  storePushEligibility(eligibility);
  storePushRecord({ ...record, pushEligibility: eligibility, updatedAt: Date.now() });

  recordPushHistoryEntry({
    pushId: input.pushId,
    category: 'ELIGIBILITY',
    summary: `Eligibility ${eligibility.eligibilityId}: ${input.platform}=${eligible}`,
    scopeUsed: eligibility.eligibilityId,
  });

  return eligibility;
}

export function checkPushEligibility(
  pushId: string,
  platform: PushPlatform,
): PushEligibility | null {
  const eligibility = registerPushEligibility({
    pushId,
    platform,
    eligible: platform !== 'UNKNOWN_PLATFORM',
  });
  if (eligibility) {
    recordPushLifecycleEvent(pushId, 'PUSH_ELIGIBILITY_CHECKED');
  }
  return eligibility;
}

export function getPushEligibility(pushId: string): PushEligibility | null {
  return getStoredPushRecord(pushId)?.pushEligibility ?? null;
}
