/**
 * DevPulse V2 Operator Feed — Phase 1 inline feed + Phase 13.1 visibility foundation.
 */

export {
  createDevPulseV2InlineOperatorFeedAuthority,
  DevPulseV2InlineOperatorFeedAuthority,
  getDevPulseV2InlineOperatorFeedAuthority,
  resetDevPulseV2InlineOperatorFeedAuthorityForTests,
} from './inline-operator-feed-authority.js';
export {
  createTurnIdFromMessage,
  feedDidNotModifyAnswer,
  feedEventsAreNotAssistantAnswers,
  runFoundationFeedForTurn,
} from './chat-feed-bridge.js';
export {
  getInlineFeedSurfaceSnapshot,
  renderInlineOperatorFeed,
} from './inline-operator-feed-surface.js';
export {
  buildInlineOperatorFeedReport,
  formatInlineOperatorFeedReport,
} from './inline-operator-feed-report.js';
export {
  FEED_OWNER_MODULE,
  FEED_PASS_TOKEN,
  FOUNDATION_FEED_STAGES,
  type InlineOperatorFeedEvent,
  type DevPulseV2InlineOperatorFeedState,
} from './types.js';

export {
  OPERATOR_FEED_FOUNDATION_PASS_TOKEN,
  OPERATOR_FEED_FOUNDATION_OWNER_MODULE,
  STANDARD_VISIBILITY_STAGES,
  FORBIDDEN_OPERATOR_FEED_DUPLICATES,
  isDuplicateOperatorFeedBrainQuestion,
  type OperatorFeedStage,
  type OperatorFeedConfidence,
  type OperatorFeedEvent as VisibilityOperatorFeedEvent,
  type OperatorFeedContext,
  type OperatorFeedTimeline,
  type OperatorFeedDiagnostics,
} from './operator-feed-types.js';

export { createOperatorFeedEvent, resetOperatorFeedEventCounterForTests } from './operator-feed-event.js';
export {
  mapCapabilityToFeedStages,
  sourceSystemForCapability,
  sourceSystemsForStages,
} from './operator-feed-stage-mapper.js';
export { trackOperatorFeedContext, contextSummaryForStage } from './operator-feed-context-tracker.js';
export {
  buildOperatorFeedTimeline,
  isTimelineOrdered,
  resetOperatorFeedTimelineCounterForTests,
} from './operator-feed-timeline.js';
export {
  getOperatorFeedDiagnostics,
  updateOperatorFeedDiagnostics,
  resetOperatorFeedDiagnostics,
  operatorFeedFoundationKey,
} from './operator-feed-diagnostics.js';
export { publishVisibilityStages, publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
export {
  ACTION_VISIBILITY_FEED_STAGES,
  publishActionVisibilityFeedStages,
} from './action-visibility-feed-bridge.js';
export {
  REASONING_VISIBILITY_FEED_STAGES,
  publishReasoningVisibilityFeedStages,
} from './reasoning-visibility-feed-bridge.js';
export {
  PROGRESS_INTELLIGENCE_FEED_STAGES,
  publishProgressIntelligenceFeedStages,
} from './progress-intelligence-feed-bridge.js';
export {
  FAILURE_VISIBILITY_FEED_STAGES,
  publishFailureVisibilityFeedStages,
} from './failure-visibility-feed-bridge.js';
export {
  LEARNING_VISIBILITY_FEED_STAGES,
  publishLearningVisibilityFeedStages,
} from './learning-visibility-feed-bridge.js';
export {
  buildOperatorFeedVisibility,
  getOperatorFeedVisibilityContext,
  type OperatorFeedVisibilityInput,
} from './operator-feed.js';

export function getDevPulseV2OperatorFeed(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_operator_feed',
    passToken: 'DEVPULSE_V2_OPERATOR_FEED_FOUNDATION_V1_PASS',
    phase: 13.1,
  };
}
