/**
 * Mobile Push Foundation — platform metadata.
 */

import {
  nextPushPlatformId,
  getStoredPushRecord,
  storePushRecord,
  storePushPlatform,
  listStoredPushRecords,
} from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { PushCategory, PushPlatform, PushPlatformMeta } from './mobile-push-types.js';
import { resolveDefaultPlatformForCategory } from './mobile-push-types.js';

export function registerPushPlatform(input: {
  pushId: string;
  platform?: PushPlatform;
  platformReason?: string;
}): PushPlatformMeta | null {
  const record = getStoredPushRecord(input.pushId);
  if (!record) return null;

  const platform = input.platform ?? resolveDefaultPlatformForCategory(record.pushCategory);
  const platformMeta: PushPlatformMeta = {
    platformId: nextPushPlatformId(),
    pushId: input.pushId,
    platform,
    platformReason: input.platformReason ?? `Default platform ${platform} for ${record.pushCategory} — planning only`,
    selectedAt: Date.now(),
  };

  storePushPlatform(platformMeta);
  storePushRecord({ ...record, pushPlatform: platformMeta, updatedAt: Date.now() });

  recordPushHistoryEntry({
    pushId: input.pushId,
    category: 'PLATFORM',
    summary: `Platform ${platformMeta.platformId}: ${platform}`,
    scopeUsed: platformMeta.platformId,
  });

  return platformMeta;
}

export function getPushPlatform(pushId: string): PushPlatformMeta | null {
  return getStoredPushRecord(pushId)?.pushPlatform ?? null;
}

export function resolvePlatformForCategory(category: PushCategory): PushPlatform {
  return resolveDefaultPlatformForCategory(category);
}

export function listPushesByPlatform(platform: PushPlatform): import('./mobile-push-types.js').MobilePushRecord[] {
  return listStoredPushRecords().filter(
    (r) => r.pushPlatform?.platform === platform || r.pushRoute?.targetPlatform === platform,
  );
}
