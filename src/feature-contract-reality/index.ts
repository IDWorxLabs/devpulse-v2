/**
 * Feature Contract Reality V1 — public API.
 */

export {
  FEATURE_CONTRACT_REALITY_V1_PASS_TOKEN,
  FEATURE_CONTRACT_REALITY_FILENAME,
  WORKSPACE_FEATURE_CONTRACT_REALITY_FILENAME,
  type FeatureContractRealityStatus,
  type FeatureRealityRecord,
  type FeatureContractRealityReport,
  type FeatureContractRealityEvidence,
  type FeatureContractRealityRecordingResult,
} from './feature-contract-reality-types.js';

export { loadPlannedFeatureContractItems, type PlannedFeatureContractItem } from './feature-contract-loader.js';
export { buildFeatureRealityRecords } from './feature-reality-mapper.js';
export { checkFeatureFileReality } from './feature-file-reality-checker.js';
export { checkFeatureRegistryReality } from './feature-route-reality-checker.js';
export { checkFeatureRenderReality } from './feature-render-reality-checker.js';
export { checkFeatureValidationReality } from './feature-validation-reality-checker.js';
export {
  checkFeatureInteractionReality,
  isInformationalFeatureModule,
  readValidationInteractionMode,
} from './feature-interaction-reality-checker.js';
export {
  buildFeatureContractRealityReport,
  buildFeatureContractRealityChatSummary,
} from './feature-contract-reality-report.js';
export { recordFeatureContractReality } from './feature-contract-reality-recorder.js';
export { applyFeatureContractRealityToManifest } from './feature-contract-reality-manifest.js';
export {
  buildFeatureContractRealityTraceEvents,
  featureContractRealityTraceTitles,
} from './feature-contract-reality-trace-events.js';
