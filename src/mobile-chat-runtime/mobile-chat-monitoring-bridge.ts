/**
 * Mobile Chat Runtime Foundation — Cloud Monitoring bridge.
 */

import { getMonitoringRecord } from '../cloud-monitoring/index.js';
import { getStoredMobileChatSession, listStoredMobileChatSessions, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatSession, MobileChatMonitoringLink } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

export function linkMobileChatToMonitoring(mobileChatId: string, monitoringId: string): MobileChatMonitoringLink | null {
  const session = getStoredMobileChatSession(mobileChatId);
  const monitoring = getMonitoringRecord(monitoringId);
  if (!session || !monitoring) return null;

  const mismatch = monitoring.monitoringOwner.projectId !== session.mobileChatOwner.projectId;
  const link: MobileChatMonitoringLink = {
    monitoringId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileChatSession({ ...session, mobileChatMonitoringLink: link, mobileChatOwner: { ...session.mobileChatOwner, monitoringId }, updatedAt: Date.now() });
  recordMobileChatHistoryEntry({ mobileChatId, category: 'MONITORING', summary: `Linked to monitoring ${monitoringId}`, scopeUsed: monitoringId });
  return link;
}

export function getMonitoringForMobileChat(mobileChatId: string): string | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatMonitoringLink.monitoringId ?? null;
}

export function listMobileChatsByMonitoring(monitoringId: string): MobileChatSession[] {
  return listStoredMobileChatSessions().filter(
    (s) => s.mobileChatMonitoringLink.monitoringId === monitoringId || s.mobileChatOwner.monitoringId === monitoringId,
  );
}

export function detectMobileChatMonitoringMismatch(mobileChatId: string): boolean {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return true;
  const monitoring = getMonitoringRecord(session.mobileChatMonitoringLink.monitoringId);
  if (!monitoring) return true;
  return monitoring.monitoringOwner.projectId !== session.mobileChatOwner.projectId || session.mobileChatMonitoringLink.mismatchDetected;
}

export function resolveMonitoringForMobileChatRegistration(monitoringId: string): { exists: boolean; projectId: string | null } {
  const monitoring = getMonitoringRecord(monitoringId);
  if (!monitoring) return { exists: false, projectId: null };
  return { exists: true, projectId: monitoring.monitoringOwner.projectId };
}
