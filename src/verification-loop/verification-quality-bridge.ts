/**
 * Answer Quality Judge bridge — judge owns review; verification verifies review claims.
 */

import type { AnswerQualityReview } from '../answer-quality-judge/types.js';
import { JUDGE_OWNER_MODULE } from '../answer-quality-judge/types.js';
import { getDevPulseV2AnswerQualityJudgeAuthority } from '../answer-quality-judge/answer-quality-judge-authority.js';
import { verifyClaim } from './verification-engine.js';
import type { QualityVerificationSummary, VerificationStatus } from './types.js';

let lastQualitySummary: QualityVerificationSummary | null = null;

export function verifyReviewQualityClaims(review: AnswerQualityReview): QualityVerificationSummary {
  const passChecks = review.checks.filter((c) => c.status === 'PASS').length;
  const subject = `Answer quality review ${review.reviewId} for answer ${review.answerId}`;
  const evidenceIds = review.checks.map((c) => c.checkId);

  const verification = verifyClaim({
    subject,
    evidenceIds: passChecks > 0 ? evidenceIds.slice(0, Math.max(1, passChecks)) : [],
  });

  let status: VerificationStatus = verification.status;
  let verified = review.overallStatus === 'PASS' && passChecks === review.checks.length;

  if (review.overallStatus === 'FAIL') {
    status = 'UNVERIFIED';
    verified = false;
  } else if (review.overallStatus === 'WARN') {
    status = 'PARTIAL';
    verified = passChecks > 0;
  }

  const summary: QualityVerificationSummary = {
    reviewId: review.reviewId,
    verified,
    status,
    summary: `Quality review claims: overall=${review.overallStatus} score=${review.qualityScore} verification=${status}`,
  };

  lastQualitySummary = { ...summary };
  return { ...summary };
}

export function getQualityVerificationSummary(): QualityVerificationSummary | null {
  return lastQualitySummary ? { ...lastQualitySummary } : null;
}

export function assertJudgeOwnershipUnchanged(): boolean {
  const judge = getDevPulseV2AnswerQualityJudgeAuthority();
  return (
    judge.constructor.name === 'DevPulseV2AnswerQualityJudgeAuthority' &&
    typeof judge.reviewAndStore === 'function' &&
    typeof (judge as { verifyClaim?: unknown }).verifyClaim === 'undefined'
  );
}

export function getJudgeOwnerForBridge(): string {
  return JUDGE_OWNER_MODULE;
}

export function resetQualityVerificationBridgeForTests(): void {
  lastQualitySummary = null;
}
