/** DevPulse V2 Answer Quality Judge — types. */

export type AnswerQualityStatus = 'PASS' | 'WARN' | 'FAIL';

export interface AnswerQualityCheck {
  checkId: string;
  name: string;
  status: AnswerQualityStatus;
  reason: string;
}

export interface AnswerQualityReview {
  reviewId: string;
  createdAt: number;
  answerId: string;
  overallStatus: AnswerQualityStatus;
  qualityScore: number;
  checks: AnswerQualityCheck[];
  warnings: string[];
  errors: string[];
}

export interface AnswerQualityJudgeState {
  judgeId: string;
  reviewCount: number;
  warnings: string[];
  errors: string[];
}

export interface ReviewSummary {
  reviewId: string;
  answerId: string;
  overallStatus: AnswerQualityStatus;
  qualityScore: number;
  summary: string;
  publishedAt: number;
}

export interface AuthorityComplianceSummary {
  compliant: boolean;
  protectionStatus: string;
  visibleAnswerOwner: string;
  violationCount: number;
  summary: string;
}

export interface AnswerQualityReport {
  ownerModule: string;
  totalReviews: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  latestReview: AnswerQualityReview | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const JUDGE_OWNER_MODULE = 'devpulse_v2_answer_quality_judge_authority';
export const JUDGE_PASS_TOKEN = 'DEVPULSE_V2_ANSWER_QUALITY_JUDGE_FOUNDATION_V1_PASS';

export const MIN_ANSWER_LENGTH = 10;
