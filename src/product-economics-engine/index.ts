export {
  PRODUCT_ECONOMICS_ENGINE_PASS_TOKEN,
  PRODUCT_ECONOMICS_ENGINE_OWNER_MODULE,
  MAX_ECONOMICS_FINDINGS,
  MAX_ECONOMICS_FEATURES,
  MAX_ECONOMICS_ACTIONS,
  MAX_ECONOMICS_RANKED,
} from './product-economics-engine-bounds.js';

export type {
  EconomicsFindingType,
  EconomicsCategory,
  EconomicsSeverity,
  RoiClassification,
  EconomicsSubscores,
  EconomicsFinding,
  FeatureEconomicsEvaluation,
  EconomicsFeedEvent,
  ProductEconomicsAssessment,
  EconomicsShellSources,
  AssessProductEconomicsInput,
  EnrichedEconomicsAssessments,
  ProductEconomicsVisibility,
} from './product-economics-engine-types.js';

export {
  assessProductEconomics,
  evaluateProductEconomicsVisibility,
  enrichAssessmentsWithProductEconomics,
  resetProductEconomicsCounterForTests,
} from './product-economics-engine-authority.js';
