/**
 * Upload System — constants and registry (V1).
 */

import type { UploadFileCategory } from './upload-system-types.js';

export const UPLOAD_SYSTEM_PASS_TOKEN = 'UPLOAD_SYSTEM_V1_PASS';
export const UPLOAD_SYSTEM_OWNER_MODULE = 'devpulse_upload_system_v1';
export const UPLOAD_SYSTEM_PHASE = 'Phase 26.22 — Universal Upload Foundation V1';
export const UPLOAD_SYSTEM_REPORT_TITLE = 'UPLOAD_SYSTEM_REPORT';
export const MAX_UPLOAD_SESSION_HISTORY = 32;
export const MAX_STORED_UPLOADS = 32;
export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB foundation limit

export const SUPPORTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;
export const SUPPORTED_DOCUMENT_EXTENSIONS = ['pdf', 'txt', 'docx'] as const;
export const SUPPORTED_VIDEO_EXTENSIONS = ['mp4', 'mov'] as const;

export const SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_IMAGE_EXTENSIONS,
  ...SUPPORTED_DOCUMENT_EXTENSIONS,
  ...SUPPORTED_VIDEO_EXTENSIONS,
] as const;

export const EXTENSION_TO_CATEGORY: Record<string, UploadFileCategory> = {
  png: 'IMAGE',
  jpg: 'IMAGE',
  jpeg: 'IMAGE',
  webp: 'IMAGE',
  pdf: 'DOCUMENT',
  txt: 'DOCUMENT',
  docx: 'DOCUMENT',
  mp4: 'VIDEO',
  mov: 'VIDEO',
};

export const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/quicktime',
] as const;

export const BLOCKED_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'msi',
  'dll',
  'js',
  'vbs',
  'ps1',
  'sh',
  'com',
  'scr',
  'jar',
] as const;

export const BLOCKED_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/javascript',
  'text/javascript',
  'application/x-sh',
  'application/x-bat',
  'application/vnd.microsoft.portable-executable',
] as const;

export const VALIDATION_RULES = [
  'Extension must match a supported foundation file type',
  'MIME type must align with supported upload categories',
  'File size must not exceed MAX_UPLOAD_SIZE_BYTES',
  'Empty files (0 bytes) are rejected',
  'Executable and script extensions are blocked',
  'Blocked MIME types are rejected regardless of extension',
] as const;

export const SECURITY_CHECKS = [
  'Extension blocklist enforcement (EXE, BAT, CMD, MSI, DLL, JS, etc.)',
  'MIME type blocklist enforcement',
  'Empty file rejection',
  'Double-extension and path traversal filename sanitization signals',
  'No AI processing, OCR, or visual intelligence in V1',
] as const;

export const SAFETY_GUARANTEES = [
  'Foundation infrastructure only — secure upload acceptance and storage metadata',
  'No OCR, screenshot analysis, voice transcription, or AI processing',
  'Bounded session history and stored upload records',
  'Read-only validation path available for evidence checks',
] as const;
