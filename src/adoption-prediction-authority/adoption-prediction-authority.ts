/**
 * Adoption Prediction Authority — retention and abandonment prediction from existing evidence.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithRealUserReality } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  ADOPTION_ABANDONMENT_BLOCK_SCORE,
  ADOPTION_PREDICTION_BLOCK_SCORE,
  ADOPTION_PREDICTION_CACHE_KEY_PREFIX,
  MAX_ADOPTION_FINDINGS,
  MAX_ADOPTION_RECOMMENDATIONS,
} from './adoption-prediction-bounds.js';
import { recordAdoptionPredictionAssessment } from './adoption-prediction-history.js';
import { buildAdoptionPredictionReportMarkdown } from './adoption-prediction-report-builder.js';
import type { AdoptionPredictionAssessment, AdoptionPredictionReadinessState } from './adoption-prediction-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function calculateEvidenceConfidenceScore(report: FounderTestV4ReportWithRealUserReality): number {
  const realUser = report.realUserRealityAuthority;
  const realityProof = report.realityProofAuthority;
  if (realUser.realUserEvidenceCount > 0) {
    return clamp(55 + realityProof.realityProofScore * 0.4 + realUser.userEvidenceScore * 0.05);
  }
  if (realUser.noRealUserEvidence) {
    return clamp(20 + realityProof.realityProofScore * 0.2 + realUser.founderOnlyEvidenceCount * 2);
  }
  return clamp(40 + realUser.userEvidenceScore * 0.25);
}

function calculateRetentionPredictionScore(report: FounderTestV4ReportWithRealUserReality): number {
  const realUser = report.realUserRealityAuthority;
  let score = clamp(
    report.customerValueAuthority.retentionValueScore * 0.35 +
      report.userSuccessAuthority.userSuccessScore * 0.35 +
      realUser.userRetentionScore * 0.15 +
      (100 - realUser.userConfusionScore) * 0.15,
  );
  if (realUser.noRealUserEvidence) {
    score = Math.min(score, 55);
  }
  return score;
}

function calculateRecommendationPredictionScore(report: FounderTestV4ReportWithRealUserReality): number {
  return clamp(
    report.trustAuthority.trustScore * 0.35 +
      report.customerValueAuthority.customerValueScore * 0.35 +
      report.competitiveRealityAuthority.differentiationScore * 0.3,
  );
}

function calculateAbandonmentRiskScore(report: FounderTestV4ReportWithRealUserReality): number {
  const realUser = report.realUserRealityAuthority;
  return clamp(
    realUser.userConfusionScore * 0.25 +
      (100 - report.userSuccessAuthority.userSuccessScore) * 0.25 +
      (100 - report.customerValueAuthority.customerValueScore) * 0.25 +
      report.trustAuthority.trustRiskScore * 0.25,
  );
}

function calculateGrowthPotentialScore(report: FounderTestV4ReportWithRealUserReality): number {
  const competitive = report.competitiveRealityAuthority;
  const evolution = report.selfEvolutionAuthority;
  const gaps = report.gapDetectionAuthority;
  return clamp(
    evolution.selfEvolutionScore * 0.35 +
      gaps.gapDetectionScore * 0.25 +
      Math.min(competitive.uniqueAdvantageCount, 6) * 5 +
      Math.min(evolution.requiredEvolutions.length, 4) * 3,
  );
}

function buildFindings(report: FounderTestV4ReportWithRealUserReality, scores: {
  retentionPredictionScore: number;
  recommendationPredictionScore: number;
  abandonmentRiskScore: number;
  growthPotentialScore: number;
  evidenceConfidenceScore: number;
}): string[] {
  const realUser = report.realUserRealityAuthority;
  const findings: string[] = [
    `[RETENTION] Return likelihood prediction: ${scores.retentionPredictionScore}/100 based on customer value, user success, and real-user proxies.`,
    `[RECOMMENDATION] Recommendation likelihood prediction: ${scores.recommendationPredictionScore}/100 based on trust, value, and differentiation evidence.`,
    `[FRICTION] Adoption friction signals: confusion ${realUser.userConfusionScore}/100, FTU blockers ${report.firstTimeUserRealityAuthority.blockerCount}, gaps ${report.gapDetectionAuthority.detectedGaps.length}, unknowns ${report.unknownDiscoveryAuthority.findings.length}.`,
    `[GROWTH] Growth potential prediction: ${scores.growthPotentialScore}/100 from self-evolution, gap solvability, and differentiation opportunities.`,
    `[ABANDONMENT] Abandonment risk prediction: ${scores.abandonmentRiskScore}/100 from confusion, weak outcomes, and trust risk.`,
    `[CONFIDENCE] Prediction confidence: ${scores.evidenceConfidenceScore}/100 — ${realUser.noRealUserEvidence ? 'founder-only evidence; predictions are not facts' : 'mixed evidence quality'}.`,
  ];
  if (realUser.noRealUserEvidence) {
    findings.push('NO_REAL_USER_EVIDENCE reduces retention and recommendation prediction confidence.');
  }
  if (report.firstTimeUserRealityAuthority.criticalConfusionCount > 0) {
    findings.push(`Critical first-time confusion (${report.firstTimeUserRealityAuthority.criticalConfusionCount}) predicts onboarding friction.`);
  }
  if (report.customerValueAuthority.criticalValueFailures > 0) {
    findings.push(`Critical value failures (${report.customerValueAuthority.criticalValueFailures}) predict abandonment risk.`);
  }
  return findings.slice(0, MAX_ADOPTION_FINDINGS);
}

function deriveReadinessState(input: {
  blocksLaunchReadiness: boolean;
  adoptionPredictionScore: number;
  retentionPredictionScore: number;
  abandonmentRiskScore: number;
  evidenceConfidenceScore: number;
}): AdoptionPredictionReadinessState {
  if (input.blocksLaunchReadiness) return 'BLOCKED';
  if (input.abandonmentRiskScore > ADOPTION_ABANDONMENT_BLOCK_SCORE) return 'HIGH_ABANDONMENT_RISK';
  if (input.evidenceConfidenceScore < 45) return 'UNCERTAIN_ADOPTION';
  if (input.adoptionPredictionScore >= 75 && input.retentionPredictionScore >= 70) {
    return 'HIGH_ADOPTION_PROBABILITY';
  }
  if (input.adoptionPredictionScore >= ADOPTION_PREDICTION_BLOCK_SCORE) return 'MODERATE_ADOPTION_PROBABILITY';
  return 'UNCERTAIN_ADOPTION';
}

function buildRecommendations(input: {
  evidenceConfidenceScore: number;
  retentionPredictionScore: number;
  abandonmentRiskScore: number;
  noRealUserEvidence: boolean;
  blocksLaunchReadiness: boolean;
}): string[] {
  const items: string[] = [];
  if (input.noRealUserEvidence) {
    items.push('Treat retention and recommendation predictions as low-confidence until real-user evidence exists.');
  }
  if (input.evidenceConfidenceScore < 50) {
    items.push(`Raise prediction evidence confidence from ${input.evidenceConfidenceScore} before acting on adoption forecasts.`);
  }
  if (input.retentionPredictionScore < ADOPTION_PREDICTION_BLOCK_SCORE) {
    items.push(`Improve retention signals from ${input.retentionPredictionScore} toward ${ADOPTION_PREDICTION_BLOCK_SCORE}+.`);
  }
  if (input.abandonmentRiskScore > ADOPTION_ABANDONMENT_BLOCK_SCORE) {
    items.push(`Reduce abandonment risk from ${input.abandonmentRiskScore} below ${ADOPTION_ABANDONMENT_BLOCK_SCORE}.`);
  }
  if (input.blocksLaunchReadiness) {
    items.push('Resolve adoption prediction blockers before expanding launch exposure.');
  }
  if (!items.length) {
    items.push('Monitor adoption predictions as evidence quality improves — predictions are not user behavior facts.');
  }
  return items.slice(0, MAX_ADOPTION_RECOMMENDATIONS);
}

function stableCacheKey(report: FounderTestV4ReportWithRealUserReality, score: number): string {
  const digest = createHash('sha256')
    .update(
      [
        report.generatedAt,
        report.realUserRealityAuthority.noRealUserEvidence,
        report.customerValueAuthority.retentionValueScore,
        report.userSuccessAuthority.userSuccessScore,
        report.trustAuthority.trustScore,
        score,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${ADOPTION_PREDICTION_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessAdoptionPredictionAuthority(
  report: FounderTestV4ReportWithRealUserReality,
): AdoptionPredictionAssessment {
  const evidenceConfidenceScore = calculateEvidenceConfidenceScore(report);
  const retentionPredictionScore = calculateRetentionPredictionScore(report);
  const recommendationPredictionScore = calculateRecommendationPredictionScore(report);
  const abandonmentRiskScore = calculateAbandonmentRiskScore(report);
  const growthPotentialScore = calculateGrowthPotentialScore(report);
  const adoptionPredictionScore = clamp(
    retentionPredictionScore * 0.3 +
      recommendationPredictionScore * 0.25 +
      (100 - abandonmentRiskScore) * 0.2 +
      growthPotentialScore * 0.15 +
      evidenceConfidenceScore * 0.1,
  );
  const blocksLaunchReadiness =
    adoptionPredictionScore < ADOPTION_PREDICTION_BLOCK_SCORE ||
    retentionPredictionScore < ADOPTION_PREDICTION_BLOCK_SCORE ||
    abandonmentRiskScore > ADOPTION_ABANDONMENT_BLOCK_SCORE;
  const readinessState = deriveReadinessState({
    blocksLaunchReadiness,
    adoptionPredictionScore,
    retentionPredictionScore,
    abandonmentRiskScore,
    evidenceConfidenceScore,
  });
  const findings = buildFindings(report, {
    retentionPredictionScore,
    recommendationPredictionScore,
    abandonmentRiskScore,
    growthPotentialScore,
    evidenceConfidenceScore,
  });
  const recommendations = buildRecommendations({
    evidenceConfidenceScore,
    retentionPredictionScore,
    abandonmentRiskScore,
    noRealUserEvidence: report.realUserRealityAuthority.noRealUserEvidence,
    blocksLaunchReadiness,
  });

  const assessment: AdoptionPredictionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    adoptionPredictionScore,
    retentionPredictionScore,
    recommendationPredictionScore,
    abandonmentRiskScore,
    growthPotentialScore,
    evidenceConfidenceScore,
    blocksLaunchReadiness,
    readinessState,
    findings,
    recommendations,
    cacheKey: stableCacheKey(report, adoptionPredictionScore),
  };

  recordAdoptionPredictionAssessment(assessment);
  return assessment;
}

export function buildAdoptionPredictionAuthorityArtifacts(
  report: FounderTestV4ReportWithRealUserReality,
): {
  adoptionPredictionAuthority: AdoptionPredictionAssessment;
  adoptionPredictionAuthorityReportMarkdown: string;
} {
  const adoptionPredictionAuthority = assessAdoptionPredictionAuthority(report);
  return {
    adoptionPredictionAuthority,
    adoptionPredictionAuthorityReportMarkdown: buildAdoptionPredictionReportMarkdown(
      adoptionPredictionAuthority,
      report.generatedAt,
    ),
  };
}
