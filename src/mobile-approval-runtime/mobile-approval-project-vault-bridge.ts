/**
 * Mobile Approval Runtime Foundation — Project Vault bridge.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getStoredMobileApprovalSession, listStoredMobileApprovalSessions, storeMobileApprovalSession } from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalSession, MobileApprovalProjectVaultLink } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

export function linkMobileApprovalToProjectVault(
  mobileApprovalId: string,
  vaultProjectId: string,
): MobileApprovalProjectVaultLink | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return null;

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.listProjects().find((p) => p.projectId === vaultProjectId);
  const mismatch = !project || project.projectId !== session.mobileApprovalOwner.projectId;

  const link: MobileApprovalProjectVaultLink = {
    vaultProjectId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileApprovalSession({
    ...session,
    mobileApprovalProjectVaultLink: link,
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'PROJECT_VAULT',
    summary: `Linked to project vault ${vaultProjectId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: vaultProjectId,
  });

  return link;
}

export function getProjectVaultForMobileApproval(mobileApprovalId: string): string | null {
  return getStoredMobileApprovalSession(mobileApprovalId)?.mobileApprovalProjectVaultLink.vaultProjectId ?? null;
}

export function listMobileApprovalsByProjectVault(vaultProjectId: string): MobileApprovalSession[] {
  return listStoredMobileApprovalSessions().filter(
    (s) =>
      s.mobileApprovalProjectVaultLink.vaultProjectId === vaultProjectId ||
      s.mobileApprovalOwner.projectId === vaultProjectId,
  );
}

export function detectMobileApprovalProjectVaultMismatch(mobileApprovalId: string): boolean {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return true;
  return session.mobileApprovalProjectVaultLink.mismatchDetected;
}
