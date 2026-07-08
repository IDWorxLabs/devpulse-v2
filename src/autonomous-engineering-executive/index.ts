/**
 * Autonomous Engineering Executive V1 — public API.
 * AEE is the sole build-spine authority for execution continuation decisions.
 */

export {
  AUTONOMOUS_ENGINEERING_EXECUTIVE_V1_PASS_TOKEN,
  AEE_OWNER_MODULE,
  AEE_OVERRIDE_ASE_DENIAL_EVENT,
  AEE_CONTINUATION_OVERRIDE_MESSAGE,
} from './aee-types.js';

export type {
  AeeStage,
  AeeDecision,
  AeeEvidenceSeverity,
  AeeEvidenceRecommendation,
  AeeBuildOutcome,
  AeeEvidenceResult,
  AeeExecutiveDecisionInput,
  AeeExecutiveDecisionResult,
  AeeFinalReport,
  AeeRuntimeRecord,
} from './aee-types.js';

export {
  aeeForbidsAbortAfterWorkspaceEvidence,
  aeeForbidsPlanningFailedAfterWorkspace,
  advanceAeeStage,
  isAfterWorkspaceReady,
  aeeStageAllowsForwardDefault,
  resolveAeeStageFromForensicStage,
  AEE_STAGE_ORDER,
} from './aee-state-machine.js';

export {
  normalizeAseEvidence,
  normalizeFeatureRealityEvidence,
  normalizePromptFaithfulnessEvidence,
  normalizeLaunchReadinessEvidence,
  normalizeAuthorityEvidenceBundle,
} from './aee-evidence-normalizer.js';

export {
  runAeeExecutiveCoordination,
  formatAeeOverrideWarning,
  aeeCanAbortBuild,
} from './aee-executive-coordinator.js';

export {
  BUILD_RESPONSE_SOURCE_AEE_CONTROLLED,
  AEE_PRODUCTION_RESPONSE_ALIGNMENT_V1_PASS_TOKEN,
  aeeOverrideWasApplied,
  buildSpineReachedInstallOrBeyond,
  previewStageWasAttempted,
  isStaleAseFailureReason,
  resolveAeeControlledFailureReason,
  shouldSuppressProfileMismatchForBuild,
  refineProfileClassificationForAeeBuild,
  resolveAeeControlledBuildStatus,
  buildAeeControlledResponseEnvelope,
  composeAeeAwareBuildChatResponse,
  buildAeeControlledTraceEvent,
  deriveAeeFinalReportFromDecision,
} from './aee-production-response.js';

export {
  evaluateAeeExecutiveDecision,
  resolveAeeBuildOutcome,
  aeeDecisionAllowsForward,
  AEE_REPAIR_BUDGET,
  AEE_RETRY_BUDGET,
} from './aee-decision-engine.js';

export {
  evaluateAeeContinuationPolicy,
  shouldAeeOverrideAseDenial,
  workspaceProvenFaithfulnessOverride,
} from './aee-continuation-policy.js';

export {
  runAeePreviewRecoveryLoop,
  isPreviewRecoveryEligible,
  detectMissingCapabilityRecoveryRequired,
  AEE_PREVIEW_RECOVERY_LOOP_V1_PASS_TOKEN,
  AEE_PREVIEW_RECOVERY_LOOP_EVENT,
  AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
} from './aee-preview-recovery-loop.js';

export {
  runAeeBuildAutofixLoop,
  isBuildAutofixEligible,
  classifyBuildFailure,
  injectSimulatedBuildFailure,
  formatAeeBuildAutofixReportMarkdown,
  AEE_BUILD_AUTOFIX_LOOP_V1_PASS_TOKEN,
  AEE_BUILD_AUTOFIX_LOOP_EVENT,
  AEE_BUILD_AUTOFIX_MAX_ATTEMPTS,
  AEE_BUILD_AUTOFIX_MAX_DEPENDENCY_RETRY,
  AEE_BUILD_AUTOFIX_INJECT_MARKER,
} from './aee-build-autofix-loop.js';

export {
  resolveAeePreviewContract,
  resolveAeePreviewContractSync,
  probePreviewDevServerRoute,
  isInteractionOrVisualGateBlocker,
  isHardPreviewGateBlocker,
  previewContractExhaustedRecoveryIsDegraded,
  buildStatusSeparateFromPreview,
  AEE_PREVIEW_CONTRACT_V1_PASS_TOKEN,
  AEE_PREVIEW_CONTRACT_EVENT,
} from './aee-preview-contract.js';

export type {
  AeePreviewContractInput,
  AeePreviewContractResult,
  AeePreviewContractStatus,
  AeePreviewRouteProbeResult,
  AeeBuildSpineStatus,
} from './aee-preview-contract-types.js';

export type {
  AeePreviewRecoveryLoopInput,
  AeePreviewRecoveryLoopResult,
  AeePreviewRecoveryAttemptRecord,
  AeePreviewRecoveryPipelines,
  AeePreviewRecoveryPhase,
} from './aee-preview-recovery-loop-types.js';

export type {
  AeeBuildAutofixLoopInput,
  AeeBuildAutofixLoopResult,
  AeeBuildAutofixAttemptRecord,
  AeeBuildAutofixReport,
  AeeBuildFailureClass,
  AeeBuildAutofixPhase,
} from './aee-build-autofix-loop-types.js';

export type {
  AeeContinuationPolicyInput,
  AeeContinuationPolicyResult,
} from './aee-continuation-policy.js';

export {
  buildAeeFinalReport,
  formatAeeFinalReportMarkdown,
  resolveAeeFailureStageLabel,
} from './aee-report-builder.js';

export type { BuildAeeFinalReportInput } from './aee-report-builder.js';

export {
  resetAeeRuntimeRecorderForTests,
  recordAeeRuntimeEvent,
  getAeeRuntimeRecords,
  getLastAeeRuntimeRecords,
  getLastAeeOverrideEvent,
} from './aee-runtime-recorder.js';

export {
  assertAeeCheck,
  AEE_REQUIRED_FILES,
  validateAeeModuleFiles,
  validateAeeStateMachineRules,
  validateAeeEvidenceNormalization,
  validateAeeAseOverride,
  validateAeeOrchestratorWiring,
  validateAeeContinuationPolicyUnit,
  evidenceHasAuthorityStopNormalized,
} from './aee-validator.js';

export type { AeeValidationCheck } from './aee-validator.js';
