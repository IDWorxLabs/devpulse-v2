/**
 * Universal Prompt-to-App Materialization V1 — public API.
 */

export {
  UNIVERSAL_PROMPT_TO_APP_MATERIALIZATION_V1_PASS_TOKEN,
  validateUniversalAppMaterialization,
  type MaterializationValidationResult,
} from './materialization-validator.js';

export {
  GENERATED_APP_MANIFEST_FILENAME,
  buildInitialGeneratedAppManifest,
  buildGeneratedAppManifest,
  serializeGeneratedAppManifest,
  isManifestEvidenceComplete,
  listManifestPlaceholderFields,
  type GeneratedAppManifest,
} from './generated-app-manifest.js';

export {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  type ProfileFeatureDefinition,
  type MaterializationProfile,
} from './profile-feature-map.js';

export {
  extractPromptAppTitle,
  summarizePrompt,
  derivePromptFeatureTerms,
  deriveGenericCustomFeatureModules,
} from './prompt-app-metadata.js';

export { buildUniversalMaterializedWorkspaceFiles } from './universal-app-materialization-engine.js';
