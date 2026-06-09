/**
 * Mobile Push Foundation — routing metadata (planning only).
 */

import {
  nextPushRouteId,
  getStoredPushRecord,
  storePushRecord,
  storePushRoute,
  listStoredPushRecords,
} from './mobile-push-store.js';
import type { MobilePushRecord } from './mobile-push-types.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { PushPlatform, PushRoute } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function registerPushRoute(input: {
  pushId: string;
  targetPlatform: PushPlatform;
  targetDevice: string;
  routingReason?: string;
  sourceRuntime?: string;
}): PushRoute | null {
  const record = getStoredPushRecord(input.pushId);
  if (!record) return null;

  const route: PushRoute = {
    routeId: nextPushRouteId(),
    pushId: input.pushId,
    sourceRuntime: input.sourceRuntime ?? MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    targetPlatform: input.targetPlatform,
    targetDevice: input.targetDevice,
    routingReason: input.routingReason ?? `Route to ${input.targetPlatform} — planning only, no real push`,
    routingTimestamp: Date.now(),
    routingStatus: 'ROUTED',
  };

  storePushRoute(route);
  storePushRecord({ ...record, pushRoute: route, updatedAt: Date.now() });

  recordPushHistoryEntry({
    pushId: input.pushId,
    category: 'ROUTING',
    summary: `Routed to ${input.targetPlatform} via ${route.routeId}`,
    scopeUsed: route.routeId,
  });

  return route;
}

export function getPushRoute(routeId: string): PushRoute | null {
  const records = listStoredPushRecords();
  for (const r of records) {
    if (r.pushRoute?.routeId === routeId) return r.pushRoute;
  }
  return null;
}

export function listRoutesForPush(pushId: string): PushRoute[] {
  const record = getStoredPushRecord(pushId);
  if (!record?.pushRoute) return [];
  return [record.pushRoute];
}

export function listPushesByPlatformRoute(platform: PushPlatform): MobilePushRecord[] {
  return listStoredPushRecords().filter(
    (r) =>
      r.pushRoute?.targetPlatform === platform ||
      r.pushPlatform?.platform === platform ||
      r.pushEligibility?.platform === platform,
  );
}
