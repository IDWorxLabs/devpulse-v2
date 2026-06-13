/**
 * Market expansion verdict engine — evidence-only expansion state derivation.
 */

import { dimensionReady } from './evidence-validation.js';
import {
  EXPANSION_RESILIENT_THRESHOLD,
  LOCAL_SUCCESS_THRESHOLD,
  MARKET_EXPANSION_REALITY_CORE_QUESTION,
  MIN_READY_DIMENSIONS_FOR_MULTI_MARKET,
  MULTI_MARKET_READY_THRESHOLD,
  SEGMENT_READY_THRESHOLD,
} from './market-expansion-reality-registry.js';
import type {
  ChannelExpansionAnalysis,
  CustomerSegmentExpansionAnalysis,
  ExpansionRiskAnalysis,
  IndustryExpansionAnalysis,
  MarketExpansionState,
  MarketExpansionVerdict,
  ProductMarketFitResilienceAnalysis,
  RegionalExpansionAnalysis,
} from './market-expansion-reality-types.js';

export function computeMarketExpansionVerdict(input: {
  customerSegment: CustomerSegmentExpansionAnalysis;
  industry: IndustryExpansionAnalysis;
  regional: RegionalExpansionAnalysis;
  channel: ChannelExpansionAnalysis;
  productMarketFit: ProductMarketFitResilienceAnalysis;
  expansionRisk: ExpansionRiskAnalysis;
  overallExpansionScore: number;
  productLaunched: boolean;
  localMarketSuccess: boolean;
  rejectFabricated?: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  scaleReadinessOnly?: boolean;
}): MarketExpansionVerdict {
  const missingEvidence = [
    ...input.customerSegment.missingEvidence,
    ...input.industry.missingEvidence,
    ...input.regional.missingEvidence,
    ...input.channel.missingEvidence,
    ...input.productMarketFit.missingEvidence,
  ].slice(0, 12);

  const riskSignals = [
    ...input.customerSegment.riskSignals,
    ...input.industry.riskSignals,
    ...input.regional.riskSignals,
    ...input.channel.riskSignals,
    ...input.productMarketFit.riskSignals,
    ...input.expansionRisk.riskSignals,
  ];

  const segmentExpansionReady = dimensionReady(input.customerSegment.customerSegmentScore);
  const industryExpansionReady = dimensionReady(input.industry.industryScore);
  const regionalExpansionReady = dimensionReady(input.regional.regionalScore);
  const channelExpansionReady = dimensionReady(input.channel.channelScore);

  const readyCount = [
    segmentExpansionReady,
    industryExpansionReady,
    regionalExpansionReady,
    channelExpansionReady,
    dimensionReady(input.productMarketFit.productMarketFitScore),
  ].filter(Boolean).length;

  const keyFindings: string[] = [];
  const recommendedActions: string[] = [];
  let marketExpansionState: MarketExpansionState = 'NOT_READY';

  if (input.rejectFabricated) {
    marketExpansionState = 'NOT_READY';
    keyFindings.unshift('Fabricated market evidence rejected — evidence-only verdict enforced');
    recommendedActions.push('Provide verifiable segment, regional, and PMF expansion evidence');
  } else if (input.revenueOnly || input.adoptionOnly) {
    marketExpansionState = 'NOT_READY';
    keyFindings.push(
      input.revenueOnly
        ? 'Revenue alone cannot create multi-market expansion readiness'
        : 'Adoption alone cannot create multi-market expansion readiness',
    );
    recommendedActions.push('Collect multi-dimensional expansion evidence beyond revenue or adoption');
  } else if (!input.productLaunched) {
    marketExpansionState = 'NOT_READY';
    keyFindings.push('Product not launched — market expansion cannot be assessed');
    recommendedActions.push('Launch product and establish local market success before expansion');
  } else if (input.localMarketSuccess && readyCount === 0) {
    marketExpansionState = 'LOCAL_SUCCESS';
    keyFindings.push('Local market success observed — expansion dimensions not yet proven');
    recommendedActions.push('Collect segment, industry, regional, and channel expansion evidence');
  } else if (readyCount === 0) {
    marketExpansionState = 'NOT_READY';
    keyFindings.push('No expansion dimensions proven from observed evidence');
    recommendedActions.push('Establish local PMF and collect expansion readiness reports');
    missingEvidence.push('Multi-dimensional market expansion evidence');
  } else if (
    input.overallExpansionScore >= EXPANSION_RESILIENT_THRESHOLD &&
    readyCount >= 4 &&
    dimensionReady(input.productMarketFit.productMarketFitScore) &&
    !input.scaleReadinessOnly &&
    input.expansionRisk.expansionRiskScore <= 25
  ) {
    marketExpansionState = 'EXPANSION_RESILIENT';
    keyFindings.push('Expansion resilient — multi-market readiness with stable PMF under expansion stress');
    recommendedActions.push('Monitor focus dilution and segment concentration during expansion');
  } else if (
    input.overallExpansionScore >= MULTI_MARKET_READY_THRESHOLD &&
    readyCount >= MIN_READY_DIMENSIONS_FOR_MULTI_MARKET &&
    !(input.revenueOnly || input.adoptionOnly)
  ) {
    marketExpansionState = 'MULTI_MARKET_READY';
    keyFindings.push(`Multi-market ready — ${readyCount}/5 expansion dimensions proven`);
    recommendedActions.push('Validate PMF resilience before entering new markets');
  } else if (input.overallExpansionScore >= SEGMENT_READY_THRESHOLD && readyCount >= 2) {
    marketExpansionState = 'SEGMENT_READY';
    keyFindings.push(`Segment ready — ${readyCount}/5 expansion dimensions proven`);
    recommendedActions.push('Strengthen regional and industry expansion evidence before multi-market entry');
  } else if (input.overallExpansionScore >= LOCAL_SUCCESS_THRESHOLD || input.localMarketSuccess) {
    marketExpansionState = 'LOCAL_SUCCESS';
    keyFindings.push('Local success — limited expansion readiness beyond primary market');
    recommendedActions.push('Prove cross-segment adoption and channel diversity');
  } else {
    marketExpansionState = 'NOT_READY';
    keyFindings.push('Not ready for market expansion — insufficient evidence');
    recommendedActions.push('Focus on local PMF before pursuing expansion');
  }

  if (input.scaleReadinessOnly && marketExpansionState === 'EXPANSION_RESILIENT') {
    marketExpansionState = 'MULTI_MARKET_READY';
    keyFindings.unshift('Scale readiness alone cannot produce EXPANSION_RESILIENT — capped at MULTI_MARKET_READY');
  }

  if ((input.revenueOnly || input.adoptionOnly) && marketExpansionState !== 'NOT_READY') {
    marketExpansionState = 'NOT_READY';
  }

  const confidenceBase = Math.round(
    input.overallExpansionScore * 0.35 +
      readyCount * 10 +
      (100 - input.expansionRisk.expansionRiskScore) * 0.15,
  );
  const confidence = Math.min(100, Math.max(0, confidenceBase));

  const finalVerdict =
    `${MARKET_EXPANSION_REALITY_CORE_QUESTION} → ${marketExpansionState}. ` +
    (readyCount >= MIN_READY_DIMENSIONS_FOR_MULTI_MARKET
      ? `${readyCount}/5 expansion dimensions proven from observed evidence.`
      : 'Revenue, adoption, and scale readiness alone are insufficient for expansion readiness.');

  return {
    readOnly: true,
    marketExpansionState,
    overallExpansionScore: input.overallExpansionScore,
    confidence,
    segmentExpansionReady,
    industryExpansionReady,
    regionalExpansionReady,
    channelExpansionReady,
    riskSignals: [...new Set(riskSignals)].slice(0, 12),
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    keyFindings: [...new Set(keyFindings)].slice(0, 8),
    recommendedActions: [...new Set(recommendedActions)].slice(0, 8),
    finalVerdict,
  };
}
