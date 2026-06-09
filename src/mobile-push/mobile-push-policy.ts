/**
 * Mobile Push Foundation — push policy metadata.
 */

import {
  nextPushPolicyId,
  getStoredPushRecord,
  storePushRecord,
  storePushPolicy,
} from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { PushPlatform, PushPolicy } from './mobile-push-types.js';
import { TRACKED_PUSH_PLATFORMS } from './mobile-push-types.js';

export function registerPushPolicy(input: {
  pushId: string;
  policyName?: string;
  allowedPlatforms?: PushPlatform[];
  blockedPlatforms?: PushPlatform[];
  policyReason?: string;
}): PushPolicy | null {
  const record = getStoredPushRecord(input.pushId);
  if (!record) return null;

  const blockedPlatforms: PushPlatform[] = input.blockedPlatforms ?? [];
  const allowedPlatforms: PushPlatform[] =
    input.allowedPlatforms ??
    TRACKED_PUSH_PLATFORMS.filter((p) => !blockedPlatforms.includes(p));

  const policy: PushPolicy = {
    policyId: nextPushPolicyId(),
    pushId: input.pushId,
    policyName: input.policyName ?? 'Default Push Planning Policy',
    allowedPlatforms,
    blockedPlatforms,
    policyReason: input.policyReason ?? 'Planning-only policy — no real FCM, APNS, or raw token storage',
    appliedAt: Date.now(),
  };

  storePushPolicy(policy);
  storePushRecord({ ...record, pushPolicy: policy, updatedAt: Date.now() });

  recordPushHistoryEntry({
    pushId: input.pushId,
    category: 'POLICY',
    summary: `Policy ${policy.policyId}: allowed=${allowedPlatforms.join(',')}`,
    scopeUsed: policy.policyId,
  });

  return policy;
}

export function getPushPolicy(pushId: string): PushPolicy | null {
  return getStoredPushRecord(pushId)?.pushPolicy ?? null;
}
