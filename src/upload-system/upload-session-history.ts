/**
 * Upload session history — bounded upload verdict history.
 */

import { MAX_UPLOAD_SESSION_HISTORY } from './upload-system-registry.js';
import type {
  UploadSessionHistoryEntry,
  UploadSessionHistorySummary,
  UploadFileCategory,
} from './upload-system-types.js';

const history: UploadSessionHistoryEntry[] = [];

export function resetUploadSessionHistoryForTests(): void {
  history.length = 0;
}

export function recordUploadSessionEntry(entry: UploadSessionHistoryEntry): void {
  history.unshift(entry);
  if (history.length > MAX_UPLOAD_SESSION_HISTORY) {
    history.length = MAX_UPLOAD_SESSION_HISTORY;
  }
}

export function getUploadSessionHistorySize(): number {
  return history.length;
}

export function getUploadSessionHistory(): readonly UploadSessionHistoryEntry[] {
  return [...history];
}

export function buildUploadSessionHistorySummary(
  entries: readonly UploadSessionHistoryEntry[] = history,
): UploadSessionHistorySummary {
  const byCategory: Record<UploadFileCategory, number> = {
    IMAGE: 0,
    DOCUMENT: 0,
    VIDEO: 0,
    UNKNOWN: 0,
  };

  for (const entry of entries) {
    byCategory[entry.fileType] += 1;
  }

  return {
    totalUploads: entries.length,
    acceptedUploads: entries.filter((e) => e.verdict === 'UPLOAD_ACCEPTED').length,
    rejectedUploads: entries.filter((e) => e.verdict === 'UPLOAD_REJECTED').length,
    byCategory,
  };
}
