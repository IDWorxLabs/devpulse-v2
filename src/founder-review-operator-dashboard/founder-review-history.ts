/**
 * Founder Review Operator Dashboard V1 — bounded review history (max 25).
 */

import type { AutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/autonomous-founder-launch-authority-types.js';
import type { FounderReviewHistoryEntry, ReviewTrendDirection } from './founder-review-dashboard-types.js';
import { MAX_FOUNDER_REVIEW_HISTORY } from './founder-review-dashboard-types.js';

const history: FounderReviewHistoryEntry[] = [];
let reviewCounter = 0;

export function resetFounderReviewHistoryForTests(): void {
  history.length = 0;
  reviewCounter = 0;
}

function nextReviewId(): string {
  reviewCounter += 1;
  return `founder-review-${reviewCounter}`;
}

export function recordFounderReviewInHistory(input: {
  profile: string;
  assessment: AutonomousFounderLaunchAssessment;
}): FounderReviewHistoryEntry {
  const entry: FounderReviewHistoryEntry = {
    reviewId: nextReviewId(),
    profile: input.profile,
    productName: input.assessment.productName ?? input.profile,
    generatedAt: input.assessment.generatedAt,
    overallScore: input.assessment.scores.overallFounderScore,
    verdict: input.assessment.verdict,
    userPhase: input.assessment.userPhase,
  };

  const duplicate = history.find(
    (item) =>
      item.profile === entry.profile &&
      item.generatedAt === entry.generatedAt &&
      item.verdict === entry.verdict,
  );
  if (!duplicate) {
    history.unshift(entry);
    if (history.length > MAX_FOUNDER_REVIEW_HISTORY) {
      history.length = MAX_FOUNDER_REVIEW_HISTORY;
    }
  }

  return entry;
}

export function listFounderReviewHistory(profile?: string): readonly FounderReviewHistoryEntry[] {
  if (!profile) return [...history];
  return history.filter((entry) => entry.profile === profile);
}

export function getFounderReviewHistorySize(): number {
  return history.length;
}

export function deriveReviewTrendDirection(
  entries: readonly FounderReviewHistoryEntry[],
): ReviewTrendDirection {
  if (entries.length < 2) return 'UNKNOWN';
  const latest = entries[0]?.overallScore ?? 0;
  const previous = entries[1]?.overallScore ?? 0;
  if (latest > previous) return 'UP';
  if (latest < previous) return 'DOWN';
  return 'STABLE';
}
