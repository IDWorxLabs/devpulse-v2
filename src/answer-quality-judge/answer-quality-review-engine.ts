/**
 * Rule-based answer quality review — no AI, LLM, rewriting, or modification.
 */

import { assertAnswerContract, type DevPulseV2Answer } from '../chat/answer-contract.js';
import { CHAT_ANSWER_SOURCE, CHAT_OWNER_MODULE } from '../chat/types.js';
import { detectAnswerAuthorityViolations } from '../answer-authority-protection/answer-contract-validator.js';
import { getVisibleAnswerAuthority } from '../answer-authority-protection/answer-authority-registry-check.js';
import type { AnswerQualityCheck, AnswerQualityReview, AnswerQualityStatus } from './types.js';
import { MIN_ANSWER_LENGTH } from './types.js';

function createReviewId(): string {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createCheckId(name: string): string {
  return `check-${name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
}

function check(
  name: string,
  passed: boolean,
  passReason: string,
  failReason: string,
  warn = false,
): AnswerQualityCheck {
  let status: AnswerQualityStatus = passed ? 'PASS' : warn ? 'WARN' : 'FAIL';
  return {
    checkId: createCheckId(name),
    name,
    status,
    reason: passed ? passReason : warn ? failReason : failReason,
  };
}

export function generateQualityChecks(answer: DevPulseV2Answer | null): AnswerQualityCheck[] {
  const checks: AnswerQualityCheck[] = [];

  checks.push(
    check(
      'Answer exists',
      answer !== null,
      'Answer object provided for review.',
      'No answer object provided.',
    ),
  );

  if (!answer) return checks;

  checks.push(
    check(
      'visibleAnswerText exists',
      'visibleAnswerText' in answer,
      'visibleAnswerText field present on answer contract.',
      'visibleAnswerText field missing from answer contract.',
    ),
  );

  checks.push(
    check(
      'Answer is not empty',
      answer.status !== 'EMPTY' && answer.visibleAnswerText.trim().length > 0,
      'Answer contains visible text.',
      'Answer is empty — no visible text produced.',
    ),
  );

  checks.push(
    check(
      'Answer length above minimum',
      answer.visibleAnswerText.trim().length >= MIN_ANSWER_LENGTH,
      `Answer length meets minimum threshold (${MIN_ANSWER_LENGTH} chars).`,
      `Answer below minimum length threshold (${MIN_ANSWER_LENGTH} chars).`,
      answer.visibleAnswerText.trim().length > 0 && answer.visibleAnswerText.trim().length < MIN_ANSWER_LENGTH,
    ),
  );

  checks.push(
    check(
      'No answer contract violation',
      assertAnswerContract(answer),
      'Answer contract intact — no hidden alternate prose fields.',
      'Answer contract violation — hidden fields or wrong source detected.',
    ),
  );

  checks.push(
    check(
      'Answer owner is Chat Authority',
      answer.source === CHAT_ANSWER_SOURCE && getVisibleAnswerAuthority() === CHAT_OWNER_MODULE,
      'Answer source is Chat Authority.',
      'Answer source is not Chat Authority.',
    ),
  );

  const authorityViolations = detectAnswerAuthorityViolations().filter((v) => !v.passed);
  checks.push(
    check(
      'No answer authority violation',
      authorityViolations.length === 0,
      'Answer authority protection checks passed.',
      `Answer authority violations detected: ${authorityViolations.map((v) => v.code).join(', ')}`,
    ),
  );

  return checks;
}

export function calculateQualityScore(review: AnswerQualityReview): number {
  if (review.checks.length === 0) return 0;
  const passWeight = review.checks.filter((c) => c.status === 'PASS').length;
  const warnWeight = review.checks.filter((c) => c.status === 'WARN').length * 0.5;
  return Math.round(((passWeight + warnWeight) / review.checks.length) * 100);
}

function deriveOverallStatus(checks: AnswerQualityCheck[]): AnswerQualityStatus {
  if (checks.some((c) => c.status === 'FAIL')) return 'FAIL';
  if (checks.some((c) => c.status === 'WARN')) return 'WARN';
  if (checks.every((c) => c.status === 'PASS')) return 'PASS';
  return 'FAIL';
}

export function reviewAnswer(answer: DevPulseV2Answer | null): AnswerQualityReview {
  const checks = generateQualityChecks(answer);
  const warnings: string[] = [
    'Answer Quality Judge reviews only — it does not create, modify, or replace answers.',
  ];
  const errors: string[] = [];

  const failedChecks = checks.filter((c) => c.status === 'FAIL');
  if (failedChecks.length > 0) {
    errors.push(`${failedChecks.length} quality check(s) failed.`);
  }

  const review: AnswerQualityReview = {
    reviewId: createReviewId(),
    createdAt: Date.now(),
    answerId: answer?.answerId ?? 'none',
    overallStatus: 'FAIL',
    qualityScore: 0,
    checks,
    warnings,
    errors,
  };

  review.overallStatus = deriveOverallStatus(checks);
  review.qualityScore = calculateQualityScore(review);

  return review;
}

export function summarizeReview(review: AnswerQualityReview): string {
  const pass = review.checks.filter((c) => c.status === 'PASS').length;
  const warn = review.checks.filter((c) => c.status === 'WARN').length;
  const fail = review.checks.filter((c) => c.status === 'FAIL').length;
  return (
    `Review ${review.reviewId}: answer=${review.answerId} status=${review.overallStatus} ` +
    `score=${review.qualityScore} checks(PASS=${pass} WARN=${warn} FAIL=${fail})`
  );
}
