/**
 * DevPulse V2 Phase 16.7 — Unified Verification Lab public API.
 */

export {
  UNIFIED_VERIFICATION_LAB_RUNTIME_PASS_TOKEN,
  UNIFIED_VERIFICATION_LAB_RUNTIME_OWNER_MODULE,
  UVL_RUNTIME_QUESTION_SIGNALS,
  FORBIDDEN_UVL_RUNTIME_DUPLICATES,
  INITIAL_VERIFICATION_PROVIDER_TYPES,
  ALL_VERIFICATION_SESSION_STATES,
  isUvlRuntimeQuestion,
  isUvlRuntimeAdvisoryQuestion,
  isDuplicateUvlRuntimeQuestion,
  type VerificationProviderType,
  type VerificationProviderStatus,
  type VerificationSessionState,
  type VerificationRuntimeState,
  type VerificationProvider,
  type VerificationSession,
  type VerificationRuntimeReport,
  type VerificationRuntimeDiagnostics,
  type PrepareVerificationRuntimeInput,
  type PrepareVerificationRuntimeResult,
} from './types.js';

export {
  parseVerificationRuntimeQuery,
  resetVerificationRuntimeRequestCounterForTests,
  type ParsedVerificationRuntimeQuery,
} from './verification-request-parser.js';

export {
  registerProvider,
  registerInitialProviders,
  getVerificationProvider,
  getVerificationProviderByType,
  listVerificationProviders,
  buildInitialProviderDefinition,
  resetVerificationProviderRegistryForTests,
  type RegisterProviderResult,
} from './verification-provider-registry.js';

export {
  createVerificationSession,
  getVerificationSession,
  listVerificationSessions,
  updateVerificationSession,
  setVerificationSessionState,
  resetVerificationSessionManagerForTests,
  type CreateSessionResult,
} from './verification-session-manager.js';

export {
  startVerificationSession,
  completeVerificationSession,
  failVerificationSession,
  markSessionReady,
  registerProviderDefinition,
  bootstrapVerificationSessions,
  advanceSessionLifecycle,
} from './verification-lifecycle-manager.js';

export {
  evaluateVerificationRuntimeGates,
  validateVerificationRuntime,
  validateProviderRegistration,
  validateSessionUniqueness,
  type VerificationRuntimeGateReport,
  type VerificationRuntimeValidationResult,
} from './verification-runtime-validator.js';

export {
  buildVerificationRuntimeReport,
  composeVerificationRuntimeResponse,
  buildVerificationRuntimeFailureContext,
  deriveRuntimeState,
  nextVerificationRuntimeReportId,
  resetVerificationRuntimeReportCounterForTests,
  type VerificationRuntimeFailureContext,
} from './verification-runtime-report.js';

export {
  getVerificationRuntimeDiagnostics,
  updateVerificationRuntimeDiagnostics,
  resetVerificationRuntimeDiagnostics,
  uvlRuntimeKey,
} from './verification-runtime-diagnostics.js';

export {
  prepareVerificationRuntime,
  processVerificationRuntimeRequest,
  getVerificationRuntimeContext,
} from './unified-verification-lab-runtime.js';

export {
  buildUvlPanelSnapshot,
  buildVerificationRegistryPanelSnapshot,
  buildVerificationOrchestratorPanelSnapshot,
  type UvlPanelSnapshot,
  type VerificationRegistryPanelSnapshot,
  type VerificationOrchestratorPanelSnapshot,
} from './uvl-panel-registry.js';

export function getDevPulseV2UnifiedVerificationLabRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_unified_verification_lab_runtime',
    passToken: 'UNIFIED_VERIFICATION_LAB_RUNTIME_V1_PASS',
    phase: 16.7,
    extensionOnly: true,
  };
}

export {
  WORLD2_BUILDER_PACKET_EXECUTION_UVL_ROWS,
  WORLD2_CONTROLLED_APPLY_RUNTIME_UVL_ROWS,
  WORLD2_ROLLBACK_RUNTIME_UVL_ROWS,
  WORLD2_RECOVERY_RUNTIME_UVL_ROWS,
  WORLD2_COMPLETION_RUNTIME_UVL_ROWS,
  LIVE_PREVIEW_RUNTIME_UVL_ROWS,
  PREVIEW_INTELLIGENCE_UVL_ROWS,
  SELF_VISION_RUNTIME_UVL_ROWS,
  UI_INSPECTION_ENGINE_UVL_ROWS,
  INTERACTION_TESTING_ENGINE_UVL_ROWS,
  VISUAL_VERIFICATION_ENGINE_UVL_ROWS,
  UNIFIED_VERIFICATION_LAB_RUNTIME_UVL_ROWS,
  VERIFICATION_REGISTRY_UVL_ROWS,
  VERIFICATION_ORCHESTRATOR_UVL_ROWS,
  ALL_UVL_ROWS,
  listWorld2BuilderPacketExecutionUvlRows,
  listWorld2ControlledApplyRuntimeUvlRows,
  listWorld2RollbackRuntimeUvlRows,
  listWorld2RecoveryRuntimeUvlRows,
  listWorld2CompletionRuntimeUvlRows,
  listLivePreviewRuntimeUvlRows,
  listPreviewIntelligenceUvlRows,
  listSelfVisionRuntimeUvlRows,
  listUiInspectionEngineUvlRows,
  listInteractionTestingEngineUvlRows,
  listVisualVerificationEngineUvlRows,
  listUnifiedVerificationLabRuntimeUvlRows,
  listVerificationRegistryUvlRows,
  listVerificationOrchestratorUvlRows,
  hasUvlRow,
  type UvlRow,
} from './uvl-row-registry.js';
