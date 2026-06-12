/**
 * Connected Runtime Activation Foundation — public API.
 */

export {
  CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS_TOKEN,
  CONNECTED_RUNTIME_ACTIVATION_OWNER_MODULE,
  CONNECTED_RUNTIME_ACTIVATION_PHASE,
  CONNECTED_RUNTIME_ACTIVATION_REPORT_TITLE,
  CONNECTED_RUNTIME_ACTIVATION_CACHE_KEY_PREFIX,
  CONNECTED_RUNTIME_ACTIVATION_CORE_QUESTION,
  MAX_CONNECTED_RUNTIME_ACTIVATION_HISTORY,
  MAX_ACTIVATION_ENTRIES,
  MAX_RECOMMENDED_ACTIONS,
  MAX_MISSING_COMPONENTS,
  RUNTIME_STATES,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  RUNTIME_ACTIVATION_SAFETY_GUARANTEES,
  isRuntimeState,
} from './connected-runtime-activation-registry.js';

export type {
  RuntimeState,
  RuntimeActivationEntry,
  RuntimeActivationArtifactEntry,
  RuntimeActivationCandidate,
  RuntimeActivationContract,
  RuntimeActivationQuestionAnswers,
  ConnectedRuntimeActivationInputSnapshot,
  ConnectedRuntimeActivationReport,
  ConnectedRuntimeActivationAssessment,
  AssessConnectedRuntimeActivationInput,
  ConnectedRuntimeActivationHistoryEntry,
  ConnectedRuntimeActivationHistorySummary,
  ConnectedRuntimeActivationArtifacts,
} from './connected-runtime-activation-types.js';

export {
  resetConnectedRuntimeActivationHistoryForTests,
  recordConnectedRuntimeActivationAssessment,
  getConnectedRuntimeActivationHistorySize,
  getLatestConnectedRuntimeActivationHistoryEntry,
  getConnectedRuntimeActivationHistory,
  countRuntimeState,
  buildConnectedRuntimeActivationHistorySummary,
} from './connected-runtime-activation-history.js';

export {
  assessConnectedRuntimeActivation,
  buildConnectedRuntimeActivationArtifacts,
  buildRuntimeActivationCandidate,
  buildRuntimeActivationContract,
  deriveRuntimeActivationQuestionAnswers,
  deriveRuntimeReadinessScore,
  deriveRuntimeState,
  deriveActivationCompleteness,
  deriveDependencyCompleteness,
  deriveRuntimeProofCompleteness,
  resetConnectedRuntimeActivationCounterForTests,
  resetConnectedRuntimeActivationModuleForTests,
} from './connected-runtime-activation-authority.js';

export { buildConnectedRuntimeActivationReportMarkdown } from './connected-runtime-activation-report-builder.js';
