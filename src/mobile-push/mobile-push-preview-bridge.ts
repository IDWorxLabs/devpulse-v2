/**
 * Mobile Push Foundation — Mobile Preview bridge.
 */

import { getMobilePreviewSession } from '../mobile-preview-runtime/index.js';
import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushPreviewLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToPreview(
  pushId: string,
  previewId: string,
): PushPreviewLink | null {
  const record = getStoredPushRecord(pushId);
  const preview = getMobilePreviewSession(previewId);
  if (!record || !preview) return null;

  const mismatch = preview.mobilePreviewOwner.projectId !== record.pushOwnership.projectId;
  const link: PushPreviewLink = {
    previewId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePushRecord({
    ...record,
    pushPreviewLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'PREVIEW',
    summary: `Linked to preview ${previewId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: previewId,
  });

  return link;
}

export function getPreviewForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushPreviewLink.previewId ?? null;
}

export function listPushRecordsByPreview(previewId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter((r) => r.pushPreviewLink.previewId === previewId);
}

export function detectPushPreviewMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const preview = getMobilePreviewSession(record.pushPreviewLink.previewId);
  if (!preview) return true;
  return (
    preview.mobilePreviewOwner.projectId !== record.pushOwnership.projectId ||
    record.pushPreviewLink.mismatchDetected
  );
}
