/**
 * Completion Truth Engine — false completion detector.
 */

import type {
  CompletionClaimAnalysis,
  CompletionEvidenceValidation,
  CompletionRealityValidation,
  FalseCompletionDetection,
  FalseCompletionState,
  RawCompletionClaimInput,
} from './completion-truth-types.js';
import { getCachedFalseCompletion, setCachedFalseCompletion } from './completion-truth-cache.js';

let falseCompletionDetectionCount = 0;

export function detectFalseCompletion(
  claims: RawCompletionClaimInput[],
  claimAnalyses: CompletionClaimAnalysis[],
  evidence: CompletionEvidenceValidation,
  reality: CompletionRealityValidation,
): FalseCompletionDetection {
  const cacheKey = [
    claims.map((c) => c.reportedComplete).join(','),
    evidence.evidenceCoverageScore,
    reality.realityCompletionScore,
  ].join('|');

  const cached = getCachedFalseCompletion(cacheKey);
  if (cached) return cached;

  falseCompletionDetectionCount += 1;
  const reasons: string[] = [];
  let riskScore = 0;

  const reportedComplete = claims.some((c) => c.reportedComplete === true);
  const avgStrength = claimAnalyses.length > 0
    ? claimAnalyses.reduce((s, a) => s + a.claimStrength, 0) / claimAnalyses.length
    : 0;

  if (reportedComplete && evidence.evidenceCoverageScore < 30) {
    reasons.push('Completion reported without sufficient evidence');
    riskScore += 35;
  }
  if (reportedComplete && evidence.evidenceAgreementScore < 40) {
    reasons.push('Completion reported without verification agreement');
    riskScore += 30;
  }
  if (reportedComplete && reality.realityGaps.length > 0) {
    reasons.push('Completion reported with reality contradictions');
    riskScore += 25;
  }
  if (reportedComplete && evidence.evidenceQualityScore < 35) {
    reasons.push('Completion reported with trust/evidence failures');
    riskScore += 20;
  }
  if (claims.some((c) => (c.blockersRemaining ?? 0) > 0) && reportedComplete) {
    reasons.push('Completion reported with unresolved blockers');
    riskScore += 30;
  }
  if (reportedComplete && avgStrength < 40) {
    reasons.push('Completion claim strength too low');
    riskScore += 15;
  }

  let state: FalseCompletionState = 'VALID_COMPLETION';
  if (riskScore >= 60) state = 'FALSE_COMPLETION';
  else if (riskScore >= 30) state = 'SUSPECT_COMPLETION';
  else if (!reportedComplete) state = 'VALID_COMPLETION';

  const result: FalseCompletionDetection = {
    state,
    riskScore: Math.min(100, riskScore),
    reasons,
  };

  setCachedFalseCompletion(cacheKey, result);
  return result;
}

export function getFalseCompletionDetectionCount(): number {
  return falseCompletionDetectionCount;
}

export function resetFalseCompletionDetectorForTests(): void {
  falseCompletionDetectionCount = 0;
}
