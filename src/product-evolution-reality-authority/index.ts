/**
 * Product Evolution Reality Authority — public API (Phase 26.18).
 */

export {
  PRODUCT_EVOLUTION_REALITY_AUTHORITY_PASS_TOKEN,
  PRODUCT_EVOLUTION_REALITY_AUTHORITY_OWNER_MODULE,
  PRODUCT_EVOLUTION_REALITY_AUTHORITY_PHASE,
  PRODUCT_EVOLUTION_REALITY_AUTHORITY_REPORT_TITLE,
  PRODUCT_EVOLUTION_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  PRODUCT_EVOLUTION_REALITY_CORE_QUESTION,
  MAX_PRODUCT_EVOLUTION_REALITY_HISTORY,
  EVIDENCE_SOURCES,
  UPSTREAM_AUTHORITIES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  FABRICATED_EVIDENCE_SOURCES,
  STATE_ORDER,
  REACTIVE_PRODUCT_THRESHOLD,
  LEARNING_PRODUCT_THRESHOLD,
  EVOLVING_PRODUCT_THRESHOLD,
  ADAPTIVE_PRODUCT_THRESHOLD,
} from './product-evolution-reality-registry.js';

export { PRODUCT_EVOLUTION_STATES } from './product-evolution-reality-types.js';

export type {
  ProductEvolutionState,
  EvidenceConfidence,
  ObservedEvidenceBase,
  FeedbackLearningEvidence,
  FailureLearningEvidence,
  UsageLearningEvidence,
  RevenueLearningEvidence,
  ImprovementVelocityEvidence,
  EvolutionEvidenceBundle,
  FeedbackLearningAnalysis,
  FailureLearningAnalysis,
  UsageLearningAnalysis,
  RevenueLearningAnalysis,
  ImprovementVelocityAnalysis,
  EvolutionRiskAnalysis,
  ProductEvolutionVerdict,
  ProductEvolutionInputSnapshot,
  ProductEvolutionRealityReport,
  ProductEvolutionRealityAssessment,
  AssessProductEvolutionRealityInput,
  ProductEvolutionRealityHistoryEntry,
  ProductEvolutionRealityHistorySummary,
  ProductEvolutionRealityArtifacts,
} from './product-evolution-reality-types.js';

export {
  resetProductEvolutionRealityHistoryForTests,
  recordProductEvolutionRealityAssessment,
  getProductEvolutionRealityHistorySize,
  buildProductEvolutionRealityHistorySummary,
} from './product-evolution-reality-history.js';

export {
  assessProductEvolutionReality,
  buildProductEvolutionRealityArtifacts,
  resetProductEvolutionRealityCounterForTests,
  resetProductEvolutionRealityAuthorityModuleForTests,
} from './product-evolution-reality-authority.js';

export {
  buildProductEvolutionRealityReportMarkdown,
  formatProductEvolutionRealitySummary,
} from './product-evolution-report-builder.js';

export { analyzeFeedbackLearning } from './feedback-learning-analyzer.js';
export { analyzeFailureLearning } from './failure-learning-analyzer.js';
export { analyzeUsageLearning } from './usage-learning-analyzer.js';
export { analyzeRevenueLearning } from './revenue-learning-analyzer.js';
export { analyzeImprovementVelocity } from './improvement-velocity-analyzer.js';
export { analyzeEvolutionRisk } from './evolution-risk-analyzer.js';
export { computeProductEvolutionVerdict } from './product-evolution-verdict-engine.js';
