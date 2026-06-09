/**
 * Cross Device Runtime Foundation — Mobile Command Runtime bridge.
 */

import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getStoredCrossDeviceSession, listStoredCrossDeviceSessions, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceSession, CrossDeviceCommandLink } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

export function linkCrossDeviceToCommandSession(
  crossDeviceId: string,
  mobileCommandId: string,
): CrossDeviceCommandLink | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  const command = getMobileCommandSession(mobileCommandId);
  if (!session || !command) return null;

  const mismatch = command.mobileCommandOwner.projectId !== session.crossDeviceOwner.projectId;
  const link: CrossDeviceCommandLink = {
    mobileCommandId,
    linkedAt: Date.now(),
    linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCrossDeviceSession({
    ...session,
    crossDeviceCommandLink: link,
    crossDeviceOwner: { ...session.crossDeviceOwner, mobileCommandSessionId: mobileCommandId },
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'COMMAND',
    summary: `Linked to mobile command ${mobileCommandId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: mobileCommandId,
  });

  return link;
}

export function getCommandSessionForCrossDevice(crossDeviceId: string): string | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceCommandLink.mobileCommandId ?? null;
}

export function listCrossDevicesByCommandSession(mobileCommandId: string): CrossDeviceSession[] {
  return listStoredCrossDeviceSessions().filter(
    (s) =>
      s.crossDeviceCommandLink.mobileCommandId === mobileCommandId ||
      s.crossDeviceOwner.mobileCommandSessionId === mobileCommandId,
  );
}

export function detectCrossDeviceCommandMismatch(crossDeviceId: string): boolean {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return true;
  const command = getMobileCommandSession(session.crossDeviceCommandLink.mobileCommandId);
  if (!command) return true;
  return (
    command.mobileCommandOwner.projectId !== session.crossDeviceOwner.projectId ||
    session.crossDeviceCommandLink.mismatchDetected
  );
}

export function resolveCommandForCrossDeviceRegistration(
  mobileCommandId: string,
): { exists: boolean; projectId: string | null } {
  const command = getMobileCommandSession(mobileCommandId);
  if (!command) return { exists: false, projectId: null };
  return { exists: true, projectId: command.mobileCommandOwner.projectId };
}
