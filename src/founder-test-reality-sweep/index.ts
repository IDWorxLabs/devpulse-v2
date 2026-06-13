/**
 * Founder Test Reality Sweep — public API (Phase 25.32).
 */

export {
  FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN,
  FOUNDER_TEST_REALITY_SWEEP_TYPE_DRIFT_REPAIR_V1_PASS,
  FOUNDER_TEST_REALITY_SWEEP_OWNER_MODULE,
  FOUNDER_TEST_REALITY_SWEEP_PHASE,
  FOUNDER_TEST_REALITY_SWEEP_REPORT_TITLE,
  FOUNDER_TEST_REALITY_SWEEP_CACHE_KEY_PREFIX,
  FOUNDER_TEST_REALITY_SWEEP_CORE_QUESTION,
  REALITY_SWEEP_CATEGORIES,
  REALITY_SWEEP_CATEGORY_LABELS,
  LAUNCH_BLOCKER_SEVERITIES,
  FOUNDER_LAUNCH_VERDICTS,
  LAUNCH_RECOMMENDATIONS,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  REALITY_SWEEP_SAFETY_GUARANTEES,
  isFounderLaunchVerdict,
  isLaunchRecommendation,
} from './founder-test-reality-sweep-registry.js';

export type {
  RealitySweepCategory,
  LaunchBlockerSeverity,
  FounderLaunchVerdict,
  LaunchRecommendation,
  RealitySweepCategoryScore,
  LaunchBlockerEntry,
  LaunchWarningEntry,
  LaunchStrengthEntry,
  MissingCapabilityEntry,
  CompetitiveGapEntry,
  LaunchRiskEntry,
  RecommendedLaunchWorkEntry,
  FounderTestRealitySweepInputSnapshot,
  FounderTestRealitySweepReport,
  FounderTestRealitySweepAssessment,
  AssessFounderTestRealitySweepInput,
  FounderTestRealitySweepHistoryEntry,
  FounderTestRealitySweepHistorySummary,
  FounderTestRealitySweepArtifacts,
} from './founder-test-reality-sweep-types.js';

export {
  computeCategoryScores,
  analyzeLaunchBlockers,
  analyzeLaunchWarnings,
  analyzeLaunchStrengths,
  analyzeMissingCapabilities,
  analyzeCompetitiveGaps,
  analyzeTopLaunchRisks,
  analyzeRecommendedLaunchWork,
  computeHonestLaunchReadinessPercent,
  deriveFounderLaunchVerdict,
  deriveLaunchRecommendation,
  rankTopBlockers,
  rankTopStrengths,
  rankTopMissingCapabilities,
  rankMostImportantNextBuildItems,
  resetLaunchBlockerAnalyzerCountersForTests,
} from './launch-blocker-analyzer.js';

export {
  assessFounderTestRealitySweep,
  buildFounderTestRealitySweepArtifacts,
  resetFounderTestRealitySweepModuleForTests,
  resetFounderTestRealitySweepCounterForTests,
} from './founder-test-reality-sweep-authority.js';

export {
  recordFounderTestRealitySweepAssessment,
  resetFounderTestRealitySweepHistoryForTests,
  getFounderTestRealitySweepHistorySize,
  getLatestFounderTestRealitySweepHistoryEntry,
  getFounderTestRealitySweepHistory,
  buildFounderTestRealitySweepHistorySummary,
} from './founder-test-reality-sweep-history.js';

export { buildFounderTestRealitySweepReportMarkdown } from './founder-test-reality-sweep-report-builder.js';
