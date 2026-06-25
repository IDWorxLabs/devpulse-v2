/**
 * UVL Maturity & Verification Hub V1 — assessment orchestrator.
 * Single source of truth for verification health, coverage, confidence, and readiness.
 */

import {
  VERIFICATION_COVERAGE_THRESHOLD,
  VERIFICATION_CONFIDENCE_THRESHOLD,
} from './uvl-maturity-bounds.js';
import { recordUvlMaturityAssessment } from './uvl-maturity-history.js';
import { resolveUvlSuiteApp } from './uvl-maturity-suite-registry.js';
import type { AssessUvlMaturityInput, UvlMaturityAssessment } from './uvl-maturity-types.js';
import {
  buildVerificationCoverageAssessment,
  computeOverallCoveragePercent,
} from './uvl-verification-coverage-assessor.js';
import { detectVerificationGaps } from './uvl-verification-gap-detector.js';
import {
  computeVerificationConfidencePenalty,
  computeVerificationConfidenceScore,
} from './uvl-verification-confidence.js';

export function assessUvlMaturity(input: AssessUvlMaturityInput = {}): UvlMaturityAssessment {
  const suiteApp = resolveUvlSuiteApp(input.profile);
  const productPrompt = input.productPrompt ?? suiteApp.prompt;

  const { categoryCoverage, timeline } = buildVerificationCoverageAssessment({
    productPrompt,
    projectRootDir: input.projectRootDir ?? null,
    workspaceDir: input.workspaceDir ?? null,
    buildProofHandoff: input.buildProofHandoff ?? null,
  });

  const verificationGapReport = detectVerificationGaps({ categoryCoverage, timeline });
  const overallCoveragePercent = computeOverallCoveragePercent(categoryCoverage);
  const verificationConfidenceScore = computeVerificationConfidenceScore({
    productPrompt,
    categoryCoverage,
  });
  const verificationConfidencePenalty = computeVerificationConfidencePenalty(verificationConfidenceScore);

  const verificationSufficientForLaunch =
    overallCoveragePercent >= VERIFICATION_COVERAGE_THRESHOLD &&
    verificationConfidenceScore >= VERIFICATION_CONFIDENCE_THRESHOLD &&
    verificationGapReport.criticalGapCount === 0;

  const incompleteVerification =
    !verificationSufficientForLaunch ||
    verificationGapReport.gaps.length > 0 ||
    overallCoveragePercent < VERIFICATION_COVERAGE_THRESHOLD;

  const assessment: UvlMaturityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Unified Verification Lab',
    profile: suiteApp.profile,
    productName: suiteApp.productName,
    productPrompt,
    overallCoveragePercent,
    verificationConfidenceScore,
    categoryCoverage,
    missingVerificationAreas: verificationGapReport.missingVerificationAreas,
    verificationGapReport,
    timeline,
    verificationSufficientForLaunch,
    incompleteVerification,
    verificationConfidencePenalty,
    generatedAt: new Date().toISOString(),
  };

  recordUvlMaturityAssessment(assessment);
  return assessment;
}

export function isVerificationSufficientForLaunch(input?: AssessUvlMaturityInput): boolean {
  return assessUvlMaturity(input).verificationSufficientForLaunch;
}
