/**
 * Founder Test Integration — public API.
 */

export {
  FOUNDER_TEST_INTEGRATION_PASS_TOKEN,
  FOUNDER_TEST_INTEGRATION_OWNER_MODULE,
  FOUNDER_TEST_INTEGRATION_PHASE,
  FOUNDER_TEST_INTEGRATION_REPORT_TITLE,
  FOUNDER_TEST_CACHE_KEY_PREFIX,
  MAX_FOUNDER_TEST_HISTORY,
  MAX_FOUNDER_TEST_FINDINGS,
  MAX_FOUNDER_TEST_BLOCKERS,
  MAX_FOUNDER_TEST_WARNINGS,
  MAX_FOUNDER_TEST_RECOMMENDATIONS,
  FOUNDER_READY_MIN_SCORE,
  FOUNDER_READY_WITH_WARNINGS_MIN_SCORE,
  REQUIREMENT_REALITY_MIN_SCORE,
  FOUNDER_SIMULATION_PASS_MIN_SCORE,
  MAJOR_AUTHORITY_MIN_AVAILABLE,
  FOUNDER_TEST_VERDICTS,
  FOUNDER_TEST_AUTHORITY_REGISTRATIONS,
  getFounderTestAuthorityWeight,
  listMajorFounderTestAuthorities,
  normalizeAuthorityScore,
  isFounderTestVerdict,
} from './founder-test-integration-registry.js';

export type {
  FounderTestAuthorityId,
  FounderTestCategory,
  FounderTestFindingSeverity,
  FounderTestVerdict,
  FounderTestShellSources,
  FounderTestAuthorityResult,
  FounderTestFinding,
  FounderTestScore,
  FounderTestSummary,
  FounderTestRun,
  FounderTestAssessment,
  FounderTestReport,
  RunFounderTestIntegrationInput,
  FounderTestHistorySummary,
} from './founder-test-integration-types.js';

export type { FounderTestAuthorityRegistration } from './founder-test-integration-registry.js';

export {
  loadFounderTestShellSources,
  runFounderTestIntegration,
  resetFounderTestIntegrationRunCounterForTests,
} from './founder-test-integration-orchestrator.js';

export {
  assessFounderTestIntegration,
  deriveFounderTestVerdict,
  buildFounderTestIntegrationReport,
  buildFounderTestIntegrationArtifacts,
  resetFounderTestIntegrationModuleForTests,
} from './founder-test-integration-authority.js';

export {
  resetFounderTestIntegrationHistoryForTests,
  recordFounderTestAssessment,
  getFounderTestHistorySize,
  getLatestFounderTestAssessment,
  getFounderTestHistory,
  buildFounderTestHistorySummary,
  countFounderTestVerdict,
} from './founder-test-integration-history.js';

export {
  buildFounderTestIntegrationReportMarkdown,
  buildFounderTestIntegrationPhaseReportMarkdown,
} from './founder-test-integration-report-builder.js';

export {
  resolveFounderExecutionConnected,
  buildRuntimeFounderExecutionProofInput,
  buildRuntimeFounderExecutionProofInputAsync,
  resolveExecutionConnectedForRoot,
  resolveExecutionConnectedFromHydration,
} from './founder-execution-connected-resolver.js';

export {
  hydrateRuntimeFounderExecutionProofInput,
  hydrateRuntimeFounderExecutionProofInputSync,
} from './runtime-founder-execution-proof-hydration.js';

export type {
  ResolveFounderExecutionConnectedInput,
  ResolvedFounderExecutionConnected,
  HydratedRuntimeFounderExecutionProofInput,
  RuntimeFounderExecutionProofHydration,
} from './founder-execution-connected-resolver.js';

export {
  resolveExecutionChainStageContext,
  resetExecutionChainStageResolverCacheForTests,
} from './connected-execution-chain-stage-resolver.js';

export type {
  ExecutionChainBrokenStage,
  ExecutionChainStageContext,
} from './connected-execution-chain-stage-resolver.js';

export {
  resolveConnectedExecutionChainTruth,
  CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
} from './connected-execution-chain-truth.js';

export type { ConnectedExecutionChainTruth } from './connected-execution-chain-truth.js';

export {
  detectExecutionProofContradictions,
  EXECUTION_PROOF_CONTRADICTION,
} from './execution-proof-contradiction-detector.js';

export type {
  ExecutionProofContradiction,
  ExecutionProofSynchronizationReport,
} from './execution-proof-contradiction-detector.js';

export {
  EXECUTION_PROOF_AUTHORITY_SYNCHRONIZATION_V1_PASS,
  EXECUTION_PROOF_SYNCHRONIZATION_PHASE,
} from './execution-proof-authority-synchronization-registry.js';
