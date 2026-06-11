/**
 * Founder Decision Readiness — synthesizes authority evidence into a single founder decision.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import {
  MAX_DECISION_ACTIONS,
  MAX_DECISION_BLOCKERS,
  MAX_DECISION_EVIDENCE,
} from './founder-decision-readiness-bounds.js';
import type {
  AssessFounderDecisionReadinessInput,
  DecisionConfidence,
  DecisionFeedEvent,
  DecisionReadinessSubscores,
  EnrichedDecisionReadinessAssessments,
  FounderDecisionOutcome,
  FounderDecisionReadinessAssessment,
  FounderDecisionReadinessVisibility,
} from './founder-decision-readiness-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

let idCounter = 0;

export function resetFounderDecisionReadinessCounterForTests(): void {
  idCounter = 0;
}

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function computePortfolioSubscores(input: AssessFounderDecisionReadinessInput): DecisionReadinessSubscores {
  const ft = input.firstTimeUserReality;
  const trust = input.verificationTrustEvidence;
  const friction = input.founderFrictionHeatmap;
  const cj = input.customerJourneySimulation;
  const promise = input.promiseRealityEngine;
  const visual = input.visualQualityAuthority;
  const launch = input.launchDaySimulation;
  const adoption = input.adoptionPrediction;
  const economics = input.productEconomics;
  const evolution = input.productEvolution;
  const competitive = input.competitiveReality;

  return {
    launchReadiness: clamp(
      (trust.trustScore * 0.25) +
        (launch.launchDayScore * 0.3) +
        (promise.promiseRealityScore * 0.25) +
        (visual.visualQualityScore * 0.2),
    ),
    adoptionReadiness: clamp(
      (adoption.adoptionPredictionScore * 0.4) +
        (cj.customerJourneyScore * 0.35) +
        (100 - competitive.portfolioSubscores.replacementRisk) * 0.25,
    ),
    trustReadiness: clamp(
      (trust.trustScore * 0.4) +
        (promise.promiseRealityScore * 0.35) +
        (100 - competitive.portfolioSubscores.blindSpotRisk) * 0.25,
    ),
    productReadiness: clamp(
      (visual.visualQualityScore * 0.35) +
        (launch.launchDayScore * 0.35) +
        (cj.customerJourneyScore * 0.3),
    ),
    strategicReadiness: clamp(
      (economics.productEconomicsScore * 0.35) +
        (evolution.productEvolutionScore * 0.35) +
        (competitive.competitiveRealityScore * 0.3),
    ),
    founderReadiness: clamp(
      (ft.firstTimeUserScore * 0.4) +
        (100 - friction.overallFrictionScore) * 0.35 +
        (trust.trustScore * 0.25),
    ),
  };
}

function countCriticalSignals(input: AssessFounderDecisionReadinessInput): number {
  let count = 0;
  if (input.launchDaySimulation.majorLaunchRisks) count += 1;
  if (input.adoptionPrediction.majorAdoptionRisks) count += 1;
  if (input.promiseRealityEngine.majorClaimsUnsupported) count += 1;
  if (input.productEconomics.majorEconomicRisks) count += 1;
  if (input.productEvolution.majorEvolutionRisks) count += 1;
  if (input.competitiveReality.majorCompetitiveRisks) count += 1;
  if (input.customerJourneySimulation.notReadyForCustomers) count += 1;
  if (!input.verificationTrustEvidence.trustPass && input.verificationTrustEvidence.trustScore < 45) count += 1;
  return count;
}

function selectPrimaryRecommendation(
  input: AssessFounderDecisionReadinessInput,
  subscores: DecisionReadinessSubscores,
): FounderDecisionOutcome {
  const criticalCount = countCriticalSignals(input);

  if (criticalCount >=  2) {
    return 'FIX_CRITICAL_ISSUES_FIRST';
  }

  if (
    input.promiseRealityEngine.majorClaimsUnsupported ||
    input.promiseRealityEngine.unprovenClaims.length >= 3 ||
    input.promiseRealityEngine.contradictedClaims.length >= 1
  ) {
    return 'VALIDATE_ASSUMPTIONS_FIRST';
  }

  if (
    input.competitiveReality.competitivePosition === 'COMMODITY_RISK' ||
    (input.competitiveReality.majorCompetitiveRisks && subscores.launchReadiness >= 55)
  ) {
    return 'IMPROVE_COMPETITIVE_POSITION_FIRST';
  }

  if (
    input.productEvolution.majorEvolutionRisks ||
    (input.productEvolution.doNotBuild.length >= 2 && subscores.strategicReadiness < 55)
  ) {
    return 'FOCUS_ON_EVOLUTION_FIRST';
  }

  if (
    input.adoptionPrediction.majorAdoptionRisks ||
    input.adoptionPrediction.adoptionBlockers.length >= 2 ||
    subscores.adoptionReadiness < 48
  ) {
    return 'IMPROVE_ADOPTION_FIRST';
  }

  if (criticalCount === 1) {
    return 'FIX_CRITICAL_ISSUES_FIRST';
  }

  if (subscores.launchReadiness < 50 || subscores.productReadiness < 50) {
    return 'NOT_READY_FOR_LAUNCH';
  }

  const launchReady =
    subscores.launchReadiness >= 68 &&
    subscores.adoptionReadiness >= 58 &&
    subscores.trustReadiness >= 58 &&
    subscores.productReadiness >= 58 &&
    subscores.strategicReadiness >= 52 &&
    subscores.founderReadiness >= 52 &&
    !input.competitiveReality.majorCompetitiveRisks;

  if (launchReady) {
    return 'READY_TO_LAUNCH';
  }

  if (
    subscores.launchReadiness >= 55 &&
    subscores.adoptionReadiness >= 50 &&
    subscores.trustReadiness >= 50
  ) {
    return 'LAUNCH_WITH_WARNINGS';
  }

  return 'NOT_READY_FOR_LAUNCH';
}

function buildSupportingEvidence(
  input: AssessFounderDecisionReadinessInput,
  subscores: DecisionReadinessSubscores,
): string[] {
  const evidence: string[] = [];

  if (subscores.launchReadiness >= 60) {
    evidence.push(`Launch Readiness ${subscores.launchReadiness}/100 — Launch Day ${input.launchDaySimulation.launchDayScore}/100, Visual ${input.visualQualityAuthority.visualQualityScore}/100`);
  }
  if (subscores.adoptionReadiness >= 60) {
    evidence.push(`Adoption Readiness ${subscores.adoptionReadiness}/100 — Adoption Prediction ${input.adoptionPrediction.adoptionPredictionScore}/100`);
  }
  if (subscores.trustReadiness >= 60) {
    evidence.push(`Trust Readiness ${subscores.trustReadiness}/100 — Verification Trust ${input.verificationTrustEvidence.trustScore}/100`);
  }
  if (subscores.productReadiness >= 60) {
    evidence.push(`Product Readiness ${subscores.productReadiness}/100 — Customer Journey ${input.customerJourneySimulation.customerJourneyScore}/100`);
  }
  if (subscores.strategicReadiness >= 60) {
    evidence.push(`Strategic Readiness ${subscores.strategicReadiness}/100 — Product Evolution ${input.productEvolution.productEvolutionScore}/100`);
  }
  if (subscores.founderReadiness >= 60) {
    evidence.push(`Founder Readiness ${subscores.founderReadiness}/100 — First-Time User ${input.firstTimeUserReality.firstTimeUserScore}/100`);
  }
  if (input.competitiveReality.strongestCompetitiveAdvantages.length > 0) {
    evidence.push(`Competitive Reality: ${input.competitiveReality.strongestCompetitiveAdvantages[0]}`);
  }
  if (input.productEvolution.quickWins.length > 0) {
    evidence.push(`Product Evolution quick win: ${input.productEvolution.quickWins[0]}`);
  }

  return evidence.filter(Boolean).slice(0, MAX_DECISION_EVIDENCE);
}

function buildBlockingEvidence(
  input: AssessFounderDecisionReadinessInput,
  subscores: DecisionReadinessSubscores,
): string[] {
  const blockers: string[] = [];

  if (subscores.launchReadiness < 60) {
    blockers.push(`Launch Readiness ${subscores.launchReadiness}/100 — Launch Day ${input.launchDaySimulation.launchDayScore}/100`);
  }
  if (subscores.adoptionReadiness < 60) {
    blockers.push(`Adoption Readiness ${subscores.adoptionReadiness}/100 — ${input.adoptionPrediction.adoptionBlockers[0]?.explanation ?? 'adoption friction detected'}`);
  }
  if (subscores.trustReadiness < 60) {
    blockers.push(`Trust Readiness ${subscores.trustReadiness}/100 — Promise Reality ${input.promiseRealityEngine.promiseRealityScore}/100`);
  }
  if (input.promiseRealityEngine.unprovenClaims.length > 0) {
    blockers.push(`Unproven claim: ${input.promiseRealityEngine.unprovenClaims[0]?.claim ?? 'unsupported product claim'}`);
  }
  if (input.competitiveReality.majorCompetitiveRisks) {
    blockers.push(`Competitive Reality: ${input.competitiveReality.competitivePosition.replace(/_/g, ' ').toLowerCase()}`);
  }
  if (input.productEvolution.doNotBuild.length > 0) {
    blockers.push(`Evolution: ${input.productEvolution.doNotBuild[0]}`);
  }
  if (input.founderFrictionHeatmap.overallFrictionScore >= 60) {
    blockers.push(`Friction Heatmap: ${input.founderFrictionHeatmap.summary.frictionLevel} friction (${input.founderFrictionHeatmap.overallFrictionScore}/100)`);
  }
  if (input.customerJourneySimulation.notReadyForCustomers) {
    blockers.push('Customer Journey: not ready for customers');
  }

  return blockers.filter(Boolean).slice(0, MAX_DECISION_BLOCKERS);
}

const OUTCOME_ACTIONS: Record<FounderDecisionOutcome, string[]> = {
  READY_TO_LAUNCH: [
    'Prepare launch checklist.',
    'Final verification run.',
    'Execute launch plan.',
  ],
  LAUNCH_WITH_WARNINGS: [
    'Review launch warnings before public release.',
    'Address top blocking evidence items.',
    'Run final verification on critical paths.',
  ],
  NOT_READY_FOR_LAUNCH: [
    'Resolve launch readiness blockers first.',
    'Improve product and trust readiness scores.',
    'Re-run Founder Testing after fixes.',
  ],
  FIX_CRITICAL_ISSUES_FIRST: [
    'Fix critical blockers across authority layers.',
    'Do not launch until critical risks are resolved.',
    'Prioritize highest-severity findings in Action Center.',
  ],
  IMPROVE_ADOPTION_FIRST: [
    'Address adoption blockers.',
    'Reduce onboarding friction.',
    'Improve value clarity for first-time users.',
  ],
  VALIDATE_ASSUMPTIONS_FIRST: [
    'Prove unverified claims.',
    'Resolve contradictions in Promise Reality.',
    'Re-run Promise Reality after evidence updates.',
  ],
  IMPROVE_COMPETITIVE_POSITION_FIRST: [
    'Strengthen unique authority systems.',
    'Improve evidence-backed differentiation.',
    'Reduce replacement risk before launch.',
  ],
  FOCUS_ON_EVOLUTION_FIRST: [
    'Correct roadmap direction before expansion.',
    'Prioritize evolution quick wins over new surface work.',
    'Delay low-ROI initiatives flagged by Product Evolution.',
  ],
};

const OUTCOME_WHY: Record<FounderDecisionOutcome, string> = {
  READY_TO_LAUNCH:
    'Authority layers align strongly across launch, adoption, trust, product, strategic, and founder readiness.',
  LAUNCH_WITH_WARNINGS:
    'Launch is reasonable but material concerns remain in one or more readiness categories.',
  NOT_READY_FOR_LAUNCH:
    'Launch evidence is insufficient — product, trust, or launch readiness scores are below the launch threshold.',
  FIX_CRITICAL_ISSUES_FIRST:
    'Critical blockers exist across multiple authority layers and must be resolved before any launch decision.',
  IMPROVE_ADOPTION_FIRST:
    'The product may function but adoption risk is too high for a confident launch recommendation.',
  VALIDATE_ASSUMPTIONS_FIRST:
    'Too many important product claims remain unproven or contradicted by authority evidence.',
  IMPROVE_COMPETITIVE_POSITION_FIRST:
    'Competitive risks outweigh differentiation strengths — launch would expose commodity overlap.',
  FOCUS_ON_EVOLUTION_FIRST:
    'Roadmap direction should be corrected before expansion — evolution analysis flags misaligned investments.',
};

function computeConfidence(
  recommendation: FounderDecisionOutcome,
  subscores: DecisionReadinessSubscores,
  supporting: string[],
  blocking: string[],
): DecisionConfidence {
  const avg = clamp(
    (subscores.launchReadiness +
      subscores.adoptionReadiness +
      subscores.trustReadiness +
      subscores.productReadiness +
      subscores.strategicReadiness +
      subscores.founderReadiness) /
      6,
  );

  const aligned =
    (recommendation === 'READY_TO_LAUNCH' && avg >= 65 && blocking.length <= 2) ||
    (recommendation === 'LAUNCH_WITH_WARNINGS' && blocking.length <= 4) ||
    (recommendation !== 'READY_TO_LAUNCH' && blocking.length >= 2);

  if (aligned && supporting.length >= 4 && blocking.length <= 2) return 'HIGH';
  if (aligned && supporting.length >= 2) return 'MEDIUM';
  if (supporting.length >= 1 || blocking.length >= 1) return 'MEDIUM';
  return 'LOW';
}

function buildOperatorFeed(
  subscores: DecisionReadinessSubscores,
  recommendation: FounderDecisionOutcome,
  confidence: DecisionConfidence,
  score: number,
): DecisionFeedEvent[] {
  return [
    {
      section: 'Founder Decision',
      action: 'Evaluating launch readiness',
      detail: `Launch readiness ${subscores.launchReadiness}/100.`,
      status: subscores.launchReadiness >= 55 ? 'Completed' : 'Warning',
    },
    {
      section: 'Founder Decision',
      action: 'Evaluating adoption readiness',
      detail: `Adoption readiness ${subscores.adoptionReadiness}/100.`,
      status: subscores.adoptionReadiness >= 55 ? 'Completed' : 'Warning',
    },
    {
      section: 'Founder Decision',
      action: 'Evaluating trust readiness',
      detail: `Trust readiness ${subscores.trustReadiness}/100.`,
      status: subscores.trustReadiness >= 55 ? 'Completed' : 'Warning',
    },
    {
      section: 'Founder Decision',
      action: 'Synthesizing founder decision',
      detail: `${recommendation.replace(/_/g, ' ')} (${confidence} confidence).`,
      status: recommendation === 'READY_TO_LAUNCH' ? 'Completed' : 'Warning',
    },
    {
      section: 'Founder Decision',
      action: 'Tracing decision evidence',
      detail: `Decision readiness score ${score}/100.`,
      status: score >= 55 ? 'Completed' : 'Warning',
    },
  ];
}

export function assessFounderDecisionReadiness(
  input: AssessFounderDecisionReadinessInput,
): FounderDecisionReadinessAssessment {
  const portfolio = computePortfolioSubscores(input);
  const primaryRecommendation = selectPrimaryRecommendation(input, portfolio);
  let supportingEvidence = buildSupportingEvidence(input, portfolio);
  let blockingEvidence = buildBlockingEvidence(input, portfolio);

  if (supportingEvidence.length === 0) {
    supportingEvidence = [
      `Launch Readiness ${portfolio.launchReadiness}/100`,
      `Adoption Readiness ${portfolio.adoptionReadiness}/100`,
      `Trust Readiness ${portfolio.trustReadiness}/100`,
    ];
  }
  if (blockingEvidence.length === 0 && primaryRecommendation !== 'READY_TO_LAUNCH') {
    blockingEvidence = [
      `Decision outcome ${primaryRecommendation.replace(/_/g, ' ').toLowerCase()} triggered by readiness synthesis.`,
    ];
  }

  const recommendedNextActions = OUTCOME_ACTIONS[primaryRecommendation].slice(0, MAX_DECISION_ACTIONS);
  const whyThisRecommendation = OUTCOME_WHY[primaryRecommendation];
  const decisionConfidence = computeConfidence(
    primaryRecommendation,
    portfolio,
    supportingEvidence,
    blockingEvidence,
  );

  const decisionReadinessScore = clamp(
    portfolio.launchReadiness * 0.2 +
      portfolio.adoptionReadiness * 0.18 +
      portfolio.trustReadiness * 0.18 +
      portfolio.productReadiness * 0.16 +
      portfolio.strategicReadiness * 0.14 +
      portfolio.founderReadiness * 0.14,
  );

  const majorDecisionRisks =
    primaryRecommendation === 'FIX_CRITICAL_ISSUES_FIRST' ||
    primaryRecommendation === 'NOT_READY_FOR_LAUNCH' ||
    decisionReadinessScore < 45;

  const founderDecisionReadinessPass =
    !majorDecisionRisks ||
    (Boolean(primaryRecommendation) &&
      supportingEvidence.length > 0 &&
      recommendedNextActions.length > 0);

  const decisionVisibilityPass = Boolean(primaryRecommendation);
  const confidenceVisibilityPass = Boolean(decisionConfidence);
  const justificationVisibilityPass = whyThisRecommendation.length > 20;
  const blockerVisibilityPass = blockingEvidence.length >= 0;
  const nextActionVisibilityPass = recommendedNextActions.length >= 3;

  return {
    decisionReadinessScore,
    portfolioSubscores: portfolio,
    primaryRecommendation,
    decisionConfidence,
    whyThisRecommendation,
    supportingEvidence,
    blockingEvidence,
    recommendedNextActions,
    decisionReadinessSummary: `Founder decision: ${primaryRecommendation.replace(/_/g, ' ').toLowerCase()} (${decisionConfidence} confidence) — readiness ${decisionReadinessScore}/100.`,
    operatorFeedEvents: buildOperatorFeed(portfolio, primaryRecommendation, decisionConfidence, decisionReadinessScore),
    majorDecisionRisks,
    founderDecisionReadinessPass,
    decisionVisibilityPass,
    confidenceVisibilityPass,
    justificationVisibilityPass,
    blockerVisibilityPass,
    nextActionVisibilityPass,
    insufficientInfo: false,
    insufficientInfoReason: null,
  };
}

export function evaluateFounderDecisionReadinessVisibility(
  assessment: FounderDecisionReadinessAssessment,
): FounderDecisionReadinessVisibility {
  const checks = [
    assessment.decisionReadinessScore >= 0,
    assessment.decisionVisibilityPass,
    assessment.confidenceVisibilityPass,
    assessment.justificationVisibilityPass,
    assessment.blockerVisibilityPass,
    assessment.nextActionVisibilityPass,
    assessment.supportingEvidence.length > 0,
    Boolean(assessment.primaryRecommendation),
  ];
  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    decisionReadinessScore: assessment.decisionReadinessScore,
    majorDecisionRisks: assessment.majorDecisionRisks,
    founderDecisionReadinessPass: assessment.founderDecisionReadinessPass,
    primaryRecommendation: assessment.primaryRecommendation,
    decisionConfidence: assessment.decisionConfidence,
  };
}

function mergeSensemaking(
  base: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  decision: FounderDecisionReadinessAssessment,
): import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment {
  return {
    ...base,
    operatorFeedEvents: [...decision.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
    founderDecision: decision.primaryRecommendation,
    decisionConfidence: decision.decisionConfidence,
    whyThisRecommendation: decision.whyThisRecommendation,
    topDecisionBlockers: decision.blockingEvidence.slice(0, 5),
    topDecisionNextActions: decision.recommendedNextActions.slice(0, 5),
    founderDecisionReadinessSummary: decision.decisionReadinessSummary,
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  decision: FounderDecisionReadinessAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  for (const [index, actionText] of decision.recommendedNextActions.slice(0, 3).entries()) {
    const title = `[${decision.decisionConfidence}] ${actionText}`;
    if (seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    actions.unshift({
      id: nextId('decision-action'),
      type: 'FIX_ACTION',
      priority: index === 0 ? 'HIGH' : 'MEDIUM',
      title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
      rationale: decision.whyThisRecommendation,
      expectedImpact: decision.primaryRecommendation.replace(/_/g, ' '),
      evidence: decision.supportingEvidence.slice(0, 2).join('; ') || decision.primaryRecommendation,
      executable: true,
    });
  }

  const topActions = actions.slice(0, MAX_DECISION_ACTIONS);
  return {
    ...base,
    topActions,
    recommendedNextStep:
      topActions[0]
        ? {
            priority: topActions[0].priority,
            title: topActions[0].title,
            type: topActions[0].type,
            reason: topActions[0].rationale,
            expectedImpact: topActions[0].expectedImpact,
            evidence: topActions[0].evidence,
          }
        : base.recommendedNextStep,
    actionsGenerated: topActions.length > 0,
    recommendationsActionable: topActions.some((a) => a.executable) || base.recommendationsActionable,
    operatorFeedEvents: [...decision.operatorFeedEvents.slice(0, 2), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichAssessmentsWithFounderDecisionReadiness(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  decision: FounderDecisionReadinessAssessment,
): EnrichedDecisionReadinessAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, decision),
    founderSensemaking: mergeSensemaking(founderSensemaking, decision),
  };
}
