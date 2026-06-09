/**
 * Cross Device Runtime Foundation — Cloud Runtime bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import { getStoredCrossDeviceSession, listStoredCrossDeviceSessions, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceSession, CrossDeviceCloudLink } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

export function linkCrossDeviceToCloud(crossDeviceId: string, runtimeId: string): CrossDeviceCloudLink | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  const runtime = getRuntime(runtimeId);
  if (!session || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== session.crossDeviceOwner.projectId;
  const link: CrossDeviceCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCrossDeviceSession({
    ...session,
    crossDeviceCloudLink: link,
    crossDeviceOwner: { ...session.crossDeviceOwner, runtimeId },
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'RUNTIME',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForCrossDevice(crossDeviceId: string): string | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceCloudLink.runtimeId ?? null;
}

export function listCrossDevicesByRuntime(runtimeId: string): CrossDeviceSession[] {
  return listStoredCrossDeviceSessions().filter(
    (s) => s.crossDeviceCloudLink.runtimeId === runtimeId || s.crossDeviceOwner.runtimeId === runtimeId,
  );
}

export function detectCrossDeviceCloudMismatch(crossDeviceId: string): boolean {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return true;
  const runtime = getRuntime(session.crossDeviceCloudLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== session.crossDeviceOwner.projectId ||
    session.crossDeviceCloudLink.mismatchDetected
  );
}

export function resolveRuntimeForCrossDeviceRegistration(
  runtimeId: string,
): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}
