/**
 * Founder Test Launch Readiness — public API.
 */

export {
  FOUNDER_TEST_LAUNCH_READINESS_PASS_TOKEN,
  FOUNDER_TEST_LAUNCH_READINESS_OWNER_MODULE,
  FOUNDER_TEST_LAUNCH_READINESS_PHASE,
  FOUNDER_TEST_LAUNCH_READINESS_REPORT_TITLE,
  FOUNDER_TEST_LAUNCH_READINESS_CACHE_KEY_PREFIX,
  FOUNDER_TEST_LAUNCH_READINESS_CORE_QUESTION,
  RUN_FOUNDER_TEST_ACTION,
  MAX_FOUNDER_TEST_LAUNCH_READINESS_HISTORY,
  MAX_TOP_BLOCKERS,
  MAX_TOP_WARNINGS,
  MAX_TOP_RECOMMENDED_ACTIONS,
  MAX_TOP_MISSING_CAPABILITIES,
  LAUNCH_READINESS_VERDICTS,
  REQUIRED_ORCHESTRATION_AUTHORITIES,
  ORCHESTRATION_FLOW,
  isLaunchReadinessVerdict,
} from './founder-test-launch-readiness-registry.js';

export type {
  FounderTestPanelState,
  LaunchReadinessVerdict,
  LaunchReadinessConfidence,
  FounderTestLaunchSeverity,
  FounderTestLaunchBlocker,
  FounderTestLaunchWarning,
  FounderTestLaunchRecommendedAction,
  FounderTestAuthoritySummary,
  FounderTestLaunchReadinessInputSnapshot,
  FounderTestLaunchReadinessReport,
  FounderTestLaunchReadinessAssessment,
  RunFounderTestLaunchReadinessInput,
  FounderTestLaunchReadinessHistoryEntry,
  FounderTestLaunchReadinessHistorySummary,
  FounderTestLaunchReadinessArtifacts,
} from './founder-test-launch-readiness-types.js';

export {
  resetFounderTestLaunchReadinessHistoryForTests,
  recordFounderTestLaunchReadinessAssessment,
  getFounderTestLaunchReadinessHistorySize,
  getLatestFounderTestLaunchReadinessHistoryEntry,
  getFounderTestLaunchReadinessHistory,
  countLaunchReadinessVerdict,
  buildFounderTestLaunchReadinessHistorySummary,
} from './founder-test-launch-readiness-history.js';

export {
  runFounderTestLaunchReadiness,
  buildFounderTestLaunchReadinessArtifacts,
  aggregateTopBlockers,
  aggregateTopWarnings,
  aggregateTopRecommendedActions,
  resetFounderTestLaunchReadinessModuleForTests,
} from './founder-test-launch-readiness-authority.js';

export { buildFounderTestLaunchReadinessReportMarkdown } from './founder-test-launch-readiness-report-builder.js';
