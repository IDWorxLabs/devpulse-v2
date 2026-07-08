/**
 * Minimal Builder Test Console V1 — public API.
 */

export {
  MINIMAL_BUILDER_TEST_CONSOLE_CONTRACT_VERSION,
  MINIMAL_BUILDER_TEST_CONSOLE_ROUTE,
  MINIMAL_BUILDER_TEST_CONSOLE_TRACE,
  MINIMAL_BUILDER_TEST_CONSOLE_V1_PASS_TOKEN,
  type MinimalBuilderTestConsoleBuildResponse,
} from './minimal-builder-test-console-types.js';

export {
  bootstrapFreshProjectForBuilderTest,
  composeMinimalBuilderTestConsoleResponse,
  resolveBuilderTestProjectName,
  resolveBuilderTestPrompt,
} from './minimal-builder-test-console-authority.js';
