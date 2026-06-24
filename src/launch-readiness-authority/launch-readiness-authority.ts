/**
 * Launch Readiness Authority — final synthesis from Launch Council evidence authorities.
 */

import { createHash } from 'node:crypto';
import { getLastBlueprintVisualAssessment } from '../universal-app-blueprint-visual/index.js';
import { getLastFeatureRealityAssessment } from '../feature-reality-validation/index.js';
import { getLastUniversalFeatureContractAssessment } from '../universal-feature-contract-intelligence/index.js';
import { getLastAutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/index.js';
import { getLastEngineeringRealityAssessment } from '../engineering-reality-authority/index.js';
import type { FounderTestV4ReportWithAdoptionPrediction } from '../founder-testing-mode/founder-testing-v4-types.js';
import type { AdoptionPredictionAssessment } from '../adoption-prediction-authority/adoption-prediction-types.js';
import { mapEvidenceAuthoritiesFromFounderTestV4 } from '../launch-council/launch-council-founder-integration.js';
import type { LaunchCouncilAuthorityResult } from '../launch-council/launch-council-types.js';
import { recordLaunchReadinessAssessment } from './launch-readiness-history.js';
import { buildLaunchReadinessReportMarkdown } from './launch-readiness-report-builder.js';
import {
  AUTHORITY_WEIGHTS,
  CONFIDENCE_INTERNAL_USE,
  CONFIDENCE_PRIVATE_BETA,
  CONFIDENCE_PUBLIC_BETA,
  CONFIDENCE_PUBLIC_LAUNCH,
  LAUNCH_READINESS_CACHE_KEY_PREFIX,
  MAX_BLOCKERS,
  MAX_EVIDENCE_BREAKDOWN,
  MAX_RECOMMENDATIONS,
  MAX_STRENGTHS,
} from './launch-readiness-thresholds.js';
import type {
  LaunchReadinessAuthorityAssessment,
  LaunchReadinessDecision,
  LaunchReadinessEvidenceBreakdown,
  LaunchReadinessRecommendation,
  LaunchReadinessState,
} from './launch-readiness-types.js';
import {
  applyAflaLaunchDelegation,
  deriveLaunchDecisionFromAfla,
  resolveAuthoritativeLaunchReadiness,
} from './launch-readiness-consolidation-bridge.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function adjustLaunchConfidenceForAdoption(
  baseScore: number,
  adoption: AdoptionPredictionAssessment,
): number {
  let adjusted = baseScore;
  if (adoption.evidenceConfidenceScore < 50) {
    adjusted -= Math.round((50 - adoption.evidenceConfidenceScore) * 0.4);
  }
  if (adoption.retentionPredictionScore < 70) {
    adjusted -= Math.round((70 - adoption.retentionPredictionScore) * 0.3);
  }
  if (adoption.abandonmentRiskScore > 50) {
    adjusted -= Math.round((adoption.abandonmentRiskScore - 50) * 0.35);
  }
  return clamp(adjusted);
}

function detectCriticalBlockers(report: FounderTestV4ReportWithAdoptionPrediction): string[] {
  const blockers: string[] = [];
  if (report.adoptionPredictionAuthority.blocksLaunchReadiness) {
    blockers.push('Adoption Prediction Authority');
  }
  if (report.realUserRealityAuthority.blocksLaunchReadiness) blockers.push('Real User Reality Authority');
  if (report.realityProofAuthority.blocksLaunchReadiness) blockers.push('Reality-Proof Authority');
  if (report.trustAuthority.blocksLaunchReadiness) blockers.push('Trust Authority');
  if (report.userSuccessAuthority.blocksLaunchReadiness) blockers.push('User Success Authority');
  if (report.customerValueAuthority.blocksLaunchReadiness) blockers.push('Customer Value Authority');
  if (report.firstTimeUserRealityAuthority.blocksLaunchReadiness) {
    blockers.push('First-Time User Reality Authority');
  }
  if (report.promiseFulfillment.contradictedCount > 0) blockers.push('Critical Promise Contradiction');
  if (report.gapDetectionAuthority.criticalGapCount > 0) blockers.push('Critical Gap Detection finding');
  if (report.unknownDiscoveryAuthority.criticalFindingCount > 0) {
    blockers.push('Critical Unknown Discovery finding');
  }
  const blueprintVisual = getLastBlueprintVisualAssessment();
  if (blueprintVisual?.blocksLaunchReadiness) {
    blockers.push('Universal App Blueprint Visual Validation');
  }
  const featureReality = getLastFeatureRealityAssessment();
  if (featureReality?.blocksLaunchReadiness) {
    blockers.push('Feature Reality Validation');
  }
  const universalFeatureContract = getLastUniversalFeatureContractAssessment();
  if (universalFeatureContract?.blocksLaunchReadiness) {
    blockers.push('Universal Feature Contract Intelligence');
  }
  const engineeringReality = getLastEngineeringRealityAssessment();
  if (engineeringReality?.blocksLaunchReadiness) {
    blockers.push('Engineering Reality Authority');
  }
  const founderLaunch = getLastAutonomousFounderLaunchAssessment();
  if (founderLaunch?.blocksLaunch) {
    blockers.push('Autonomous Founder Launch Authority');
  }
  return blockers.slice(0, MAX_BLOCKERS);
}

