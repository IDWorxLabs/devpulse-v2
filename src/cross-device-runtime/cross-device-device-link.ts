/**
 * Cross Device Runtime Foundation — device link management (metadata only).
 */

import {
  nextDeviceLinkId,
  storeDeviceLink,
  getStoredDeviceLink,
  listStoredDeviceLinks,
  getStoredCrossDeviceSession,
  storeCrossDeviceSession,
} from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import { buildDefaultDeviceVisibility } from './cross-device-visibility.js';
import type { DeviceLink, CrossDeviceType } from './cross-device-types.js';

export function registerDeviceLink(input: {
  crossDeviceId: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  sourceDeviceType: CrossDeviceType;
  targetDeviceType: CrossDeviceType;
  projectId: string;
  sessionId: string;
}): DeviceLink | null {
  const session = getStoredCrossDeviceSession(input.crossDeviceId);
  if (!session) return null;

  const link: DeviceLink = {
    deviceLinkId: nextDeviceLinkId(),
    crossDeviceId: input.crossDeviceId,
    sourceDeviceId: input.sourceDeviceId,
    targetDeviceId: input.targetDeviceId,
    sourceDeviceType: input.sourceDeviceType,
    targetDeviceType: input.targetDeviceType,
    projectId: input.projectId,
    sessionId: input.sessionId,
    linkStatus: 'LINKED',
    linkTimestamp: Date.now(),
    linkVisibility: buildDefaultDeviceVisibility(session.crossDeviceType),
  };

  storeDeviceLink(link);
  storeCrossDeviceSession({
    ...session,
    deviceLinks: [...session.deviceLinks, link],
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId: input.crossDeviceId,
    category: 'LINK',
    summary: `Device link ${link.deviceLinkId}: ${input.sourceDeviceId} → ${input.targetDeviceId}`,
    scopeUsed: link.deviceLinkId,
  });

  return link;
}

export function getDeviceLink(deviceLinkId: string): DeviceLink | null {
  return getStoredDeviceLink(deviceLinkId);
}

export function listDeviceLinks(crossDeviceId?: string): DeviceLink[] {
  const all = listStoredDeviceLinks();
  if (!crossDeviceId) return all;
  return all.filter((l) => l.crossDeviceId === crossDeviceId);
}
