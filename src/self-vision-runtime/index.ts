/**
 * DevPulse V2 Phase 16.3 — Self Vision Runtime public API.
 */

export {
  SELF_VISION_RUNTIME_PASS_TOKEN,
  SELF_VISION_RUNTIME_OWNER_MODULE,
  SELF_VISION_RUNTIME_QUESTION_SIGNALS,
  FORBIDDEN_SELF_VISION_RUNTIME_DUPLICATES,
  ALL_CAPTURE_PLAN_TYPES,
  TRACKED_OBSERVATION_CAPABILITIES,
  ALL_OBSERVATION_TARGETS,
  isSelfVisionRuntimeQuestion,
  isSelfVisionRuntimeAdvisoryQuestion,
  isDuplicateSelfVisionRuntimeQuestion,
  capabilitiesForTargetType,
  type ObservationState,
  type CapturePlanType,
  type ObservationCapabilityType,
  type ObservationTargetType,
  type CapturePlanItem,
  type ObservationTargetItem,
  type SelfVisionSession,
  type SelfVisionRuntimeReport,
  type SelfVisionRuntimeDiagnostics,
  type PrepareSelfVisionRuntimeInput,
  type PrepareSelfVisionRuntimeResult,
} from './types.js';

export { parseSelfVisionQuery, resetSelfVisionRequestCounterForTests, type ParsedSelfVisionQuery } from './self-vision-request-parser.js';

export {
  createSelfVisionSession,
  getSelfVisionSession,
  getSelfVisionSessionByPreview,
  listSelfVisionSessions,
  hasSelfVisionSession,
  resetSelfVisionSessionRegistryForTests,
  getSelfVisionOwnerModule,
} from './self-vision-session-registry.js';

export { planCaptureSequence } from './self-vision-capture-planner.js';
export { planObservationTargets } from './self-vision-observation-model.js';

export {
  evaluateSelfVisionGates,
  validateSelfVisionRuntime,
  type SelfVisionGateReport,
  type SelfVisionValidationResult,
} from './self-vision-runtime-validator.js';

export {
  composeSelfVisionResponse,
  buildSelfVisionFailureContext,
  nextSelfVisionReportId,
  resetSelfVisionReportCounterForTests,
  type SelfVisionFailureContext,
} from './self-vision-runtime-report.js';

export {
  getSelfVisionRuntimeDiagnostics,
  updateSelfVisionRuntimeDiagnostics,
  resetSelfVisionRuntimeDiagnostics,
  selfVisionRuntimeKey,
} from './self-vision-runtime-diagnostics.js';

export {
  prepareSelfVisionRuntime,
  processSelfVisionRuntimeRequest,
  getSelfVisionRuntimeContext,
} from './self-vision-runtime.js';

export function getDevPulseV2SelfVisionRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_self_vision_runtime',
    passToken: 'SELF_VISION_RUNTIME_V1_PASS',
    phase: 16.3,
    extensionOnly: true,
  };
}
