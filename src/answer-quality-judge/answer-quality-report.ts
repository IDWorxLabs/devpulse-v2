/**
 * Answer Quality Judge founder-readable report — review layer only.
 */

import type { AnswerQualityJudgeState, AnswerQualityReport, AnswerQualityReview } from './types.js';
import { JUDGE_OWNER_MODULE } from './types.js';

export function buildAnswerQualityReport(
  state: AnswerQualityJudgeState,
  reviews: AnswerQualityReview[],
): AnswerQualityReport {
  const passCount = reviews.filter((r) => r.overallStatus === 'PASS').length;
  const warnCount = reviews.filter((r) => r.overallStatus === 'WARN').length;
  const failCount = reviews.filter((r) => r.overallStatus === 'FAIL').length;
  const latestReview = reviews.length > 0 ? reviews[reviews.length - 1] : null;

  let recommendation =
    'Answer Quality Judge reviews answers after creation — Chat Authority still owns all visible answers.';
  if (state.reviewCount === 0) {
    recommendation = 'Submit answers through Chat Authority, then review quality here — no modification allowed.';
  } else if (failCount > 0) {
    recommendation =
      'Some answers failed quality review — inspect Chat Authority path; judge does not rewrite answers.';
  } else if (warnCount > 0) {
    recommendation = 'Some answers have quality warnings — monitor answer contract and length thresholds.';
  }

  return {
    ownerModule: JUDGE_OWNER_MODULE,
    totalReviews: state.reviewCount,
    passCount,
    warnCount,
    failCount,
    latestReview: latestReview
      ? {
          ...latestReview,
          checks: latestReview.checks.map((c) => ({ ...c })),
          warnings: [...latestReview.warnings],
          errors: [...latestReview.errors],
        }
      : null,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatAnswerQualityReport(
  state: AnswerQualityJudgeState,
  reviews: AnswerQualityReview[],
): string {
  const report = buildAnswerQualityReport(state, reviews);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Answer Quality Judge Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Judge ID: ${state.judgeId}`,
    `Total reviews: ${report.totalReviews}`,
    `Pass: ${report.passCount} | Warn: ${report.warnCount} | Fail: ${report.failCount}`,
    '',
  ];

  if (report.latestReview) {
    lines.push(`Latest review: ${report.latestReview.reviewId}`);
    lines.push(`  Answer: ${report.latestReview.answerId}`);
    lines.push(`  Status: ${report.latestReview.overallStatus} | Score: ${report.latestReview.qualityScore}`);
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const e of report.errors) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