function hasCriticalFailures(report: FounderTestV4ReportWithAdoptionPrediction): boolean {
  return detectCriticalBlockers(report).length > 0;
}

function buildEvidenceBreakdown(
  authorityResults: LaunchCouncilAuthorityResult[],
): LaunchReadinessEvidenceBreakdown[] {
  return authorityResults
    .filter((result) => result.authorityId in AUTHORITY_WEIGHTS)
    .map((result) => ({
      authorityId: result.authorityId,
      authorityName: result.authorityName,
      weightPercent: Math.round((AUTHORITY_WEIGHTS[result.authorityId] ?? 0) * 1000) / 10,
      score: result.score,
      status: result.status,
      launchBlocker: result.launchBlocker,
    }))
    .slice(0, MAX_EVIDENCE_BREAKDOWN);
}

function calculateLaunchConfidenceScore(authorityResults: LaunchCouncilAuthorityResult[]): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const result of authorityResults) {
    const weight = AUTHORITY_WEIGHTS[result.authorityId];
    if (weight === undefined || result.status === 'NOT_RUN') continue;
    weightedSum += result.score * weight;
    weightTotal += weight;
  }
  if (weightTotal <= 0) return 0;
  return clamp(weightedSum / weightTotal);
}

function collectBlockingAuthorities(
  authorityResults: LaunchCouncilAuthorityResult[],
  criticalBlockers: string[],
): string[] {
  const fromAuthorities = authorityResults.filter((result) => result.launchBlocker).map((result) => result.authorityName);
  return [...new Set([...criticalBlockers, ...fromAuthorities])].slice(0, MAX_BLOCKERS);
}

function collectSupportingAuthorities(authorityResults: LaunchCouncilAuthorityResult[]): string[] {
  return authorityResults
    .filter((result) => result.status === 'PASS' && result.score >= 55)
    .map((result) => result.authorityName)
    .slice(0, MAX_STRENGTHS);
}

function collectStrengths(
  authorityResults: LaunchCouncilAuthorityResult[],
  supportingAuthorities: string[],
): string[] {
  const strengths = supportingAuthorities.map((name) => `${name} passed with supporting evidence`);
  for (const result of authorityResults) {
    if (result.status === 'PASS' && result.score >= 75 && !strengths.some((item) => item.startsWith(result.authorityName))) {
      strengths.push(`${result.authorityName} scored ${result.score}/100`);
    }
  }
  return strengths.slice(0, MAX_STRENGTHS);
}

