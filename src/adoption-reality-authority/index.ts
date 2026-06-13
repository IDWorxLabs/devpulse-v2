/**
 * Adoption Reality Authority — public API (Phase 26.16).
 */

export {
  ADOPTION_REALITY_AUTHORITY_PASS_TOKEN,
  ADOPTION_REALITY_AUTHORITY_OWNER_MODULE,
  ADOPTION_REALITY_AUTHORITY_PHASE,
  ADOPTION_REALITY_AUTHORITY_REPORT_TITLE,
  ADOPTION_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  ADOPTION_REALITY_CORE_QUESTION,
  MAX_ADOPTION_REALITY_HISTORY,
  EVIDENCE_SOURCES,
  UPSTREAM_AUTHORITIES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  FABRICATED_EVIDENCE_SOURCES,
  STATE_ORDER,
  EARLY_ADOPTION_THRESHOLD,
  EMERGING_ADOPTION_THRESHOLD,
  ESTABLISHED_ADOPTION_THRESHOLD,
  CRITICAL_DEPENDENCY_THRESHOLD,
} from './adoption-reality-registry.js';

export { ADOPTION_REALITY_STATES } from './adoption-reality-types.js';

export type {
  AdoptionRealityState,
  EvidenceConfidence,
  ObservedEvidenceBase,
  RepeatUsageEvidence,
  BehavioralIntegrationEvidence,
  FeatureAdoptionEvidence,
  UserDependencyEvidence,
  AdoptionEvidenceBundle,
  RepeatUsageAnalysis,
  BehavioralIntegrationAnalysis,
  FeatureAdoptionAnalysis,
  UserDependencyAnalysis,
  AdoptionRiskAnalysis,
  AdoptionVerdict,
  AdoptionInputSnapshot,
  AdoptionRealityReport,
  AdoptionRealityAssessment,
  AssessAdoptionRealityInput,
  AdoptionRealityHistoryEntry,
  AdoptionRealityHistorySummary,
  AdoptionRealityArtifacts,
} from './adoption-reality-types.js';

export {
  resetAdoptionRealityHistoryForTests,
  recordAdoptionRealityAssessment,
  getAdoptionRealityHistorySize,
  buildAdoptionRealityHistorySummary,
} from './adoption-reality-history.js';

export {
  assessAdoptionReality,
  buildAdoptionRealityArtifacts,
  resetAdoptionRealityCounterForTests,
  resetAdoptionRealityAuthorityModuleForTests,
} from './adoption-reality-authority.js';

export {
  buildAdoptionRealityReportMarkdown,
  formatAdoptionRealitySummary,
} from './adoption-reality-report-builder.js';

export { analyzeRepeatUsage } from './repeat-usage-analyzer.js';
export { analyzeBehavioralIntegration } from './behavioral-integration-analyzer.js';
export { analyzeFeatureAdoption } from './feature-adoption-analyzer.js';
export { analyzeUserDependency } from './user-dependency-analyzer.js';
export { analyzeAdoptionRisk } from './adoption-risk-analyzer.js';
export { computeAdoptionVerdict } from './adoption-verdict-engine.js';
