/**
 * Digital Founder Board — executive aggregation layer (no new evidence or decisions).
 */

import {
  MAX_BOARD_ACTIONS,
  MAX_BOARD_OPPORTUNITIES,
  MAX_BOARD_RISKS,
} from './digital-founder-board-bounds.js';
import type {
  AssessDigitalFounderBoardInput,
  BoardFeedEvent,
  BoardStatusClassification,
  DigitalFounderBoardAssessment,
  DigitalFounderBoardVisibility,
  EnrichedBoardAssessments,
} from './digital-founder-board-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function classifyBoardStatus(input: AssessDigitalFounderBoardInput): BoardStatusClassification {
  const decision = input.founderDecisionReadiness.primaryRecommendation;

  if (
    decision === 'FIX_CRITICAL_ISSUES_FIRST' ||
    (decision === 'NOT_READY_FOR_LAUNCH' && input.founderDecisionReadiness.majorDecisionRisks)
  ) {
    return 'CRITICAL_INTERVENTION_REQUIRED';
  }

  if (
    decision === 'VALIDATE_ASSUMPTIONS_FIRST' ||
    decision === 'IMPROVE_ADOPTION_FIRST' ||
    decision === 'IMPROVE_COMPETITIVE_POSITION_FIRST' ||
    decision === 'FOCUS_ON_EVOLUTION_FIRST' ||
    decision === 'NOT_READY_FOR_LAUNCH'
  ) {
    return 'ACTION_REQUIRED';
  }

  if (decision === 'LAUNCH_WITH_WARNINGS') {
    return 'HEALTHY_WITH_WARNINGS';
  }

  return 'HEALTHY';
}

function buildHighestPriorityRisks(input: AssessDigitalFounderBoardInput): string[] {
  const risks: string[] = [];

  for (const claim of input.promiseRealityEngine.unprovenClaims.slice(0, 2)) {
    risks.push(`Unproven claim: ${claim.claim}`);
  }
  for (const claim of input.promiseRealityEngine.contradictedClaims.slice(0, 1)) {
    risks.push(`Contradicted claim: ${claim.claim}`);
  }
  for (const blocker of input.adoptionPrediction.adoptionBlockers.slice(0, 2)) {
    risks.push(`Adoption blocker: ${blocker.explanation}`);
  }
  for (const risk of input.competitiveReality.competitiveBlindSpots.slice(0, 2)) {
    risks.push(`Competitive blind spot: ${risk}`);
  }
  for (const weakness of input.launchDaySimulation.launchWeaknesses.slice(0, 1)) {
    risks.push(`Launch blocker: ${weakness}`);
  }
  if (input.verificationTrustEvidence.blackBoxRisk) {
    risks.push('Trust risk: verification may feel like a black box');
  }
  if (input.promiseRealityEngine.majorClaimsUnsupported) {
    risks.push('Trust risk: major product claims lack reality support');
  }

  return [...new Set(risks.filter((r) => r && !ARCH_LEAK.test(r)))].slice(0, MAX_BOARD_RISKS);
}

function buildRecommendedActions(input: AssessDigitalFounderBoardInput): string[] {
  const fromDecision = input.founderDecisionReadiness.recommendedNextActions.slice(0, 3);
  const fromActionCenter = input.founderActionCenter.topActions.slice(0, 3).map((a) => a.title);
  return [...new Set([...fromDecision, ...fromActionCenter])].slice(0, MAX_BOARD_ACTIONS);
}

function buildOperatorFeed(
  status: BoardStatusClassification,
  decision: string,
  riskCount: number,
): BoardFeedEvent[] {
  return [
    {
      section: 'Digital Founder Board',
      action: 'Loading executive summary',
      detail: `Founder decision: ${decision.replace(/_/g, ' ')}.`,
      status: status === 'HEALTHY' ? 'Completed' : 'Warning',
    },
    {
      section: 'Digital Founder Board',
      action: 'Aggregating product health',
      detail: 'Six readiness dimensions from Founder Decision Readiness.',
      status: 'Completed',
    },
    {
      section: 'Digital Founder Board',
      action: 'Surfacing risk board',
      detail: `${riskCount} highest-priority risk(s) visible.`,
      status: riskCount === 0 ? 'Completed' : 'Warning',
    },
    {
      section: 'Digital Founder Board',
      action: 'Surfacing opportunity board',
      detail: 'Quick wins, ROI, and roadmap intelligence aggregated.',
      status: 'Completed',
    },
    {
      section: 'Digital Founder Board',
      action: 'Classifying board status',
      detail: status.replace(/_/g, ' '),
      status: status === 'CRITICAL_INTERVENTION_REQUIRED' ? 'Blocked' : 'Completed',
    },
  ];
}