function deriveRecommendation(input: {
  report: FounderTestV4ReportWithAdoptionPrediction;
  authorityResults: LaunchCouncilAuthorityResult[];
  launchConfidenceScore: number;
  criticalBlockers: string[];
}): LaunchReadinessRecommendation {
  const { report, authorityResults, launchConfidenceScore, criticalBlockers } = input;
  const hasCriticalBlockers = criticalBlockers.length > 0;
  const hasAnyLaunchBlocker = authorityResults.some((result) => result.launchBlocker);
  const participating = authorityResults.filter((result) => result.status !== 'NOT_RUN');
  const passCount = participating.filter((result) => result.status === 'PASS').length;
  const majorityPass = passCount > participating.length / 2;

  if (launchConfidenceScore < CONFIDENCE_INTERNAL_USE || hasCriticalBlockers) {
    return 'NOT_READY_FOR_LAUNCH';
  }

  const publicLaunchReady =
    !hasAnyLaunchBlocker &&
    !hasCriticalFailures(report) &&
    !report.realityProofAuthority.blocksLaunchReadiness &&
    !report.realUserRealityAuthority.blocksLaunchReadiness &&
    !report.adoptionPredictionAuthority.blocksLaunchReadiness &&
    report.realUserRealityAuthority.realUserEvidenceCount > 0 &&
    !report.realUserRealityAuthority.noRealUserEvidence &&
    launchConfidenceScore >= CONFIDENCE_PUBLIC_LAUNCH &&
    majorityPass &&
    !report.trustAuthority.blocksLaunchReadiness &&
    !report.userSuccessAuthority.blocksLaunchReadiness &&
    !report.firstTimeUserRealityAuthority.blocksLaunchReadiness &&
    !report.customerValueAuthority.blocksLaunchReadiness;

  if (publicLaunchReady) return 'READY_FOR_PUBLIC_LAUNCH';

  let recommendation: LaunchReadinessRecommendation;
  if (!hasCriticalBlockers && launchConfidenceScore >= CONFIDENCE_PUBLIC_BETA) {
    recommendation = 'READY_FOR_PUBLIC_BETA';
  } else if (launchConfidenceScore >= CONFIDENCE_PRIVATE_BETA) {
    recommendation = 'READY_FOR_PRIVATE_BETA';
  } else if (launchConfidenceScore >= CONFIDENCE_INTERNAL_USE) {
    recommendation = 'READY_FOR_INTERNAL_USE';
  } else {
    recommendation = 'NOT_READY_FOR_LAUNCH';
  }

  if (
    report.realUserRealityAuthority.noRealUserEvidence ||
    report.realUserRealityAuthority.realUserEvidenceCount === 0
  ) {
    if (recommendation === 'READY_FOR_PUBLIC_BETA') {
      recommendation = 'READY_FOR_PRIVATE_BETA';
    }
  }

  return recommendation;
}

function deriveReadinessState(recommendation: LaunchReadinessRecommendation): LaunchReadinessState {
  switch (recommendation) {
    case 'READY_FOR_PUBLIC_LAUNCH':
    case 'READY_FOR_PUBLIC_BETA':
      return 'READY';
    case 'READY_FOR_PRIVATE_BETA':
      return 'CAUTION';
    case 'READY_FOR_INTERNAL_USE':
      return 'HIGH_RISK';
    case 'NOT_READY_FOR_LAUNCH':
    default:
      return 'BLOCKED';
  }
}

function buildRationale(input: {
  recommendation: LaunchReadinessRecommendation;
  launchConfidenceScore: number;
  blockingAuthorities: string[];
  supportingAuthorities: string[];
}): string {
  const { recommendation, launchConfidenceScore, blockingAuthorities, supportingAuthorities } = input;
  const blockerSummary =
    blockingAuthorities.length > 0
      ? `Blocking authorities: ${blockingAuthorities.slice(0, 4).join(', ')}.`
      : 'No blocking authorities detected from evidence outputs.';
  const supportSummary =
    supportingAuthorities.length > 0
      ? `Supporting authorities: ${supportingAuthorities.slice(0, 4).join(', ')}.`
      : 'Limited supporting authority evidence.';
  return `Launch confidence ${launchConfidenceScore}/100. Recommendation: ${recommendation.replaceAll('_', ' ')}. ${blockerSummary} ${supportSummary}`;
}

function buildRecommendations(input: {
  recommendation: LaunchReadinessRecommendation;
  blockingAuthorities: string[];
  launchConfidenceScore: number;
}): string[] {
  const items: string[] = [];
  if (input.recommendation === 'NOT_READY_FOR_LAUNCH') {
    items.push('Resolve blocking authorities before any external launch.');
    if (input.blockingAuthorities.length) {
      items.push(`Address blockers first: ${input.blockingAuthorities.slice(0, 3).join(', ')}.`);
    }
  } else if (input.recommendation === 'READY_FOR_INTERNAL_USE') {
    items.push('Limit exposure to internal teams until confidence rises above private beta thresholds.');
  } else if (input.recommendation === 'READY_FOR_PRIVATE_BETA') {
    items.push('Launch privately with explicit feedback loops on remaining risks.');
  } else if (input.recommendation === 'READY_FOR_PUBLIC_BETA') {
    items.push('Public beta is supported, but monitor non-critical authority warnings closely.');
  } else {
    items.push('Evidence supports public launch readiness across weighted authorities.');
  }
  if (input.launchConfidenceScore < CONFIDENCE_PUBLIC_LAUNCH) {
    items.push(`Raise weighted launch confidence from ${input.launchConfidenceScore} toward ${CONFIDENCE_PUBLIC_LAUNCH}.`);
  }
  return items.slice(0, MAX_RECOMMENDATIONS);
}

