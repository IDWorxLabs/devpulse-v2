/**
 * AFLA Trust Calibration V1 — reviewer alignment analysis.
 */

import type { AutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/autonomous-founder-launch-authority-types.js';
import { REVIEWER_ALIGNMENT_DIVERGENCE_THRESHOLD } from './afla-trust-calibration-bounds.js';
import type { ReviewerAlignmentReport } from './afla-trust-calibration-types.js';

const REVIEWER_LABELS: Record<string, string> = {
  'senior-engineer': 'Engineering Review',
  qa: 'QA Review',
  ux: 'UX Review',
  product: 'Product Review',
  launch: 'Launch Review',
  founder: 'Founder Review',
};

export function analyzeReviewerAlignment(
  assessment: AutonomousFounderLaunchAssessment,
): ReviewerAlignmentReport {
  const scores: Record<string, number> = {};
  for (const reviewer of assessment.reviewers) {
    scores[REVIEWER_LABELS[reviewer.role] ?? reviewer.reviewerName] = reviewer.score;
  }

  const scoreValues = Object.values(scores);
  const minScore = scoreValues.length === 0 ? 0 : Math.min(...scoreValues);
  const maxScore = scoreValues.length === 0 ? 0 : Math.max(...scoreValues);
  const divergence = maxScore - minScore;
  const extremeDisagreement = divergence > REVIEWER_ALIGNMENT_DIVERGENCE_THRESHOLD;

  let divergenceExplanation: string | null = null;
  if (extremeDisagreement) {
    const lowest = Object.entries(scores).find(([, score]) => score === minScore);
    const highest = Object.entries(scores).find(([, score]) => score === maxScore);
    divergenceExplanation = `Extreme reviewer disagreement: ${highest?.[0] ?? 'High'} (${maxScore}) vs ${lowest?.[0] ?? 'Low'} (${minScore}) — divergence ${divergence} exceeds threshold ${REVIEWER_ALIGNMENT_DIVERGENCE_THRESHOLD}.`;
  }

  return {
    readOnly: true,
    scores,
    minScore,
    maxScore,
    divergence,
    extremeDisagreement,
    divergenceExplanation,
  };
}
