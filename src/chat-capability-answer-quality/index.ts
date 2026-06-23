/**
 * Phase 26.92 — Chat Capability Answer Quality (V1).
 */

export {
  CHAT_CAPABILITY_ANSWER_QUALITY_PASS,
  CHAT_CAPABILITY_ANSWER_QUALITY_CORE_QUESTION,
  CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE,
  CAPABILITY_ANSWER_QUALITY_RULES,
  CAPABILITY_ANSWER_SCENARIOS,
  GENERIC_AI_PATTERNS,
  OVERCLAIM_PATTERNS,
} from './chat-capability-answer-quality-registry.js';

export type {
  CapabilityAnswerScenarioId,
  CapabilityAnswerScenarioDefinition,
  CapabilityBoundaryLevel,
  CapabilityAnswerDimensionScores,
  CapabilityAnswerAudit,
  CapabilityAnswerRepairPlan,
  ChatCapabilityAnswerQualityReport,
  ChatCapabilityAnswerQualityAssessment,
  AssessChatCapabilityAnswerQualityInput,
  BuildRepairedCapabilityAnswerInput,
} from './chat-capability-answer-quality-types.js';

export {
  assessChatCapabilityAnswerQuality,
  resolveRepairedCapabilityAnswerForMessage,
  matchCapabilityAnswerScenario,
  buildRepairedCapabilityAnswer,
  auditCapabilityAnswer,
  auditAllCapabilityAnswers,
  resetChatCapabilityAnswerQualityModuleForTests,
  resetChatCapabilityAnswerQualityCounterForTests,
} from './chat-capability-answer-quality-authority.js';

export { planCapabilityAnswerRepair, getCapabilityAnswerScenarioDefinition } from './answer-repair-planner.js';

export {
  buildChatCapabilityAnswerQualityReportMarkdown,
  buildChatCapabilityAnswerRepairReportMarkdown,
  buildChatCapabilityAnswerValidationMarkdown,
  buildRepairPlansFromReport,
} from './chat-capability-answer-quality-report-builder.js';

export {
  recordChatCapabilityAnswerQualityReport,
  resetChatCapabilityAnswerQualityHistoryForTests,
  getChatCapabilityAnswerQualityHistorySize,
  getLatestChatCapabilityAnswerQualityHistoryEntry,
  getChatCapabilityAnswerQualityHistory,
} from './chat-capability-answer-quality-history.js';

export { analyzeAnswerHonesty } from './answer-honesty-analyzer.js';
export { analyzeAnswerCompleteness } from './answer-completeness-analyzer.js';
export { analyzeAnswerUsefulness } from './answer-usefulness-analyzer.js';
export {
  analyzeCapabilityBoundaries,
  analyzeIdentityClarity,
  analyzeCapabilityAccuracy,
} from './capability-boundary-analyzer.js';
