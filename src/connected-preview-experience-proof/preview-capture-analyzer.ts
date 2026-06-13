/**
 * Preview Capture Analyzer — verify preview evidence captures exist.
 */

import type {
  PreviewCaptureAssessment,
  PreviewCaptureState,
  PreviewSessionEvidence,
} from './connected-preview-experience-proof-types.js';

export function analyzePreviewCapture(input: {
  sessionEvidence?: PreviewSessionEvidence;
}): PreviewCaptureAssessment {
  const paths = [
    ...(input.sessionEvidence?.capturePaths ?? []),
    ...(input.sessionEvidence?.renderCapturePath
      ? [input.sessionEvidence.renderCapturePath]
      : []),
  ];
  const uniquePaths = [...new Set(paths)];

  if (uniquePaths.length === 0) {
    return {
      readOnly: true,
      captureState: 'NOT_CAPTURED',
      captureObserved: false,
      captureCount: 0,
      capturePaths: [],
      confidence: 0,
    };
  }

  const captureState: PreviewCaptureState =
    uniquePaths.length >= 2 ? 'CAPTURED' : 'PARTIAL';

  return {
    readOnly: true,
    captureState,
    captureObserved: true,
    captureCount: uniquePaths.length,
    capturePaths: uniquePaths,
    confidence: captureState === 'CAPTURED' ? 85 : 55,
  };
}
