/**
 * Cross Device Runtime Foundation — device visibility (metadata only).
 */

import { getStoredCrossDeviceSession, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { DeviceVisibility, CrossDeviceCategory } from './cross-device-types.js';

export function buildDefaultDeviceVisibility(crossDeviceType: CrossDeviceCategory = 'GENERAL_CROSS_DEVICE'): DeviceVisibility {
  const mobileVisible =
    crossDeviceType === 'MOBILE_TO_DESKTOP' ||
    crossDeviceType === 'MOBILE_TO_CLOUD' ||
    crossDeviceType === 'GENERAL_CROSS_DEVICE';
  const desktopVisible =
    crossDeviceType === 'DESKTOP_TO_MOBILE' ||
    crossDeviceType === 'DESKTOP_TO_CLOUD' ||
    crossDeviceType === 'GENERAL_CROSS_DEVICE';
  const cloudVisible =
    crossDeviceType === 'MOBILE_TO_CLOUD' ||
    crossDeviceType === 'DESKTOP_TO_CLOUD' ||
    crossDeviceType === 'GENERAL_CROSS_DEVICE';

  return {
    visibleOnMobile: mobileVisible,
    visibleOnDesktop: desktopVisible,
    visibleOnCloud: cloudVisible,
    visibleInOperatorFeed: true,
    visibleInProjectVault: true,
    visibleInMobileCommand: crossDeviceType !== 'FOUNDER_CROSS_DEVICE',
    visibilityReason: `Default visibility for ${crossDeviceType} — authority metadata only`,
  };
}

export function getDeviceVisibility(crossDeviceId: string): DeviceVisibility | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceVisibility ?? null;
}

export function setDeviceVisibility(crossDeviceId: string, visibility: DeviceVisibility): DeviceVisibility | null {
  const issues = validateDeviceVisibility(visibility);
  if (issues.length > 0) return null;

  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return null;

  storeCrossDeviceSession({
    ...session,
    crossDeviceVisibility: visibility,
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'VISIBILITY',
    summary: `Device visibility updated — mobile=${visibility.visibleOnMobile} desktop=${visibility.visibleOnDesktop}`,
    scopeUsed: crossDeviceId,
  });

  return visibility;
}

export function validateDeviceVisibility(visibility: DeviceVisibility): string[] {
  const issues: string[] = [];
  if (!visibility.visibilityReason?.trim()) issues.push('Missing visibility reason');
  return issues;
}
