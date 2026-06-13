/**
 * Upload file classifier — extension, MIME, category, and size.
 */

import {
  EXTENSION_TO_CATEGORY,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
} from './upload-system-registry.js';
import type { UploadCandidate, UploadClassification, UploadFileCategory } from './upload-system-types.js';

function normalizeExtension(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const parts = base.toLowerCase().split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1] ?? '';
}

function normalizeMime(mimeType: string): string {
  return mimeType.trim().toLowerCase().split(';')[0]?.trim() ?? '';
}

export function classifyUploadCandidate(candidate: UploadCandidate): UploadClassification {
  const normalizedExtension = normalizeExtension(candidate.filename);
  const mimeType = normalizeMime(candidate.mimeType);
  const fileCategory: UploadFileCategory =
    EXTENSION_TO_CATEGORY[normalizedExtension] ?? 'UNKNOWN';

  const extensionSupported = SUPPORTED_EXTENSIONS.includes(
    normalizedExtension as (typeof SUPPORTED_EXTENSIONS)[number],
  );
  const mimeSupported = SUPPORTED_MIME_TYPES.includes(
    mimeType as (typeof SUPPORTED_MIME_TYPES)[number],
  );

  const supported =
    extensionSupported &&
    mimeSupported &&
    fileCategory !== 'UNKNOWN' &&
    normalizedExtension.length > 0;

  return {
    readOnly: true,
    filename: candidate.filename,
    normalizedExtension,
    mimeType,
    sizeBytes: candidate.sizeBytes,
    fileCategory,
    supported,
  };
}
