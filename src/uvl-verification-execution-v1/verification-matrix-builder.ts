/**
 * UVL Verification Execution V1 — verification matrix.
 */

import type {
  VerificationCategoryResult,
  VerificationMatrixEntry,
} from './uvl-verification-execution-v1-types.js';

export function buildVerificationMatrix(
  results: readonly VerificationCategoryResult[],
): readonly VerificationMatrixEntry[] {
  return results.map((result) => ({
    readOnly: true,
    profile: result.profile,
    productName: result.productName,
    built: result.metrics.buildSuccess,
    previewed: result.metrics.previewSuccess,
    verified: result.verified,
    verificationConfidence: result.metrics.verificationConfidence,
    failureClass: result.failureClass,
  }));
}

export function formatVerificationMatrixText(matrix: readonly VerificationMatrixEntry[]): string {
  const lines = ['Verification Matrix', '=================', ''];
  for (const entry of matrix) {
    lines.push(
      `${entry.productName.padEnd(28)} built=${entry.built ? 'Y' : 'N'} preview=${entry.previewed ? 'Y' : 'N'} verified=${entry.verified ? 'Y' : 'N'} conf=${entry.verificationConfidence}`,
    );
  }
  return lines.join('\n');
}
