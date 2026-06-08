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
  classificationKey,
  responseKey,
  systemsAwarenessKey,
  roadmapContextKey,
  BRAIN_PIPELINE_SEQUENCE,
  OPERATOR_FEED_EVENT_SEQUENCE,
  COMMAND_CENTER_BRAIN_OWNER_MODULE,
  COMMAND_CENTER_BRAIN_PASS_TOKEN,
} from './command-center-brain.js';

export {
  classifyBrainRequest,
  isKnownCategory,
  isRoadmapQuestion,
  isSystemQuestion,
  isArchitectureQuestion,
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
} from './brain-types.js';

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
