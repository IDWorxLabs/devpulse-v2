/**
 * Launch Blocker Board V1 — founder-facing launch readiness classification.
 */

export type {
  BuildLaunchBlockerBoardInput,
  LaunchBlockerBoardArtifacts,
  LaunchBlockerBoardAssessment,
  LaunchBlockerBoardEntry,
  LaunchBlockerBoardReport,
  LaunchBlockerBucket,
  LaunchBlockerDisposition,
  LaunchBlockerLaunchImpact,
  LaunchBlockerSeverity,
} from './launch-blocker-board-types.js';

export {
  CANONICAL_LAUNCH_BLOCKER_IDS,
  FOUNDER_TEST_REPAIR_PHASE_TRIGGERS,
  LAUNCH_BLOCKER_BOARD_CORE_QUESTION,
  LAUNCH_BLOCKER_BOARD_PASS,
  LAUNCH_BLOCKER_BOARD_PHASE,
  LAUNCH_BLOCKER_BOARD_REPORT_TITLE,
  LAUNCH_BLOCKER_BUCKETS,
  STRATEGY_RESET_RULE,
} from './launch-blocker-board-registry.js';

export {
  assembleLaunchBlockerBoard,
  buildLaunchBlockerBoardArtifacts,
  resetLaunchBlockerBoardCounterForTests,
  resetLaunchBlockerBoardModuleForTests,
} from './launch-blocker-board-authority.js';

export { collectLaunchBlockerBoardEntries } from './launch-blocker-board-collector.js';
export {
  classifyLaunchBlockerBucket,
  deriveDisposition,
  deriveLaunchImpact,
  sortLaunchBlockerEntries,
} from './launch-blocker-board-classifier.js';

export {
  buildLaunchBlockerBoardReportMarkdown,
  buildLaunchBlockerBoardValidationMarkdown,
} from './launch-blocker-board-report-builder.js';

export {
  getLaunchBlockerBoardHistory,
  getLaunchBlockerBoardHistorySize,
  recordLaunchBlockerBoardReport,
  resetLaunchBlockerBoardHistoryForTests,
} from './launch-blocker-board-history.js';
