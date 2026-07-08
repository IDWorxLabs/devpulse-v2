/**
 * Live Preview Interaction Proof V1 — public API barrel.
 */

export {
  LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT,
  LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_LOAD_WAIT_MS,
  LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_INTERACTION_ATTEMPTS,
  LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_TOTAL_PROOF_TIME_MS,
  PLAYWRIGHT_INSTALL_INSTRUCTION,
} from './live-preview-interaction-proof-types.js';
export type {
  PreviewInteractionProofResultKind,
  PlannedInteractionType,
  PlannedInteraction,
  InteractionAttemptRecord,
  FeatureContractHints,
  MaterializationManifestHints,
  LivePreviewInteractionProofInput,
  LivePreviewInteractionProofEvidence,
  LivePreviewInteractionProofSummary,
  LivePreviewInteractionProofReport,
} from './live-preview-interaction-proof-types.js';

export { derivePrimaryFeatureCandidates, planInteractions } from './live-preview-interaction-proof-planner.js';
export type { PrimaryFeatureCandidates } from './live-preview-interaction-proof-planner.js';

export {
  classifyPlaywrightLaunchError,
  launchDefaultProofPageDriver,
  attemptInteraction,
} from './live-preview-interaction-proof-runner.js';
export type { ProofPageDriver, PlaywrightLaunchClassification } from './live-preview-interaction-proof-runner.js';

export { classifyInteractionProof } from './live-preview-interaction-proof-normalizer.js';
export { buildInteractionProofSummary } from './live-preview-interaction-proof-report.js';

export {
  runLivePreviewInteractionProof,
} from './live-preview-interaction-proof-engine.js';
export type { LivePreviewInteractionProofDeps } from './live-preview-interaction-proof-engine.js';
