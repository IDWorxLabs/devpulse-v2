/**
 * Market Expansion Reality Authority — public API (Phase 26.21).
 */

export {
  MARKET_EXPANSION_REALITY_AUTHORITY_PASS_TOKEN,
  MARKET_EXPANSION_REALITY_AUTHORITY_OWNER_MODULE,
  MARKET_EXPANSION_REALITY_AUTHORITY_PHASE,
  MARKET_EXPANSION_REALITY_AUTHORITY_REPORT_TITLE,
  MARKET_EXPANSION_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  MARKET_EXPANSION_REALITY_CORE_QUESTION,
  MAX_MARKET_EXPANSION_REALITY_HISTORY,
  EVIDENCE_SOURCES,
  UPSTREAM_AUTHORITIES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  FABRICATED_EVIDENCE_SOURCES,
  STATE_ORDER,
  LOCAL_SUCCESS_THRESHOLD,
  SEGMENT_READY_THRESHOLD,
  MULTI_MARKET_READY_THRESHOLD,
  EXPANSION_RESILIENT_THRESHOLD,
  MIN_READY_DIMENSIONS_FOR_MULTI_MARKET,
} from './market-expansion-reality-registry.js';

export { MARKET_EXPANSION_STATES } from './market-expansion-reality-types.js';

export type {
  MarketExpansionState,
  EvidenceConfidence,
  ObservedEvidenceBase,
  CustomerSegmentExpansionEvidence,
  IndustryExpansionEvidence,
  RegionalExpansionEvidence,
  ChannelExpansionEvidence,
  ProductMarketFitResilienceEvidence,
  ExpansionEvidenceBundle,
  CustomerSegmentExpansionAnalysis,
  IndustryExpansionAnalysis,
  RegionalExpansionAnalysis,
  ChannelExpansionAnalysis,
  ProductMarketFitResilienceAnalysis,
  ExpansionRiskAnalysis,
  MarketExpansionVerdict,
  MarketExpansionInputSnapshot,
  MarketExpansionRealityReport,
  MarketExpansionRealityAssessment,
  AssessMarketExpansionRealityInput,
  MarketExpansionRealityHistoryEntry,
  MarketExpansionRealityHistorySummary,
  MarketExpansionRealityArtifacts,
} from './market-expansion-reality-types.js';

export {
  resetMarketExpansionRealityHistoryForTests,
  recordMarketExpansionRealityAssessment,
  getMarketExpansionRealityHistorySize,
  buildMarketExpansionRealityHistorySummary,
} from './market-expansion-reality-history.js';

export {
  assessMarketExpansionReality,
  buildMarketExpansionRealityArtifacts,
  resetMarketExpansionRealityCounterForTests,
  resetMarketExpansionRealityAuthorityModuleForTests,
} from './market-expansion-reality-authority.js';

export {
  buildMarketExpansionRealityReportMarkdown,
  formatMarketExpansionRealitySummary,
} from './market-expansion-report-builder.js';

export { analyzeCustomerSegmentExpansion } from './customer-segment-expansion-analyzer.js';
export { analyzeIndustryExpansion } from './industry-expansion-analyzer.js';
export { analyzeRegionalExpansion } from './regional-expansion-analyzer.js';
export { analyzeChannelExpansion } from './channel-expansion-analyzer.js';
export { analyzeProductMarketFitResilience } from './product-market-fit-resilience-analyzer.js';
export { analyzeExpansionRisk } from './expansion-risk-analyzer.js';
export { computeMarketExpansionVerdict } from './market-expansion-verdict-engine.js';
