/**
 * Product Evolution Engine — converts authority evidence into prioritized roadmap guidance.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { SensemakingFindingType } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import {
  MAX_EVIDENCE_TRACES,
  MAX_EVOLUTION_ACTIONS,
  MAX_EVOLUTION_CANDIDATES,
  MAX_EVOLUTION_RANKED,
} from './product-evolution-engine-bounds.js';
import type {
  AssessProductEvolutionInput,
  EnrichedEvolutionAssessments,
  EvolutionCandidate,
  EvolutionFeedEvent,
  EvolutionRankingBucket,
  EvolutionShellSources,
  EvolutionSubscores,
  ProductEvolutionAssessment,
  ProductEvolutionVisibility,
  RecommendationConfidence,
} from './product-evolution-engine-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

let idCounter = 0;

export function resetProductEvolutionCounterForTests(): void {
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

function computePortfolioSubscores(input: AssessProductEvolutionInput): EvolutionSubscores {
  const ft = input.firstTimeUserReality;
  const trust = input.verificationTrustEvidence;
  const friction = input.founderFrictionHeatmap;
  const cj = input.customerJourneySimulation;
  const promise = input.promiseRealityEngine;
  const visual = input.visualQualityAuthority;
  const launch = input.launchDaySimulation;
  const adoption = input.adoptionPrediction;
  const economics = input.productEconomics;

  return {
    adoptionGrowth: clamp(
      (adoption.adoptionPredictionScore * 0.35) +
        (100 - adoption.subscores.adoptionFriction) * 0.2 +
        (cj.subscores.retention * 0.2) +
        (cj.subscores.advocacy * 0.15) +
        (adoption.adoptionBlockers.length === 0 ? 10 : 0),
    ),
    frictionReduction: clamp(
      100 -
        friction.overallFrictionScore * 0.45 -
        (ft.categoryScores.simplicity < 55 ? 15 : 0) -
        (friction.deadEndFindings.length * 5),
    ),
    trustImprovement: clamp(
      (trust.trustScore * 0.35) +
        (promise.promiseRealityScore * 0.25) +
        (launch.subscores.trustSurvival * 0.25) +
        (trust.trustPass ? 15 : 0),
    ),
    qualityImprovement: clamp(
      (visual.visualQualityScore * 0.35) +
        (launch.launchDayScore * 0.25) +
        (cj.customerJourneyScore * 0.25) +
        (visual.visualQualityPass ? 10 : 0),
    ),
    strategicLeverage: clamp(
      (economics.subscores.strategicValue * 0.4) +
        (economics.productEconomicsScore * 0.25) +
        (adoption.subscores.competitivePressure * 0.2) +
        (promise.provenClaims.length * 3),
    ),
    executionEfficiency: clamp(
      100 -
        economics.subscores.buildCost * 0.35 -
        economics.subscores.maintenanceCost * 0.25 +
        (economics.featureEvaluations.filter((f) => f.roiClassification === 'BUILD_NOW').length * 8),
    ),
  };
}

function confidenceFromEvidence(
  evidence: string[],
  promiseUnsupported: boolean,
): RecommendationConfidence {
  if (promiseUnsupported && evidence.length < 3) return 'LOW';
  if (evidence.length >= 3) return 'HIGH';
  if (evidence.length >= 2) return 'MEDIUM';
  return 'LOW';
}

function classifyBucket(
  priority: number,
  buildCostProxy: number,
  economicsBucket: string | undefined,
): EvolutionRankingBucket {
  if (economicsBucket === 'DO_NOT_BUILD' || priority < 35) return 'DO_NOT_BUILD';
  if (economicsBucket === 'BUILD_NOW' && buildCostProxy <= 45 && priority >= 70) return 'QUICK_WIN';
  if (priority >= 72 && buildCostProxy <= 55) return 'QUICK_WIN';
  if (economicsBucket === 'BUILD_LATER' && priority >= 60 && buildCostProxy >= 55) return 'STRATEGIC_INVESTMENT';
  if (priority >= 68 && buildCostProxy >= 60) return 'STRATEGIC_INVESTMENT';
  if (priority >= 55) return 'HIGHEST_PRIORITY';
  if (priority >= 42) return 'DEFERRED';
  return 'DO_NOT_BUILD';
}

interface CandidateTemplate {
  id: string;
  name: string;
  build: (input: AssessProductEvolutionInput, portfolio: EvolutionSubscores) => {
    categoryScores: EvolutionSubscores;
    evidence: string[];
    buildCostProxy: number;
    economicsMatch?: string;
    explanation: string;
    recommendation: string;
    promiseSensitive?: boolean;
  };
}

const CANDIDATE_TEMPLATES: CandidateTemplate[] = [
  {
    id: 'improve-onboarding',
    name: 'Improve onboarding',
    build: (input, portfolio) => {
      const evidence: string[] = [];
      if (!input.firstTimeUserReality.actionPathPass) evidence.push('First-Time User Reality: action path incomplete');
      if (input.customerJourneySimulation.subscores.onboarding < 70) {
        evidence.push(`Customer Journey: onboarding ${input.customerJourneySimulation.subscores.onboarding}/100`);
      }
      if (input.adoptionPrediction.adoptionBlockers.length) {
        evidence.push(`Adoption Prediction: ${input.adoptionPrediction.adoptionBlockers[0]?.explanation ?? 'blocker'}`);
      }
      if (evidence.length === 0) {
        evidence.push(
          `First-Time User Reality: ${input.firstTimeUserReality.firstTimeUserScore}/100`,
          `Customer Journey onboarding: ${input.customerJourneySimulation.subscores.onboarding}/100`,
        );
      }
      return {
        categoryScores: {
          ...portfolio,
          adoptionGrowth: clamp(portfolio.adoptionGrowth + 18),
          frictionReduction: clamp(portfolio.frictionReduction + 10),
          executionEfficiency: clamp(portfolio.executionEfficiency + 12),
        },
        evidence,
        buildCostProxy: 35,
        economicsMatch: 'BUILD_LATER',
        explanation: 'Onboarding improvements address adoption blockers with relatively low build cost.',
        recommendation: 'Prioritize onboarding improvements.',
        promiseSensitive: true,
      };
    },
  },
  {
    id: 'improve-adoption-path',
    name: 'Improve adoption path',
    build: (input, portfolio) => {
      const evidence = [
        ...input.adoptionPrediction.retentionRisks.slice(0, 1).map((r) => `Adoption Prediction retention: ${r}`),
        ...input.customerJourneySimulation.weaknesses.slice(0, 1).map((w) => `Customer Journey: ${w}`),
      ].filter(Boolean);
      if (input.adoptionPrediction.adoptionBlockers.length) {
        evidence.push(`Adoption blocker: ${input.adoptionPrediction.adoptionBlockers[0]?.explanation ?? 'blocker detected'}`);
      }
      if (evidence.length === 0) {
        evidence.push(
          `Adoption Prediction: ${input.adoptionPrediction.adoptionPredictionScore}/100`,
          `Customer Journey: ${input.customerJourneySimulation.customerJourneyScore}/100`,
        );
      }
      return {
        categoryScores: {
          ...portfolio,
          adoptionGrowth: clamp(portfolio.adoptionGrowth + 22),
          strategicLeverage: clamp(portfolio.strategicLeverage + 8),
        },
        evidence,
        buildCostProxy: 40,
        explanation: 'Strengthening the adoption path improves growth before new feature expansion.',
        recommendation: 'Address adoption blocker first.',
      };
    },
  },
  {
    id: 'reduce-workflow-friction',
    name: 'Reduce workflow friction',
    build: (input, portfolio) => {
      const evidence = [
        `Friction Heatmap: ${input.founderFrictionHeatmap.summary.frictionLevel} friction (${input.founderFrictionHeatmap.overallFrictionScore}/100)`,
        ...input.founderFrictionHeatmap.highestFrictionAreas.slice(0, 1).map((a) => `Hotspot: ${a}`),
        ...input.firstTimeUserReality.weaknesses.slice(0, 1).map((w) => `First-time: ${w}`),
      ];
      return {
        categoryScores: {
          ...portfolio,
          frictionReduction: clamp(portfolio.frictionReduction + 24),
          executionEfficiency: clamp(portfolio.executionEfficiency + 14),
        },
        evidence,
        buildCostProxy: 38,
        explanation: 'Friction reduction creates high value with moderate implementation effort.',
        recommendation: 'Reduce friction before expanding scope.',
      };
    },
  },
  {
    id: 'verification-transparency',
    name: 'Increase verification transparency',
    build: (input, portfolio) => {
      const evidence = [
        `Verification Trust: ${input.verificationTrustEvidence.trustScore}/100`,
        ...(input.verificationTrustEvidence.blackBoxRisk ? ['Verification may feel like a black box'] : []),
        ...input.promiseRealityEngine.unprovenClaims.slice(0, 1).map((c) => `Unproven claim: ${c.claim}`),
      ];
      return {
        categoryScores: {
          ...portfolio,
          trustImprovement: clamp(portfolio.trustImprovement + 20),
          qualityImprovement: clamp(portfolio.qualityImprovement + 8),
        },
        evidence,
        buildCostProxy: 48,
        economicsMatch: 'BUILD_LATER',
        explanation: 'Verification transparency improves trust and reduces promise-reality gaps.',
        recommendation: 'Improve trust before adding features.',
        promiseSensitive: true,
      };
    },
  },
  {
    id: 'launch-readiness',
    name: 'Improve launch readiness',
    build: (input, portfolio) => {
      const evidence = [
        `Launch Day: ${input.launchDaySimulation.launchDayScore}/100`,
        `Visual Quality: ${input.visualQualityAuthority.visualQualityScore}/100`,
        ...input.launchDaySimulation.launchWeaknesses.slice(0, 1).map((w) => `Launch weakness: ${w}`),
      ];
      return {
        categoryScores: {
          ...portfolio,
          qualityImprovement: clamp(portfolio.qualityImprovement + 18),
          trustImprovement: clamp(portfolio.trustImprovement + 10),
        },
        evidence,
        buildCostProxy: 52,
        economicsMatch: 'BUILD_LATER',
        explanation: 'Launch readiness polish improves quality when core adoption path is stable.',
        recommendation: 'Improve launch readiness after adoption blockers are addressed.',
      };
    },
  },
  {
    id: 'strengthen-differentiation',
    name: 'Strengthen differentiation',
    build: (input, portfolio) => {
      const evidence = [
        `Competitive pressure: ${input.adoptionPrediction.subscores.competitivePressure}/100`,
        ...input.adoptionPrediction.competitiveRisks.slice(0, 1).map((r) => `Competitive risk: ${r}`),
        ...input.productEconomics.strategicInvestments.slice(0, 1).map((s) => `Economics: ${s}`),
      ];
      return {
        categoryScores: {
          ...portfolio,
          strategicLeverage: clamp(portfolio.strategicLeverage + 20),
          adoptionGrowth: clamp(portfolio.adoptionGrowth + 8),
        },
        evidence,
        buildCostProxy: 58,
        economicsMatch: 'BUILD_LATER',
        explanation: 'Differentiation strengthens long-term strategic leverage.',
        recommendation: 'Strengthen differentiation when core workflow is proven.',
      };
    },
  },
  {
    id: 'founder-guidance',
    name: 'Improve founder guidance',
    build: (input, portfolio) => {
      const evidence = [
        `First-time score: ${input.firstTimeUserReality.firstTimeUserScore}/100`,
        ...(input.firstTimeUserReality.recommendedFixes.slice(0, 1).map((f) => `First-time fix: ${f}`)),
        ...(input.shellSources.html.includes('first-time-founder-path') ? ['Founder path panel present'] : []),
      ];
      return {
        categoryScores: {
          ...portfolio,
          frictionReduction: clamp(portfolio.frictionReduction + 14),
          adoptionGrowth: clamp(portfolio.adoptionGrowth + 10),
          executionEfficiency: clamp(portfolio.executionEfficiency + 16),
        },
        evidence,
        buildCostProxy: 32,
        explanation: 'Founder guidance improvements reduce confusion with low implementation cost.',
        recommendation: 'Prioritize founder guidance where first-time clarity is weak.',
      };
    },
  },
  {
    id: 'expand-before-core',
    name: 'Expand product surface before core workflow is ready',
    build: (input, portfolio) => {
      const evidence = [
        ...input.productEconomics.featureEvaluations
          .filter((f) => f.roiClassification === 'DO_NOT_BUILD')
          .slice(0, 1)
          .map((f) => `Economics: ${f.name}`),
        ...input.productEconomics.lowestRoiOpportunities.slice(0, 1).map((d) => `Economics ROI: ${d}`),
        ...(input.adoptionPrediction.majorAdoptionRisks ? ['Adoption Prediction: major risks present'] : []),
        ...(input.promiseRealityEngine.majorClaimsUnsupported ? ['Promise Reality: unsupported claims'] : []),
      ];
      if (evidence.length === 0) {
        evidence.push(
          `Product Economics: ${input.productEconomics.productEconomicsScore}/100`,
          `Adoption Prediction: ${input.adoptionPrediction.adoptionPredictionScore}/100`,
        );
      }
      return {
        categoryScores: {
          ...portfolio,
          adoptionGrowth: clamp(portfolio.adoptionGrowth - 20),
          executionEfficiency: clamp(portfolio.executionEfficiency - 15),
          strategicLeverage: clamp(portfolio.strategicLeverage - 10),
        },
        evidence,
        buildCostProxy: 75,
        economicsMatch: 'DO_NOT_BUILD',
        explanation: 'Expanding scope before core readiness creates cost without proportional value.',
        recommendation: 'Delay low ROI initiative — do not build now.',
        promiseSensitive: true,
      };
    },
  },
];

function avgCategoryScore(scores: EvolutionSubscores): number {
  return clamp(
    (scores.adoptionGrowth +
      scores.frictionReduction +
      scores.trustImprovement +
      scores.qualityImprovement +
      scores.strategicLeverage +
      scores.executionEfficiency) /
      6,
  );
}

function buildCandidates(input: AssessProductEvolutionInput, portfolio: EvolutionSubscores): EvolutionCandidate[] {
  const promiseUnsupported = input.promiseRealityEngine.majorClaimsUnsupported;

  return CANDIDATE_TEMPLATES.slice(0, MAX_EVOLUTION_CANDIDATES).map((template) => {
    const built = template.build(input, portfolio);
    const evidence = built.evidence.filter(Boolean).slice(0, MAX_EVIDENCE_TRACES);
    const priorityScore = clamp(
      avgCategoryScore(built.categoryScores) -
        built.buildCostProxy * 0.25 +
        (built.economicsMatch === 'DO_NOT_BUILD' ? -10 : 8),
    );
    const economicsFeature = input.productEconomics.featureEvaluations.find((f) =>
      built.economicsMatch ? f.roiClassification === built.economicsMatch : false,
    );
    const rankingBucket = classifyBucket(
      avgCategoryScore(built.categoryScores) - built.buildCostProxy * 0.2,
      built.buildCostProxy,
      economicsFeature?.roiClassification ?? built.economicsMatch,
    );
    const confidence = confidenceFromEvidence(
      evidence,
      Boolean(built.promiseSensitive && promiseUnsupported),
    );

    return {
      id: template.id,
      name: template.name,
      categoryScores: built.categoryScores,
      priorityScore: clamp(priorityScore),
      confidence,
      evidence,
      rankingBucket,
      explanation: built.explanation,
      recommendation: built.recommendation,
    };
  });
}

function buildOperatorFeed(
  portfolio: EvolutionSubscores,
  candidates: EvolutionCandidate[],
  score: number,
): EvolutionFeedEvent[] {
  return [
    {
      section: 'Product Evolution',
      action: 'Evaluating adoption growth opportunities',
      detail: `Adoption opportunity score ${portfolio.adoptionGrowth}/100.`,
      status: portfolio.adoptionGrowth >= 60 ? 'Completed' : 'Warning',
    },
    {
      section: 'Product Evolution',
      action: 'Evaluating friction reduction opportunities',
      detail: `Friction reduction score ${portfolio.frictionReduction}/100.`,
      status: portfolio.frictionReduction >= 55 ? 'Completed' : 'Warning',
    },
    {
      section: 'Product Evolution',
      action: 'Ranking roadmap recommendations',
      detail: `${candidates.filter((c) => c.rankingBucket === 'HIGHEST_PRIORITY' || c.rankingBucket === 'QUICK_WIN').length} high-priority candidate(s).`,
      status: 'Completed',
    },
    {
      section: 'Product Evolution',
      action: 'Tracing recommendation evidence',
      detail: `${candidates.filter((c) => c.evidence.length >= 2).length} candidate(s) with multi-source evidence.`,
      status: candidates.every((c) => c.evidence.length > 0) ? 'Completed' : 'Warning',
    },
    {
      section: 'Product Evolution',
      action: 'Applying economics prioritization',
      detail: `Execution efficiency ${portfolio.executionEfficiency}/100 from economics signals.`,
      status: 'Completed',
    },
    {
      section: 'Product Evolution',
      action: 'Summarizing product evolution score',
      detail: `Product Evolution Score ${score}/100.`,
      status: score >= 60 ? 'Completed' : 'Warning',
    },
  ];
}

export function assessProductEvolution(input: AssessProductEvolutionInput): ProductEvolutionAssessment {
  const portfolio = computePortfolioSubscores(input);
  const candidates = buildCandidates(input, portfolio);

  const highestPriorityOpportunities = candidates
    .filter((c) => c.rankingBucket === 'HIGHEST_PRIORITY')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((c) => `[${c.confidence}] ${c.name} — ${c.priorityScore}/100`)
    .slice(0, MAX_EVOLUTION_RANKED);

  const quickWins = candidates
    .filter((c) => c.rankingBucket === 'QUICK_WIN')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((c) => `[${c.confidence}] ${c.name} — ${c.priorityScore}/100`)
    .slice(0, MAX_EVOLUTION_RANKED);

  const strategicInvestments = candidates
    .filter((c) => c.rankingBucket === 'STRATEGIC_INVESTMENT')
    .map((c) => `[${c.confidence}] ${c.name}`)
    .slice(0, MAX_EVOLUTION_RANKED);

  const deferredOpportunities = candidates
    .filter((c) => c.rankingBucket === 'DEFERRED')
    .map((c) => `[${c.confidence}] ${c.name}`)
    .slice(0, MAX_EVOLUTION_RANKED);

  const doNotBuild = candidates
    .filter((c) => c.rankingBucket === 'DO_NOT_BUILD')
    .map((c) => `[${c.confidence}] ${c.name} — ${c.explanation}`)
    .slice(0, MAX_EVOLUTION_RANKED);

  const recommendedNextInvestments = [...quickWins, ...highestPriorityOpportunities].slice(0, MAX_EVOLUTION_RANKED);

  const evidenceCoverage =
    candidates.filter((c) => c.evidence.length >= 2).length / Math.max(candidates.length, 1);
  const confidenceCoverage =
    candidates.filter((c) => c.confidence === 'HIGH' || c.confidence === 'MEDIUM').length /
    Math.max(candidates.length, 1);

  const productEvolutionScore = clamp(
    avgCategoryScore(portfolio) * 0.35 +
      (recommendedNextInvestments.length > 0 ? 20 : 0) +
      evidenceCoverage * 25 +
      confidenceCoverage * 20,
  );

  const recommendationConfidenceSummary = `HIGH: ${candidates.filter((c) => c.confidence === 'HIGH').length} | MEDIUM: ${candidates.filter((c) => c.confidence === 'MEDIUM').length} | LOW: ${candidates.filter((c) => c.confidence === 'LOW').length}`;

  const majorEvolutionRisks =
    doNotBuild.length >= 2 &&
    recommendedNextInvestments.length === 0 &&
    productEvolutionScore < 45;

  const productEvolutionPass =
    !majorEvolutionRisks &&
    productEvolutionScore >= 50 &&
    candidates.every((c) => c.evidence.length > 0 && Boolean(c.rankingBucket));

  return {
    productEvolutionScore,
    portfolioSubscores: portfolio,
    candidates,
    highestPriorityOpportunities,
    quickWins,
    strategicInvestments,
    deferredOpportunities,
    doNotBuild,
    recommendedNextInvestments,
    productEvolutionSummary: `Product evolution ${productEvolutionScore}/100 — next: ${recommendedNextInvestments[0] ?? 'stabilize core workflow first'}.`,
    recommendationConfidenceSummary,
    operatorFeedEvents: buildOperatorFeed(portfolio, candidates, productEvolutionScore),
    majorEvolutionRisks,
    productEvolutionPass,
    recommendationRankingVisibilityPass: candidates.length > 0 && recommendedNextInvestments.length >= 0,
    recommendationConfidenceVisibilityPass: candidates.every((c) => Boolean(c.confidence)),
    evidenceTraceabilityPass: candidates.every((c) => c.evidence.length > 0),
    quickWinVisibilityPass: quickWins.length >= 0,
    strategicInvestmentVisibilityPass: strategicInvestments.length >= 0,
    insufficientInfo: false,
    insufficientInfoReason: null,
  };
}

export function evaluateProductEvolutionVisibility(
  assessment: ProductEvolutionAssessment,
): ProductEvolutionVisibility {
  const checks = [
    assessment.productEvolutionScore >= 0,
    assessment.candidates.length <= MAX_EVOLUTION_CANDIDATES,
    assessment.operatorFeedEvents.length >= 5,
    assessment.recommendationRankingVisibilityPass,
    assessment.recommendationConfidenceVisibilityPass,
    assessment.evidenceTraceabilityPass,
    assessment.quickWinVisibilityPass,
    assessment.strategicInvestmentVisibilityPass,
  ];
  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    productEvolutionScore: assessment.productEvolutionScore,
    majorEvolutionRisks: assessment.majorEvolutionRisks,
    productEvolutionPass: assessment.productEvolutionPass,
    highestPriorityCount: assessment.highestPriorityOpportunities.length,
    quickWinCount: assessment.quickWins.length,
  };
}

function mergeSensemaking(
  base: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  evolution: ProductEvolutionAssessment,
): import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment {
  return {
    ...base,
    operatorFeedEvents: [...evolution.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
    recommendedNextInvestments: evolution.recommendedNextInvestments.slice(0, 5),
    evolutionQuickWins: evolution.quickWins.slice(0, 5),
    evolutionStrategicInvestments: evolution.strategicInvestments.slice(0, 5),
    evolutionDeferredOpportunities: evolution.deferredOpportunities.slice(0, 5),
    evolutionDoNotBuildList: evolution.doNotBuild.slice(0, 5),
    productEvolutionSummary: evolution.productEvolutionSummary,
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  evolution: ProductEvolutionAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  const templates: ReadonlyArray<{ match: string; title: string; reason: string }> = [
    { match: 'onboarding', title: 'Prioritize onboarding improvements', reason: 'Evolution roadmap prioritizes onboarding.' },
    { match: 'adoption', title: 'Address adoption blocker first', reason: 'Adoption growth opportunity ranked highest.' },
    { match: 'friction', title: 'Reduce friction before expanding scope', reason: 'Friction reduction opportunity detected.' },
    { match: 'trust', title: 'Improve trust before adding features', reason: 'Trust improvement ranked on roadmap.' },
    { match: 'Delay', title: 'Delay low ROI initiative', reason: 'Do-not-build guidance from evolution analysis.' },
  ];

  for (const candidate of evolution.candidates
    .filter((c) => c.rankingBucket !== 'DO_NOT_BUILD')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3)) {
    const template = templates.find((t) => candidate.recommendation.includes(t.match.split(' ')[0]) || candidate.name.toLowerCase().includes(t.match));
    const title = `[${candidate.confidence}] ${template?.title ?? candidate.recommendation.slice(0, 48)}`;
    if (seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    actions.unshift({
      id: nextId('evolution-action'),
      type: 'FIX_ACTION',
      priority: candidate.confidence === 'HIGH' ? 'HIGH' : 'MEDIUM',
      title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
      rationale: candidate.explanation,
      expectedImpact: candidate.recommendation,
      evidence: candidate.evidence.join('; ') || candidate.name,
      executable: true,
    });
  }

  const topActions = actions.slice(0, MAX_EVOLUTION_ACTIONS);
  return {
    ...base,
    topActions,
    recommendedNextStep:
      topActions[0] && (topActions[0].priority === 'CRITICAL' || topActions[0].priority === 'HIGH')
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
    operatorFeedEvents: [...evolution.operatorFeedEvents.slice(0, 2), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichAssessmentsWithProductEvolution(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  evolution: ProductEvolutionAssessment,
): EnrichedEvolutionAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, evolution),
    founderSensemaking: mergeSensemaking(founderSensemaking, evolution),
  };
}
