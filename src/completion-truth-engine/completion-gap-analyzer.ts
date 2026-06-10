/**
 * Completion Truth Engine — completion gap analyzer.
 */

import type {
  CompletionEvidenceValidation,
  CompletionGap,
  CompletionRealityValidation,
  RawCompletionClaimInput,
  RawCompletionRealityInput,
} from './completion-truth-types.js';

let gapAnalysisCount = 0;

export function analyzeCompletionGaps(
  claims: RawCompletionClaimInput[],
  evidence: CompletionEvidenceValidation,
  reality: CompletionRealityValidation,
  realitySignals: RawCompletionRealityInput[] = [],
): CompletionGap[] {
  gapAnalysisCount += 1;
  const gaps: CompletionGap[] = [];
  const reported = claims.some((c) => c.reportedComplete === true);
  const merged = realitySignals[0] ?? {};

  if (reported && evidence.evidenceCoverageScore < 40) {
    gaps.push({ gapType: 'missing_evidence', description: 'Missing completion evidence' });
  }
  if (reported && evidence.evidenceAgreementScore < 50) {
    gaps.push({ gapType: 'missing_verification', description: 'Missing verification for completion' });
  }
  if (reported && reality.realityGaps.length > 0) {
    gaps.push({ gapType: 'missing_reality', description: 'Missing or contradicted reality validation' });
  }
  if (reported && merged.trustPresent === false) {
    gaps.push({ gapType: 'missing_trust', description: 'Missing trust for completion claim' });
  }
  if (reported && merged.governanceApproved === false) {
    gaps.push({ gapType: 'missing_governance', description: 'Missing governance approval for completion' });
  }

  return gaps;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetCompletionGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}
