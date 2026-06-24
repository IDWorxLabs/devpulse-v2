/**

 * Clarifying Question Intelligence — public API.

 */



export {

  CLARIFYING_QUESTION_INTELLIGENCE_PASS_TOKEN,

  CLARIFYING_QUESTION_OWNER_MODULE,

  MAX_CLARIFYING_HISTORY,

  CLARIFYING_QUESTION_CACHE_KEY_PREFIX,

  CLARIFYING_QUESTION_REPORT_TITLE,

} from './clarifying-question-bounds.js';



export type {

  ClarifyingQuestionReadinessState,

  RequirementCategoryId,

  ClarifyingQuestionPriority,

  ClarifyingQuestionDefinition,

  RequirementCategoryDefinition,

  ClarifyingQuestionAssessment,

} from './clarifying-question-types.js';



export {

  REQUIREMENT_CATEGORY_DEFINITIONS,

  MAX_REQUIREMENT_CATEGORIES,

  ASSUMPTION_PREVENTION_BY_CATEGORY,

} from './clarifying-question-categories.js';



export {

  resetClarifyingQuestionHistoryForTests,

  recordClarifyingQuestionAssessment,

  getClarifyingQuestionHistorySize,

  getLatestClarifyingQuestionAssessment,

} from './clarifying-question-history.js';



export { buildClarifyingQuestionReportMarkdown } from './clarifying-question-report-builder.js';



export {

  validateRequirementCategoryCount,

  validateCategoryDetection,

  validateMissingRequirementDetection,

  validateCriticalRequirementDetection,

  validateQuestionGeneration,

  validatePriorityClassification,

  validateCompletenessScoring,

  validateClarifyingDeterministicScoring,

  validateClarifyingAdvisoryOnly,

  validateClarifyingReportGeneration,

  validateCriticalBlocksClarification,

} from './clarifying-question-validator.js';



export {

  detectRequirementCategories,

  generateRecommendedQuestions,

  assessClarifyingQuestionIntelligence,

  buildClarifyingQuestionIntelligenceArtifacts,

} from './clarifying-question-authority.js';



export type {

  ProjectArchetype,

  LiveGateCategoryId,

  LiveGateDecision,

  LiveGateCategoryDefinition,

  LiveGateQuestionDefinition,

  ClarifyingAnswerRecord,

  AssumptionPreventedEvent,

  ClarifyingLiveGateInput,

  ClarifyingLiveGateResult,

  ClarifyingLiveGateScenario,

} from './clarifying-question-live-gate-types.js';

export { CLARIFYING_QUESTION_LIVE_GATE_PASS_TOKEN } from './clarifying-question-live-gate-types.js';



export {

  LIVE_GATE_CATEGORY_DEFINITIONS,

  MAX_LIVE_GATE_CATEGORIES,

  ARCHETYPE_QUESTION_OVERRIDES,

} from './clarifying-question-live-gate-categories.js';



export {

  resetClarifyingLiveGateMemoryForTests,

  recordClarifyingAnswer,

  listClarifyingAnswers,

  loadClarifyingAnswersFromVault,

  buildClarifyingEvidenceText,

  getClarifyingLiveGateMemorySize,

} from './clarifying-question-live-gate-memory.js';



export {

  detectProjectArchetype,

  detectLiveGateCategories,

  generateLiveGateQuestions,

  buildAssumptionPreventedEvents,

  formatClarificationPrompt,

  evaluateClarifyingLiveGate,

  canProceedToPlanning,

  applyClarifyingAnswersToPrompt,

  resetClarifyingLiveGateMetricsForTests,

  getClarifyingLiveGateMetrics,

} from './clarifying-question-live-gate.js';



export {

  CLARIFYING_LIVE_GATE_SCENARIOS,

  CLARIFYING_LIVE_GATE_FOOD_DELIVERY_PROMPT,

  CLARIFYING_LIVE_GATE_COMPLETE_FOOD_DELIVERY_ANSWERS,

} from './clarifying-question-live-gate-scenarios.js';



export {

  validateLiveGateCategoryCount,

  validateLiveGateBlocksPlanning,

  validateLiveGateQuestionsGenerated,

  validateLiveGateAssumptionPrevention,

  validateLiveGateDeterministicOutput,

  validateLiveGateUnblocksAfterAnswers,

  validateLiveGateNoDuplicateQuestions,

  validateLiveGateReadOnly,

} from './clarifying-question-live-gate-validator.js';



export {

  evaluateRequirementExtractionGate,

  extractRequirementsWithClarifyingGate,

  resolveRequirementGateWithAnswers,

} from './clarifying-question-aidev-bridge.js';



export type { RequirementExtractionGateResult } from './clarifying-question-aidev-bridge.js';



export {

  evaluateWorld2PlanningGate,

  generateExecutionPlanWithClarifyingGate,

} from './clarifying-question-world2-bridge.js';



export type { World2PlanningGateResult } from './clarifying-question-world2-bridge.js';

export {
  CQI_CANONICAL_OWNERSHIP_STATUS,
  CQI_CANONICAL_RESPONSIBILITIES,
  CQI_CONSOLIDATED_CAPABILITIES,
  getClarifyingQuestionConsolidationOwnership,
} from './clarifying-question-consolidation-ownership.js';
export type { ClarifyingQuestionConsolidationOwnership } from './clarifying-question-consolidation-ownership.js';


