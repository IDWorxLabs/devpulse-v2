/**
 * DevPulse V2 Phase 13.2 — Action Visibility Engine public API.
 */

export {
  ACTION_VISIBILITY_ENGINE_PASS_TOKEN,
  ACTION_VISIBILITY_ENGINE_OWNER_MODULE,
  ACTION_VISIBILITY_QUESTION_SIGNALS,
  ACTION_SOURCE_SYSTEMS,
  FORBIDDEN_ACTION_VISIBILITY_DUPLICATES,
  isActionVisibilityQuestion,
  type ActionStatus,
  type ActionConfidence,
  type ActionCandidate,
  type ActionRecommendation,
  type ActionVisibilityRecord,
  type ActionVisibilityResult,
  type ActionVisibilityDiagnostics,
} from './action-visibility-types.js';

export {
  resolveActionSourceFromCapability,
  resolveActionSourceFromQuery,
  displaySourceSystem,
} from './action-source-resolver.js';

export {
  evaluateActionStatus,
  isBlockedStatus,
  isDeferredStatus,
  isRecommendedStatus,
} from './action-status-evaluator.js';

export {
  rankActionsByPriority,
  findHighestPriorityAction,
  filterActionsByStatus,
  filterActionsBySource,
} from './action-priority-evaluator.js';

export {
  buildActionCandidates,
  buildActionRecommendation,
  buildActionVisibilityRecordsFromDecision,
  resetActionCandidateCounterForTests,
} from './action-candidate-builder.js';

export {
  getActionVisibilityDiagnostics,
  updateActionVisibilityDiagnostics,
  resetActionVisibilityDiagnostics,
  actionVisibilityKey,
} from './action-visibility-diagnostics.js';

export {
  analyzeActionVisibility,
  processActionVisibilityRequest,
  getActionVisibilityContext,
} from './action-visibility-engine.js';

export function getDevPulseV2ActionVisibilityEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_action_visibility_engine',
    passToken: 'DEVPULSE_V2_ACTION_VISIBILITY_ENGINE_FOUNDATION_V1_PASS',
    phase: 13.2,
  };
}
