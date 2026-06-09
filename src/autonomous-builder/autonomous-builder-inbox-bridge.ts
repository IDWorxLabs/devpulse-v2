/**
 * Autonomous Builder Foundation — Founder Inbox bridge.
 */

import { getInboxEntry, listInboxEntriesAll } from '../founder-inbox/index.js';
import {
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildSession, AutonomousBuildInboxLink } from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

export function linkAutonomousBuildToInbox(
  autonomousBuildId: string,
  inboxEntryId: string,
): AutonomousBuildInboxLink | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  const inbox = getInboxEntry(inboxEntryId);
  if (!record || !inbox) return null;

  const mismatch =
    inbox.inboxOwnership.projectId !== record.buildOwnership.projectId ||
    record.buildOwnership.inboxEntryId !== inboxEntryId;

  const link: AutonomousBuildInboxLink = {
    inboxEntryId,
    linkedAt: Date.now(),
    linkAuthority: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeAutonomousBuildRecord({
    ...record,
    inboxEntryId,
    buildOwnership: { ...record.buildOwnership, inboxEntryId },
    buildInboxLink: link,
    updatedAt: Date.now(),
  });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'INBOX',
    summary: `Linked to inbox ${inboxEntryId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: inboxEntryId,
  });

  return link;
}

export function getInboxForAutonomousBuild(autonomousBuildId: string): string | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildInboxLink.inboxEntryId ?? null;
}

export function listAutonomousBuildsByInbox(inboxEntryId: string): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords().filter((r) => r.buildInboxLink.inboxEntryId === inboxEntryId);
}

export function detectAutonomousBuildInboxMismatch(autonomousBuildId: string): boolean {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return true;
  const inbox = getInboxEntry(record.buildInboxLink.inboxEntryId);
  if (!inbox) return true;
  return (
    inbox.inboxOwnership.projectId !== record.buildOwnership.projectId ||
    record.buildInboxLink.mismatchDetected
  );
}

export function resolveInboxForAutonomousBuildRegistration(
  inboxEntryId: string,
): { exists: boolean; projectId: string | null } {
  const inbox = getInboxEntry(inboxEntryId);
  if (!inbox) return { exists: false, projectId: null };
  return { exists: true, projectId: inbox.inboxOwnership.projectId };
}

export function findInboxEntryByName(inboxEntryName: string): string | null {
  const match = listInboxEntriesAll().find((e) => e.inboxMetadata.inboxEntryName === inboxEntryName);
  return match?.inboxEntryId ?? null;
}
