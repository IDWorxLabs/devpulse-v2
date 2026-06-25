/**
 * Build Intent Routing — route chat build prompts into autonomous builder execution.
 */

export const BUILD_INTENT_ROUTING_PASS_TOKEN = 'BUILD_INTENT_ROUTING_V1_PASS';

/** Health payload marker — stale servers without build intent routing omit this field. */
export const BUILD_INTENT_ROUTING_HEALTH_MARKER = true as const;

export {
  isBuildIntentRequest,
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
