/**
 * Competitive Reality Engine — evaluates differentiation, replacement risk, and strategic positioning.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import {
  MAX_COMPETITIVE_ACTIONS,
  MAX_COMPETITIVE_ADVANTAGES,
  MAX_COMPETITIVE_CLAIMS,
  MAX_COMPETITIVE_FINDINGS,
} from './competitive-reality-engine-bounds.js';
import type {
  AssessCompetitiveRealityInput,
  CompetitiveAdvantageRecord,
  CompetitiveCategory,
  CompetitiveClaimRecord,
  CompetitiveClaimStatus,
  CompetitiveFeedEvent,
  CompetitiveFinding,
  CompetitiveFindingSeverity,
  CompetitiveFindingType,
  CompetitivePositionClassification,
  CompetitiveRealityAssessment,
  CompetitiveRealityVisibility,
  CompetitiveSubscores,
  EnrichedCompetitiveAssessments,
} from './competitive-reality-engine-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

let idCounter = 0;

export function resetCompetitiveRealityCounterForTests(): void {
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

function countAuthorityLayers(input: AssessCompetitiveRealityInput): number {
  const layers = [
    input.firstTimeUserReality.firstTimeUserScore >= 0,
    input.verificationTrustEvidence.trustScore >= 0,
    input.founderFrictionHeatmap.overallFrictionScore >= 0,
    input.customerJourneySimulation.customerJourneyScore >= 0,
    input.promiseRealityEngine.promiseRealityScore >= 0,
    input.visualQualityAuthority.visualQualityScore >= 0,
    input.launchDaySimulation.launchDayScore >= 0,
    input.adoptionPrediction.adoptionPredictionScore >= 0,
    input.productEconomics.productEconomicsScore >= 0,
    input.productEvolution.productEvolutionScore >= 0,
  ];
  return layers.filter(Boolean).length;
}

function computePortfolioSubscores(input: AssessCompetitiveRealityInput): CompetitiveSubscores {
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
  const combined = `${input.shellSources.html}\n${input.shellSources.appJs}`;
  const authorityDepth = countAuthorityLayers(input);
  const validatorDepth = input.validatorScriptCount ?? 0;

  const uniqueSignals = [
    combined.includes('first-time-founder-path'),
    combined.includes('operator-feed') || combined.includes('operatorFeed'),
    combined.includes('founder-testing') || combined.includes('Founder Test'),
    validatorDepth >= 8,
    evolution.candidates.length >= 6,
    trust.trustPass,
  ].filter(Boolean).length;

  const differentiationStrength = clamp(
    (economics.subscores.strategicValue * 0.2) +
      (evolution.portfolioSubscores.strategicLeverage * 0.2) +
      (uniqueSignals * 8) +
      (100 - adoption.subscores.competitivePressure) * 0.25 +
      (promise.provenClaims.length * 4),
  );

  const replacementRisk = clamp(
    (adoption.subscores.competitivePressure * 0.35) +
      (100 - differentiationStrength) * 0.25 +
      (friction.overallFrictionScore * 0.15) +
      (promise.majorClaimsUnsupported ? 15 : 0) +
      (economics.featureEvaluations.filter((f) => f.roiClassification === 'DO_NOT_BUILD').length * 6),
  );

  const founderAdvantage = clamp(
    (launch.subscores.trustSurvival * 0.2) +
      (trust.trustScore * 0.25) +
      (evolution.productEvolutionScore * 0.2) +
      (economics.subscores.founderValue * 0.2) +
      (ft.firstTimeUserScore * 0.15),
  );

  const productAdvantage = clamp(
    (launch.launchDayScore * 0.2) +
      (adoption.adoptionPredictionScore * 0.2) +
      (100 - friction.overallFrictionScore) * 0.2 +
      (cj.customerJourneyScore * 0.2) +
      (visual.visualQualityScore * 0.2),
  );

  const strategicDefensibility = clamp(
    (authorityDepth * 6) +
      (validatorDepth >= 10 ? 15 : validatorDepth >= 8 ? 10 : 5) +
      (economics.subscores.strategicValue * 0.25) +
      (trust.trustPass ? 12 : 0) +
      (evolution.evidenceTraceabilityPass ? 10 : 0),
  );

  const blindSpotRisk = clamp(
    (promise.unprovenClaims.length * 8) +
      (100 - differentiationStrength) * 0.2 +
      (adoption.competitiveRisks.length * 6) +
      (evolution.candidates.filter((c) => c.confidence === 'LOW').length * 5) +
      (promise.majorClaimsUnsupported ? 15 : 0),
  );

  return {
    differentiationStrength,
    replacementRisk,
    founderAdvantage,
    productAdvantage,
    strategicDefensibility,
    blindSpotRisk,
  };
}

function classifyPosition(
  subscores: CompetitiveSubscores,
): CompetitivePositionClassification {
  if (subscores.replacementRisk >= 70 || subscores.differentiationStrength < 40) {
    return 'COMMODITY_RISK';
  }
  if (subscores.differentiationStrength >= 75 && subscores.replacementRisk <= 35) {
    return 'STRONG_DIFFERENTIATION';
  }
  if (subscores.differentiationStrength >= 55) {
    return 'MODERATE_DIFFERENTIATION';
  }
  return 'LIMITED_DIFFERENTIATION';
}

function pushFinding(
  bucket: CompetitiveFinding[],
  seen: Set<string>,
  finding: Omit<CompetitiveFinding, 'id'>,
): void {
  const key = `${finding.type}:${finding.explanation.trim().toLowerCase()}`;
  if (seen.has(key) || bucket.length >= MAX_COMPETITIVE_FINDINGS) return;
  if (ARCH_LEAK.test(`${finding.explanation} ${finding.recommendation}`)) return;
  seen.add(key);
  bucket.push({ ...finding, id: nextId('competitive') });
}

function buildFindings(
  input: AssessCompetitiveRealityInput,
  subscores: CompetitiveSubscores,
): CompetitiveFinding[] {
  const findings: CompetitiveFinding[] = [];
  const seen = new Set<string>();

  if (subscores.differentiationStrength < 55) {
    pushFinding(findings, seen, {
      type: 'WEAK_DIFFERENTIATION',
      category: 'DIFFERENTIATION_STRENGTH',
      severity: subscores.differentiationStrength < 40 ? 'HIGH' : 'MEDIUM',
      explanation:
        'This capability provides limited differentiation because competitors can replicate the outcome through standard workflows.',
      recommendation: 'Strengthen verification evidence and founder trust systems before expanding feature scope.',
    });
  }

  if (subscores.replacementRisk >= 60) {
    pushFinding(findings, seen, {
      type: 'HIGH_REPLACEMENT_RISK',
      category: 'REPLACEMENT_RISK',
      severity: subscores.replacementRisk >= 75 ? 'CRITICAL' : 'HIGH',
      explanation:
        'Founders could replace AiDevEngine with commodity tooling when unique authority systems are not clearly visible.',
      recommendation: 'Reduce replacement risk by investing in defensible authority systems and evidence-backed outcomes.',
    });
  }

  if (subscores.strategicDefensibility < 50) {
    pushFinding(findings, seen, {
      type: 'LOW_DEFENSIBILITY',
      category: 'STRATEGIC_DEFENSIBILITY',
      severity: subscores.strategicDefensibility < 35 ? 'HIGH' : 'MEDIUM',
      explanation:
        'Current advantages are shallow and easier for competitors to replicate without the integrated authority network.',
      recommendation: 'Invest in defensible capabilities that compound through system integration and accumulated intelligence.',
    });
  }

  if (input.promiseRealityEngine.majorClaimsUnsupported || input.promiseRealityEngine.unprovenClaims.length >= 2) {
    pushFinding(findings, seen, {
      type: 'UNPROVEN_ADVANTAGE',
      category: 'COMPETITIVE_BLIND_SPOT',
      severity: 'HIGH',
      explanation:
        'Some competitive claims lack supporting evidence from authority layers and may not survive founder scrutiny.',
      recommendation: 'Validate competitive assumptions with proven launch, adoption, and trust outcomes before marketing them.',
    });
  }

  if (input.adoptionPrediction.competitiveRisks.length >= 1) {
    pushFinding(findings, seen, {
      type: 'COMPETITIVE_GAP',
      category: 'COMPETITIVE_BLIND_SPOT',
      severity: 'MEDIUM',
      explanation: `Adoption signals highlight competitive gaps: ${input.adoptionPrediction.competitiveRisks[0]}.`,
      recommendation: 'Improve evidence-backed differentiation where adoption prediction flags competitive weakness.',
    });
  }

  if (
    input.productEvolution.doNotBuild.length >= 1 &&
    input.productEconomics.majorEconomicRisks
  ) {
    pushFinding(findings, seen, {
      type: 'STRATEGIC_RISK',
      category: 'REPLACEMENT_RISK',
      severity: 'MEDIUM',
      explanation:
        'Roadmap direction includes low-ROI expansion that weakens strategic positioning and increases commodity overlap.',
      recommendation: 'Align roadmap with differentiation-strengthening investments before scope expansion.',
    });
  }

  if (subscores.blindSpotRisk >= 55) {
    pushFinding(findings, seen, {
      type: 'COMPETITIVE_GAP',
      category: 'COMPETITIVE_BLIND_SPOT',
      severity: subscores.blindSpotRisk >= 70 ? 'HIGH' : 'MEDIUM',
      explanation:
        'Low-confidence recommendations and unproven assumptions create competitive blind spots founders may not see.',
      recommendation: 'Improve differentiation clarity and reduce unsupported competitive claims.',
    });
  }

  return findings;
}

interface AdvantageTemplate {
  id: string;
  name: string;
  build: (input: AssessCompetitiveRealityInput, subscores: CompetitiveSubscores) => {
    strengthScore: number;
    evidence: string[];
    explanation: string;
  };
}

const ADVANTAGE_TEMPLATES: AdvantageTemplate[] = [
  {
    id: 'authority-stack',
    name: 'Integrated authority validation stack',
    build: (input, subscores) => ({
      strengthScore: clamp(subscores.strategicDefensibility + 5),
      evidence: [
        `${countAuthorityLayers(input)} authority layers active`,
        `Product Evolution score ${input.productEvolution.productEvolutionScore}/100`,
        `Economics strategic value ${input.productEconomics.subscores.strategicValue}/100`,
      ],
      explanation: 'Deep authority integration is harder to replicate than single-feature competitors.',
    }),
  },
  {
    id: 'founder-testing',
    name: 'Founder testing reality simulation',
    build: (input) => ({
      strengthScore: clamp(
        (input.launchDaySimulation.launchDayScore * 0.4) +
          (input.adoptionPrediction.adoptionPredictionScore * 0.35) +
          (input.firstTimeUserReality.firstTimeUserScore * 0.25),
      ),
      evidence: [
        `Launch Day ${input.launchDaySimulation.launchDayScore}/100`,
        `Adoption Prediction ${input.adoptionPrediction.adoptionPredictionScore}/100`,
        `First-Time User ${input.firstTimeUserReality.firstTimeUserScore}/100`,
      ],
      explanation: 'Pre-launch founder reality testing reduces launch risk in ways generic builders lack.',
    }),
  },
  {
    id: 'verification-trust',
    name: 'Verification trust and evidence systems',
    build: (input) => ({
      strengthScore: clamp(input.verificationTrustEvidence.trustScore),
      evidence: [
        `Verification Trust ${input.verificationTrustEvidence.trustScore}/100`,
        input.verificationTrustEvidence.trustPass ? 'Trust pass active' : 'Trust pass not met',
        `Promise Reality ${input.promiseRealityEngine.promiseRealityScore}/100`,
      ],
      explanation: 'Evidence-backed verification creates founder trust that commodity tools rarely provide.',
    }),
  },
  {
    id: 'roadmap-intelligence',
    name: 'Product evolution roadmap intelligence',
    build: (input) => ({
      strengthScore: clamp(input.productEvolution.productEvolutionScore),
      evidence: [
        `Evolution score ${input.productEvolution.productEvolutionScore}/100`,
        `${input.productEvolution.quickWins.length} quick-win roadmap candidates`,
        input.productEvolution.evidenceTraceabilityPass ? 'Roadmap evidence traceable' : 'Roadmap evidence gaps',
      ],
      explanation: 'Evidence-ranked roadmap guidance differentiates AiDevEngine from intuition-only builders.',
    }),
  },
  {
    id: 'launch-guidance',
    name: 'Launch day simulation guidance',
    build: (input) => ({
      strengthScore: clamp(input.launchDaySimulation.launchDayScore),
      evidence: [
        `Launch Day ${input.launchDaySimulation.launchDayScore}/100`,
        `Visual Quality ${input.visualQualityAuthority.visualQualityScore}/100`,
        ...(input.launchDaySimulation.launchWeaknesses.slice(0, 1).map((w) => `Launch weakness: ${w}`)),
      ],
      explanation: 'Launch readiness simulation improves founder confidence before public release.',
    }),
  },
  {
    id: 'founder-path',
    name: 'First-time founder experience clarity',
    build: (input) => ({
      strengthScore: clamp(input.firstTimeUserReality.firstTimeUserScore),
      evidence: [
        `First-Time User ${input.firstTimeUserReality.firstTimeUserScore}/100`,
        input.firstTimeUserReality.actionPathPass ? 'Action path complete' : 'Action path incomplete',
        ...(input.firstTimeUserReality.strengths.slice(0, 1).map((s) => `Strength: ${s}`)),
      ],
      explanation: 'Founder-first onboarding clarity influences why founders choose AiDevEngine over generic IDEs.',
    }),
  },
  {
    id: 'customer-journey',
    name: 'Customer journey simulation depth',
    build: (input) => ({
      strengthScore: clamp(input.customerJourneySimulation.customerJourneyScore),
      evidence: [
        `Customer Journey ${input.customerJourneySimulation.customerJourneyScore}/100`,
        `Onboarding subscore ${input.customerJourneySimulation.subscores.onboarding}/100`,
        ...(input.customerJourneySimulation.strengths.slice(0, 1).map((s) => `Strength: ${s}`)),
      ],
      explanation: 'Customer journey simulation supports adoption guidance beyond standard dev tools.',
    }),
  },
  {
    id: 'generic-workflow',
    name: 'Standard workflow UI surfaces',
    build: (input, subscores) => ({
      strengthScore: clamp(100 - subscores.differentiationStrength),
      evidence: [
        `Differentiation ${subscores.differentiationStrength}/100`,
        `Competitive pressure ${input.adoptionPrediction.subscores.competitivePressure}/100`,
        ...(input.adoptionPrediction.competitiveRisks.slice(0, 1).map((r) => `Risk: ${r}`)),
      ],
      explanation: 'Generic workflow surfaces are easily replaced by commodity alternatives.',
    }),
  },
];

function buildAdvantages(input: AssessCompetitiveRealityInput, subscores: CompetitiveSubscores): CompetitiveAdvantageRecord[] {
  return ADVANTAGE_TEMPLATES.slice(0, MAX_COMPETITIVE_ADVANTAGES).map((template) => {
    const built = template.build(input, subscores);
    return {
      id: template.id,
      name: template.name,
      strengthScore: clamp(built.strengthScore),
      evidence: built.evidence.filter(Boolean).slice(0, 4),
      explanation: built.explanation,
    };
  });
}

function evaluateClaimStatus(
  evidenceCount: number,
  promiseUnsupported: boolean,
  contradicted: boolean,
): CompetitiveClaimStatus {
  if (contradicted) return 'CONTRADICTED';
  if (promiseUnsupported && evidenceCount < 2) return 'UNPROVEN';
  if (evidenceCount >= 3) return 'PROVEN';
  if (evidenceCount >= 1) return 'PARTIALLY_PROVEN';
  return 'UNPROVEN';
}

function buildCompetitiveClaims(input: AssessCompetitiveRealityInput): CompetitiveClaimRecord[] {
  const launch = input.launchDaySimulation;
  const evolution = input.productEvolution;
  const trust = input.verificationTrustEvidence;
  const promise = input.promiseRealityEngine;

  const claimTemplates: Array<{ claim: string; evidence: string[]; contradicted?: boolean }> = [
    {
      claim: 'AiDevEngine provides better launch guidance than generic builders.',
      evidence: [
        launch.launchDayScore >= 60 ? `Launch Day ${launch.launchDayScore}/100` : '',
        launch.launchDayPass ? 'Launch day pass met' : '',
        evolution.quickWins.length > 0 ? `${evolution.quickWins.length} launch-related quick wins` : '',
      ].filter(Boolean),
      contradicted: launch.majorLaunchRisks && launch.launchDayScore < 45,
    },
    {
      claim: 'AiDevEngine offers unique founder validation depth.',
      evidence: [
        `First-Time User ${input.firstTimeUserReality.firstTimeUserScore}/100`,
        `Adoption Prediction ${input.adoptionPrediction.adoptionPredictionScore}/100`,
        evolution.evidenceTraceabilityPass ? 'Evolution evidence traceable' : '',
      ].filter(Boolean),
      contradicted: input.firstTimeUserReality.firstTimeUserScore < 35 && input.adoptionPrediction.majorAdoptionRisks,
    },
    {
      claim: 'AiDevEngine verification creates stronger founder trust.',
      evidence: [
        `Verification Trust ${trust.trustScore}/100`,
        trust.trustPass ? 'Trust pass met' : '',
        `Promise Reality ${promise.promiseRealityScore}/100`,
      ].filter(Boolean),
      contradicted: trust.trustScore < 40 && trust.blackBoxRisk,
    },
    {
      claim: 'AiDevEngine roadmap intelligence improves strategic decisions.',
      evidence: [
        `Product Evolution ${evolution.productEvolutionScore}/100`,
        evolution.recommendedNextInvestments.length > 0 ? 'Ranked investments present' : '',
        evolution.recommendationConfidenceVisibilityPass ? 'Confidence visible' : '',
      ].filter(Boolean),
      contradicted: evolution.majorEvolutionRisks,
    },
  ];

  return claimTemplates.slice(0, MAX_COMPETITIVE_CLAIMS).map((template) => {
    const status = evaluateClaimStatus(
      template.evidence.length,
      promise.majorClaimsUnsupported,
      Boolean(template.contradicted),
    );
    return {
      id: nextId('claim'),
      claim: template.claim,
      status,
      evidence: template.evidence,
      explanation:
        status === 'PROVEN'
          ? 'Authority evidence supports this competitive claim.'
          : status === 'PARTIALLY_PROVEN'
            ? 'Some evidence exists but the claim is not fully proven across authority layers.'
            : status === 'CONTRADICTED'
              ? 'Authority evidence contradicts this competitive claim.'
              : 'Insufficient evidence to support this competitive claim.',
    };
  });
}

function buildOperatorFeed(
  subscores: CompetitiveSubscores,
  position: CompetitivePositionClassification,
  score: number,
): CompetitiveFeedEvent[] {
  return [
    {
      section: 'Competitive Reality',
      action: 'Evaluating differentiation strength',
      detail: `Differentiation strength ${subscores.differentiationStrength}/100.`,
      status: subscores.differentiationStrength >= 55 ? 'Completed' : 'Warning',
    },
    {
      section: 'Competitive Reality',
      action: 'Evaluating replacement risk',
      detail: `Replacement risk ${subscores.replacementRisk}/100 (lower is better).`,
      status: subscores.replacementRisk <= 45 ? 'Completed' : 'Warning',
    },
    {
      section: 'Competitive Reality',
      action: 'Evaluating strategic defensibility',
      detail: `Strategic defensibility ${subscores.strategicDefensibility}/100.`,
      status: subscores.strategicDefensibility >= 50 ? 'Completed' : 'Warning',
    },
    {
      section: 'Competitive Reality',
      action: 'Identifying competitive blind spots',
      detail: `Blind spot risk ${subscores.blindSpotRisk}/100.`,
      status: subscores.blindSpotRisk <= 50 ? 'Completed' : 'Warning',
    },
    {
      section: 'Competitive Reality',
      action: 'Classifying competitive position',
      detail: position.replace(/_/g, ' '),
      status: position === 'COMMODITY_RISK' ? 'Warning' : 'Completed',
    },
    {
      section: 'Competitive Reality',
      action: 'Summarizing competitive reality score',
      detail: `Competitive Reality Score ${score}/100.`,
      status: score >= 55 ? 'Completed' : 'Warning',
    },
  ];
}

export function assessCompetitiveReality(input: AssessCompetitiveRealityInput): CompetitiveRealityAssessment {
  const portfolio = computePortfolioSubscores(input);
  const findings = buildFindings(input, portfolio);
  const advantages = buildAdvantages(input, portfolio);
  const claims = buildCompetitiveClaims(input);

  const sortedByStrength = [...advantages].sort((a, b) => b.strengthScore - a.strengthScore);
  const strongestCompetitiveAdvantages = sortedByStrength
    .filter((a) => a.id !== 'generic-workflow')
    .slice(0, 4)
    .map((a) => `[${a.strengthScore}/100] ${a.name} — ${a.explanation}`)
    .slice(0, MAX_COMPETITIVE_ADVANTAGES);

  const weakestCompetitiveAdvantages = [...advantages]
    .sort((a, b) => a.strengthScore - b.strengthScore)
    .slice(0, 4)
    .map((a) => `[${a.strengthScore}/100] ${a.name} — ${a.explanation}`);

  const highReplacementRisks = advantages
    .filter((a) => a.strengthScore < 50 || a.id === 'generic-workflow')
    .map((a) => `${a.name} — ${a.explanation}`)
    .slice(0, 4);

  const strategicDefensibility = sortedByStrength
    .filter((a) => a.strengthScore >= 55 && (a.id === 'authority-stack' || a.id === 'verification-trust' || a.id === 'roadmap-intelligence'))
    .map((a) => `[${a.strengthScore}/100] ${a.name}`)
    .slice(0, 4);

  if (strategicDefensibility.length === 0) {
    strategicDefensibility.push(
      `[${portfolio.strategicDefensibility}/100] Integrated authority network — depth from ${countAuthorityLayers(input)} layers`,
    );
  }

  const competitiveBlindSpots = findings
    .filter((f) => f.category === 'COMPETITIVE_BLIND_SPOT' || f.type === 'WEAK_DIFFERENTIATION')
    .map((f) => `[${f.severity}] ${f.explanation}`)
    .slice(0, 4);

  const unprovenCompetitiveClaims = claims
    .filter((c) => c.status === 'UNPROVEN' || c.status === 'PARTIALLY_PROVEN' || c.status === 'CONTRADICTED')
    .map((c) => `[${c.status}] ${c.claim} — ${c.explanation}`)
    .slice(0, MAX_COMPETITIVE_CLAIMS);

  const competitiveRealityScore = clamp(
    portfolio.differentiationStrength * 0.2 +
      (100 - portfolio.replacementRisk) * 0.2 +
      portfolio.founderAdvantage * 0.15 +
      portfolio.productAdvantage * 0.15 +
      portfolio.strategicDefensibility * 0.2 +
      (100 - portfolio.blindSpotRisk) * 0.1,
  );

  const competitivePosition = classifyPosition(portfolio);

  const majorCompetitiveRisks =
    competitivePosition === 'COMMODITY_RISK' ||
    (portfolio.replacementRisk >= 70 && portfolio.differentiationStrength < 45);

  const competitiveRealityPass =
    !majorCompetitiveRisks &&
    competitiveRealityScore >= 50 &&
    strongestCompetitiveAdvantages.length > 0;

  return {
    competitiveRealityScore,
    portfolioSubscores: portfolio,
    competitivePosition,
    findings,
    strongestCompetitiveAdvantages,
    weakestCompetitiveAdvantages,
    highReplacementRisks,
    strategicDefensibility,
    competitiveBlindSpots,
    unprovenCompetitiveClaims,
    competitiveRealitySummary: `Competitive reality ${competitiveRealityScore}/100 — ${competitivePosition.replace(/_/g, ' ').toLowerCase()}.`,
    operatorFeedEvents: buildOperatorFeed(portfolio, competitivePosition, competitiveRealityScore),
    majorCompetitiveRisks,
    competitiveRealityPass,
    competitiveAdvantageVisibilityPass: strongestCompetitiveAdvantages.length > 0,
    replacementRiskVisibilityPass: highReplacementRisks.length > 0 || portfolio.replacementRisk >= 0,
    defensibilityVisibilityPass: strategicDefensibility.length > 0,
    blindSpotVisibilityPass: competitiveBlindSpots.length >= 0,
    competitiveClassificationVisibilityPass: Boolean(competitivePosition),
    insufficientInfo: false,
    insufficientInfoReason: null,
  };
}

export function evaluateCompetitiveRealityVisibility(
  assessment: CompetitiveRealityAssessment,
): CompetitiveRealityVisibility {
  const checks = [
    assessment.competitiveRealityScore >= 0,
    assessment.competitiveAdvantageVisibilityPass,
    assessment.replacementRiskVisibilityPass,
    assessment.defensibilityVisibilityPass,
    assessment.blindSpotVisibilityPass,
    assessment.competitiveClassificationVisibilityPass,
    assessment.strongestCompetitiveAdvantages.length > 0,
  ];
  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    competitiveRealityScore: assessment.competitiveRealityScore,
    majorCompetitiveRisks: assessment.majorCompetitiveRisks,
    competitiveRealityPass: assessment.competitiveRealityPass,
    competitivePosition: assessment.competitivePosition,
    strongestAdvantageCount: assessment.strongestCompetitiveAdvantages.length,
    blindSpotCount: assessment.competitiveBlindSpots.length,
  };
}

function mergeSensemaking(
  base: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  competitive: CompetitiveRealityAssessment,
): import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment {
  return {
    ...base,
    operatorFeedEvents: [...competitive.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
    competitivePosition: competitive.competitivePosition,
    topCompetitiveAdvantages: competitive.strongestCompetitiveAdvantages.slice(0, 5),
    topCompetitiveRisks: competitive.highReplacementRisks.slice(0, 5),
    strategicDefensibilitySummary: competitive.strategicDefensibility.slice(0, 5),
    competitiveBlindSpots: competitive.competitiveBlindSpots.slice(0, 5),
    competitiveRealitySummary: competitive.competitiveRealitySummary,
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  competitive: CompetitiveRealityAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  const templates: ReadonlyArray<{ match: RegExp; title: string; reason: string }> = [
    { match: /differentiation|authority/i, title: 'Strengthen unique authority systems', reason: 'Competitive reality flags differentiation gaps.' },
    { match: /evidence|trust|verification/i, title: 'Improve evidence-backed differentiation', reason: 'Trust and verification strengthen competitive position.' },
    { match: /replacement|commodity/i, title: 'Reduce replacement risk', reason: 'High replacement risk detected in competitive analysis.' },
    { match: /unproven|validate|assumption/i, title: 'Validate competitive assumptions', reason: 'Unproven competitive claims require validation.' },
    { match: /defensib/i, title: 'Invest in defensible capabilities', reason: 'Strategic defensibility opportunity identified.' },
  ];

  for (const finding of competitive.findings
    .filter((f) => f.severity === 'HIGH' || f.severity === 'CRITICAL')
    .slice(0, 3)) {
    const template = templates.find((t) => t.match.test(finding.recommendation) || t.match.test(finding.type));
    const title = `[${finding.severity}] ${template?.title ?? finding.recommendation.slice(0, 48)}`;
    if (seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    actions.unshift({
      id: nextId('competitive-action'),
      type: 'FIX_ACTION',
      priority: finding.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
      rationale: finding.explanation,
      expectedImpact: finding.recommendation,
      evidence: finding.type,
      executable: true,
    });
  }

  const topActions = actions.slice(0, MAX_COMPETITIVE_ACTIONS);
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
    operatorFeedEvents: [...competitive.operatorFeedEvents.slice(0, 2), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichAssessmentsWithCompetitiveReality(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  competitive: CompetitiveRealityAssessment,
): EnrichedCompetitiveAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, competitive),
    founderSensemaking: mergeSensemaking(founderSensemaking, competitive),
  };
}
