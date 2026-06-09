/**
 * Mobile Push Foundation — Mobile Approval bridge.
 */

import { getMobileApprovalSession } from '../mobile-approval-runtime/index.js';
import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushApprovalLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToApproval(
  pushId: string,
  approvalId: string,
): PushApprovalLink | null {
  const record = getStoredPushRecord(pushId);
  const approval = getMobileApprovalSession(approvalId);
  if (!record || !approval) return null;

  const mismatch = approval.mobileApprovalOwner.projectId !== record.pushOwnership.projectId;
  const link: PushApprovalLink = {
    approvalId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePushRecord({
    ...record,
    pushApprovalLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'APPROVAL',
    summary: `Linked to approval ${approvalId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: approvalId,
  });

  return link;
}

export function getApprovalForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushApprovalLink.approvalId ?? null;
}

export function listPushRecordsByApproval(approvalId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter((r) => r.pushApprovalLink.approvalId === approvalId);
}

export function detectPushApprovalMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const approval = getMobileApprovalSession(record.pushApprovalLink.approvalId);
  if (!approval) return true;
  return (
    approval.mobileApprovalOwner.projectId !== record.pushOwnership.projectId ||
    record.pushApprovalLink.mismatchDetected
  );
}
