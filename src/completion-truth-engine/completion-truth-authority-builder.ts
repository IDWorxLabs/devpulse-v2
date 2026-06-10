/**
 * Completion Truth Engine — unified completion truth authority builder.
 */

import type {
  CompletionClaimAnalysis,
  CompletionConsistencyScores,
  CompletionEvidenceValidation,
  CompletionGap,
  CompletionRealityValidation,
  CompletionTruthDecision,
  CompletionTruthState,
  FalseCompletionDetection,
  UnifiedCompletionTruthAuthority,
} from './completion-truth-types.js';
import { getCachedAuthority, setCachedAuthority } from './completion-truth-cache.js';
import { nextAuthorityId } from './completion-truth-registry.js';

let authorityBuildCount = 0;

function resolveTruthState(
  falseCompletion: FalseCompletionDetection,
  consistency: CompletionConsistencyScores,
  evidence: CompletionEvidenceValidation,
  reality: CompletionRealityValidation,
  avgStrength: number,
): CompletionTruthState {
  if (falseCompletion.state === 'FALSE_COMPLETION') return 'FALSE_COMPLETION';
  if (reality.realityGaps.some((g) => g.includes('contradict'))) return 'CONTRADICTED';
  if (avgStrength >= 85 && evidence.evidenceCoverageScore >= 70 && reality.realityCompletionScore >= 75) {
    return 'COMPLETE';
  }
  if (avgStrength >= 65 && consistency.consistencyScore >= 60) return 'SUBSTANTIALLY_COMPLETE';
  if (avgStrength >= 40 || consistency.consistencyScore >= 40) return 'PARTIALLY_COMPLETE';
  if (avgStrength > 0) return 'INCOMPLETE';
  return 'UNKNOWN';
}

function resolveDecision(
  truthState: CompletionTruthState,
  falseCompletion: FalseCompletionDetection,
  gaps: CompletionGap[],
): CompletionTruthDecision {
  if (falseCompletion.state === 'FALSE_COMPLETION') return 'FALSE_COMPLETION_DETECTED';
  if (truthState === 'CONTRADICTED') return 'BLOCKED';
  if (truthState === 'COMPLETE') return 'COMPLETE';
  if (gaps.some((g) => g.gapType === 'missing_verification')) return 'NEEDS_VERIFICATION';
  if (gaps.some((g) => g.gapType === 'missing_evidence')) return 'NEEDS_EVIDENCE';
  if (gaps.some((g) => g.gapType === 'missing_reality')) return 'NEEDS_REALITY_VALIDATION';
  if (truthState === 'INCOMPLETE' || truthState === 'UNKNOWN') return 'NOT_COMPLETE';
  if (falseCompletion.state === 'SUSPECT_COMPLETION') return 'NEEDS_VERIFICATION';
  return 'NOT_COMPLETE';
}

export function buildUnifiedCompletionTruthAuthority(
  requestId: string,
  claimAnalyses: CompletionClaimAnalysis[],
  evidence: CompletionEvidenceValidation,
  reality: CompletionRealityValidation,
  consistency: CompletionConsistencyScores,
  falseCompletion: FalseCompletionDetection,
  gaps: CompletionGap[],
): UnifiedCompletionTruthAuthority {
  const cacheKey = [requestId, claimAnalyses.length, falseCompletion.riskScore].join('|');
  const cached = getCachedAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;

  const avgStrength = claimAnalyses.length > 0
    ? claimAnalyses.reduce((s, a) => s + a.claimStrength, 0) / claimAnalyses.length
    : 0;

  const truthState = resolveTruthState(falseCompletion, consistency, evidence, reality, avgStrength);
  const decision = resolveDecision(truthState, falseCompletion, gaps);

  const completionTruthScore = Math.round(
    (avgStrength + evidence.evidenceQualityScore + reality.realityCompletionScore + consistency.consistencyScore) / 4,
  );

  const authority: UnifiedCompletionTruthAuthority = {
    authorityId: nextAuthorityId(),
    truthState,
    decision,
    completionTruthScore: Math.max(0, Math.min(100, completionTruthScore)),
    falseCompletionRisk: falseCompletion.riskScore,
    claimCount: claimAnalyses.length,
    gapCount: gaps.length,
    createdAt: Date.now(),
  };

  setCachedAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetCompletionTruthAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
}
