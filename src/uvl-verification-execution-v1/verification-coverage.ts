/**
 * UVL Verification Execution V1 — coverage metrics.
 */

import { MIN_VERIFIED_CATEGORIES } from './uvl-verification-execution-v1-bounds.js';
import type {
  VerificationCategoryResult,
  VerificationCoverageReport,
} from './uvl-verification-execution-v1-types.js';

export function buildVerificationCoverageReport(
  results: readonly VerificationCategoryResult[],
): VerificationCoverageReport {
  const required: number = MIN_VERIFIED_CATEGORIES;
  const verified = results.filter((r) => r.verified);
  const failed = results.filter((r) => !r.verified && r.workspacePath !== null);
  const skipped = results.filter((r) => r.workspacePath === null);
  const built = results.filter((r) => r.metrics.buildSuccess);
  const previewed = results.filter((r) => r.metrics.previewSuccess);

  return {
    readOnly: true,
    categoriesRequired: required,
    verifiedCount: verified.length,
    failedCount: failed.length,
    skippedCount: skipped.length,
    verificationCoveragePercent:
      required === 0 ? 0 : Math.round((verified.length / required) * 100),
    builtCount: built.length,
    previewedCount: previewed.length,
  };
}
