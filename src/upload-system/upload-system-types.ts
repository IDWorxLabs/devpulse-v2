/**
 * Upload System — foundation types (V1).
 * Infrastructure only — no AI, OCR, or visual intelligence.
 */

export type UploadFileCategory = 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'UNKNOWN';

export type UploadVerdict = 'UPLOAD_ACCEPTED' | 'UPLOAD_REJECTED';

export type UploadRejectionReason =
  | 'UNSUPPORTED_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'INVALID_UPLOAD';

export interface UploadCandidate {
  readOnly?: false;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /** Optional content for empty-file and security checks. */
  content?: Buffer | Uint8Array | null;
}

export interface UploadClassification {
  readOnly: true;
  filename: string;
  normalizedExtension: string;
  mimeType: string;
  sizeBytes: number;
  fileCategory: UploadFileCategory;
  supported: boolean;
}

export interface UploadSecurityCheckResult {
  readOnly: true;
  passed: boolean;
  blockedExtension: boolean;
  blockedMimeType: boolean;
  executablePayload: boolean;
  emptyFile: boolean;
  securitySignals: string[];
}

export interface UploadAcceptanceResult {
  readOnly: true;
  eligible: boolean;
  verdict: UploadVerdict;
  rejectionReason: UploadRejectionReason | null;
  classification: UploadClassification;
  security: UploadSecurityCheckResult;
}

export interface StoredUploadRecord {
  readOnly: true;
  uploadId: string;
  storedAt: string;
  filename: string;
  normalizedExtension: string;
  mimeType: string;
  fileCategory: UploadFileCategory;
  sizeBytes: number;
  verdict: UploadVerdict;
  rejectionReason: UploadRejectionReason | null;
}

export interface UploadSessionHistoryEntry {
  uploadId: string;
  timestamp: string;
  filename: string;
  fileType: UploadFileCategory;
  sizeBytes: number;
  verdict: UploadVerdict;
  rejectionReason: UploadRejectionReason | null;
}

export interface UploadSessionHistorySummary {
  totalUploads: number;
  acceptedUploads: number;
  rejectedUploads: number;
  byCategory: Record<UploadFileCategory, number>;
}

export interface UploadSystemReport {
  readOnly: true;
  generatedAt: string;
  supportedFileTypes: readonly string[];
  validationRules: readonly string[];
  securityChecks: readonly string[];
  uploadVerdicts: {
    accepted: number;
    rejected: number;
  };
  historySummary: UploadSessionHistorySummary;
}

export interface ProcessUploadInput {
  candidate: UploadCandidate;
  skipHistoryRecording?: boolean;
  skipStorage?: boolean;
}

export interface ProcessUploadResult {
  readOnly: true;
  uploadId: string;
  acceptance: UploadAcceptanceResult;
  stored: boolean;
  storedRecord: StoredUploadRecord | null;
}

export interface UploadSystemAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'UPLOAD_SYSTEM_COMPLETE' | 'UPLOAD_SYSTEM_FAILED';
  result: ProcessUploadResult;
}
