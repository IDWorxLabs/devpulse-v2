/**
 * Revenue Reality Authority — public API (Phase 26.17).
 */

export {
  REVENUE_REALITY_AUTHORITY_PASS_TOKEN,
  REVENUE_REALITY_AUTHORITY_OWNER_MODULE,
  REVENUE_REALITY_AUTHORITY_PHASE,
  REVENUE_REALITY_AUTHORITY_REPORT_TITLE,
  REVENUE_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  REVENUE_REALITY_CORE_QUESTION,
  MAX_REVENUE_REALITY_HISTORY,
  EVIDENCE_SOURCES,
  UPSTREAM_AUTHORITIES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  FABRICATED_EVIDENCE_SOURCES,
  STATE_ORDER,
  EARLY_REVENUE_THRESHOLD,
  REPEAT_REVENUE_THRESHOLD,
  SUSTAINABLE_REVENUE_THRESHOLD,
  BUSINESS_ENGINE_THRESHOLD,
} from './revenue-reality-registry.js';

export { REVENUE_REALITY_STATES } from './revenue-reality-types.js';

export type {
  RevenueRealityState,
  EvidenceConfidence,
  RevenueTrend,
  ObservedEvidenceBase,
  RevenueEvidence,
  CustomerValueEvidence,
  ConversionEvidence,
  RevenueStabilityEvidence,
  RevenueEvidenceBundle,
  RevenueEvidenceAnalysis,
  CustomerValueAnalysis,
  ConversionAnalysis,
  RevenueStabilityAnalysis,
  BusinessRiskAnalysis,
  RevenueVerdict,
  RevenueInputSnapshot,
  RevenueRealityReport,
  RevenueRealityAssessment,
  AssessRevenueRealityInput,
  RevenueRealityHistoryEntry,
  RevenueRealityHistorySummary,
  RevenueRealityArtifacts,
} from './revenue-reality-types.js';

export {
  resetRevenueRealityHistoryForTests,
  recordRevenueRealityAssessment,
  getRevenueRealityHistorySize,
  buildRevenueRealityHistorySummary,
} from './revenue-reality-history.js';

export {
  assessRevenueReality,
  buildRevenueRealityArtifacts,
  resetRevenueRealityCounterForTests,
  resetRevenueRealityAuthorityModuleForTests,
} from './revenue-reality-authority.js';

export {
  buildRevenueRealityReportMarkdown,
  formatRevenueRealitySummary,
} from './revenue-reality-report-builder.js';

export { analyzeRevenueEvidence } from './revenue-evidence-analyzer.js';
export { analyzeCustomerValue } from './customer-value-analyzer.js';
export { analyzeConversion } from './conversion-analyzer.js';
export { analyzeRevenueStability } from './revenue-stability-analyzer.js';
export { analyzeBusinessRisk } from './business-risk-analyzer.js';
export { computeRevenueVerdict } from './revenue-verdict-engine.js';
