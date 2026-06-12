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
