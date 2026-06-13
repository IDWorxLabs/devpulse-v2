/**
 * Strategic Defensibility Reality Authority — public API (Phase 26.22).
 */

export {
  STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_PASS_TOKEN,
  STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_OWNER_MODULE,
  STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_PHASE,
  STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_REPORT_TITLE,
  STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  STRATEGIC_DEFENSIBILITY_REALITY_CORE_QUESTION,
  MAX_STRATEGIC_DEFENSIBILITY_REALITY_HISTORY,
  EVIDENCE_SOURCES,
  UPSTREAM_AUTHORITIES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  FABRICATED_EVIDENCE_SOURCES,
  STATE_ORDER,
  WEAKLY_DEFENSIBLE_THRESHOLD,
  MODERATELY_DEFENSIBLE_THRESHOLD,
  STRONGLY_DEFENSIBLE_THRESHOLD,
  CATEGORY_DEFENSIBLE_THRESHOLD,
  MIN_MOAT_DIMENSIONS_FOR_STRONGLY_DEFENSIBLE,
} from './strategic-defensibility-registry.js';

export { STRATEGIC_DEFENSIBILITY_STATES } from './strategic-defensibility-types.js';

export type {
  StrategicDefensibilityState,
  EvidenceConfidence,
  ObservedEvidenceBase,
  NetworkEffectsEvidence,
  DataAdvantageEvidence,
  SwitchingCostEvidence,
  BrandTrustEvidence,
  DistributionAdvantageEvidence,
  ExecutionAdvantageEvidence,
  DefensibilityEvidenceBundle,
  NetworkEffectsAnalysis,
  DataAdvantageAnalysis,
  SwitchingCostAnalysis,
  BrandTrustAnalysis,
  DistributionAdvantageAnalysis,
  ExecutionAdvantageAnalysis,
  DefensibilityRiskAnalysis,
  StrategicDefensibilityVerdict,
  StrategicDefensibilityInputSnapshot,
  StrategicDefensibilityRealityReport,
  StrategicDefensibilityRealityAssessment,
  AssessStrategicDefensibilityRealityInput,
  StrategicDefensibilityRealityHistoryEntry,
  StrategicDefensibilityRealityHistorySummary,
  StrategicDefensibilityRealityArtifacts,
} from './strategic-defensibility-types.js';

export {
  resetStrategicDefensibilityRealityHistoryForTests,
  recordStrategicDefensibilityRealityAssessment,
  getStrategicDefensibilityRealityHistorySize,
  buildStrategicDefensibilityRealityHistorySummary,
} from './strategic-defensibility-history.js';

export {
  assessStrategicDefensibilityReality,
  buildStrategicDefensibilityRealityArtifacts,
  resetStrategicDefensibilityRealityCounterForTests,
  resetStrategicDefensibilityRealityAuthorityModuleForTests,
} from './strategic-defensibility-reality-authority.js';

export {
  buildStrategicDefensibilityRealityReportMarkdown,
  formatStrategicDefensibilityRealitySummary,
} from './strategic-defensibility-report-builder.js';

export { analyzeNetworkEffects } from './network-effects-analyzer.js';
export { analyzeDataAdvantage } from './data-advantage-analyzer.js';
export { analyzeSwitchingCost } from './switching-cost-analyzer.js';
export { analyzeBrandTrust } from './brand-trust-analyzer.js';
export { analyzeDistributionAdvantage } from './distribution-advantage-analyzer.js';
export { analyzeExecutionAdvantage } from './execution-advantage-analyzer.js';
export { analyzeDefensibilityRisk } from './defensibility-risk-analyzer.js';
export { computeStrategicDefensibilityVerdict } from './strategic-defensibility-verdict-engine.js';
