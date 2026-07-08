/**
 * Build Intent Routing — route chat build prompts into autonomous builder execution.
 */

export const BUILD_INTENT_ROUTING_PASS_TOKEN = 'BUILD_INTENT_ROUTING_V1_PASS';

/** Health payload marker — stale servers without build intent routing omit this field. */
export const BUILD_INTENT_ROUTING_HEALTH_MARKER = true as const;

export {
  BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION,
  BUILD_INTENT_ROUTE_PARITY_V1_HEALTH_MARKER,
  BUILD_INTENT_ROUTE_PARITY_V1_PASS_TOKEN,
  BUILD_INTENT_ROUTE_PARITY_CHAT_ONLY_PROMPTS,
  BUILD_INTENT_ROUTE_PARITY_MATRIX_IDS,
  classifyBuildIntentRequest,
  isBuildIntentClassification,
  type BuildIntentClassification,
  type BuildIntentRoute,
} from './build-intent-route-parity-v1.js';

export {
  isBuildIntentRequest,
  legacyDetectBuildIntent,
  classifyBuildIntentRoute,
  resolveBuildIntentProfile,
} from './build-intent-detector.js';

export {
  recordBuildIntentRun,
  getBuildIntentRun,
  listBuildIntentRuns,
  listBuildIntentRunsForProject,
  resetBuildIntentRunsForTests,
  type BuildIntentRunRecord,
} from './build-intent-run-store.js';
