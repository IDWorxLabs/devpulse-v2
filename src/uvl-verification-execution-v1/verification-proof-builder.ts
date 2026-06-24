/**
 * UVL Verification Execution V1 — verification proof records.
 */

import type {
  VerificationCategoryResult,
  VerificationProofRecord,
} from './uvl-verification-execution-v1-types.js';

function stageStatus(passed: boolean, attempted: boolean): 'PASS' | 'FAIL' | 'SKIPPED' {
  if (!attempted) return 'SKIPPED';
  return passed ? 'PASS' : 'FAIL';
}

export function buildVerificationProofRecords(
  results: readonly VerificationCategoryResult[],
): readonly VerificationProofRecord[] {
  return results.map((result) => ({
    readOnly: true,
    category: result.profile,
    productName: result.productName,
    profile: result.profile,
    workspacePath: result.workspacePath,
    previewUrl: result.verificationProof.previewUrl,
    runtimeResult: stageStatus(
      result.verificationProof.runtimeValidation,
      result.workspacePath !== null,
    ),
    featureResult: stageStatus(result.verificationProof.featureValidation, result.metrics.buildSuccess),
    blueprintResult: stageStatus(
      result.verificationProof.blueprintValidation,
      result.metrics.buildSuccess,
    ),
    engineeringResult: stageStatus(
      result.verificationProof.engineeringValidation,
      result.metrics.buildSuccess,
    ),
    navigationResult: stageStatus(
      result.verificationProof.navigationValidation,
      result.metrics.previewSuccess,
    ),
    verificationVerdict: result.verificationProof.verificationVerdict,
    proofComplete: result.verificationProof.proofComplete,
  }));
}
