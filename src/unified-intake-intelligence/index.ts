/**
 * Unified Intake Intelligence — public API (V1).
 */

export {
  UNIFIED_INTAKE_INTELLIGENCE_V1_PASS,
  UNIFIED_INTAKE_INTELLIGENCE_OWNER_MODULE,
  UNIFIED_INTAKE_INTELLIGENCE_PHASE,
  UNIFIED_INTAKE_INTELLIGENCE_REPORT_TITLE,
  MAX_UNIFIED_INTAKE_HISTORY,
  INTAKE_SOURCE_IDS,
  APPLICATION_TYPES,
  INTAKE_READINESS_VALUES,
  SAFETY_GUARANTEES,
} from './unified-intake-registry.js';

export type {
  ApplicationType,
  IntakeReadiness,
  IntakeReadinessCategory,
  EvidenceConflictType,
  IntakeSourceId,
  TypedPromptInput,
  ProjectVaultIntakeSnapshot,
  FounderContextSnapshot,
  UploadIntakeSnapshot,
  PluggableIntakeSource,
  ConsolidatedIntakeEvidence,
  ProjectIntentAnalysis,
  UnifiedProjectUnderstanding,
  EvidenceConflict,
  IntakeGap,
  IntakeRecommendation,
  UnifiedIntakeAnalysis,
  UnifiedIntakeHistoryEntry,
  UnifiedIntakeIntelligenceReport,
  AssessUnifiedIntakeInput,
  UnifiedIntakeAssessment,
} from './unified-intake-types.js';

export {
  resetUnifiedIntakeHistoryForTests,
  recordUnifiedIntakeAnalysis,
  getUnifiedIntakeHistorySize,
  getUnifiedIntakeHistory,
  getUnifiedIntakeAnalyses,
  getLatestUnifiedIntakeAnalysis,
} from './unified-intake-history.js';

export {
  assessUnifiedIntake,
  runUnifiedIntakeIntelligence,
  buildUnifiedIntakeIntelligenceArtifacts,
  resetUnifiedIntakeCounterForTests,
  resetUnifiedIntakeIntelligenceModuleForTests,
} from './unified-intake-authority.js';

export {
  buildUnifiedIntakeIntelligenceReport,
  buildUnifiedIntakeIntelligenceReportMarkdown,
} from './unified-intake-report-builder.js';

export { consolidateIntakeEvidence, hasMinimumIntakeEvidence } from './intake-evidence-consolidator.js';
export { analyzeProjectIntent } from './project-intent-analyzer.js';
export { buildUnifiedProjectUnderstanding } from './project-understanding-builder.js';
export { detectEvidenceConflicts, computeConflictPenalty } from './evidence-conflict-detector.js';
export { detectIntakeGaps } from './intake-gap-detector.js';
export {
  computeUnifiedIntakeConfidence,
  computeIntakeReadinessScore,
  mapIntakeReadinessCategory,
  generateIntakeRecommendations,
} from './intake-confidence-engine.js';
