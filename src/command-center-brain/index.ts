/**
 * DevPulse V2 Phase 11.1 Unified Command Center Brain — public API.
 */

export {
  processBrainRequest,
  brainStructuralKey,
  scanBrainModuleForForbiddenPatterns,
  DevPulseV2CommandCenterBrain,
  getDevPulseV2CommandCenterBrain,
  resetDevPulseV2CommandCenterBrainForTests,
  getLastCrossSystemDiagnostics,
  resetCrossSystemDiagnosticsForTests,
  classificationKey,
  responseKey,
  systemsAwarenessKey,
  roadmapContextKey,
  crossSystemAwarenessKey,
  BRAIN_PIPELINE_SEQUENCE,
  OPERATOR_FEED_EVENT_SEQUENCE,
  CROSS_SYSTEM_FEED_DEPENDENCY,
  CROSS_SYSTEM_FEED_IMPACT,
  CROSS_SYSTEM_FEED_RELATIONSHIP,
  PROJECT_UNDERSTANDING_FEED,
  GENERAL_QUESTION_UNDERSTANDING_FEED,
  TIMELINE_INTELLIGENCE_FEED,
  UNIFIED_DECISION_LAYER_FEED,
  SHARED_MEMORY_OPERATOR_FEED_STAGES,
  withSharedMemoryFeedStages,
  COMMAND_CENTER_BRAIN_OWNER_MODULE,
  COMMAND_CENTER_BRAIN_PASS_TOKEN,
} from './command-center-brain.js';

export {
  classifyBrainRequest,
  isKnownCategory,
  isRoadmapQuestion,
  isSystemQuestion,
  isArchitectureQuestion,
  isRelationshipQuestion,
  isDependencyQuestion,
  isImpactQuestion,
  isCrossSystemQuestion,
  isMemoryQuestion,
  isProjectUnderstandingQuestion,
} from './brain-request-classifier.js';

export {
  getCommandCenterAwareSystems,
  findSystemByKeyword,
  assertDistinctFromCentralBrain,
  assertBrainNotSecondCentralBrain,
  summarizeSystemMaturity,
  COMMAND_CENTER_AWARE_SYSTEMS,
} from './brain-system-awareness.js';

export {
  getBrainRoadmapContext,
  getNextBuildRecommendation,
  formatCompletedPhasesList,
  isPhaseComplete,
} from './brain-roadmap-awareness.js';

export {
  generateBrainResponse,
  generateBlockedResponse,
} from './brain-response-generator.js';

export type {
  BrainRequestCategory,
  BrainPipelineStage,
  OperatorFeedEventType,
  BrainRequestInput,
  BrainClassification,
  BrainSystemRecord,
  BrainRoadmapContext,
  OperatorFeedEvent,
  BrainConfirmation,
  BrainResponseResult,
  CrossSystemAwarenessSnapshot,
  CrossSystemDiagnostics,
  CrossSystemRoutingReport,
  SharedMemoryContext,
  ProjectUnderstandingContext,
  ProjectUnderstandingDiagnostics,
  GeneralQuestionRoutingDiagnostics,
  QuestionRoutingPlan,
  TimelineIntelligenceDiagnostics,
  UnifiedDecisionLayerDiagnostics,
  ProjectVaultIntelligenceDiagnostics,
} from './brain-types.js';

export {
  GENERAL_QUESTION_UNDERSTANDING_PASS_TOKEN,
  GENERAL_QUESTION_UNDERSTANDING_OWNER_MODULE,
  understandGeneralQuestion,
  buildQuestionRoutingPlan,
  executeGeneralQuestionRouting,
  getLastGeneralQuestionDiagnostics,
  resetGeneralQuestionUnderstandingForTests,
  detectQuestionDimensions,
  detectContextNeeds,
  selectReasoningModes,
  selectCapabilities,
} from './general-question-understanding/index.js';

export {
  TIMELINE_INTELLIGENCE_PASS_TOKEN,
  TIMELINE_INTELLIGENCE_OWNER_MODULE,
  answerTimelineQuestion,
  answerTimelineQuestionWithTrace,
  buildTimelineState,
  buildTimelineContext,
  getTimelineIntelligenceDiagnostics,
  processTimelineIntelligenceRequest,
  resetTimelineIntelligenceForTests,
  timelineIntelligenceKey,
  isTimelineQuestion,
} from '../timeline-intelligence/index.js';

export {
  UNIFIED_DECISION_LAYER_PASS_TOKEN,
  UNIFIED_DECISION_LAYER_OWNER_MODULE,
  answerDecisionQuestion,
  reasonOverDecision,
  buildDecisionContext,
  createDecisionOptions,
  generateDecisionRecommendation,
  composeDecisionAnswer,
  getUnifiedDecisionLayerDiagnostics,
  processUnifiedDecisionLayerRequest,
  resetUnifiedDecisionLayerForTests,
  unifiedDecisionLayerKey,
  isDecisionQuestion,
} from '../unified-decision-layer/index.js';

export {
  PROJECT_VAULT_INTELLIGENCE_PASS_TOKEN,
  PROJECT_VAULT_INTELLIGENCE_OWNER_MODULE,
  bridgeVaultFactsIntoUnderstanding,
  getProjectVaultIntelligenceDiagnostics,
  isVaultAwareQuestion,
  resetProjectVaultIntelligenceBridgeForTests,
  resetProjectVaultIntelligenceDiagnostics,
  projectVaultIntelligenceKey,
} from '../project-vault-intelligence/index.js';

export {
  CROSS_SYSTEM_AWARENESS_PASS_TOKEN,
  CROSS_SYSTEM_AWARENESS_OWNER_MODULE,
  DUPLICATE_CROSS_SYSTEM_PATTERNS,
  CROSS_SYSTEM_ROUTING_PASS_TOKEN,
  buildCrossSystemRegistry,
  getRelationshipEdges,
  analyzeDependencies,
  analyzeImpact,
  processCrossSystemAwareness,
  buildCrossSystemRoutingReport,
  routingReportKey,
  getDevPulseV2CrossSystemAwareness,
  DevPulseV2CrossSystemAwareness,
} from './cross-system-awareness/index.js';

export {
  BRAIN_REQUEST_CATEGORIES,
  DUPLICATE_BRAIN_PATTERNS,
  resetBrainCountersForTests,
} from './brain-types.js';

export {
  BRAIN_RUNTIME_VERIFICATION_PASS_TOKEN,
  BRAIN_SERVER_CAPABILITY,
  BRAIN_HEALTH_PATH,
  BRAIN_RESPOND_PATH,
  FEED_STAGE_DELAY_MS,
  buildBrainHealthPayload,
  buildBrainRuntimeVerificationReport,
  buildBrainRuntimeVerificationReportFromResult,
  verifyBrainProcessing,
  verifyChatPipeline,
  verifyOperatorFeedEvents,
  interpretHttpBrainFailure,
  verifyHealthResponsePayload,
  mapFeedEventToSection,
  assertRuntimeReportHealthy,
  runtimeReportKey,
  type BrainRuntimeVerificationReport,
} from './runtime-verification/index.js';