export function assembleDigitalFounderBoard(input: AssessDigitalFounderBoardInput): DigitalFounderBoardAssessment {
  const decision = input.founderDecisionReadiness;
  const boardStatus = classifyBoardStatus(input);
  const highestPriorityRisks = buildHighestPriorityRisks(input);
  const blockingEvidence = decision.blockingEvidence.slice(0, MAX_BOARD_RISKS);
  const recommendedActions = buildRecommendedActions(input);

  const executiveSummary = {
    founderDecision: decision.primaryRecommendation,
    decisionConfidence: decision.decisionConfidence,
    whyThisRecommendation: decision.whyThisRecommendation,
    topNextActions: decision.recommendedNextActions.slice(0, 3),
  };

  const productHealth = { ...decision.portfolioSubscores };

  const opportunityBoard = {
    quickWins: input.productEvolution.quickWins.slice(0, MAX_BOARD_OPPORTUNITIES),
    strategicInvestments: input.productEvolution.strategicInvestments.slice(0, MAX_BOARD_OPPORTUNITIES),
    highestRoiOpportunities: input.productEconomics.highestRoiOpportunities.slice(0, MAX_BOARD_OPPORTUNITIES),
    recommendedNextInvestments: input.productEvolution.recommendedNextInvestments.slice(0, MAX_BOARD_OPPORTUNITIES),
  };

  const competitivePosition = {
    competitiveClassification: input.competitiveReality.competitivePosition.replace(/_/g, ' '),
    strongestAdvantages: input.competitiveReality.strongestCompetitiveAdvantages.slice(0, 4),
    replacementRisks: input.competitiveReality.highReplacementRisks.slice(0, 4),
    strategicDefensibility: input.competitiveReality.strategicDefensibility.slice(0, 4),
  };

  const trustValidation = {
    verificationTrustScore: input.verificationTrustEvidence.trustScore,
    promiseRealityScore: input.promiseRealityEngine.promiseRealityScore,
    unprovenClaims: input.promiseRealityEngine.unprovenClaims.slice(0, 4).map((c) => c.claim),
    contradictedClaims: input.promiseRealityEngine.contradictedClaims.slice(0, 4).map((c) => c.claim),
    realityConfidence: input.promiseRealityEngine.promiseRealityPass
      ? 'Strong promise-reality alignment'
      : input.promiseRealityEngine.majorClaimsUnsupported
        ? 'Major claims unsupported — validate before launch'
        : 'Partial promise-reality alignment',
  };

  const founderExperience = {
    firstTimeUserScore: input.firstTimeUserReality.firstTimeUserScore,
    frictionScore: input.founderFrictionHeatmap.overallFrictionScore,
    customerJourneyScore: input.customerJourneySimulation.customerJourneyScore,
    launchDayScore: input.launchDaySimulation.launchDayScore,
    adoptionPredictionScore: input.adoptionPrediction.adoptionPredictionScore,
  };

  const roadmapIntelligence = {
    buildNext: [
      ...input.productEvolution.recommendedNextInvestments.slice(0, 3),
      ...input.productEvolution.highestPriorityOpportunities.slice(0, 2),
    ].slice(0, MAX_BOARD_OPPORTUNITIES),
    buildLater: input.productEvolution.deferredOpportunities.slice(0, MAX_BOARD_OPPORTUNITIES),
    doNotBuild: [
      ...input.productEvolution.doNotBuild.slice(0, 3),
      ...input.productEconomics.lowestRoiOpportunities.slice(0, 2),
    ].slice(0, MAX_BOARD_OPPORTUNITIES),
  };

  const executiveSummaryVisibilityPass = Boolean(executiveSummary.founderDecision && executiveSummary.whyThisRecommendation);
  const decisionVisibilityPass = Boolean(executiveSummary.founderDecision);
  const riskBoardVisibilityPass = highestPriorityRisks.length > 0 || blockingEvidence.length > 0;
  const opportunityBoardVisibilityPass =
    opportunityBoard.quickWins.length > 0 ||
    opportunityBoard.highestRoiOpportunities.length > 0 ||
    opportunityBoard.recommendedNextInvestments.length > 0;
  const roadmapPanelVisibilityPass =
    roadmapIntelligence.buildNext.length > 0 || roadmapIntelligence.doNotBuild.length > 0;
  const trustPanelVisibilityPass =
    trustValidation.unprovenClaims.length >= 0 &&
    Number.isFinite(trustValidation.verificationTrustScore);
  const competitivePanelVisibilityPass = competitivePosition.strongestAdvantages.length > 0;
  const boardStatusVisibilityPass = Boolean(boardStatus);
  const recommendedActionsVisibilityPass = recommendedActions.length >= 3;

  const majorBoardRisks =
    boardStatus === 'CRITICAL_INTERVENTION_REQUIRED' ||
    (boardStatus === 'ACTION_REQUIRED' && highestPriorityRisks.length >= 3);

  const digitalFounderBoardPass =
    executiveSummaryVisibilityPass &&
    decisionVisibilityPass &&
    riskBoardVisibilityPass &&
    opportunityBoardVisibilityPass &&
    roadmapPanelVisibilityPass &&
    trustPanelVisibilityPass &&
    competitivePanelVisibilityPass &&
    boardStatusVisibilityPass &&
    recommendedActionsVisibilityPass;

  return {
    boardStatus,
    executiveSummary,
    productHealth,
    riskBoard: {
      highestPriorityRisks,
      blockingEvidence,
    },
    opportunityBoard,
    competitivePosition,
    trustValidation,
    founderExperience,
    roadmapIntelligence,
    recommendedActions,
    digitalFounderBoardSummary: `Digital Founder Board — ${boardStatus.replace(/_/g, ' ').toLowerCase()}: ${decision.primaryRecommendation.replace(/_/g, ' ').toLowerCase()} (${decision.decisionConfidence} confidence).`,
    operatorFeedEvents: buildOperatorFeed(boardStatus, decision.primaryRecommendation, highestPriorityRisks.length),
    majorBoardRisks,
    digitalFounderBoardPass,
    executiveSummaryVisibilityPass,
    decisionVisibilityPass,
    riskBoardVisibilityPass,
    opportunityBoardVisibilityPass,
    roadmapPanelVisibilityPass,
    trustPanelVisibilityPass,
    competitivePanelVisibilityPass,
    boardStatusVisibilityPass,
    recommendedActionsVisibilityPass,
    insufficientInfo: false,
    insufficientInfoReason: null,
  };
}

