/**
 * Interaction Proof Engine — public exports.
 */

import { resetInteractionProofAuthorityForTests } from './interaction-proof-authority.js';

export {
  INTERACTION_PROOF_ENGINE_PASS_TOKEN,
  INTERACTION_PROOF_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_INTERACTION_PROOF_HISTORY,
} from './interaction-proof-types.js';

export type {
  InteractionClassification,
  InteractionProofStatus,
  InteractionProofVerdict,
  InteractionFailureCategory,
  InteractionSurface,
  InteractionInventoryRecord,
  InteractionIntentMapping,
  InteractionEventProof,
  InteractionHandlerProof,
  InteractionEffectProof,
  InteractionAccessibilityProof,
  InteractionDeviceCoverageProof,
  InteractionProofResult,
  InteractionFailureReport,
  InteractionRepairRecommendation,
  WholeAppInteractionSweepResult,
  InteractionProofPipelineInput,
  InteractionProofPipelineResult,
  LaunchInteractionProofEvidence,
  InteractionProofReadinessResult,
  LivePreviewInteractionProofGateResult,
} from './interaction-proof-types.js';

export {
  getDevPulseV2InteractionProofEngine,
  registerInteractionProofEngineWithLaunchAuthority,
  registerInteractionProofEngineWithVirtualDeviceLaboratory,
  registerInteractionProofEngineWithLivePreviewGate,
} from './interaction-proof-registry.js';

export {
  discoverInteractionSurfaces,
  resetInteractionSurfaceDiscoveryForTests,
} from './interaction-surface-discovery.js';
export { buildInteractionInventory } from './interaction-inventory-builder.js';
export { mapInteractionIntents } from './interaction-intent-mapper.js';
export { proveInteractionReachability } from './interaction-reachability-prover.js';
export { executeInteractionEvent } from './interaction-event-executor.js';
export { verifyInteractionHandler } from './interaction-handler-verifier.js';
export { verifyInteractionStateEffect } from './interaction-state-effect-verifier.js';
export { verifyInteractionDataEffect } from './interaction-data-effect-verifier.js';
export { verifyInteractionUiEffect } from './interaction-ui-effect-verifier.js';
export {
  verifyInteractionAccessibility,
  resetInteractionAccessibilityVerifierForTests,
} from './interaction-accessibility-verifier.js';
export { proveInteractionDeviceCoverage } from './interaction-device-coverage.js';
export {
  classifyInteractionFailure,
  resetInteractionFailureClassifierForTests,
} from './interaction-failure-classifier.js';
export {
  recommendInteractionRepair,
  resetInteractionRepairRecommenderForTests,
} from './interaction-repair-recommender.js';
export { buildInteractionProofPipelineReport } from './interaction-proof-report-builder.js';
export {
  recordInteractionProofHistory,
  getInteractionProofHistorySize,
  resetInteractionProofHistoryForTests,
} from './interaction-proof-history.js';
export { assessInteractionProofReadiness } from './interaction-proof-readiness.js';
export { evaluateLivePreviewInteractionProofGate } from './interaction-proof-live-preview-gate.js';
export {
  runInteractionProofPipeline,
  simulateInteractionProofImpactForFeatureSlice,
  simulateInteractionProofImpactForFeatureSlice as simulateInteractionProofForFeatureSlice,
  getLastInteractionProofPipelineResult,
  isInteractionProofReadyForPreview,
  buildLaunchInteractionProofEvidence,
  getInteractionProofPassToken,
  resetInteractionProofAuthorityForTests,
} from './interaction-proof-authority.js';

export function resetInteractionProofEngineModuleForTests(): void {
  resetInteractionProofAuthorityForTests();
}
