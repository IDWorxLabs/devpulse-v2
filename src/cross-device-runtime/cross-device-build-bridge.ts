/**
 * Cross Device Runtime Foundation — Persistent Build bridge.
 */

import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getStoredCrossDeviceSession, listStoredCrossDeviceSessions, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceSession, CrossDeviceBuildLink } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

export function linkCrossDeviceToBuild(
  crossDeviceId: string,
  persistentBuildId: string,
): CrossDeviceBuildLink | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  const build = getPersistentBuild(persistentBuildId);
  if (!session || !build) return null;

  const mismatch = build.buildOwner.projectId !== session.crossDeviceOwner.projectId;
  const link: CrossDeviceBuildLink = {
    persistentBuildId,
    linkedAt: Date.now(),
    linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCrossDeviceSession({
    ...session,
    crossDeviceBuildLink: link,
    crossDeviceOwner: { ...session.crossDeviceOwner, persistentBuildId },
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'PERSISTENT_BUILD',
    summary: `Linked to build ${persistentBuildId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: persistentBuildId,
  });

  return link;
}

export function getBuildForCrossDevice(crossDeviceId: string): string | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceBuildLink.persistentBuildId ?? null;
}

export function listCrossDevicesByPersistentBuild(persistentBuildId: string): CrossDeviceSession[] {
  return listStoredCrossDeviceSessions().filter(
    (s) =>
      s.crossDeviceBuildLink.persistentBuildId === persistentBuildId ||
      s.crossDeviceOwner.persistentBuildId === persistentBuildId,
  );
}

export function detectCrossDeviceBuildMismatch(crossDeviceId: string): boolean {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return true;
  const build = getPersistentBuild(session.crossDeviceBuildLink.persistentBuildId);
  if (!build) return true;
  return (
    build.buildOwner.projectId !== session.crossDeviceOwner.projectId ||
    session.crossDeviceBuildLink.mismatchDetected
  );
}
