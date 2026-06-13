/**
 * Upload acceptance rules — eligibility from classification and security.
 */

import { MAX_UPLOAD_SIZE_BYTES, SUPPORTED_EXTENSIONS } from './upload-system-registry.js';
import type {
  UploadAcceptanceResult,
  UploadClassification,
  UploadRejectionReason,
  UploadSecurityCheckResult,
  UploadVerdict,
} from './upload-system-types.js';

export function evaluateUploadAcceptance(input: {
  classification: UploadClassification;
  security: UploadSecurityCheckResult;
}): UploadAcceptanceResult {
  let verdict: UploadVerdict = 'UPLOAD_ACCEPTED';
  let rejectionReason: UploadRejectionReason | null = null;

  if (input.security.emptyFile) {
    verdict = 'UPLOAD_REJECTED';
    rejectionReason = 'EMPTY_FILE';
  } else if (
    input.security.blockedExtension ||
    input.security.blockedMimeType ||
    input.security.executablePayload
  ) {
    verdict = 'UPLOAD_REJECTED';
    rejectionReason = 'INVALID_UPLOAD';
  } else if (input.classification.sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    verdict = 'UPLOAD_REJECTED';
    rejectionReason = 'FILE_TOO_LARGE';
  } else if (
    !input.classification.supported ||
    input.classification.fileCategory === 'UNKNOWN' ||
    !SUPPORTED_EXTENSIONS.includes(
      input.classification.normalizedExtension as (typeof SUPPORTED_EXTENSIONS)[number],
    )
  ) {
    verdict = 'UPLOAD_REJECTED';
    rejectionReason = 'UNSUPPORTED_FILE_TYPE';
  }

  return {
    readOnly: true,
    eligible: verdict === 'UPLOAD_ACCEPTED',
    verdict,
    rejectionReason,
    classification: input.classification,
    security: input.security,
  };
}
