/**
 * Build Strategy Engine — Founder Inbox bridge.
 */

import { getInboxEntry, listInboxEntriesAll } from '../founder-inbox/index.js';
import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategySession, BuildStrategyInboxLink } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

export function linkBuildStrategyToInbox(
  buildStrategyId: string,
  inboxEntryId: string,
): BuildStrategyInboxLink | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  const inbox = getInboxEntry(inboxEntryId);
  if (!record || !inbox) return null;

  const mismatch =
    inbox.inboxOwnership.projectId !== record.strategyOwnership.projectId ||
    record.strategyOwnership.inboxEntryId !== inboxEntryId;

  const link: BuildStrategyInboxLink = {
    inboxEntryId,
    linkedAt: Date.now(),
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeBuildStrategyRecord({
    ...record,
    inboxEntryId,
    strategyOwnership: { ...record.strategyOwnership, inboxEntryId },
    strategyInboxLink: link,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'INBOX',
    summary: `Linked to inbox ${inboxEntryId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: inboxEntryId,
  });

  return link;
}

export function getInboxForBuildStrategy(buildStrategyId: string): string | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyInboxLink.inboxEntryId ?? null;
}

export function listBuildStrategiesByInbox(inboxEntryId: string): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter((r) => r.strategyInboxLink.inboxEntryId === inboxEntryId);
}

export function detectBuildStrategyInboxMismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  const inbox = getInboxEntry(record.strategyInboxLink.inboxEntryId);
  if (!inbox) return true;
  return (
    inbox.inboxOwnership.projectId !== record.strategyOwnership.projectId ||
    record.strategyInboxLink.mismatchDetected
  );
}

export function resolveInboxForBuildStrategyRegistration(
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
