/**
 * Requirement Completeness Intelligence — public API (V1).
 */

export {
  REQUIREMENT_COMPLETENESS_INTELLIGENCE_PASS_TOKEN,
  REQUIREMENT_COMPLETENESS_INTELLIGENCE_OWNER_MODULE,
  REQUIREMENT_COMPLETENESS_INTELLIGENCE_PHASE,
  REQUIREMENT_COMPLETENESS_INTELLIGENCE_REPORT_TITLE,
  MAX_REQUIREMENT_COMPLETENESS_HISTORY,
  ANALYSIS_DOMAINS,
  COMPLETENESS_CATEGORIES,
  PROJECT_READINESS_VALUES,
  QUESTION_PRIORITIES,
  SAFETY_GUARANTEES,
} from './requirement-completeness-registry.js';

export type {
  CompletenessCategory,
  ProjectRequirementReadiness,
  RequirementRiskLevel,
  AnalysisDomain,
  QuestionPriority,
  TypedRequirementsInput,
  ProjectVaultFactSnapshot,
  ProjectVaultContextSnapshot,
  ConsolidatedRequirementEvidence,
  DomainAnalysisResult,
  RequirementGap,
  CompletenessClarifyingQuestion,
  RequirementCompletenessAnalysis,
  RequirementCompletenessHistoryEntry,
  RequirementCompletenessIntelligenceReport,
  AssessRequirementCompletenessInput,
  RequirementCompletenessAssessment,
} from './requirement-completeness-types.js';

export {
  resetRequirementCompletenessHistoryForTests,
  recordRequirementCompletenessAnalysis,
  getRequirementCompletenessHistorySize,
  getRequirementCompletenessHistory,
  getRequirementCompletenessAnalyses,
  getLatestRequirementCompletenessAnalysis,
} from './requirement-completeness-history.js';

export {
  assessRequirementCompleteness,
  runRequirementCompletenessIntelligence,
  buildRequirementCompletenessIntelligenceArtifacts,
  resetRequirementCompletenessCounterForTests,
  resetRequirementCompletenessIntelligenceModuleForTests,
} from './requirement-completeness-authority.js';

export {
  buildRequirementCompletenessIntelligenceReport,
  buildRequirementCompletenessIntelligenceReportMarkdown,
} from './requirement-completeness-report-builder.js';

export { analyzeRequirementDomains } from './requirement-domain-analyzer.js';
export { analyzeProjectScope } from './project-scope-analyzer.js';
export { detectRequirementGaps } from './requirement-gap-detector.js';
export { generateClarifyingQuestions } from './clarifying-question-generator.js';
export {
  computeCompletenessScore,
  mapCompletenessCategory,
  computeReadinessScore,
  determineProjectRequirementReadiness,
  assessRiskLevel,
} from './completeness-score-engine.js';
export { consolidateRequirementEvidence, hasMinimumEvidence } from './requirement-evidence-consolidator.js';

export {
  REQUIREMENT_COMPLETENESS_AUTHORITATIVE_OWNER,
  REQUIREMENT_COMPLETENESS_CONSOLIDATION_STATUS,
  resolveAuthoritativeRequirementIntelligence,
  applyCqiRequirementDelegation,
} from './requirement-completeness-consolidation-bridge.js';
export type { RequirementCompletenessConsolidationSnapshot } from './requirement-completeness-consolidation-bridge.js';
