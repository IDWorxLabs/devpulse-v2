/**
 * Upload storage authority — in-memory bounded storage for accepted uploads (V1).
 */

import { MAX_STORED_UPLOADS } from './upload-system-registry.js';
import type { StoredUploadRecord, UploadAcceptanceResult } from './upload-system-types.js';

interface StoredUploadEntry {
  record: StoredUploadRecord;
  content: Buffer | null;
}

const storage = new Map<string, StoredUploadEntry>();
const storageOrder: string[] = [];

export function resetUploadStorageForTests(): void {
  storage.clear();
  storageOrder.length = 0;
}

export function storeAcceptedUpload(input: {
  uploadId: string;
  acceptance: UploadAcceptanceResult;
  content?: Buffer | Uint8Array | null;
}): StoredUploadRecord | null {
  if (input.acceptance.verdict !== 'UPLOAD_ACCEPTED') return null;

  const record: StoredUploadRecord = {
    readOnly: true,
    uploadId: input.uploadId,
    storedAt: new Date().toISOString(),
    filename: input.acceptance.classification.filename,
    normalizedExtension: input.acceptance.classification.normalizedExtension,
    mimeType: input.acceptance.classification.mimeType,
    fileCategory: input.acceptance.classification.fileCategory,
    sizeBytes: input.acceptance.classification.sizeBytes,
    verdict: input.acceptance.verdict,
    rejectionReason: null,
  };

  const contentBuffer =
    input.content != null
      ? input.content instanceof Buffer
        ? input.content
        : Buffer.from(input.content)
      : null;

  storage.set(input.uploadId, { record, content: contentBuffer });
  storageOrder.unshift(input.uploadId);

  while (storageOrder.length > MAX_STORED_UPLOADS) {
    const evictId = storageOrder.pop();
    if (evictId) storage.delete(evictId);
  }

  return record;
}

export function getStoredUpload(uploadId: string): StoredUploadRecord | null {
  return storage.get(uploadId)?.record ?? null;
}

export function getStoredUploadContent(uploadId: string): Buffer | null {
  const entry = storage.get(uploadId);
  if (!entry?.content) return null;
  return entry.content;
}

export function getUploadStorageSize(): number {
  return storageOrder.length;
}

export function listStoredUploads(): readonly StoredUploadRecord[] {
  return storageOrder.map((id) => storage.get(id)!.record);
}
