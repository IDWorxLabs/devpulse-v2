/**
 * Mobile Push Foundation — Project Vault bridge.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushProjectVaultLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToProjectVault(
  pushId: string,
  vaultProjectId: string,
): PushProjectVaultLink | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.getProject(vaultProjectId);
  const mismatch = !project || project.projectId !== record.pushOwnership.projectId;

  const link: PushProjectVaultLink = {
    vaultProjectId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePushRecord({
    ...record,
    pushProjectVaultLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'PROJECT_VAULT',
    summary: `Linked to project vault ${vaultProjectId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: vaultProjectId,
  });

  return link;
}

export function getProjectVaultForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushProjectVaultLink.vaultProjectId ?? null;
}

export function listPushRecordsByProjectVault(vaultProjectId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter(
    (r) => r.pushProjectVaultLink.vaultProjectId === vaultProjectId,
  );
}

export function detectPushProjectVaultMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.getProject(record.pushProjectVaultLink.vaultProjectId);
  if (!project) return true;
  return (
    project.projectId !== record.pushOwnership.projectId ||
    record.pushProjectVaultLink.mismatchDetected
  );
}
