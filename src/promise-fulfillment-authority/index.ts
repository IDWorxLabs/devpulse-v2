/**
 * Promise Fulfillment Authority — public API.
 */

export {
  PROMISE_FULFILLMENT_AUTHORITY_PASS_TOKEN,
  PROMISE_FULFILLMENT_OWNER_MODULE,
  MAX_REGISTERED_PROMISES,
  MAX_PROMISE_RECOMMENDATIONS,
  MAX_PROMISE_HISTORY,
  PROMISE_FULFILLMENT_CACHE_KEY_PREFIX,
  PROMISE_FULFILLMENT_REPORT_TITLE,
  PROMISE_FULFILLMENT_BLOCK_SCORE,
  PROMISE_SCORE_FULFILLED,
  PROMISE_SCORE_PARTIAL,
  PROMISE_SCORE_UNPROVEN,
  PROMISE_SCORE_CONTRADICTED,
} from './promise-fulfillment-bounds.js';

export type {
  PromiseStatus,
  PromiseCategory,
  PromiseFulfillmentReadinessState,
  PromiseEvidenceSource,
  RegisteredPromiseDefinition,
  PromiseAssessment,
  PromiseFulfillmentAssessment,
} from './promise-fulfillment-types.js';

export {
  REGISTERED_PROMISES,
  listRegisteredPromises,
  getRegisteredPromise,
  assertPromiseRegistryIntegrity,
} from './promise-fulfillment-registry.js';

export {
  resetPromiseFulfillmentHistoryForTests,
  recordPromiseFulfillmentAssessment,
  getPromiseFulfillmentHistorySize,
  getLatestPromiseFulfillmentAssessment,
} from './promise-fulfillment-history.js';

export { buildPromiseFulfillmentReportMarkdown } from './promise-fulfillment-report-builder.js';

export {
  validatePromiseRegistry,
  validatePromiseEvidenceMapping,
  validatePromiseFulfillmentScoring,
  validatePromiseContradictionDetection,
  validatePromiseLaunchBlocking,
  validatePromiseDeterministicScoring,
} from './promise-fulfillment-validator.js';

export { assessPromiseFulfillment, buildPromiseFulfillmentArtifacts } from './promise-fulfillment-authority.js';
