/**
 * Mobile Push Foundation — Mobile Command bridge.
 */

import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushCommandLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToCommand(
  pushId: string,
  commandSessionId: string,
): PushCommandLink | null {
  const record = getStoredPushRecord(pushId);
  const command = getMobileCommandSession(commandSessionId);
  if (!record || !command) return null;

  const mismatch = command.mobileCommandOwner.projectId !== record.pushOwnership.projectId;
  const link: PushCommandLink = {
    commandSessionId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePushRecord({
    ...record,
    pushCommandLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'COMMAND',
    summary: `Linked to command ${commandSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: commandSessionId,
  });

  return link;
}

export function getCommandForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushCommandLink.commandSessionId ?? null;
}

export function listPushRecordsByCommand(commandSessionId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter((r) => r.pushCommandLink.commandSessionId === commandSessionId);
}

export function detectPushCommandMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const command = getMobileCommandSession(record.pushCommandLink.commandSessionId);
  if (!command) return true;
  return (
    command.mobileCommandOwner.projectId !== record.pushOwnership.projectId ||
    record.pushCommandLink.mismatchDetected
  );
}
