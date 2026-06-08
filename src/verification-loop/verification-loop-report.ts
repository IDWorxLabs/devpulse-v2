/**
 * Verification Loop founder-readable report — verification layer only.
 */

import type {
  VerificationLoopReport,
  VerificationLoopState,
  VerificationReview,
} from './types.js';
import { LOOP_OWNER_MODULE } from './types.js';

export function buildVerificationLoopReport(
  state: VerificationLoopState,
  reviews: VerificationReview[],
): VerificationLoopReport {
  const verifiedCount = reviews.filter((r) => r.status === 'VERIFIED').length;
  const partialCount = reviews.filter((r) => r.status === 'PARTIAL').length;
  const unverifiedCount = reviews.filter((r) => r.status === 'UNVERIFIED').length;
  const conflictCount = reviews.filter((r) => r.status === 'CONFLICT').length;
  const latestVerification = reviews.length > 0 ? reviews[reviews.length - 1] : null;

  let recommendation =
    'Verification Loop validates claims against evidence — it does not answer or execute.';
  if (state.reviewCount === 0) {
    recommendation = 'Verify claims with linked evidence before downstream systems act on summaries.';
  } else if (conflictCount > 0) {
    recommendation = 'Resolve contradictory evidence before trusting conflicting claims.';
  } else if (unverifiedCount > 0) {
    recommendation = 'Add supporting evidence to unverified claims — registry remains evidence owner.';
  }

  return {
    ownerModule: LOOP_OWNER_MODULE,
    totalReviews: state.reviewCount,
    verifiedCount,
    partialCount,
    unverifiedCount,
    conflictCount,
    latestVerification: latestVerification
      ? {
          ...latestVerification,
          evidenceIds: [...latestVerification.evidenceIds],
          findings: [...latestVerification.findings],
          warnings: [...latestVerification.warnings],
          errors: [...latestVerification.errors],
        }
      : null,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatVerificationLoopReport(
  state: VerificationLoopState,
  reviews: VerificationReview[],
): string {
  const report = buildVerificationLoopReport(state, reviews);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Verification Loop Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Loop ID: ${state.loopId}`,
    `Total reviews: ${report.totalReviews}`,
    `Verified: ${report.verifiedCount} | Partial: ${report.partialCount} | Unverified: ${report.unverifiedCount} | Conflict: ${report.conflictCount}`,
    '',
  ];

  if (report.latestVerification) {
    lines.push(`Latest verification: ${report.latestVerification.verificationId}`);
    lines.push(`  Subject: ${report.latestVerification.subject}`);
    lines.push(
      `  Status: ${report.latestVerification.status} | Confidence: ${report.latestVerification.confidence}`,
    );
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
