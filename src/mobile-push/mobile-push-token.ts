/**
 * Mobile Push Foundation — token metadata (planning only, no raw tokens).
 */

import {
  nextPushTokenId,
  getStoredPushRecord,
  storePushRecord,
  storePushToken,
} from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import { recordPushLifecycleEvent } from './mobile-push-lifecycle.js';
import type { PushPlatform, PushTokenMetadata, TokenState } from './mobile-push-types.js';
import { detectRawTokenRisk } from './mobile-push-types.js';

export function registerPushTokenMetadata(input: {
  pushId: string;
  tokenAlias: string;
  tokenFingerprint: string;
  platform: PushPlatform;
  tokenState?: TokenState;
}): PushTokenMetadata | null {
  const record = getStoredPushRecord(input.pushId);
  if (!record) return null;

  if (detectRawTokenRisk(input.tokenAlias) || detectRawTokenRisk(input.tokenFingerprint)) {
    return null;
  }

  const token: PushTokenMetadata = {
    tokenId: nextPushTokenId(),
    pushId: input.pushId,
    tokenAlias: input.tokenAlias,
    tokenFingerprint: input.tokenFingerprint,
    tokenState: input.tokenState ?? 'TOKEN_METADATA_REGISTERED',
    platform: input.platform,
    registeredAt: Date.now(),
    planningOnly: true,
  };

  storePushToken(token);
  storePushRecord({ ...record, pushTokenMetadata: token, updatedAt: Date.now() });

  recordPushHistoryEntry({
    pushId: input.pushId,
    category: 'TOKEN',
    summary: `Token metadata ${token.tokenId}: alias=${input.tokenAlias} platform=${input.platform}`,
    scopeUsed: token.tokenId,
  });

  return token;
}

export function checkPushTokenMetadata(
  pushId: string,
  tokenAlias?: string,
  tokenFingerprint?: string,
  platform?: PushPlatform,
): PushTokenMetadata | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;

  const alias = tokenAlias ?? record.pushTokenMetadata?.tokenAlias ?? `alias-${pushId}`;
  const fingerprint = tokenFingerprint ?? record.pushTokenMetadata?.tokenFingerprint ?? `fingerprint-${pushId}`;
  const plat = platform ?? record.pushPlatform?.platform ?? 'ANDROID';

  const token = registerPushTokenMetadata({
    pushId,
    tokenAlias: alias,
    tokenFingerprint: fingerprint,
    platform: plat,
    tokenState: 'TOKEN_METADATA_VALID',
  });

  if (token) {
    recordPushLifecycleEvent(pushId, 'PUSH_TOKEN_METADATA_CHECKED', `Token metadata checked for ${pushId}`);
  }

  return token;
}

export function getPushTokenMetadata(pushId: string): PushTokenMetadata | null {
  return getStoredPushRecord(pushId)?.pushTokenMetadata ?? null;
}
