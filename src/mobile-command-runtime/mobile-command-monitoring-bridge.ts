/**
 * Mobile Command Runtime Foundation — Cloud Monitoring Foundation bridge.
 */

import { getMonitoringRecord } from '../cloud-monitoring/index.js';
import { getStoredMobileCommandSession, listStoredMobileCommandSessions, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandSession, MobileCommandMonitoringLink } from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

export function linkMobileCommandToMonitoring(mobileCommandId: string, monitoringId: string): MobileCommandMonitoringLink | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  const monitoring = getMonitoringRecord(monitoringId);
  if (!session || !monitoring) return null;

  const mismatch = monitoring.monitoringOwner.projectId !== session.mobileCommandOwner.projectId;
  const link: MobileCommandMonitoringLink = {
    monitoringId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileCommandSession({
    ...session,
    mobileCommandMonitoringLink: link,
    mobileCommandOwner: { ...session.mobileCommandOwner, monitoringId },
    updatedAt: Date.now(),
  });

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'MONITORING',
    summary: `Linked to monitoring ${monitoringId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: monitoringId,
  });

  return link;
}

export function getMonitoringForMobileCommand(mobileCommandId: string): string | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandMonitoringLink.monitoringId ?? null;
}

export function listMobileCommandsByMonitoring(monitoringId: string): MobileCommandSession[] {
  return listStoredMobileCommandSessions().filter(
    (s) =>
      s.mobileCommandMonitoringLink.monitoringId === monitoringId ||
      s.mobileCommandOwner.monitoringId === monitoringId,
  );
}

export function detectMobileCommandMonitoringMismatch(mobileCommandId: string): boolean {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return true;
  const monitoring = getMonitoringRecord(session.mobileCommandMonitoringLink.monitoringId);
  if (!monitoring) return true;
  return monitoring.monitoringOwner.projectId !== session.mobileCommandOwner.projectId || session.mobileCommandMonitoringLink.mismatchDetected;
}

export function resolveMonitoringForMobileCommandRegistration(
  monitoringId: string,
): { exists: boolean; projectId: string | null } {
  const monitoring = getMonitoringRecord(monitoringId);
  if (!monitoring) return { exists: false, projectId: null };
  return { exists: true, projectId: monitoring.monitoringOwner.projectId };
}
