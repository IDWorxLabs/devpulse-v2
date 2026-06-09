/**
 * Reasoning confidence builder — explains confidence basis without hidden reasoning.
 */

import { reasonOverDecision } from '../unified-decision-layer/index.js';
import type { ReasoningConfidence } from './reasoning-visibility-types.js';
import type { ReasoningBlocker, ReasoningEvidence, ReasoningRisk } from './reasoning-visibility-types.js';

export function calculateReasoningConfidence(
  evidence: ReasoningEvidence[],
  blockers: ReasoningBlocker[],
  risks: ReasoningRisk[],
  query: string,
): { confidence: ReasoningConfidence; confidenceBasis: string; recommendationBasis: string } {
  const trace = reasonOverDecision(query);
  const highEvidence = evidence.filter((e) => e.confidence === 'HIGH').length;
  const hasBlockers = blockers.length > 0;
  const hasRisks = risks.length > 0;

  let confidence: ReasoningConfidence = trace.recommendation.confidence;
  let confidenceBasis = '';

  if (highEvidence >= 5 && !hasBlockers) {
    confidence = 'HIGH';
    confidenceBasis =
      'High confidence — multiple corroborating evidence items from project, dependency, and decision sources with no active blockers.';
  } else if (highEvidence >= 3 || evidence.length >= 6) {
    confidence = 'MEDIUM';
    confidenceBasis =
      'Medium confidence — sufficient structured evidence gathered; some risks or gaps remain advisory.';
  } else {
    confidence = 'LOW';
    confidenceBasis =
      'Low confidence — limited evidence available; additional validation recommended before advancing.';
  }

  if (hasBlockers) {
    confidenceBasis += ` ${blockers.length} blocker(s) influence advisory posture.`;
  }
  if (hasRisks) {
    confidenceBasis += ` ${risks.length} risk(s) evaluated.`;
  }

  const recommendationBasis = [
    `Recommendation: ${trace.recommendation.recommendation}`,
    `Why: ${trace.recommendation.why}`,
    `Risk level: ${trace.recommendation.riskLevel}`,
    `Next safe action: ${trace.recommendation.nextSafeAction}`,
  ].join(' ');

  return { confidence, confidenceBasis: confidenceBasis.trim(), recommendationBasis };
}
