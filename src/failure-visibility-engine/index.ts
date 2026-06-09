/**
 * DevPulse V2 Phase 13.5 — Failure Visibility Engine public API.
 */

export {
  FAILURE_VISIBILITY_ENGINE_PASS_TOKEN,
  FAILURE_VISIBILITY_ENGINE_OWNER_MODULE,
  FAILURE_VISIBILITY_QUESTION_SIGNALS,
  FORBIDDEN_FAILURE_VISIBILITY_DUPLICATES,
  isFailureVisibilityQuestion,
  compareFailureSeverity,
  type FailureSeverity,
  type FailureConfidence,
  type FailureImpact,
  type FailureDependencyImpact,
  type FailureRecord,
  type FailureAnalysis,
  type FailureVisibilityResult,
  type FailureVisibilityDiagnostics,
} from './failure-visibility-types.js';

export { classifyFailureSeverity, findMostSevereSeverity } from './failure-severity-analyzer.js';
export {
  analyzeFailureImpacts,
  collectBlockedCapabilities,
  resetFailureImpactCounterForTests,
} from './failure-impact-analyzer.js';
export {
  analyzeFailureDependencyImpacts,
  resetFailureDependencyCounterForTests,
} from './failure-dependency-analyzer.js';
export {
  buildRecommendedNextStep,
  buildAggregateNextStep,
  confidenceForSeverity,
} from './failure-next-step-builder.js';
export { buildFailureRecords, resetFailureRecordCounterForTests } from './failure-record-builder.js';

export {
  getFailureVisibilityDiagnostics,
  updateFailureVisibilityDiagnostics,
  resetFailureVisibilityDiagnostics,
  failureVisibilityKey,
} from './failure-visibility-diagnostics.js';

export {
  analyzeFailures,
  processFailureVisibilityRequest,
  getFailureVisibilityContext,
} from './failure-visibility-engine.js';

export function getDevPulseV2FailureVisibilityEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_failure_visibility_engine',
    passToken: 'DEVPULSE_V2_FAILURE_VISIBILITY_ENGINE_FOUNDATION_V1_PASS',
    phase: 13.5,
  };
}
