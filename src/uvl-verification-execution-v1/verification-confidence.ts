/**
 * UVL Verification Execution V1 — verification confidence model.
 */

import type {
  VerificationCategoryResult,
  VerificationConfidenceReport,
  VerificationCoverageReport,
} from './uvl-verification-execution-v1-types.js';
import { MIN_VERIFICATION_CONFIDENCE_SCORE } from './uvl-verification-execution-v1-bounds.js';
import type { WorkspaceValidationResults } from './workspace-verification-checks.js';

export function computeCategoryVerificationConfidence(input: {
  checks: WorkspaceValidationResults;
  executionSucceeded: boolean;
  verified: boolean;
}): number {
  if (!input.checks.buildSuccess) return 0;
  let score = 20;
  if (input.checks.previewLoads) score += 15;
  if (input.checks.navigationWorks) score += 10;
  if (input.checks.coreFeatureWorks) score += 10;
  if (input.checks.blueprintValidationPasses) score += 15;
  if (input.checks.featureRealityPasses) score += 15;
  if (input.checks.engineeringRealityPasses) score += 10;
  if (input.executionSucceeded) score += 10;
  if (input.verified) score = Math.max(score, MIN_VERIFICATION_CONFIDENCE_SCORE);
  return Math.min(100, score);
}

export function buildVerificationConfidenceReport(input: {
  results: readonly VerificationCategoryResult[];
  coverage: VerificationCoverageReport;
  failureDistribution: readonly { failureClass: string; count: number }[];
}): VerificationConfidenceReport {
  const verified = input.results.filter((r) => r.verified);
  const avgConfidence =
    input.results.length > 0
      ? Math.round(
          input.results.reduce((sum, r) => sum + r.metrics.verificationConfidence, 0) /
            input.results.length,
        )
      : 0;

  const coverageWeight = input.coverage.verificationCoveragePercent;
  const runtimeEvidenceWeight = Math.round(
    (verified.filter((r) => r.verificationProof.runtimeValidation).length /
      Math.max(1, input.results.length)) *
      100,
  );
  const failureCount = input.failureDistribution.reduce((sum, f) => sum + f.count, 0);
  const failureDistributionPenalty = Math.min(40, failureCount * 5);
  const consistencyWeight = Math.round(
    (verified.length / Math.max(1, input.results.length)) * 100,
  );

  const verificationConfidenceScore = Math.max(
    0,
    Math.round(
      coverageWeight * 0.35 +
        runtimeEvidenceWeight * 0.25 +
        consistencyWeight * 0.25 +
        avgConfidence * 0.15 -
        failureDistributionPenalty * 0.1,
    ),
  );

  const verificationProofStatus: VerificationConfidenceReport['verificationProofStatus'] =
    input.coverage.verificationCoveragePercent >= 100 &&
    verified.length === input.coverage.categoriesRequired
      ? 'PROVEN'
      : verified.length > 0
        ? 'PARTIAL'
        : 'NOT_PROVEN';

  return {
    readOnly: true,
    verificationConfidenceScore,
    coverageWeight,
    runtimeEvidenceWeight,
    failureDistributionPenalty,
    consistencyWeight,
    verificationProofStatus,
  };
}
