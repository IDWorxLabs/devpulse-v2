export {
  PROMISE_REALITY_ENGINE_PASS_TOKEN,
  PROMISE_REALITY_ENGINE_OWNER_MODULE,
  MAX_PROMISE_CLAIMS,
  MAX_PROVEN_CLAIMS,
  MAX_PARTIAL_CLAIMS,
  MAX_UNPROVEN_CLAIMS,
  MAX_CONTRADICTED_CLAIMS,
  MAX_PROMISE_SCENARIOS,
  MAX_PROMISE_ACTIONS,
} from './promise-reality-engine-bounds.js';

export type {
  PromiseCategory,
  EvidenceLevel,
  PromiseSeverity,
  PromiseClaimRecord,
  PromiseRealityFeedEvent,
  PromiseRealityScenarioResult,
  PromiseRealityEngineAssessment,
  PromiseRealityShellSources,
  AssessPromiseRealityEngineInput,
  EnrichedPromiseRealityAssessments,
  PromiseRealityVisibility,
} from './promise-reality-engine-types.js';

export {
  assessPromiseRealityEngine,
  evaluatePromiseRealityVisibility,
  enrichAssessmentsWithPromiseReality,
  enrichFirstTimeUserRealityWithPromiseScenarios,
  resetPromiseRealityCounterForTests,
} from './promise-reality-engine-authority.js';
