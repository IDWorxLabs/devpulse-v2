/**
 * Feature Reality Validation Authority V1 — public API.
 */

export {
  FEATURE_REALITY_V1_PASS_TOKEN,
  FEATURE_REALITY_OWNER_MODULE,
  FEATURE_REALITY_PHASE,
  FEATURE_REALITY_MIN_LAUNCH_SCORE,
} from './feature-reality-validation-registry.js';

export type {
  FeatureRealityVerdict,
  FeatureContract,
  FeatureContractItem,
  FeatureRealityCheck,
  FeatureRealityScores,
  FeatureRealityAssessment,
  RunFeatureRealityValidationInput,
} from './feature-reality-validation-types.js';

export {
  buildTaskTrackerFeatureContract,
  buildTaskTrackerFeatureContractJson,
  parseFeatureContract,
} from './feature-contract-builder.js';

export {
  computeFeatureRealityScores,
  deriveFeatureRealityVerdict,
  resolveFeatureRealityLaunchBlock,
  buildFeatureRealityAssessment,
} from './feature-reality-validation-scoring.js';

export {
  runFeatureRealityValidation,
  getLastFeatureRealityAssessment,
  resetFeatureRealityAssessmentForTests,
} from './feature-reality-validation-authority.js';

export { formatFeatureRealityReportMarkdown } from './feature-reality-validation-report.js';

export { mapFeatureRealityLaunchCouncilAuthority } from './feature-reality-validation-integration.js';
