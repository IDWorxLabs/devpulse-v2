/**
 * Intake Alignment Engine — public API (V1).
 */

export {
  MULTI_SOURCE_INTAKE_ALIGNMENT_REPAIR_V1_PASS,
  INTAKE_ALIGNMENT_ENGINE_OWNER_MODULE,
  INTAKE_ALIGNMENT_ENGINE_PHASE,
  INTAKE_ALIGNMENT_REPORT_TITLE,
  MAX_INTAKE_ALIGNMENT_HISTORY,
  ALIGNMENT_CATEGORIES,
  CONFLICT_CLASSIFICATIONS,
  SAFETY_GUARANTEES,
} from './intake-alignment-registry.js';

export type {
  AlignmentCategory,
  ConflictClassification,
  NormalizedPlatform,
  NormalizedRole,
  NormalizedConcept,
  SemanticAgreementItem,
  ClassifiedConflict,
  PlatformAlignmentResult,
  RoleAlignmentResult,
  WorkflowAlignmentResult,
  AlignmentRecommendation,
  IntakeAlignmentAnalysis,
  IntakeAlignmentHistoryEntry,
  IntakeAlignmentReport,
  AssessIntakeAlignmentInput,
  IntakeAlignmentAssessment,
  SimulationAlignmentImpact,
  AlignmentEvidenceBundle,
} from './intake-alignment-types.js';

export {
  resetIntakeAlignmentHistoryForTests,
  recordIntakeAlignmentAnalysis,
  getIntakeAlignmentHistorySize,
  getIntakeAlignmentHistory,
  getIntakeAlignmentAnalyses,
  getLatestIntakeAlignmentAnalysis,
} from './alignment-history.js';

export {
  assessIntakeAlignment,
  runIntakeAlignmentEngine,
  applyAlignmentRepairToUnifiedIntake,
  resetIntakeAlignmentEngineModuleForTests,
  resetIntakeAlignmentCounterForTests,
} from './intake-alignment-authority.js';

export {
  buildIntakeAlignmentReport,
  buildIntakeAlignmentReportMarkdown,
} from './alignment-report-builder.js';

export {
  normalizeRole,
  normalizePlatform,
  normalizeWorkflow,
  detectProductDomain,
  rolesAreComplementary,
} from './evidence-normalizer.js';

export { buildAlignmentEvidenceBundle, matchCrossSourceEntities } from './cross-source-entity-matcher.js';
export { analyzePlatformAlignment } from './platform-alignment-analyzer.js';
export { analyzeRoleAlignment } from './role-alignment-analyzer.js';
export { analyzeWorkflowAlignment } from './workflow-alignment-analyzer.js';
export { detectSemanticAgreements, classifyConflicts } from './semantic-agreement-detector.js';
export {
  computeAlignmentScore,
  computeAlignedConfidence,
  mapAlignmentCategory,
  generateAlignmentRecommendations,
} from './alignment-confidence-engine.js';

export { computeSimulationAlignmentImpact } from './simulation-alignment-impact.js';
