/**
 * Real User Reality Authority — actual user outcome evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithRealityProof } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  REAL_USER_CONFUSION_BLOCK_SCORE,
  REAL_USER_REALITY_CACHE_KEY_PREFIX,
  REAL_USER_SUCCESS_BLOCK_SCORE,
  MAX_REAL_USER_FINDINGS,
  MAX_REAL_USER_RECOMMENDATIONS,
} from './real-user-reality-bounds.js';
import { recordRealUserRealityAssessment } from './real-user-reality-history.js';
import { buildRealUserRealityReportMarkdown } from './real-user-reality-report-builder.js';
import type {
  RealUserEvidenceItem,
  RealUserRealityAssessment,
  RealUserRealityReadinessState,
} from './real-user-reality-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function collectEvidenceItems(report: FounderTestV4ReportWithRealityProof): RealUserEvidenceItem[] {
  const items: RealUserEvidenceItem[] = [];
  const pushFounder = (
    id: string,
    category: RealUserEvidenceItem['category'],
    summary: string,
    source: string,
  ): void => {
    items.push({ id, category, evidenceType: 'FOUNDER_USER', summary, source });
  };
  const pushSimulated = (
    id: string,
    category: RealUserEvidenceItem['category'],
    summary: string,
    source: string,
  ): void => {
    items.push({ id, category, evidenceType: 'SIMULATED_USER', summary, source });
  };

  if (report.firstTimeUserRealityAuthority.scenarioResults.length > 0) {
    pushFounder(
      'understanding-ftu',
      'USER_UNDERSTANDING',
      `First-time user score ${report.firstTimeUserRealityAuthority.firstTimeUserScore}/100 with ${report.firstTimeUserRealityAuthority.scenarioResults.length} scenarios`,
      'First-Time User Reality Authority',
    );
  } else {
    items.push({
      id: 'understanding-none',
      category: 'USER_UNDERSTANDING',
      evidenceType: 'NO_EVIDENCE',
      summary: 'No first-time user understanding evidence recorded',
      source: 'First-Time User Reality Authority',
    });
  }

  if (report.userSuccessAuthority.scenarioResults.length > 0) {
    pushSimulated(
      'success-scenarios',
      'USER_SUCCESS',
      `User success score ${report.userSuccessAuthority.userSuccessScore}/100 across ${report.userSuccessAuthority.scenarioResults.length} simulated goals`,
      'User Success Authority',
    );
  } else {
    items.push({
      id: 'success-none',
      category: 'USER_SUCCESS',
      evidenceType: 'NO_EVIDENCE',
      summary: 'No user success scenario evidence recorded',
      source: 'User Success Authority',
    });
  }

  pushFounder(
    'confusion-ftu',
    'USER_CONFUSION',
    `Confusion score ${report.firstTimeUserRealityAuthority.confusionScore}/100 with ${report.firstTimeUserRealityAuthority.confusionPoints.length} confusion points`,
    'First-Time User Reality Authority',
  );

  if (report.trustAuthority.scenarioResults.length > 0) {
    pushFounder(
      'trust-authority',
      'USER_TRUST',
      `Trust score ${report.trustAuthority.trustScore}/100 from founder-testing trust scenarios`,
      'Trust Authority',
    );
  } else {
    items.push({
      id: 'trust-none',
      category: 'USER_TRUST',
      evidenceType: 'NO_EVIDENCE',
      summary: 'No trust scenario evidence recorded',
      source: 'Trust Authority',
    });
  }

  pushFounder(
    'retention-customer-value',
    'USER_RETENTION',
    `Retention value score ${report.customerValueAuthority.retentionValueScore}/100 from customer value evaluation`,
    'Customer Value Authority',
  );

  if (report.durationMs > 0) {
    pushFounder(
      'founder-test-runtime',
      'USER_SUCCESS',
      `Founder test executed in ${report.durationMs}ms with verdict ${report.verdict}`,
      'Founder Testing',
    );
  }

  return items.slice(0, MAX_REAL_USER_FINDINGS);
}

function buildFindings(
  report: FounderTestV4ReportWithRealityProof,
  evidenceItems: RealUserEvidenceItem[],
  noRealUserEvidence: boolean,
): string[] {
  const findings: string[] = [];
  if (noRealUserEvidence) {
    findings.push('NO_REAL_USER_EVIDENCE — all current user signals come from founder or simulated sources');
  }
  findings.push(
    `Founder-only evidence items: ${evidenceItems.filter((item) => item.evidenceType === 'FOUNDER_USER').length}`,
  );
  findings.push(
    `Simulated user evidence items: ${evidenceItems.filter((item) => item.evidenceType === 'SIMULATED_USER').length}`,
  );
  findings.push(
    `User success proxy score: ${report.userSuccessAuthority.userSuccessScore}/100 (User Success Authority)`,
  );
  findings.push(
    `User confusion proxy score: ${report.firstTimeUserRealityAuthority.confusionScore}/100 (First-Time User Reality Authority)`,
  );
  findings.push(`User trust proxy score: ${report.trustAuthority.trustScore}/100 (Trust Authority)`);
  findings.push(
    `User retention proxy score: ${report.customerValueAuthority.retentionValueScore}/100 (Customer Value Authority)`,
  );
  if (report.firstTimeUserRealityAuthority.criticalConfusionCount > 0) {
    findings.push(
      `Critical confusion count: ${report.firstTimeUserRealityAuthority.criticalConfusionCount} from first-time user scenarios`,
    );
  }
  if (report.userSuccessAuthority.criticalSuccessFailures > 0) {
    findings.push(
      `Critical success failures: ${report.userSuccessAuthority.criticalSuccessFailures} from user success scenarios`,
    );
  }
  return findings.slice(0, MAX_REAL_USER_FINDINGS);
}

function deriveReadinessState(input: {
  noRealUserEvidence: boolean;
  blocksLaunchReadiness: boolean;
  userSuccessScore: number;
  userConfusionScore: number;
  realUserRealityScore: number;
  realUserEvidenceCount: number;
}): RealUserRealityReadinessState {
  if (input.blocksLaunchReadiness && !input.noRealUserEvidence) return 'BLOCKED';
  if (input.noRealUserEvidence) return 'NO_REAL_USER_EVIDENCE';
  if (input.realUserEvidenceCount > 0 && input.userSuccessScore >= 80 && input.userConfusionScore <= 30) {
    return 'USERS_PROVE_SUCCESS';
  }
  if (input.realUserEvidenceCount > 0 && input.userSuccessScore >= 65) return 'USERS_MOSTLY_SUCCEED';
  if (input.userConfusionScore > REAL_USER_CONFUSION_BLOCK_SCORE || input.userSuccessScore < REAL_USER_SUCCESS_BLOCK_SCORE) {
    return 'HIGH_USER_RISK';
  }
  if (input.realUserRealityScore >= 60) return 'MIXED_RESULTS';
  return 'HIGH_USER_RISK';
}

function buildRecommendations(input: {
  noRealUserEvidence: boolean;
  userSuccessScore: number;
  userConfusionScore: number;
  blocksLaunchReadiness: boolean;
}): string[] {
  const items: string[] = [];
  if (input.noRealUserEvidence) {
    items.push('Collect real-user evidence before claiming public launch readiness.');
    items.push('Maximum defensible launch stage without real users: READY_FOR_PRIVATE_BETA.');
  }
  if (input.userSuccessScore < REAL_USER_SUCCESS_BLOCK_SCORE) {
    items.push(`Raise observed user success from ${input.userSuccessScore} toward ${REAL_USER_SUCCESS_BLOCK_SCORE}+.`);
  }
  if (input.userConfusionScore > REAL_USER_CONFUSION_BLOCK_SCORE) {
    items.push(`Reduce user confusion risk from ${input.userConfusionScore} below ${REAL_USER_CONFUSION_BLOCK_SCORE}.`);
  }
  if (input.blocksLaunchReadiness) {
    items.push('Resolve user success or confusion blockers before expanding launch exposure.');
  }
  if (!items.length) {
    items.push('Continue separating real-user proof from founder-only signals.');
  }
  return items.slice(0, MAX_REAL_USER_RECOMMENDATIONS);
}

function stableCacheKey(report: FounderTestV4ReportWithRealityProof, score: number): string {
  const digest = createHash('sha256')
    .update(
      [
        report.generatedAt,
        report.userSuccessAuthority.userSuccessScore,
        report.firstTimeUserRealityAuthority.confusionScore,
        report.trustAuthority.trustScore,
        report.customerValueAuthority.retentionValueScore,
        score,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${REAL_USER_REALITY_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessRealUserRealityAuthority(
  report: FounderTestV4ReportWithRealityProof,
): RealUserRealityAssessment {
  const evidenceItems = collectEvidenceItems(report);
  const realUserEvidenceCount = evidenceItems.filter((item) => item.evidenceType === 'REAL_USER').length;
  const founderOnlyEvidenceCount = evidenceItems.filter(
    (item) => item.evidenceType === 'FOUNDER_USER' || item.evidenceType === 'SIMULATED_USER',
  ).length;
  const noRealUserEvidence = realUserEvidenceCount === 0;

  const userSuccessScore = clamp(report.userSuccessAuthority.userSuccessScore);
  const userConfusionScore = clamp(report.firstTimeUserRealityAuthority.confusionScore);
  const userTrustScore = clamp(report.trustAuthority.trustScore);
  const userRetentionScore = clamp(report.customerValueAuthority.retentionValueScore);

  const userEvidenceScore = noRealUserEvidence
    ? clamp(Math.max(0, founderOnlyEvidenceCount * 8))
    : clamp(50 + realUserEvidenceCount * 10 + founderOnlyEvidenceCount * 2);

  const realUserRealityScore = clamp(
    userSuccessScore * 0.3 +
      (100 - userConfusionScore) * 0.2 +
      userTrustScore * 0.2 +
      userRetentionScore * 0.15 +
      userEvidenceScore * 0.15,
  );

  const blocksLaunchReadiness =
    userSuccessScore < REAL_USER_SUCCESS_BLOCK_SCORE || userConfusionScore > REAL_USER_CONFUSION_BLOCK_SCORE;

  const readinessState = deriveReadinessState({
    noRealUserEvidence,
    blocksLaunchReadiness,
    userSuccessScore,
    userConfusionScore,
    realUserRealityScore,
    realUserEvidenceCount,
  });

  const findings = buildFindings(report, evidenceItems, noRealUserEvidence);
  const recommendations = buildRecommendations({
    noRealUserEvidence,
    userSuccessScore,
    userConfusionScore,
    blocksLaunchReadiness,
  });

  const assessment: RealUserRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    realUserRealityScore,
    userEvidenceScore,
    userSuccessScore,
    userConfusionScore,
    userTrustScore,
    userRetentionScore,
    realUserEvidenceCount,
    founderOnlyEvidenceCount,
    noRealUserEvidence,
    blocksLaunchReadiness,
    readinessState,
    findings,
    recommendations,
    evidenceItems,
    cacheKey: stableCacheKey(report, realUserRealityScore),
  };

  recordRealUserRealityAssessment(assessment);
  return assessment;
}

export function buildRealUserRealityAuthorityArtifacts(
  report: FounderTestV4ReportWithRealityProof,
): {
  realUserRealityAuthority: RealUserRealityAssessment;
  realUserRealityAuthorityReportMarkdown: string;
} {
  const realUserRealityAuthority = assessRealUserRealityAuthority(report);
  return {
    realUserRealityAuthority,
    realUserRealityAuthorityReportMarkdown: buildRealUserRealityReportMarkdown(
      realUserRealityAuthority,
      report.generatedAt,
    ),
  };
}
