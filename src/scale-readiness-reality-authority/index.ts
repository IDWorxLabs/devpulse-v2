/**
 * Scale Readiness Reality Authority — public API (Phase 26.20).
 */

export {
  SCALE_READINESS_REALITY_AUTHORITY_PASS_TOKEN,
  SCALE_READINESS_REALITY_AUTHORITY_OWNER_MODULE,
  SCALE_READINESS_REALITY_AUTHORITY_PHASE,
  SCALE_READINESS_REALITY_AUTHORITY_REPORT_TITLE,
  SCALE_READINESS_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  SCALE_READINESS_REALITY_CORE_QUESTION,
  MAX_SCALE_READINESS_REALITY_HISTORY,
  EVIDENCE_SOURCES,
  UPSTREAM_AUTHORITIES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  FABRICATED_EVIDENCE_SOURCES,
  STATE_ORDER,
  FRAGILE_THRESHOLD,
  PARTIALLY_READY_THRESHOLD,
  SCALE_READY_THRESHOLD,
  SCALE_RESILIENT_THRESHOLD,
  MIN_READY_DIMENSIONS_FOR_SCALE_READY,
} from './scale-readiness-registry.js';

export { SCALE_READINESS_STATES } from './scale-readiness-types.js';

export type {
  ScaleReadinessState,
  EvidenceConfidence,
  ObservedEvidenceBase,
  ArchitectureScalabilityEvidence,
  OperationalScalabilityEvidence,
  TeamScalabilityEvidence,
  FinancialScalabilityEvidence,
  CustomerSupportScalabilityEvidence,
  ReliabilityScalabilityEvidence,
  ScaleEvidenceBundle,
  ArchitectureScalabilityAnalysis,
  OperationalScalabilityAnalysis,
  TeamScalabilityAnalysis,
  FinancialScalabilityAnalysis,
  CustomerSupportScalabilityAnalysis,
  ReliabilityScalabilityAnalysis,
  ScaleRiskAnalysis,
  ScaleReadinessVerdict,
  ScaleReadinessInputSnapshot,
  ScaleReadinessRealityReport,
  ScaleReadinessRealityAssessment,
  AssessScaleReadinessRealityInput,
  ScaleReadinessRealityHistoryEntry,
  ScaleReadinessRealityHistorySummary,
  ScaleReadinessRealityArtifacts,
} from './scale-readiness-types.js';

export {
  resetScaleReadinessRealityHistoryForTests,
  recordScaleReadinessRealityAssessment,
  getScaleReadinessRealityHistorySize,
  buildScaleReadinessRealityHistorySummary,
} from './scale-readiness-history.js';

export {
  assessScaleReadinessReality,
  buildScaleReadinessRealityArtifacts,
  resetScaleReadinessRealityCounterForTests,
  resetScaleReadinessRealityAuthorityModuleForTests,
} from './scale-readiness-reality-authority.js';

export {
  buildScaleReadinessRealityReportMarkdown,
  formatScaleReadinessRealitySummary,
} from './scale-readiness-report-builder.js';

export { analyzeArchitectureScalability } from './architecture-scalability-analyzer.js';
export { analyzeOperationalScalability } from './operational-scalability-analyzer.js';
export { analyzeTeamScalability } from './team-scalability-analyzer.js';
export { analyzeFinancialScalability } from './financial-scalability-analyzer.js';
export { analyzeCustomerSupportScalability } from './customer-support-scalability-analyzer.js';
export { analyzeReliabilityScalability } from './reliability-scalability-analyzer.js';
export { analyzeScaleRisk } from './scale-risk-analyzer.js';
export { computeScaleReadinessVerdict } from './scale-readiness-verdict-engine.js';
