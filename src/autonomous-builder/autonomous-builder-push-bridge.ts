/**
 * Autonomous Builder Foundation — Mobile Push bridge (primary upstream).
 */

import { getPushRecord, listPushRecordsAll } from '../mobile-push/index.js';
import {
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildSession, AutonomousBuildPushLink } from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

export function linkAutonomousBuildToPush(
  autonomousBuildId: string,
  pushId: string,
): AutonomousBuildPushLink | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  const push = getPushRecord(pushId);
  if (!record || !push) return null;

  const mismatch =
    push.pushOwnership.projectId !== record.buildOwnership.projectId ||
    record.buildOwnership.pushId !== pushId;

  const link: AutonomousBuildPushLink = {
    pushId,
    linkedAt: Date.now(),
    linkAuthority: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeAutonomousBuildRecord({
    ...record,
    pushId,
    buildOwnership: { ...record.buildOwnership, pushId },
    buildPushLink: link,
    updatedAt: Date.now(),
  });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'PUSH',
    summary: `Linked to push ${pushId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: pushId,
  });

  return link;
}

export function getPushForAutonomousBuild(autonomousBuildId: string): string | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildPushLink.pushId ?? null;
}

export function listAutonomousBuildsByPush(pushId: string): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords().filter((r) => r.buildPushLink.pushId === pushId);
}

export function detectAutonomousBuildPushMismatch(autonomousBuildId: string): boolean {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return true;
  const push = getPushRecord(record.buildPushLink.pushId);
  if (!push) return true;
  return (
    push.pushOwnership.projectId !== record.buildOwnership.projectId ||
    record.buildPushLink.mismatchDetected
  );
}

export function resolvePushForAutonomousBuildRegistration(
  pushId: string,
): { exists: boolean; projectId: string | null; deliveryId: string | null; notificationId: string | null; inboxEntryId: string | null } {
  const push = getPushRecord(pushId);
  if (!push) return { exists: false, projectId: null, deliveryId: null, notificationId: null, inboxEntryId: null };
  return {
    exists: true,
    projectId: push.pushOwnership.projectId,
    deliveryId: push.deliveryId,
    notificationId: push.notificationId,
    inboxEntryId: push.inboxEntryId,
  };
}

export function findPushByName(pushName: string): string | null {
  const match = listPushRecordsAll().find((p) => p.pushMetadata.pushName === pushName);
  return match?.pushId ?? null;
}
