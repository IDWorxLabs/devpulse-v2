/**
 * Change Intelligence Visibility — public exports.
 */

export {
  CHANGE_INTELLIGENCE_VISIBILITY_PASS_TOKEN,
  CHANGE_INTELLIGENCE_VISIBILITY_OWNER_MODULE,
} from './change-intelligence-visibility-types.js';

export type {
  ChangeCategory,
  ChangeDirection,
  ChangeEvent,
  ChangeFeedEvent,
  ChangeImpactSummary,
  ChangeIntelligenceSnapshot,
  ChangeIntelligenceVisibilityAssessment,
  ChangeSeverity,
  ChangeTimelineEntry,
} from './change-intelligence-visibility-types.js';

export {
  assessChangeIntelligenceVisibility,
} from './change-intelligence-visibility-authority.js';

export {
  captureChangeIntelligenceSnapshotFromWorkspace,
  getChangeIntelligenceHistory,
  recordChangeIntelligenceSnapshot,
  recordFounderTestChangeSnapshot,
  recordWorkspaceChangeSnapshot,
  resetChangeIntelligenceHistoryForTests,
} from './change-intelligence-history.js';
