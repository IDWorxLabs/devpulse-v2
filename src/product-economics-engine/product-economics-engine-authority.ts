/**
 * Product Economics Engine — evaluates whether features justify their cost.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { SensemakingFindingType } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import {
  MAX_ECONOMICS_ACTIONS,
  MAX_ECONOMICS_FEATURES,
  MAX_ECONOMICS_FINDINGS,
  MAX_ECONOMICS_RANKED,
} from './product-economics-engine-bounds.js';
import type {
  AssessProductEconomicsInput,
  EconomicsCategory,
  EconomicsFeedEvent,
  EconomicsFinding,
  EconomicsFindingType,
  EconomicsSeverity,
  EconomicsSubscores,
  EnrichedEconomicsAssessments,
  FeatureEconomicsEvaluation,
  ProductEconomicsAssessment,
  ProductEconomicsVisibility,
  RoiClassification,
} from './product-economics-engine-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

const SEVERITY_RANK: Record<EconomicsSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

let findingIdCounter = 0;

export function resetProductEconomicsCounterForTests(): void {
  findingIdCounter = 0;
}

function nextId(prefix: string): string {
  findingIdCounter += 1;
  return `${prefix}-${findingIdCounter}`;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function pushFinding(
  bucket: EconomicsFinding[],
  seen: Set<string>,
  finding: Omit<EconomicsFinding, 'id'> & { id?: string },
): void {
  const key = `${finding.type}:${finding.explanation.trim().toLowerCase()}`;
  if (seen.has(key) || bucket.length >= MAX_ECONOMICS_FINDINGS) return;
  if (ARCH_LEAK.test(`${finding.explanation} ${finding.recommendation}`)) return;
  seen.add(key);
  bucket.push({ ...finding, id: finding.id ?? nextId('economics') });
}

function computePortfolioSubscores(input: AssessProductEconomicsInput): EconomicsSubscores {
  const ft = input.firstTimeUserReality;
  const cj = input.customerJourneySimulation;
  const launch = input.launchDaySimulation;
  const adoption = input.adoptionPrediction;
  const friction = input.founderFrictionHeatmap;
  const promise = input.promiseRealityEngine;
  const combined = `${input.shellSources.html}\n${input.shellSources.appJs}`;
  const validatorLoad = clamp((input.validatorScriptCount ?? 0) * 0.35);

  const userValue = clamp(
    (ft.firstTimeUserScore * 0.25) +
      (cj.subscores.value * 0.25) +
      (adoption.subscores.valueClarity * 0.2) +
      (adoption.subscores.retentionPotential * 0.15) +
      (ft.productUnderstandingPass ? 15 : 0),
  );

  const founderValue = clamp(
    (promise?.promiseRealityScore ?? 50) * 0.25 +
      (cj.customerJourneyScore * 0.2) +
      (launch.launchConfidence * 0.2) +
      (combined.includes('Launch with Confidence') ? 15 : 5) +
      (friction.summary.frictionLevel === 'LOW' ? 15 : 5),
  );

  const buildCost = clamp(
    35 +
      validatorLoad * 0.4 +
      (friction.overallFrictionScore * 0.25) +
      (promise?.executionGapScore ?? 30) * 0.2 +
      (combined.length > 120_000 ? 15 : 5),
  );

  const maintenanceCost = clamp(
    30 +
      (friction.deadEndFindings.length * 4) +
      (launch.majorLaunchRisks ? 15 : 0) +
      (adoption.majorAdoptionRisks ? 12 : 0) +
      (promise?.majorClaimsUnsupported ? 10 : 0),
  );

  const adoptionImpact = clamp(
    (adoption.adoptionPredictionScore * 0.35) +
      (cj.subscores.advocacy * 0.2) +
      (launch.subscores.newUserReadiness * 0.2) +
      (adoption.subscores.recommendationPotential * 0.25),
  );

  const strategicValue = clamp(
    (combined.includes('AiDevEngine') && combined.includes('Autonomous') ? 25 : 10) +
      (promise?.provenClaims.length ?? 0) * 4 +
      (cj.customerReady ? 20 : 10) +
      (launch.launchDayPass ? 15 : 5),
  );

  return { userValue, founderValue, buildCost, maintenanceCost, adoptionImpact, strategicValue };
}

function netValueFromSubscores(subscores: EconomicsSubscores): number {
  const valueAvg =
    (subscores.userValue + subscores.founderValue + subscores.adoptionImpact + subscores.strategicValue) / 4;
  const costAvg = (subscores.buildCost + subscores.maintenanceCost) / 2;
  return clamp(valueAvg - costAvg * 0.55 + 50);
}

function classifyRoi(
  netValue: number,
  subscores: EconomicsSubscores,
  adoptionWeak: boolean,
): RoiClassification {
  if (subscores.userValue < 35 && subscores.buildCost >= 65) return 'DO_NOT_BUILD';
  if (netValue >= 68 && subscores.buildCost <= 62 && subscores.adoptionImpact >= 55 && !adoptionWeak) {
    return 'BUILD_NOW';
  }
  if (netValue >= 52 && subscores.strategicValue >= 50) return 'BUILD_LATER';
  if (netValue < 40 || subscores.userValue < 40) return 'DO_NOT_BUILD';
  return 'EXPERIMENT_FIRST';
}

interface FeatureTemplate {
  id: string;
  name: string;
  adjust: (base: EconomicsSubscores, input: AssessProductEconomicsInput) => EconomicsSubscores;
  explanation: (subscores: EconomicsSubscores, roi: RoiClassification) => string;
  recommendation: (roi: RoiClassification) => string;
}

const FEATURE_TEMPLATES: FeatureTemplate[] = [
  {
    id: 'adoption-blockers-first',
    name: 'Resolve adoption blockers before new surface work',
    adjust: (base, input) => ({
      ...base,
      userValue: clamp(base.userValue + (input.adoptionPrediction.majorAdoptionRisks ? 20 : 5)),
      founderValue: clamp(base.founderValue + 15),
      buildCost: clamp(base.buildCost - 15),
      maintenanceCost: clamp(base.maintenanceCost - 10),
      adoptionImpact: clamp(base.adoptionImpact + 20),
      strategicValue: clamp(base.strategicValue + 10),
    }),
    explanation: (s, roi) =>
      roi === 'BUILD_NOW'
        ? `High adoption leverage (${s.adoptionImpact}/100) with manageable build cost (${s.buildCost}/100).`
        : `Adoption impact ${s.adoptionImpact}/100 — economics favor addressing blockers first.`,
    recommendation: (roi) =>
      roi === 'DO_NOT_BUILD'
        ? 'Do not expand scope until adoption economics improve.'
        : 'Focus on adoption blockers first.',
  },
  {
    id: 'onboarding-value-delivery',
    name: 'Improve first-time value delivery and onboarding clarity',
    adjust: (base, input) => ({
      ...base,
      userValue: clamp(base.userValue + (input.firstTimeUserReality.actionPathPass ? 10 : 18)),
      buildCost: clamp(base.buildCost - 8),
      adoptionImpact: clamp(base.adoptionImpact + 15),
      maintenanceCost: clamp(base.maintenanceCost - 5),
    }),
    explanation: (s) =>
      `User value ${s.userValue}/100 with adoption impact ${s.adoptionImpact}/100 from onboarding improvements.`,
    recommendation: () => 'Improve first-time value delivery before adding new capabilities.',
  },
  {
    id: 'verification-trust-transparency',
    name: 'Strengthen verification trust and evidence clarity',
    adjust: (base, input) => ({
      ...base,
      userValue: clamp(base.userValue + 8),
      founderValue: clamp(base.founderValue + 18),
      buildCost: clamp(base.buildCost + 8),
      maintenanceCost: clamp(base.maintenanceCost + 6),
      strategicValue: clamp(base.strategicValue + 12),
    }),
    explanation: (s) =>
      `Founder value ${s.founderValue}/100; maintenance ${s.maintenanceCost}/100 for trust transparency work.`,
    recommendation: (roi) =>
      roi === 'BUILD_LATER' ? 'Schedule after adoption-critical fixes.' : 'Prioritize explainable verification evidence.',
  },
  {
    id: 'launch-readiness-polish',
    name: 'Launch readiness polish (visual + launch day)',
    adjust: (base, input) => ({
      ...base,
      userValue: clamp(base.userValue + 10),
      founderValue: clamp(base.founderValue + 12),
      buildCost: clamp(base.buildCost + 12),
      maintenanceCost: clamp(base.maintenanceCost + 8),
      adoptionImpact: clamp(base.adoptionImpact + (input.launchDaySimulation.launchDayPass ? 8 : 14)),
    }),
    explanation: (s) =>
      `Launch-oriented polish: adoption impact ${s.adoptionImpact}/100, build cost ${s.buildCost}/100.`,
    recommendation: () => 'Polish launch surfaces only when core adoption economics are stable.',
  },
  {
    id: 'autonomous-builder-execution',
    name: 'Connect Autonomous Builder to real execution',
    adjust: (base) => ({
      ...base,
      userValue: clamp(base.userValue + 5),
      founderValue: clamp(base.founderValue + 22),
      buildCost: clamp(base.buildCost + 28),
      maintenanceCost: clamp(base.maintenanceCost + 22),
      strategicValue: clamp(base.strategicValue + 25),
    }),
    explanation: (s) =>
      `Strategic value ${s.strategicValue}/100 but build ${s.buildCost}/100 and maintenance ${s.maintenanceCost}/100 are high.`,
    recommendation: (roi) =>
      roi === 'BUILD_NOW'
        ? 'Strategic investment justified — plan phased execution connection.'
        : 'Defer full execution connection until adoption blockers are resolved.',
  },
  {
    id: 'portfolio-intelligence-expansion',
    name: 'Expand portfolio intelligence surfaces',
    adjust: (base, input) => ({
      ...base,
      userValue: clamp(base.userValue + (input.customerJourneySimulation.customerReady ? 12 : 4)),
      founderValue: clamp(base.founderValue + 10),
      buildCost: clamp(base.buildCost + 18),
      maintenanceCost: clamp(base.maintenanceCost + 14),
      strategicValue: clamp(base.strategicValue + 8),
      adoptionImpact: clamp(base.adoptionImpact - 5),
    }),
    explanation: (s, roi) =>
      roi === 'DO_NOT_BUILD'
        ? 'This feature introduces significant complexity but provides limited user benefit.'
        : `Portfolio expansion: user value ${s.userValue}/100, adoption impact ${s.adoptionImpact}/100.`,
    recommendation: (roi) =>
      roi === 'DO_NOT_BUILD' ? 'Delay implementation until adoption blockers are resolved.' : 'Validate demand before implementation.',
  },
  {
    id: 'new-surface-before-core',
    name: 'Add new product surface before core workflow is ready',
    adjust: (base, input) => ({
      ...base,
      userValue: clamp(base.userValue - 15),
      buildCost: clamp(base.buildCost + 22),
      maintenanceCost: clamp(base.maintenanceCost + 18),
      adoptionImpact: clamp(base.adoptionImpact - 12),
      strategicValue: clamp(base.strategicValue - 8),
    }),
    explanation: () => 'New surfaces before core readiness increase cost without proportional user benefit.',
    recommendation: () => 'Do not build — focus on core workflow and adoption economics first.',
  },
  {
    id: 'retention-recommendation-loop',
    name: 'Increase retention and recommendation incentives',
    adjust: (base, input) => ({
      ...base,
      userValue: clamp(base.userValue + 12),
      adoptionImpact: clamp(
        base.adoptionImpact +
          (input.adoptionPrediction.subscores.retentionPotential >= 60 ? 8 : 16),
      ),
      buildCost: clamp(base.buildCost + 6),
      maintenanceCost: clamp(base.maintenanceCost + 4),
      strategicValue: clamp(base.strategicValue + 10),
    }),
    explanation: (s) =>
      `Retention/recommendation economics: adoption impact ${s.adoptionImpact}/100, user value ${s.userValue}/100.`,
    recommendation: () => 'Increase retention incentives after validating core value delivery.',
  },
];

function evaluateFeatures(
  input: AssessProductEconomicsInput,
  portfolio: EconomicsSubscores,
  adoptionWeak: boolean,
): FeatureEconomicsEvaluation[] {
  return FEATURE_TEMPLATES.slice(0, MAX_ECONOMICS_FEATURES).map((template) => {
    const subscores = template.adjust({ ...portfolio }, input);
    const netValueScore = netValueFromSubscores(subscores);
    const roiClassification = classifyRoi(netValueScore, subscores, adoptionWeak);
    return {
      id: template.id,
      name: template.name,
      subscores,
      netValueScore,
      productEconomicsScore: netValueScore,
      roiClassification,
      explanation: template.explanation(subscores, roiClassification),
      recommendation: template.recommendation(roiClassification),
    };
  });
}

function generateFindings(
  input: AssessProductEconomicsInput,
  portfolio: EconomicsSubscores,
  features: FeatureEconomicsEvaluation[],
  findings: EconomicsFinding[],
  seen: Set<string>,
): void {
  const adoption = input.adoptionPrediction;
  const launch = input.launchDaySimulation;

  if (portfolio.userValue < 50) {
    pushFinding(
      findings,
      seen,
      {
        type: 'LOW_USER_VALUE',
        category: 'USER_VALUE',
        severity: portfolio.userValue < 35 ? 'HIGH' : 'MEDIUM',
        explanation: 'Current product economics show limited user value relative to founder expectations.',
        recommendation: 'Validate user outcome improvement before investing in new features.',
      },
    );
  }

  if (portfolio.buildCost >= 65) {
    pushFinding(
      findings,
      seen,
      {
        type: 'HIGH_BUILD_COST',
        category: 'BUILD_COST',
        severity: portfolio.buildCost >= 75 ? 'HIGH' : 'MEDIUM',
        explanation: 'Implementation complexity and dependency footprint increase build cost materially.',
        recommendation: 'Reduce scope or simplify architecture before committing build effort.',
      },
    );
  }

  if (portfolio.maintenanceCost >= 60) {
    pushFinding(
      findings,
      seen,
      {
        type: 'HIGH_MAINTENANCE_COST',
        category: 'MAINTENANCE_COST',
        severity: 'MEDIUM',
        explanation: 'Ongoing complexity and support burden create elevated maintenance cost.',
        recommendation: 'Reduce maintenance burden before adding new initiatives.',
      },
    );
  }

  if (portfolio.adoptionImpact < 50 || adoption.majorAdoptionRisks) {
    pushFinding(
      findings,
      seen,
      {
        type: 'LOW_ADOPTION_IMPACT',
        category: 'ADOPTION_IMPACT',
        severity: adoption.majorAdoptionRisks ? 'HIGH' : 'MEDIUM',
        explanation: 'Expected adoption impact is weak relative to proposed product investment.',
        recommendation: 'Focus on adoption blockers first.',
        featureId: 'adoption-blockers-first',
      },
    );
  }

  for (const risk of adoption.retentionRisks.slice(0, 2)) {
    pushFinding(findings, seen, {
      type: 'ECONOMIC_RISK',
      category: 'ADOPTION_IMPACT',
      severity: 'MEDIUM',
      explanation: `Retention economics risk: ${risk}`,
      recommendation: 'Increase retention incentives after core value is proven.',
    });
  }

  for (const risk of launch.trustRisks.slice(0, 1)) {
    pushFinding(findings, seen, {
      type: 'ECONOMIC_RISK',
      category: 'FOUNDER_VALUE',
      severity: 'MEDIUM',
      explanation: `Launch trust economics risk: ${risk}`,
      recommendation: 'Address launch trust risks before high-cost feature investment.',
    });
  }

  for (const feature of features.filter((f) => f.roiClassification === 'DO_NOT_BUILD').slice(0, 2)) {
    pushFinding(findings, seen, {
      type: 'NEGATIVE_ROI',
      category: 'USER_VALUE',
      severity: 'HIGH',
      explanation: `${feature.name}: ${feature.explanation}`,
      recommendation: feature.recommendation,
      featureId: feature.id,
    });
  }

  if (portfolio.strategicValue < 45) {
    pushFinding(findings, seen, {
      type: 'LOW_STRATEGIC_VALUE',
      category: 'STRATEGIC_VALUE',
      severity: 'MEDIUM',
      explanation: 'Proposed initiatives show weak alignment with long-term product vision.',
      recommendation: 'Re-align roadmap to platform leverage and strategic importance.',
    });
  }
}

function buildOperatorFeed(
  portfolio: EconomicsSubscores,
  features: FeatureEconomicsEvaluation[],
  score: number,
): EconomicsFeedEvent[] {
  const buildNow = features.filter((f) => f.roiClassification === 'BUILD_NOW').length;
  return [
    {
      section: 'Product Economics',
      action: 'Evaluating user value',
      detail: `User value ${portfolio.userValue}/100 from outcome and adoption signals.`,
      status: portfolio.userValue >= 60 ? 'Completed' : 'Warning',
    },
    {
      section: 'Product Economics',
      action: 'Evaluating build and maintenance cost',
      detail: `Build ${portfolio.buildCost}/100 | Maintenance ${portfolio.maintenanceCost}/100.`,
      status: portfolio.buildCost >= 70 ? 'Blocked' : 'Completed',
    },
    {
      section: 'Product Economics',
      action: 'Evaluating adoption impact',
      detail: `Adoption impact ${portfolio.adoptionImpact}/100 from prediction and journey signals.`,
      status: portfolio.adoptionImpact >= 55 ? 'Completed' : 'Warning',
    },
    {
      section: 'Product Economics',
      action: 'Classifying ROI opportunities',
      detail: `${buildNow} BUILD_NOW candidate(s) in bounded feature set.`,
      status: buildNow > 0 ? 'Completed' : 'Warning',
    },
    {
      section: 'Product Economics',
      action: 'Ranking strategic investments',
      detail: `${features.filter((f) => f.roiClassification === 'BUILD_LATER' || f.roiClassification === 'BUILD_NOW').length} investable opportunities ranked.`,
      status: 'Completed',
    },
    {
      section: 'Product Economics',
      action: 'Summarizing product economics score',
      detail: `Product Economics Score ${score}/100.`,
      status: score >= 60 ? 'Completed' : 'Warning',
    },
  ];
}

export function assessProductEconomics(input: AssessProductEconomicsInput): ProductEconomicsAssessment {
  const findings: EconomicsFinding[] = [];
  const seen = new Set<string>();
  const portfolio = computePortfolioSubscores(input);
  const adoptionWeak = input.adoptionPrediction.majorAdoptionRisks || input.adoptionPrediction.adoptionPredictionScore < 55;
  const features = evaluateFeatures(input, portfolio, adoptionWeak);
  generateFindings(input, portfolio, features, findings, seen);

  const productEconomicsScore = clamp(
    features.reduce((sum, f) => sum + f.netValueScore, 0) / Math.max(features.length, 1),
  );

  const rankedHigh = [...features]
    .sort((a, b) => b.netValueScore - a.netValueScore)
    .slice(0, MAX_ECONOMICS_RANKED);
  const rankedLow = [...features]
    .sort((a, b) => a.netValueScore - b.netValueScore)
    .slice(0, MAX_ECONOMICS_RANKED);

  const highestRoiOpportunities = rankedHigh
    .filter((f) => f.roiClassification === 'BUILD_NOW' || f.roiClassification === 'BUILD_LATER')
    .map((f) => `[${f.roiClassification}] ${f.name} — ${f.netValueScore}/100`)
    .slice(0, MAX_ECONOMICS_RANKED);

  const lowestRoiOpportunities = rankedLow
    .filter((f) => f.roiClassification === 'DO_NOT_BUILD' || f.roiClassification === 'EXPERIMENT_FIRST')
    .map((f) => `[${f.roiClassification}] ${f.name} — ${f.netValueScore}/100`)
    .slice(0, MAX_ECONOMICS_RANKED);

  const strategicInvestments = features
    .filter(
      (f) =>
        f.subscores.strategicValue >= 65 &&
        (f.roiClassification === 'BUILD_NOW' || f.roiClassification === 'BUILD_LATER'),
    )
    .map((f) => f.name)
    .slice(0, MAX_ECONOMICS_RANKED);

  const deferredOpportunities = features
    .filter((f) => f.roiClassification === 'BUILD_LATER' || f.roiClassification === 'EXPERIMENT_FIRST')
    .map((f) => `[${f.roiClassification}] ${f.name}`)
    .slice(0, MAX_ECONOMICS_RANKED);

  const economicRisks = findings
    .filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')
    .map((f) => f.explanation)
    .slice(0, MAX_ECONOMICS_RANKED);

  const majorEconomicRisks =
    findings.some((f) => f.severity === 'CRITICAL') ||
    features.filter((f) => f.roiClassification === 'DO_NOT_BUILD').length >= 2 ||
    productEconomicsScore < 45;

  const productEconomicsPass = !majorEconomicRisks && productEconomicsScore >= 50;

  return {
    productEconomicsScore,
    subscores: portfolio,
    findings,
    featureEvaluations: features,
    highestRoiOpportunities,
    lowestRoiOpportunities,
    economicRisks,
    strategicInvestments,
    deferredOpportunities,
    productEconomicsSummary: `Product economics ${productEconomicsScore}/100 — ${highestRoiOpportunities[0] ?? 'prioritize adoption economics before expansion'}.`,
    operatorFeedEvents: buildOperatorFeed(portfolio, features, productEconomicsScore),
    majorEconomicRisks,
    productEconomicsPass,
    roiClassificationVisibilityPass: features.every((f) => Boolean(f.roiClassification)),
    costVisibilityPass: portfolio.buildCost >= 0 && portfolio.maintenanceCost >= 0,
    valueVisibilityPass: portfolio.userValue >= 0 && portfolio.founderValue >= 0,
    strategicAlignmentVisibilityPass: portfolio.strategicValue >= 0,
    economicRiskVisibilityPass: findings.length >= 0,
    insufficientInfo: false,
    insufficientInfoReason: null,
  };
}

export function evaluateProductEconomicsVisibility(
  assessment: ProductEconomicsAssessment,
): ProductEconomicsVisibility {
  const checks = [
    assessment.productEconomicsScore >= 0,
    assessment.featureEvaluations.length <= MAX_ECONOMICS_FEATURES,
    assessment.operatorFeedEvents.length >= 5,
    assessment.roiClassificationVisibilityPass,
    assessment.costVisibilityPass,
    assessment.valueVisibilityPass,
    assessment.strategicAlignmentVisibilityPass,
    assessment.economicRiskVisibilityPass,
  ];
  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    productEconomicsScore: assessment.productEconomicsScore,
    majorEconomicRisks: assessment.majorEconomicRisks,
    productEconomicsPass: assessment.productEconomicsPass,
    buildNowCount: assessment.featureEvaluations.filter((f) => f.roiClassification === 'BUILD_NOW').length,
    doNotBuildCount: assessment.featureEvaluations.filter((f) => f.roiClassification === 'DO_NOT_BUILD').length,
  };
}

function mapEconomicsToSensemaking(
  finding: EconomicsFinding,
): import('../founder-sensemaking-engine/founder-sensemaking-types.js').SensemakingFinding {
  const type: SensemakingFindingType =
    finding.type === 'NEGATIVE_ROI' || finding.type === 'ECONOMIC_RISK'
      ? 'COHERENCE_GAP'
      : finding.type === 'LOW_USER_VALUE'
        ? 'CONFUSION'
        : 'ADOPTION_RISK';

  return {
    id: nextId('economics-sense'),
    type,
    severity: finding.severity,
    area: 'Product Economics',
    whatDoesNotMakeSense: finding.explanation,
    whyItMatters: 'Features must justify cost — expected value should exceed expected cost.',
    recommendedUpgrade: finding.recommendation,
    expectedImpact: 'Improves ROI clarity and prioritization quality.',
    evidence: finding.featureId ?? 'Product Economics Engine',
  };
}

function mergeSensemaking(
  base: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  economics: ProductEconomicsAssessment,
): import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment {
  const extraFindings = economics.findings.slice(0, 4).map(mapEconomicsToSensemaking);
  const mergedFindings = [...extraFindings, ...base.findings]
    .sort((a, b) => SEVERITY_RANK[a.severity as EconomicsSeverity] - SEVERITY_RANK[b.severity as EconomicsSeverity])
    .slice(0, 12);

  return {
    ...base,
    findings: mergedFindings,
    operatorFeedEvents: [...economics.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
    productEconomicsSummary: economics.productEconomicsSummary,
    highestRoiOpportunities: economics.highestRoiOpportunities.slice(0, 5),
    economicRisks: economics.economicRisks.slice(0, 5),
    strategicInvestmentCandidates: economics.strategicInvestments.slice(0, 5),
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  economics: ProductEconomicsAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  const templates: ReadonlyArray<{ match: RoiClassification | EconomicsFindingType; title: string; reason: string }> =
    [
      { match: 'BUILD_NOW', title: 'Prioritize high ROI feature', reason: 'High-value opportunity detected.' },
      { match: 'DO_NOT_BUILD', title: 'Delay low-value initiative', reason: 'Negative ROI relative to cost.' },
      { match: 'EXPERIMENT_FIRST', title: 'Validate demand before implementation', reason: 'Insufficient economic evidence.' },
      { match: 'HIGH_MAINTENANCE_COST', title: 'Reduce maintenance burden', reason: 'Maintenance cost elevated.' },
      { match: 'LOW_ADOPTION_IMPACT', title: 'Focus on adoption blockers first', reason: 'Adoption impact too weak for investment.' },
    ];

  const topFeature = economics.featureEvaluations.find((f) => f.roiClassification === 'BUILD_NOW') ??
    economics.featureEvaluations[0];

  if (topFeature) {
    const title = `[${topFeature.roiClassification}] ${topFeature.name.slice(0, 48)}`;
    if (!seen.has(title.toLowerCase())) {
      actions.unshift({
        id: nextId('economics-action'),
        type: 'FIX_ACTION',
        priority: topFeature.roiClassification === 'BUILD_NOW' ? 'HIGH' : 'MEDIUM',
        title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
        rationale: topFeature.recommendation,
        expectedImpact: 'Improves product economics and prioritization.',
        evidence: topFeature.explanation,
        executable: true,
      });
    }
  }

  for (const finding of economics.findings.slice(0, 3)) {
    const template = templates.find((t) => t.match === finding.type);
    if (!template) continue;
    const title = `[${finding.severity}] ${template.title}`;
    if (seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    actions.unshift({
      id: nextId('economics-action'),
      type: 'FIX_ACTION',
      priority: finding.severity === 'CRITICAL' ? 'CRITICAL' : finding.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      title,
      rationale: template.reason,
      expectedImpact: finding.recommendation,
      evidence: finding.explanation,
      executable: true,
    });
  }

  const topActions = actions.slice(0, MAX_ECONOMICS_ACTIONS);
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
    operatorFeedEvents: [...economics.operatorFeedEvents.slice(0, 2), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichAssessmentsWithProductEconomics(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  economics: ProductEconomicsAssessment,
): EnrichedEconomicsAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, economics),
    founderSensemaking: mergeSensemaking(founderSensemaking, economics),
  };
}
