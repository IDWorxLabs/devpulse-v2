/**
 * Phase 26.95 — Chat Intelligence Scenario Consumption audit (V1).
 */

export type {
  AssessChatIntelligenceScenarioConsumptionInput,
  ChatIntelligenceScenarioConsumptionAssessment,
  ChatIntelligenceScenarioConsumptionReport,
  ChatScenarioPipelineFailureClass,
  ChatScenarioPipelineStage,
  ChatScenarioPipelineTrace,
  ChatScenarioSourceId,
  DeriveChatIntelligenceFromSourcesInput,
} from './chat-intelligence-scenario-consumption-types.js';

export {
  CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_CORE_QUESTION,
  CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_PASS,
  CHAT_SCENARIO_CONSUMPTION_RULES,
  CHAT_SCENARIO_SOURCE_PRIORITY,
  INTEGRATION_TARGETS,
  PIPELINE_STAGES,
  TESTING_INFRASTRUCTURE_DEFECT,
} from './chat-intelligence-scenario-consumption-registry.js';

export {
  assessChatIntelligenceScenarioConsumption,
  applyChatIntelligenceScenarioConsumptionSync,
  resetChatIntelligenceScenarioConsumptionCounterForTests,
  resetChatIntelligenceScenarioConsumptionModuleForTests,
} from './chat-intelligence-scenario-consumption-authority.js';

export {
  deriveChatIntelligenceFromCapabilityAnswerQuality,
  deriveChatIntelligenceFromChatStress,
  deriveChatIntelligenceFromRegisteredSources,
  detectChatIntelligenceConsumptionContradiction,
  reconcileChatIntelligenceForFounderTest,
} from './chat-intelligence-consumption-bridge.js';

export { auditScenarioRegistration, countRegisteredScenarios } from './scenario-registration-auditor.js';
export { auditScenarioDiscovery, countDiscoveredScenarios } from './scenario-discovery-auditor.js';
export { auditScenarioSelection, countSelectedScenarios } from './scenario-selection-auditor.js';
export { auditScenarioExecution, countExecutedScenarios } from './scenario-execution-auditor.js';
export { auditScenarioResultCapture, countResultCapturedScenarios } from './scenario-result-capture-auditor.js';
export {
  auditScenarioScoring,
  auditScenarioScorePropagation,
  countPropagatedScenarios,
  countScoredScenarios,
} from './scenario-score-propagation-auditor.js';

export {
  buildChatIntelligenceScenarioConsumptionReportMarkdown,
  buildChatIntelligenceScenarioPipelineAuditMarkdown,
  buildChatIntelligenceScenarioConsumptionValidationMarkdown,
} from './chat-intelligence-scenario-consumption-report-builder.js';

export {
  getChatIntelligenceScenarioConsumptionHistory,
  getChatIntelligenceScenarioConsumptionHistorySize,
  recordChatIntelligenceScenarioConsumptionReport,
  resetChatIntelligenceScenarioConsumptionHistoryForTests,
} from './chat-intelligence-scenario-consumption-history.js';
