/**
 * Evidence Intelligence — evidence intelligence evaluator.
 */

import type {
  EvidenceConflict,
  EvidenceIntelligenceEvaluation,
  EvidenceQualityScores,
  EvidenceSufficiencyLevel,
  UnifiedEvidenceAuthority,
} from './evidence-intelligence-types.js';
import { getCachedEvidenceEvaluation, setCachedEvidenceEvaluation } from './evidence-intelligence-cache.js';

let evaluationCount = 0;

const SUFFICIENCY_WEIGHT: Record<EvidenceSufficiencyLevel, number> = {
  INSUFFICIENT: 10,
  PARTIAL: 35,
  SUFFICIENT: 60,
  STRONG: 80,
  AUTHORITATIVE: 95,
};

export function evaluateEvidenceIntelligence(
  authority: UnifiedEvidenceAuthority,
  quality: EvidenceQualityScores,
  conflicts: EvidenceConflict[],
): EvidenceIntelligenceEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.sufficiencyLevel,
    quality.qualityScore,
    conflicts.length,
  ].join('|');

  const cached = getCachedEvidenceEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const evidenceConfidence = Math.max(
    0,
    Math.min(100, Math.round(quality.qualityScore - conflicts.length * 5)),
  );

  const evidenceTrustworthiness = Math.max(
    0,
    Math.min(100, Math.round(quality.consistencyScore * 0.5 + quality.reliabilityScore * 0.5)),
  );

  const evidenceReadiness = Math.round(
    (SUFFICIENCY_WEIGHT[authority.sufficiencyLevel] + evidenceConfidence) / 2,
  );

  const evidenceStability = Math.max(
    0,
    Math.min(100, Math.round(quality.consistencyScore - authority.gapCount * 3)),
  );

  const result: EvidenceIntelligenceEvaluation = {
    overallEvidenceState: authority.sufficiencyLevel,
    evidenceConfidence,
    evidenceTrustworthiness,
    evidenceReadiness,
    evidenceStability,
  };

  setCachedEvidenceEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetEvidenceIntelligenceEvaluatorForTests(): void {
  evaluationCount = 0;
}
