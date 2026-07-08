/**
 * Project Context Isolation + Prompt Reset Authority V4 — public API.
 */

export type {
  BuildContextScopeInput,
  BuildDecisionInput,
  BuildDecisionKind,
  BuildDecisionOverrideRejection,
  BuildDecisionResult,
  BuildIntentOverride,
  ContextIsolationReportSection,
  ContextScope,
  ContextSourceDecision,
  ContextSourceId,
  ModuleOriginCandidate,
  PromptResetPlan,
  ResetAction,
  ResetCategory,
  ResetExecutorMap,
  ResetMethod,
  ResetTrigger,
  StaleContextCheckInput,
  StaleContextCheckResult,
  StaleContextDetection,
  StaleContextLeakageKind,
} from './project-context-isolation-types.js';

export { ALL_RESET_CATEGORIES, PROJECT_CONTEXT_ISOLATION_V4_PASS_TOKEN } from './project-context-isolation-types.js';

export { classifyNewBuildDecision } from './new-build-decision-authority.js';

export type { NewBuildDecisionV2Input, NewBuildDecisionV2Result } from './new-build-decision-authority-v2.js';
export { classifyNewBuildDecisionV2 } from './new-build-decision-authority-v2.js';

export type {
  AmbiguityEvidenceInput,
  ContinuationEvidenceInput,
  DecisionEvidenceItem,
  EvidenceSource,
  NewBuildEvidenceInput,
} from './new-build-decision-score.js';
export {
  CLOSE_SCORE_MARGIN,
  CONTINUATION_MODERATE_THRESHOLD,
  CONTINUATION_STRONG_THRESHOLD,
  GENERIC_PRODUCT_WORDS,
  IDENTITY_COMPATIBILITY_THRESHOLD,
  LOW_THRESHOLD,
  NEW_BUILD_MODERATE_THRESHOLD,
  NEW_BUILD_STRONG_THRESHOLD,
  computeAmbiguityEvidence,
  computeContinuationEvidence,
  computeNewBuildEvidence,
  isIdentityCompatible,
  jaccardOverlap,
  sumConfidence,
  tokenizeMeaningful,
} from './new-build-decision-score.js';

export type {
  NewBuildDecisionDiagnostics,
  NewBuildDecisionReport,
  NewBuildDecisionScoreBreakdown,
} from './new-build-decision-report.js';
export {
  buildNewBuildDecisionDiagnostics,
  buildNewBuildDecisionReport,
  renderNewBuildDecisionReportMarkdown,
} from './new-build-decision-report.js';

export { buildContextScope, isSourceAllowed, isSourceBlocked } from './context-scope-authority.js';

export { assertNoStaleContext, runStaleContextCheck } from './stale-context-detector.js';

export { applyPromptResetPlan, buildPromptResetPlan, unclearedCategories } from './prompt-reset-authority.js';

export {
  buildContextIsolationReportSection,
  renderContextIsolationReportMarkdown,
} from './project-context-isolation-report.js';
