export {
  BUILD_RESULT_NORMALIZER_V1_CONTRACT,
} from './build-result-normalizer-types.js';
export type {
  NormalizedBuildResult,
  NormalizedBuildResultKind,
  NormalizedBuildRealityStages,
  NormalizedBuildPlainEnglishSummary,
  NormalizedGenerationFaithfulnessSummary,
  NormalizedLivePreviewProofSummary,
  NormalizedProductFaithfulnessSummary,
  NormalizedWorkspaceMaterializationSummary,
} from './build-result-normalizer-types.js';
export {
  normalizeBuildResult,
} from './build-result-normalizer.js';
export type {
  BuildResultNormalizerInput,
  BuildResultNormalizerAutofixAttemptInput,
} from './build-result-normalizer.js';
export {
  normalizeOnePromptBuildResult,
  deriveMaterializationManifestHints,
  deriveProductFaithfulnessInput,
  evaluateProductFaithfulnessForBuild,
  deriveGenerationFaithfulnessStages,
  evaluateGenerationFaithfulnessForBuild,
} from './build-result-normalizer-adapter.js';
