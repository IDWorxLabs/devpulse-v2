/**
 * Upload System Authority — secure upload foundation orchestrator (V1).
 * No AI processing, OCR, or visual intelligence.
 */

import { randomUUID } from 'node:crypto';
import { evaluateUploadAcceptance } from './upload-acceptance-rules.js';
import { classifyUploadCandidate } from './upload-file-classifier.js';
import { recordUploadSessionEntry } from './upload-session-history.js';
import { validateUploadSecurity } from './upload-security-validator.js';
import { storeAcceptedUpload } from './upload-storage-authority.js';
import type {
  ProcessUploadInput,
  ProcessUploadResult,
  UploadSessionHistoryEntry,
  UploadSystemAssessment,
} from './upload-system-types.js';

let uploadCounter = 0;

export function resetUploadSystemCounterForTests(): void {
  uploadCounter = 0;
}

export function resetUploadSystemModuleForTests(): void {
  resetUploadSystemCounterForTests();
}

function nextUploadId(): string {
  uploadCounter += 1;
  return `upload-${uploadCounter}-${randomUUID().slice(0, 8)}`;
}

export function processUpload(input: ProcessUploadInput): ProcessUploadResult {
  const uploadId = nextUploadId();
  const classification = classifyUploadCandidate(input.candidate);
  const security = validateUploadSecurity(input.candidate);
  const acceptance = evaluateUploadAcceptance({ classification, security });

  let storedRecord = null;
  let stored = false;

  if (acceptance.verdict === 'UPLOAD_ACCEPTED' && !input.skipStorage) {
    storedRecord = storeAcceptedUpload({
      uploadId,
      acceptance,
      content: input.candidate.content ?? null,
    });
    stored = storedRecord != null;
  }

  if (!input.skipHistoryRecording) {
    const historyEntry: UploadSessionHistoryEntry = {
      uploadId,
      timestamp: new Date().toISOString(),
      filename: input.candidate.filename,
      fileType: classification.fileCategory,
      sizeBytes: input.candidate.sizeBytes,
      verdict: acceptance.verdict,
      rejectionReason: acceptance.rejectionReason,
    };
    recordUploadSessionEntry(historyEntry);
  }

  return {
    readOnly: true,
    uploadId,
    acceptance,
    stored,
    storedRecord,
  };
}

export function assessUpload(input: ProcessUploadInput = { candidate: { filename: '', mimeType: '', sizeBytes: 0 } }): UploadSystemAssessment {
  const result = processUpload(input);
  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'UPLOAD_SYSTEM_COMPLETE',
    result,
  };
}
