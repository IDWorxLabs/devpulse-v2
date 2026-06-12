/**
 * Founder Test Execution Chain Integration — public API.
 */

export {
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS_TOKEN,
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_OWNER_MODULE,
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PHASE,
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_REPORT_TITLE,
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_CACHE_KEY_PREFIX,
  FOUNDER_TEST_EXECUTION_CHAIN_CORE_QUESTION,
  MAX_FOUNDER_TEST_EXECUTION_CHAIN_HISTORY,
  MAX_EXECUTION_CHAIN_BLOCKERS,
  MAX_EXECUTION_CHAIN_WARNINGS,
  MAX_RECOMMENDED_ACTIONS,
  EXECUTION_CHAIN_STATES,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  EXECUTION_CHAIN_SAFETY_GUARANTEES,
  isExecutionChainState,
} from './founder-test-execution-chain-integration-registry.js';

export type {
  ExecutionChainState,
  ExecutionStage,
  ExecutionChainBlocker,
  ExecutionChainWarning,
  ExecutionChainQuestionAnswers,
  FounderTestExecutionChainInputSnapshot,
  FounderExecutionChainReport,
  FounderExecutionChainAssessment,
  AssessFounderTestExecutionChainInput,
  FounderTestExecutionChainHistoryEntry,
  FounderTestExecutionChainHistorySummary,
  FounderTestExecutionChainArtifacts,
} from './founder-test-execution-chain-integration-types.js';

export {
  resetFounderTestExecutionChainHistoryForTests,
  recordFounderTestExecutionChainAssessment,
  getFounderTestExecutionChainHistorySize,
  getLatestFounderTestExecutionChainHistoryEntry,
  getFounderTestExecutionChainHistory,
  countExecutionChainState,
  buildFounderTestExecutionChainHistorySummary,
} from './founder-test-execution-chain-integration-history.js';

export {
  assessFounderTestExecutionChain,
  buildFounderTestExecutionChainArtifacts,
  deriveExecutionChainQuestionAnswers,
  deriveExecutionChainScore,
  mapEndToEndProofStateToExecutionChainState,
  resetFounderTestExecutionChainCounterForTests,
  resetFounderTestExecutionChainModuleForTests,
} from './founder-test-execution-chain-integration-authority.js';

export { buildFounderTestExecutionChainReportMarkdown } from './founder-test-execution-chain-integration-report-builder.js';
