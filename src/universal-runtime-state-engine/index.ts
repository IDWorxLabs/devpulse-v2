/**
 * Universal Runtime State Engine V1 — public exports.
 */

export {
  buildRuntimeMaterializationInputFromEnvelope,
  materializeUniversalRuntimeForModule,
  augmentCrudComponentWithUniversalRuntime,
  shouldMaterializeUniversalRuntimeForModule,
  buildUniversalRuntimeSharedRuntimeFiles,
  buildUniversalRuntimeMaterializationReport,
  computeUniversalRuntimeCapabilityCoverageScore,
  verifyUniversalRuntimeBehavior,
  diagnoseUniversalRuntimeGenerationGaps,
  detectStaticRuntimeStateShell,
  UNIVERSAL_RUNTIME_STATE_ENGINE_VERSION,
  UNIVERSAL_RUNTIME_STATE_ENGINE_SOURCE,
  stableRuntimeScopeId,
  stableQueryKey,
} from './universal-runtime-state-engine.js';

export type {
  UniversalRuntimeStateDescriptor,
  UniversalRuntimeMaterializationInput,
  UniversalRuntimeMaterializationReport,
  UniversalRuntimeBehaviorVerificationResult,
  UniversalRuntimeSupportClassification,
} from './universal-runtime-types.js';

export type { UniversalRuntimeModuleMaterializationResult } from './universal-runtime-state-engine.js';
