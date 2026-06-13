/**
 * Upload System — public API (Universal Upload Foundation V1).
 */

export {
  UPLOAD_SYSTEM_PASS_TOKEN,
  UPLOAD_SYSTEM_OWNER_MODULE,
  UPLOAD_SYSTEM_PHASE,
  UPLOAD_SYSTEM_REPORT_TITLE,
  MAX_UPLOAD_SESSION_HISTORY,
  MAX_STORED_UPLOADS,
  MAX_UPLOAD_SIZE_BYTES,
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_DOCUMENT_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
  BLOCKED_EXTENSIONS,
  BLOCKED_MIME_TYPES,
  VALIDATION_RULES,
  SECURITY_CHECKS,
  SAFETY_GUARANTEES,
} from './upload-system-registry.js';

export type {
  UploadFileCategory,
  UploadVerdict,
  UploadRejectionReason,
  UploadCandidate,
  UploadClassification,
  UploadSecurityCheckResult,
  UploadAcceptanceResult,
  StoredUploadRecord,
  UploadSessionHistoryEntry,
  UploadSessionHistorySummary,
  UploadSystemReport,
  ProcessUploadInput,
  ProcessUploadResult,
  UploadSystemAssessment,
} from './upload-system-types.js';

export {
  resetUploadSessionHistoryForTests,
  recordUploadSessionEntry,
  getUploadSessionHistorySize,
  getUploadSessionHistory,
  buildUploadSessionHistorySummary,
} from './upload-session-history.js';

export {
  resetUploadStorageForTests,
  storeAcceptedUpload,
  getStoredUpload,
  getStoredUploadContent,
  getUploadStorageSize,
  listStoredUploads,
} from './upload-storage-authority.js';

export {
  processUpload,
  assessUpload,
  resetUploadSystemCounterForTests,
  resetUploadSystemModuleForTests,
} from './upload-system-authority.js';

export { buildUploadSystemReport, buildUploadSystemReportMarkdown } from './upload-report-builder.js';
export { classifyUploadCandidate } from './upload-file-classifier.js';
export { validateUploadSecurity } from './upload-security-validator.js';
export { evaluateUploadAcceptance } from './upload-acceptance-rules.js';