function stableCacheKey(report: FounderTestV4ReportWithAdoptionPrediction, confidence: number): string {
  const digest = createHash('sha256')
    .update(
      [
        report.generatedAt,
        report.verdict,
        report.adoptionPredictionAuthority.adoptionPredictionScore,
        report.adoptionPredictionAuthority.retentionPredictionScore,
        report.adoptionPredictionAuthority.abandonmentRiskScore,
        report.realUserRealityAuthority.noRealUserEvidence,
        report.realUserRealityAuthority.realUserEvidenceCount,
        report.realityProofAuthority.blocksLaunchReadiness,
        report.realityProofAuthority.realityProofScore,
        report.trustAuthority.blocksLaunchReadiness,
        report.userSuccessAuthority.blocksLaunchReadiness,
        report.customerValueAuthority.blocksLaunchReadiness,
        report.firstTimeUserRealityAuthority.blocksLaunchReadiness,
        report.promiseFulfillment.contradictedCount,
        report.gapDetectionAuthority.criticalGapCount,
        report.unknownDiscoveryAuthority.criticalFindingCount,
        confidence,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${LAUNCH_READINESS_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessLaunchReadinessAuthority(
  report: FounderTestV4ReportWithAdoptionPrediction,
): LaunchReadinessAuthorityAssessment {
  const consolidation = resolveAuthoritativeLaunchReadiness();
  const authorityResults = mapEvidenceAuthoritiesFromFounderTestV4(report);
  const evidenceBreakdown = buildEvidenceBreakdown(authorityResults);
  const baseConfidenceScore = calculateLaunchConfidenceScore(authorityResults);
  let launchConfidenceScore = adjustLaunchConfidenceForAdoption(
    baseConfidenceScore,
    report.adoptionPredictionAuthority,
  );
  const criticalBlockers = detectCriticalBlockers(report);
  const blockingAuthorities = collectBlockingAuthorities(authorityResults, criticalBlockers);
  const supportingAuthorities = collectSupportingAuthorities(authorityResults);
  let recommendation = deriveRecommendation({
    report,
    authorityResults,
    launchConfidenceScore,
    criticalBlockers,
  });
  if (consolidation.aflaAssessment) {
    const aflaDecision = deriveLaunchDecisionFromAfla(consolidation.aflaAssessment);
    recommendation = applyAflaLaunchDelegation(recommendation, consolidation.aflaAssessment);
    launchConfidenceScore = aflaDecision.launchConfidenceScore;
  }
  const readinessState = deriveReadinessState(recommendation);
  const rationale = buildRationale({
    recommendation,
    launchConfidenceScore,
    blockingAuthorities,
    supportingAuthorities,
  });
  const blockers = blockingAuthorities.slice(0, MAX_BLOCKERS);
  const strengths = collectStrengths(authorityResults, supportingAuthorities);
  const recommendations = buildRecommendations({
    recommendation,
    blockingAuthorities,
    launchConfidenceScore,
  });
  const evidenceCount = authorityResults.filter((result) => result.status !== 'NOT_RUN').length;
  const decision: LaunchReadinessDecision = {
    recommendation,
    confidence: launchConfidenceScore,
    evidenceCount,
    blockingAuthorities: blockers,
    supportingAuthorities,
    rationale,
  };

  const assessment: LaunchReadinessAuthorityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    launchReadinessAuthorityScore: launchConfidenceScore,
    launchConfidenceScore,
    blockingAuthorityCount: blockers.length,
    supportingAuthorityCount: supportingAuthorities.length,
    recommendation,
    readinessState,
    rationale,
    blockers,
    strengths,
    recommendations,
    decision,
    evidenceBreakdown,
    cacheKey: stableCacheKey(report, launchConfidenceScore),
  };

  recordLaunchReadinessAssessment(assessment);
  return assessment;
}

export function buildLaunchReadinessAuthorityArtifacts(
  report: FounderTestV4ReportWithAdoptionPrediction,
): {
  launchReadinessAuthority: LaunchReadinessAuthorityAssessment;
  launchReadinessAuthorityReportMarkdown: string;
} {
  const launchReadinessAuthority = assessLaunchReadinessAuthority(report);
  return {
    launchReadinessAuthority,
    launchReadinessAuthorityReportMarkdown: buildLaunchReadinessReportMarkdown(
      launchReadinessAuthority,
      report.generatedAt,
    ),
  };
}
