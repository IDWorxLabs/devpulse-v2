/**
 * Strategic defensibility verdict engine.
 */

import { moatObserved } from './evidence-validation.js';
import {
  CATEGORY_DEFENSIBLE_THRESHOLD,
  MIN_MOAT_DIMENSIONS_FOR_STRONGLY_DEFENSIBLE,
  MODERATELY_DEFENSIBLE_THRESHOLD,
  STRATEGIC_DEFENSIBILITY_REALITY_CORE_QUESTION,
  STRONGLY_DEFENSIBLE_THRESHOLD,
  WEAKLY_DEFENSIBLE_THRESHOLD,
} from './strategic-defensibility-registry.js';
import type {
  BrandTrustAnalysis,
  DataAdvantageAnalysis,
  DefensibilityRiskAnalysis,
  DistributionAdvantageAnalysis,
  ExecutionAdvantageAnalysis,
  NetworkEffectsAnalysis,
  StrategicDefensibilityState,
  StrategicDefensibilityVerdict,
  SwitchingCostAnalysis,
} from './strategic-defensibility-types.js';

export function computeStrategicDefensibilityVerdict(input: {
  networkEffects: NetworkEffectsAnalysis;
  dataAdvantage: DataAdvantageAnalysis;
  switchingCost: SwitchingCostAnalysis;
  brandTrust: BrandTrustAnalysis;
  distributionAdvantage: DistributionAdvantageAnalysis;
  executionAdvantage: ExecutionAdvantageAnalysis;
  defensibilityRisk: DefensibilityRiskAnalysis;
  overallDefensibilityScore: number;
  productLaunched: boolean;
  rejectFabricated?: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  marketExpansionOnly?: boolean;
}): StrategicDefensibilityVerdict {
  const missingEvidence = [
    ...input.networkEffects.missingEvidence,
    ...input.dataAdvantage.missingEvidence,
    ...input.switchingCost.missingEvidence,
    ...input.brandTrust.missingEvidence,
    ...input.distributionAdvantage.missingEvidence,
    ...input.executionAdvantage.missingEvidence,
  ].slice(0, 12);

  const riskSignals = [
    ...input.networkEffects.riskSignals,
    ...input.dataAdvantage.riskSignals,
    ...input.switchingCost.riskSignals,
    ...input.brandTrust.riskSignals,
    ...input.distributionAdvantage.riskSignals,
    ...input.executionAdvantage.riskSignals,
    ...input.defensibilityRisk.riskSignals,
  ];

  const networkEffectsObserved = moatObserved(input.networkEffects.networkEffectsScore);
  const dataAdvantageObserved = moatObserved(input.dataAdvantage.dataAdvantageScore);
  const switchingCostObserved = moatObserved(input.switchingCost.switchingCostScore);
  const brandTrustObserved = moatObserved(input.brandTrust.brandTrustScore);

  const moatCount = [
    networkEffectsObserved,
    dataAdvantageObserved,
    switchingCostObserved,
    brandTrustObserved,
    moatObserved(input.distributionAdvantage.distributionScore),
    moatObserved(input.executionAdvantage.executionAdvantageScore),
  ].filter(Boolean).length;

  const keyFindings: string[] = [];
  const recommendedActions: string[] = [];
  let strategicDefensibilityState: StrategicDefensibilityState = 'EASILY_REPLACED';

  if (input.rejectFabricated) {
    strategicDefensibilityState = 'EASILY_REPLACED';
    keyFindings.unshift('Fabricated moat evidence rejected — evidence-only verdict enforced');
    recommendedActions.push('Provide verifiable network, data, switching cost, and brand trust evidence');
  } else if (input.revenueOnly || input.adoptionOnly) {
    strategicDefensibilityState = 'EASILY_REPLACED';
    keyFindings.push(
      input.revenueOnly
        ? 'Revenue alone cannot create strong defensibility'
        : 'Adoption alone cannot create strong defensibility',
    );
    recommendedActions.push('Collect evidence-backed moat signals beyond revenue or adoption');
  } else if (!input.productLaunched) {
    strategicDefensibilityState = 'EASILY_REPLACED';
    keyFindings.push('Product not launched — defensibility cannot be assessed');
    recommendedActions.push('Launch product and establish customer dependency evidence');
  } else if (moatCount === 0) {
    strategicDefensibilityState = 'EASILY_REPLACED';
    keyFindings.push('No defensibility moats proven from observed evidence');
    recommendedActions.push('Collect network effects, switching cost, and data advantage reports');
    missingEvidence.push('Multi-dimensional defensibility evidence');
  } else if (
    input.overallDefensibilityScore >= CATEGORY_DEFENSIBLE_THRESHOLD &&
    moatCount >= 5 &&
    networkEffectsObserved &&
    switchingCostObserved &&
    !input.marketExpansionOnly &&
    input.defensibilityRisk.defensibilityRiskScore <= 25
  ) {
    strategicDefensibilityState = 'CATEGORY_DEFENSIBLE';
    keyFindings.push('Category defensible — multiple durable moats with low displacement risk');
    recommendedActions.push('Monitor competitive threats and maintain moat evidence collection');
  } else if (
    input.overallDefensibilityScore >= STRONGLY_DEFENSIBLE_THRESHOLD &&
    moatCount >= MIN_MOAT_DIMENSIONS_FOR_STRONGLY_DEFENSIBLE &&
    !(input.revenueOnly || input.adoptionOnly)
  ) {
    strategicDefensibilityState = 'STRONGLY_DEFENSIBLE';
    keyFindings.push(`Strongly defensible — ${moatCount}/6 moat dimensions proven`);
    recommendedActions.push('Strengthen data flywheel and network reinforcement signals');
  } else if (input.overallDefensibilityScore >= MODERATELY_DEFENSIBLE_THRESHOLD && moatCount >= 2) {
    strategicDefensibilityState = 'MODERATELY_DEFENSIBLE';
    keyFindings.push(`Moderately defensible — ${moatCount}/6 moat dimensions proven`);
    recommendedActions.push('Build switching costs and brand trust durability before competitor entry');
  } else if (input.overallDefensibilityScore >= WEAKLY_DEFENSIBLE_THRESHOLD || moatCount >= 1) {
    strategicDefensibilityState = 'WEAKLY_DEFENSIBLE';
    keyFindings.push('Weakly defensible — limited moat evidence');
    recommendedActions.push('Address commoditization and displacement risks');
  } else {
    strategicDefensibilityState = 'EASILY_REPLACED';
    keyFindings.push('Easily replaced — insufficient evidence of competitive advantages');
    recommendedActions.push('Build evidence-backed moats before well-funded competitor entry');
  }

  if (input.marketExpansionOnly && strategicDefensibilityState === 'CATEGORY_DEFENSIBLE') {
    strategicDefensibilityState = 'STRONGLY_DEFENSIBLE';
    keyFindings.unshift('Market expansion alone cannot produce CATEGORY_DEFENSIBLE — capped at STRONGLY_DEFENSIBLE');
  }

  if ((input.revenueOnly || input.adoptionOnly) && strategicDefensibilityState !== 'EASILY_REPLACED') {
    strategicDefensibilityState = 'EASILY_REPLACED';
  }

  const confidenceBase = Math.round(
    input.overallDefensibilityScore * 0.35 +
      moatCount * 10 +
      (100 - input.defensibilityRisk.defensibilityRiskScore) * 0.15,
  );
  const confidence = Math.min(100, Math.max(0, confidenceBase));

  const finalVerdict =
    `${STRATEGIC_DEFENSIBILITY_REALITY_CORE_QUESTION} → ${strategicDefensibilityState}. ` +
    (moatCount >= MIN_MOAT_DIMENSIONS_FOR_STRONGLY_DEFENSIBLE
      ? `${moatCount}/6 moat dimensions proven from observed evidence.`
      : 'Revenue, adoption, and market expansion alone are insufficient for defensibility.');

  return {
    readOnly: true,
    strategicDefensibilityState,
    overallDefensibilityScore: input.overallDefensibilityScore,
    confidence,
    networkEffectsObserved,
    dataAdvantageObserved,
    switchingCostObserved,
    brandTrustObserved,
    riskSignals: [...new Set(riskSignals)].slice(0, 12),
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    keyFindings: [...new Set(keyFindings)].slice(0, 8),
    recommendedActions: [...new Set(recommendedActions)].slice(0, 8),
    finalVerdict,
  };
}
