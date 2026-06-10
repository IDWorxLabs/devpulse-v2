/**
 * Founder Trust Validation — trust gap analyzer.
 */

import type {
  TruthfulnessValidation,
  TransparencyValidation,
  VerificationIntegrityValidation,
  GovernanceComplianceValidation,
  ExecutionPredictabilityValidation,
  EvidenceVisibilityValidation,
  RollbackConfidenceValidation,
  SafetyBoundaryValidation,
  TrustGap,
  TrustGapAnalysis,
} from './founder-trust-types.js';
import { TRUST_GAP_ANALYSIS_PASS, MAX_TRUST_GAPS } from './founder-trust-types.js';
import { mergeBoundedGaps } from './trust-gap-model.js';
import { getCachedTrustGapAnalysis, setCachedTrustGapAnalysis } from './founder-trust-cache.js';

export interface ValidatorGapInputs {
  truthfulness: TruthfulnessValidation;
  transparency: TransparencyValidation;
  verificationIntegrity: VerificationIntegrityValidation;
  governanceCompliance: GovernanceComplianceValidation;
  executionPredictability: ExecutionPredictabilityValidation;
  evidenceVisibility: EvidenceVisibilityValidation;
  rollbackConfidence: RollbackConfidenceValidation;
  safetyBoundaries: SafetyBoundaryValidation;
}

let gapAnalysisCount = 0;

export function analyzeTrustGaps(requestId: string, validators: ValidatorGapInputs): TrustGapAnalysis {
  const cacheKey = [
    requestId,
    validators.truthfulness.score,
    validators.governanceCompliance.score,
    validators.safetyBoundaries.score,
  ].join('|');
  const cached = getCachedTrustGapAnalysis(cacheKey);
  if (cached) return cached;

  gapAnalysisCount += 1;

  const gaps = mergeBoundedGaps(
    [
      validators.truthfulness.gaps,
      validators.transparency.gaps,
      validators.verificationIntegrity.gaps,
      validators.governanceCompliance.gaps,
      validators.executionPredictability.gaps,
      validators.evidenceVisibility.gaps,
      validators.rollbackConfidence.gaps,
      validators.safetyBoundaries.gaps,
    ],
    MAX_TRUST_GAPS,
  );

  const result: TrustGapAnalysis = {
    gaps,
    criticalTrustGaps: gaps.filter((g) => g.severity === 'CRITICAL'),
    majorTrustGaps: gaps.filter((g) => g.severity === 'MAJOR'),
    minorTrustGaps: gaps.filter((g) => g.severity === 'MINOR'),
    passToken: TRUST_GAP_ANALYSIS_PASS,
  };
  setCachedTrustGapAnalysis(cacheKey, result);
  return result;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetTrustGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}
