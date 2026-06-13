/**
 * Expansion risk analyzer.
 */

import type {
  ChannelExpansionAnalysis,
  CustomerSegmentExpansionAnalysis,
  ExpansionRiskAnalysis,
  IndustryExpansionAnalysis,
  ProductMarketFitResilienceAnalysis,
  RegionalExpansionAnalysis,
} from './market-expansion-reality-types.js';

export function analyzeExpansionRisk(input: {
  customerSegment: CustomerSegmentExpansionAnalysis;
  industry: IndustryExpansionAnalysis;
  regional: RegionalExpansionAnalysis;
  channel: ChannelExpansionAnalysis;
  productMarketFit: ProductMarketFitResilienceAnalysis;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  scaleReadinessOnly?: boolean;
  productLaunched: boolean;
}): ExpansionRiskAnalysis {
  const riskSignals: string[] = [];
  let expansionRiskScore = 0;

  if (input.revenueOnly) {
    expansionRiskScore += 40;
    riskSignals.push('Market risk — revenue alone does not indicate expansion readiness');
  }

  if (input.adoptionOnly) {
    expansionRiskScore += 35;
    riskSignals.push('Segment risk — adoption alone does not indicate expansion readiness');
  }

  if (input.scaleReadinessOnly) {
    expansionRiskScore += 30;
    riskSignals.push('Execution risk — scale readiness alone is insufficient for expansion resilience');
  }

  if (input.customerSegment.customerSegmentScore < 40) {
    expansionRiskScore += 12;
    riskSignals.push('Segment risk — limited cross-segment adoption evidence');
  }

  if (input.industry.industryScore < 40) {
    expansionRiskScore += 12;
    riskSignals.push('Industry risk — limited industry fit and use case diversity');
  }

  if (input.regional.regionalScore < 40) {
    expansionRiskScore += 12;
    riskSignals.push('Regional risk — localization and regional adoption not proven');
  }

  if (input.channel.channelScore < 40) {
    expansionRiskScore += 10;
    riskSignals.push('Channel dependency risk — limited acquisition channel diversity');
  }

  if (input.productMarketFit.productMarketFitScore < 50) {
    expansionRiskScore += 15;
    riskSignals.push('Focus dilution risk — PMF stability under expansion stress not proven');
  }

  if (input.productLaunched && input.customerSegment.customerSegmentScore < 25) {
    riskSignals.push('Market dependency risk — single-segment concentration likely');
  }

  expansionRiskScore = Math.min(100, Math.max(0, expansionRiskScore));

  return {
    readOnly: true,
    marketRisk: input.revenueOnly || expansionRiskScore >= 50,
    segmentRisk: input.customerSegment.customerSegmentScore < 50,
    industryRisk: input.industry.industryScore < 50,
    regionalRisk: input.regional.regionalScore < 50,
    executionRisk: input.scaleReadinessOnly || input.channel.channelScore < 40,
    focusDilutionRisk: input.productMarketFit.productMarketFitScore < 45,
    expansionRiskScore,
    riskSignals: [...new Set(riskSignals)].slice(0, 12),
  };
}
