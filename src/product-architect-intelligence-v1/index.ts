/**
 * Product Architect Intelligence V1 — public API.
 */

export {
  PRODUCT_ARCHITECT_INTELLIGENCE_V1_PASS_TOKEN,
  PRODUCT_ARCHITECT_INTELLIGENCE_OWNER_MODULE,
  PRODUCT_ARCHITECT_INTELLIGENCE_PHASE,
  MAX_PRODUCT_ARCHITECT_INTELLIGENCE_HISTORY,
  PRODUCT_READINESS_LAUNCH_READY_THRESHOLD,
  PRODUCT_READINESS_REFINEMENT_THRESHOLD,
  PRODUCT_READINESS_COMPLETE_THRESHOLD,
  MIN_PRODUCT_ARCHITECT_SUITE_APPS,
} from './product-architect-intelligence-bounds.js';

export type {
  ProductArchitectDomain,
  ProductGapCategory,
  ProductGapSeverity,
  ProductReadinessLabel,
  ProductArchitectureRootCause,
  MissingScreenFinding,
  WorkflowCompletenessFinding,
  UserJourneyFinding,
  ProductGapFinding,
  ProductGapReport,
  ProductArchitectureScores,
  ProductArchitectureCqiContext,
  ProductArchitectureAssessment,
  AssessProductArchitectureInput,
  ProductArchitectIntelligenceHistoryEntry,
} from './product-architect-intelligence-types.js';

export {
  PRODUCT_PATTERN_REGISTRY,
  detectProductArchitectDomain,
  resolveProductPattern,
} from './product-pattern-registry.js';

export {
  PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS,
  resolveProductArchitectIntelligenceSuiteApp,
} from './product-architect-intelligence-suite-registry.js';

export { detectMissingScreens } from './product-missing-screen-detector.js';
export { analyzeWorkflowCompleteness } from './product-workflow-completeness.js';
export { analyzeUserJourneys } from './product-user-journey-analyzer.js';
export { buildProductGapReport, listCriticalProductGaps } from './product-gap-report-builder.js';
export {
  computeProductArchitectureScores,
  buildProductArchitectureRecommendations,
} from './product-readiness-score.js';
export { buildProductArchitectureCqiContext } from './product-architect-cqi-integration.js';
export { buildUvlProductArchitectureSummary } from './product-architect-uvl-integration.js';
export { computeProductArchitectureAflaPenalty } from './product-architect-afla-integration.js';
export {
  measureProductArchitectureForCategory,
  buildLargeScaleProductArchitectureSummary,
} from './product-architect-large-scale-integration.js';

export {
  resetProductArchitectIntelligenceHistoryForTests,
  recordProductArchitectureAssessment,
  getLastProductArchitectureAssessment,
  listProductArchitectIntelligenceHistory,
  getProductArchitectIntelligenceHistorySize,
} from './product-architect-intelligence-history.js';

export {
  assessProductArchitecture,
  registerSourceDerivedProductArchitectureAssessment,
  getProductReadinessScore,
  isArchitecturallyIncomplete,
} from './product-architecture-assessor.js';

export { buildProductArchitectIntelligenceReportMarkdown } from './product-architect-intelligence-report-builder.js';

export function getProductArchitectIntelligenceConsolidationOwnership(): {
  capability: string;
  ownerModule: string;
  status: 'CANONICAL';
} {
  return {
    capability: 'Product Architect Intelligence',
    ownerModule: 'aidevengine_product_architect_intelligence',
    status: 'CANONICAL',
  };
}
