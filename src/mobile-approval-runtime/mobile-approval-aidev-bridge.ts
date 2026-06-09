/**
 * Mobile Approval Runtime Foundation — AiDev metadata bridge.
 */

import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import { getStoredMobileApprovalSession, listStoredMobileApprovalSessions, storeMobileApprovalSession } from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalSession, MobileApprovalAiDevLink } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

export function validateAiDevOperationId(aidevOperationId: string): boolean {
  if (!aidevOperationId) return false;
  const summary = getLatestAiDevSummary();
  if (!summary) return false;
  return summary.requestId === aidevOperationId || summary.summary.includes(aidevOperationId);
}

export function linkMobileApprovalToAiDevOperation(
  mobileApprovalId: string,
  aidevOperationId: string,
): MobileApprovalAiDevLink | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return null;

  const exists = validateAiDevOperationId(aidevOperationId);
  const link: MobileApprovalAiDevLink = {
    aidevOperationId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !exists,
  };

  storeMobileApprovalSession({
    ...session,
    mobileApprovalAiDevLink: link,
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'AIDEV',
    summary: `Linked to aidev operation ${aidevOperationId}${link.mismatchDetected ? ' — MISMATCH' : ''}`,
    scopeUsed: aidevOperationId,
  });

  return link;
}

export function getAiDevOperationForMobileApproval(mobileApprovalId: string): string | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  const operationId = session?.mobileApprovalAiDevLink.aidevOperationId;
  return operationId && operationId.length > 0 ? operationId : null;
}

export function listMobileApprovalsByAiDevOperation(aidevOperationId: string): MobileApprovalSession[] {
  return listStoredMobileApprovalSessions().filter(
    (s) => s.mobileApprovalAiDevLink.aidevOperationId === aidevOperationId,
  );
}

export function detectMobileApprovalAiDevMismatch(mobileApprovalId: string): boolean {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return true;
  const operationId = session.mobileApprovalAiDevLink.aidevOperationId;
  if (!operationId) return true;
  return session.mobileApprovalAiDevLink.mismatchDetected || !validateAiDevOperationId(operationId);
}

export function resolveAiDevForMobileApprovalRegistration(
  aidevOperationId: string,
): { exists: boolean; projectId: string | null } {
  return { exists: validateAiDevOperationId(aidevOperationId), projectId: null };
}