export function evaluateDigitalFounderBoardVisibility(
  assessment: DigitalFounderBoardAssessment,
): DigitalFounderBoardVisibility {
  const checks = [
    assessment.executiveSummaryVisibilityPass,
    assessment.decisionVisibilityPass,
    assessment.riskBoardVisibilityPass,
    assessment.opportunityBoardVisibilityPass,
    assessment.roadmapPanelVisibilityPass,
    assessment.trustPanelVisibilityPass,
    assessment.competitivePanelVisibilityPass,
    assessment.boardStatusVisibilityPass,
    assessment.recommendedActionsVisibilityPass,
  ];
  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    boardStatus: assessment.boardStatus,
    majorBoardRisks: assessment.majorBoardRisks,
    digitalFounderBoardPass: assessment.digitalFounderBoardPass,
    panelCount: 8,
  };
}

export function enrichSensemakingWithDigitalFounderBoard(
  founderSensemaking: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  board: DigitalFounderBoardAssessment,
): EnrichedBoardAssessments {
  return {
    founderSensemaking: {
      ...founderSensemaking,
      operatorFeedEvents: [...board.operatorFeedEvents.slice(0, 2), ...founderSensemaking.operatorFeedEvents].slice(0, 12),
      boardStatus: board.boardStatus,
      digitalFounderBoardSummary: board.digitalFounderBoardSummary,
      topBoardRisks: board.riskBoard.highestPriorityRisks.slice(0, 5),
      topBoardOpportunities: [
        ...board.opportunityBoard.quickWins.slice(0, 2),
        ...board.opportunityBoard.highestRoiOpportunities.slice(0, 2),
      ].slice(0, 5),
    },
  };
}
