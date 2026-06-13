/**
 * Defensibility risk analyzer.
 */

import type {
  BrandTrustAnalysis,
  DataAdvantageAnalysis,
  DefensibilityRiskAnalysis,
  DistributionAdvantageAnalysis,
  ExecutionAdvantageAnalysis,
  NetworkEffectsAnalysis,
  SwitchingCostAnalysis,
} from './strategic-defensibility-types.js';

export function analyzeDefensibilityRisk(input: {
  networkEffects: NetworkEffectsAnalysis;
  dataAdvantage: DataAdvantageAnalysis;
  switchingCost: SwitchingCostAnalysis;
  brandTrust: BrandTrustAnalysis;
  distributionAdvantage: DistributionAdvantageAnalysis;
  executionAdvantage: ExecutionAdvantageAnalysis;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  marketExpansionOnly?: boolean;
  productLaunched: boolean;
}): DefensibilityRiskAnalysis {
  const riskSignals: string[] = [];
  let defensibilityRiskScore = 0;

  if (input.revenueOnly) {
    defensibilityRiskScore += 40;
    riskSignals.push('Competitive threat risk — revenue alone does not indicate defensibility');
  }

  if (input.adoptionOnly) {
    defensibilityRiskScore += 35;
    riskSignals.push('Displacement risk — adoption alone does not indicate moat strength');
  }

  if (input.marketExpansionOnly) {
    defensibilityRiskScore += 30;
    riskSignals.push('Market dependency risk — market expansion alone is insufficient for category defensibility');
  }

  if (input.networkEffects.networkEffectsScore < 40) {
    defensibilityRiskScore += 12;
    riskSignals.push('Commoditization risk — limited network effects evidence');
  }

  if (input.switchingCost.switchingCostScore < 40) {
    defensibilityRiskScore += 15;
    riskSignals.push('Displacement risk — limited switching cost or workflow dependency evidence');
  }

  if (input.dataAdvantage.dataAdvantageScore < 40) {
    defensibilityRiskScore += 10;
    riskSignals.push('Commoditization risk — limited data advantage evidence');
  }

  if (input.brandTrust.brandTrustScore < 35) {
    defensibilityRiskScore += 10;
    riskSignals.push('Competitive threat risk — limited brand trust durability');
  }

  if (input.distributionAdvantage.distributionScore < 35) {
    defensibilityRiskScore += 8;
    riskSignals.push('Platform risk — limited distribution advantage');
  }

  if (input.executionAdvantage.executionAdvantageScore < 40 && input.productLaunched) {
    defensibilityRiskScore += 8;
    riskSignals.push('Competitive threat risk — execution advantage not proven');
  }

  defensibilityRiskScore = Math.min(100, Math.max(0, defensibilityRiskScore));

  return {
    readOnly: true,
    competitiveThreatRisk: input.revenueOnly || defensibilityRiskScore >= 50,
    commoditizationRisk: input.networkEffects.networkEffectsScore < 45 && input.dataAdvantage.dataAdvantageScore < 45,
    displacementRisk: input.switchingCost.switchingCostScore < 45 || input.adoptionOnly === true,
    platformRisk: input.distributionAdvantage.distributionScore < 40,
    marketDependencyRisk: input.marketExpansionOnly || input.brandTrust.brandTrustScore < 30,
    defensibilityRiskScore,
    riskSignals: [...new Set(riskSignals)].slice(0, 12),
  };
}
