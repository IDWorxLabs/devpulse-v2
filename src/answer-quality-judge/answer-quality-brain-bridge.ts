/**
 * Central Brain bridge — awareness owner unchanged; judge publishes review summaries only.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { summarizeReview } from './answer-quality-review-engine.js';
import type { AnswerQualityReview, ReviewSummary } from './types.js';

let latestPublishedSummary: ReviewSummary | null = null;

export function publishReviewSummary(review: AnswerQualityReview): ReviewSummary {
  const summary: ReviewSummary = {
    reviewId: review.reviewId,
    answerId: review.answerId,
    overallStatus: review.overallStatus,
    qualityScore: review.qualityScore,
    summary: summarizeReview(review),
    publishedAt: Date.now(),
  };
  latestPublishedSummary = { ...summary };
  return { ...summary };
}

export function getLatestReviewSummary(): ReviewSummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { reviewAnswer?: unknown }).reviewAnswer === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetQualityBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
