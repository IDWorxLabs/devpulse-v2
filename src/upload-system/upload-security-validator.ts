/**
 * Upload security validator — block executables and dangerous payloads.
 */

import { BLOCKED_EXTENSIONS, BLOCKED_MIME_TYPES } from './upload-system-registry.js';
import type { UploadCandidate, UploadSecurityCheckResult } from './upload-system-types.js';

const EXECUTABLE_SIGNATURES: readonly number[][] = [
  [0x4d, 0x5a], // MZ (Windows PE)
  [0x7f, 0x45, 0x4c, 0x46], // ELF
];

function getExtension(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const parts = base.toLowerCase().split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1] ?? '';
}

function hasBlockedExtension(filename: string): boolean {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const lower = base.toLowerCase();
  const segments = lower.split('.');

  for (const segment of segments) {
    if (BLOCKED_EXTENSIONS.includes(segment as (typeof BLOCKED_EXTENSIONS)[number])) {
      return true;
    }
  }

  const ext = getExtension(filename);
  return BLOCKED_EXTENSIONS.includes(ext as (typeof BLOCKED_EXTENSIONS)[number]);
}

function hasBlockedMime(mimeType: string): boolean {
  const normalized = mimeType.trim().toLowerCase().split(';')[0]?.trim() ?? '';
  return BLOCKED_MIME_TYPES.includes(normalized as (typeof BLOCKED_MIME_TYPES)[number]);
}

function detectExecutablePayload(content: Buffer | Uint8Array | null | undefined): boolean {
  if (!content || content.length < 2) return false;
  const bytes = content instanceof Buffer ? content : Buffer.from(content);
  return EXECUTABLE_SIGNATURES.some((sig) => sig.every((byte, i) => bytes[i] === byte));
}

function hasPathTraversal(filename: string): boolean {
  return filename.includes('..') || filename.includes('\0');
}

export function validateUploadSecurity(candidate: UploadCandidate): UploadSecurityCheckResult {
  const securitySignals: string[] = [];
  const content =
    candidate.content ??
    (candidate.sizeBytes > 0 ? Buffer.alloc(Math.min(candidate.sizeBytes, 4)) : null);

  const emptyFile =
    candidate.sizeBytes === 0 || (candidate.content != null && candidate.content.length === 0);

  const blockedExtension = hasBlockedExtension(candidate.filename);
  const blockedMimeType = hasBlockedMime(candidate.mimeType);
  const executablePayload = detectExecutablePayload(
    candidate.content ?? (emptyFile ? null : content),
  );

  if (blockedExtension) securitySignals.push('Blocked extension detected');
  if (blockedMimeType) securitySignals.push('Blocked MIME type detected');
  if (executablePayload) securitySignals.push('Executable payload signature detected');
  if (emptyFile) securitySignals.push('Empty file detected');
  if (hasPathTraversal(candidate.filename)) securitySignals.push('Path traversal in filename');

  const passed = !blockedExtension && !blockedMimeType && !executablePayload && !emptyFile;

  return {
    readOnly: true,
    passed,
    blockedExtension,
    blockedMimeType,
    executablePayload,
    emptyFile,
    securitySignals,
  };
}
