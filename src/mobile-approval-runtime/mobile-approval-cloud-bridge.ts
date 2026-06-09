/**
 * Mobile Approval Runtime Foundation — Cloud Runtime bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import { getStoredMobileApprovalSession, listStoredMobileApprovalSessions, storeMobileApprovalSession } from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalSession, MobileApprovalCloudLink } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

export function linkMobileApprovalToCloud(mobileApprovalId: string, runtimeId: string): MobileApprovalCloudLink | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  const runtime = getRuntime(runtimeId);
  if (!session || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== session.mobileApprovalOwner.projectId;
  const link: MobileApprovalCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileApprovalSession({
    ...session,
    mobileApprovalCloudLink: link,
    mobileApprovalOwner: { ...session.mobileApprovalOwner, runtimeId },
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'RUNTIME',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForMobileApproval(mobileApprovalId: string): string | null {
  return getStoredMobileApprovalSession(mobileApprovalId)?.mobileApprovalCloudLink.runtimeId ?? null;
}

export function listMobileApprovalsByRuntime(runtimeId: string): MobileApprovalSession[] {
  return listStoredMobileApprovalSessions().filter(
    (s) => s.mobileApprovalCloudLink.runtimeId === runtimeId || s.mobileApprovalOwner.runtimeId === runtimeId,
  );
}

export function detectMobileApprovalCloudMismatch(mobileApprovalId: string): boolean {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return true;
  const runtime = getRuntime(session.mobileApprovalCloudLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== session.mobileApprovalOwner.projectId ||
    session.mobileApprovalCloudLink.mismatchDetected
  );
}

export function resolveRuntimeForMobileApprovalRegistration(
  runtimeId: string,
): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}
