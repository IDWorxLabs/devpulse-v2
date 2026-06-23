/**
 * Universal Feature Contract Intelligence V1 — public exports.
 */

export {
  UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE_V1_PASS_TOKEN,
  UNIVERSAL_FEATURE_CONTRACT_OWNER_MODULE,
  UNIVERSAL_FEATURE_CONTRACT_PHASE,
  UNIVERSAL_FEATURE_REALITY_MIN_LAUNCH_SCORE,
  UNIVERSAL_FEATURE_CONTRACT_SUITE_APPS,
} from './universal-feature-contract-registry.js';

export type {
  UniversalAppProfile,
  UniversalFeatureEntity,
  UniversalFeatureAction,
  UniversalFeatureRule,
  UniversalFeatureWorkflow,
  UniversalFeatureOutcome,
  UniversalFeatureContract,
  BuildUniversalFeatureContractInput,
  FeatureRealityValidationPlan,
  FeatureRealityValidationStep,
  UniversalFeatureRealityCheck,
  UniversalFeatureRealityScores,
  UniversalFeatureRealityVerdict,
  UniversalFeatureContractAssessment,
  UniversalFeatureContractSuiteResult,
  RunUniversalFeatureValidationInput,
} from './universal-feature-contract-types.js';

export {
  buildUniversalFeatureContract,
  buildUniversalFeatureContractJson,
  parseUniversalFeatureContract,
  detectUniversalAppProfile,
  getPrimaryEntity,
  computeContractCompletenessScore,
} from './universal-feature-contract-builder.js';

export { generateFeatureRealityValidationPlan } from './feature-reality-validation-plan-generator.js';

export {
  runUniversalFeatureRealityChecks,
  createPlaywrightUniversalValidationPage,
} from './universal-feature-validation-runner.js';

export {
  computeUniversalFeatureRealityScores,
  deriveUniversalFeatureRealityVerdict,
  resolveUniversalFeatureLaunchBlock,
  buildUniversalFeatureContractAssessment,
} from './universal-feature-contract-scoring.js';

export {
  runUniversalFeatureValidation,
  getLastUniversalFeatureContractAssessment,
  resetUniversalFeatureContractAssessmentForTests,
} from './universal-feature-contract-authority.js';

export { formatUniversalFeatureContractReportMarkdown } from './universal-feature-contract-report.js';

export { mapUniversalFeatureContractLaunchCouncilAuthority } from './universal-feature-contract-integration.js';
