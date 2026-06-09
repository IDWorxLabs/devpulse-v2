/**
 * Mobile Approval Runtime Foundation — World2 metadata bridge.
 */

import { readSystemSummariesForMobileApproval } from './mobile-approval-read-cache.js';
import { getStoredMobileApprovalSession, listStoredMobileApprovalSessions, storeMobileApprovalSession } from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalSession, MobileApprovalWorld2Link } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

function listWorld2SystemSummaries(): ReturnType<typeof readSystemSummariesForMobileApproval> {
  return readSystemSummariesForMobileApproval().filter((s) => s.systemId.includes('world2'));
}

export function validateWorld2OperationId(world2OperationId: string): boolean {
  if (!world2OperationId) return false;
  return listWorld2SystemSummaries().some(
    (s) => s.systemId.includes(world2OperationId) || s.summary.includes(world2OperationId),
  );
}

export function linkMobileApprovalToWorld2Operation(
  mobileApprovalId: string,
  world2OperationId: string,
): MobileApprovalWorld2Link | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return null;

  const exists = validateWorld2OperationId(world2OperationId);
  const link: MobileApprovalWorld2Link = {
    world2OperationId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !exists,
  };

  storeMobileApprovalSession({
    ...session,
    mobileApprovalWorld2Link: link,
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'WORLD2',
    summary: `Linked to world2 operation ${world2OperationId}${link.mismatchDetected ? ' — MISMATCH' : ''}`,
    scopeUsed: world2OperationId,
  });

  return link;
}

export function getWorld2OperationForMobileApproval(mobileApprovalId: string): string | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  const operationId = session?.mobileApprovalWorld2Link.world2OperationId;
  return operationId && operationId.length > 0 ? operationId : null;
}

export function listMobileApprovalsByWorld2Operation(world2OperationId: string): MobileApprovalSession[] {
  return listStoredMobileApprovalSessions().filter(
    (s) => s.mobileApprovalWorld2Link.world2OperationId === world2OperationId,
  );
}

export function detectMobileApprovalWorld2Mismatch(mobileApprovalId: string): boolean {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return true;
  const operationId = session.mobileApprovalWorld2Link.world2OperationId;
  if (!operationId) return true;
  return session.mobileApprovalWorld2Link.mismatchDetected || !validateWorld2OperationId(operationId);
}

export function resolveWorld2ForMobileApprovalRegistration(
  world2OperationId: string,
): { exists: boolean; projectId: string | null } {
  return { exists: validateWorld2OperationId(world2OperationId), projectId: null };
}
