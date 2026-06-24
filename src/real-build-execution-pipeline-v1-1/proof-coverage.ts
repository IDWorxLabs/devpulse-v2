/**
 * Real Build Execution Pipeline V1.1 — proof coverage report.
 */

import type { RealBuildCategoryResult } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';
import { MIN_FULL_PROOF_CATEGORIES } from './real-build-execution-pipeline-v11-bounds.js';
import type { ProofCoverageReport } from './real-build-execution-pipeline-v11-types.js';

export function buildProofCoverageReport(
  results: readonly RealBuildCategoryResult[],
): ProofCoverageReport {
  const required = MIN_FULL_PROOF_CATEGORIES;
  const fullProof = results.filter((r) => r.executionProof.proofComplete);
  const built = results.filter((r) => r.metrics.buildSuccess);
  const previewed = results.filter((r) => r.metrics.previewSuccess);
  const verified = results.filter((r) => r.metrics.verificationSuccess);
  const reviewed = results.filter((r) => r.stageResults?.paiPassed);
  const aflaVerdicts = results.filter((r) => r.stageResults?.aflaVerdictIssued);

  return {
    readOnly: true,
    categoriesRequired: required,
    categoriesWithFullProof: fullProof.length,
    proofCoveragePercent:
      required === 0 ? 0 : Math.round((fullProof.length / required) * 100),
    builtCount: built.length,
    previewedCount: previewed.length,
    verifiedCount: verified.length,
    reviewedCount: reviewed.length,
    aflaVerdictCount: aflaVerdicts.length,
  };
}
