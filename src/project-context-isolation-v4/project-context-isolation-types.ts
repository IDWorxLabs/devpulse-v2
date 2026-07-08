/**
 * Project Context Isolation + Prompt Reset Authority V4 — types.
 *
 * Engine-wide, generic authority for distinguishing a brand-new app build from a continuation
 * of an existing project, and for preventing stale project context (identity, concepts,
 * metadata, contracts, manifests, preview evidence) from leaking into an unrelated build.
 *
 * Nothing in this module or its siblings branches on product domain. All inputs/outputs are
 * generic strings/tokens supplied by callers.
 */

export type BuildDecisionKind = 'NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | 'AMBIGUOUS_REQUIRES_CONFIRMATION';

/**
 * NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — an explicit, user-issued build intent choice made in
 * direct response to a prior AMBIGUOUS_REQUIRES_CONFIRMATION confirmation panel. This is distinct
 * from confirmFreshCopy/confirmProjectResume (which resolve duplicate-project/alignment prompts):
 * a buildIntentOverride specifically answers "is this a new app or a continuation?".
 */
export type BuildIntentOverride = 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT';

export interface BuildDecisionInput {
  rawPrompt: string;
  requestedProjectId?: string | null;
  requestedProjectName?: string | null;
  /** True when the caller already knows of an existing project this request might relate to. */
  hasKnownExistingProject: boolean;
  /** Short domain/identity summary of the currently-known project, if any (for compatibility check). */
  currentProjectIdentitySummary?: string | null;
  /** Explicit user choice from a prior NEW_BUILD_CONFIRMATION_REQUIRED panel, if any. */
  buildIntentOverride?: BuildIntentOverride | null;
}

export interface BuildDecisionOverrideRejection {
  requested: BuildIntentOverride;
  reason: string;
}

export interface BuildDecisionResult {
  readOnly: true;
  decision: BuildDecisionKind;
  /** 0-1, deterministic function of how many/which signals matched. */
  confidence: number;
  reasons: string[];
  continuationSignals: string[];
  newBuildSignals: string[];
  /** User-facing clarification question, populated only for AMBIGUOUS_REQUIRES_CONFIRMATION. */
  message: string | null;
  /** Set when an explicit buildIntentOverride was honored to reach this decision. */
  overrideApplied?: BuildIntentOverride | null;
  /** Set when an explicit buildIntentOverride was rejected (e.g. unsafe continuation) — decision falls back to AMBIGUOUS_REQUIRES_CONFIRMATION. */
  overrideRejected?: BuildDecisionOverrideRejection | null;
}

export type ContextSourceId =
  | 'CURRENT_PROMPT'
  | 'PREVIOUS_ACTIVE_PROJECT'
  | 'PREVIOUS_PROJECT_METADATA'
  | 'PREVIOUS_CONCEPTS'
  | 'PREVIOUS_CANONICAL_CONTRACT'
  | 'PREVIOUS_CONCEPT_GRAPH'
  | 'PREVIOUS_MODULE_PLAN'
  | 'PREVIOUS_FEATURE_CONTRACT'
  | 'PREVIOUS_ROUTES_NAVIGATION'
  | 'PREVIOUS_MATERIALIZATION_MANIFEST'
  | 'PREVIOUS_PREVIEW_EVIDENCE'
  | 'PREVIOUS_FAITHFULNESS_REPORT'
  | 'PREVIOUS_RECOVERED_CONCEPTS'
  | 'PREVIOUS_FALLBACK_MODULE_EVIDENCE'
  | 'PREVIOUS_BUILD_RESULT'
  | 'PREVIOUS_RUNTIME_ACTIVATION_STATE'
  | 'PREVIOUS_LIVE_PREVIEW_PROOF';

export interface ContextSourceDecision {
  source: ContextSourceId;
  allowed: boolean;
  reason: string;
}

export interface ContextScope {
  readOnly: true;
  requestId: string;
  buildId: string;
  projectId: string;
  decision: BuildDecisionKind;
  currentPromptHash: string;
  allowedContextSources: ContextSourceDecision[];
  blockedContextSources: ContextSourceDecision[];
  inheritedProjectId: string | null;
  inheritedConcepts: string[];
}

export interface BuildContextScopeInput {
  requestId: string;
  buildId: string;
  projectId: string;
  decision: BuildDecisionKind;
  currentPromptHash: string;
  /** The project id the request explicitly referenced/continued, if any (only for CONTINUE). */
  explicitlyReferencedProjectId?: string | null;
  /** A process/session-level "active project" candidate that may or may not match the explicit reference. */
  activeProjectIdCandidate?: string | null;
  inheritedConcepts?: string[];
}

export type ResetCategory =
  | 'PRODUCT_IDENTITY'
  | 'CANONICAL_CONTRACT'
  | 'CONCEPT_GRAPH'
  | 'MODULE_PLAN'
  | 'FEATURE_CONTRACT'
  | 'ROUTES'
  | 'NAVIGATION'
  | 'MATERIALIZATION_MANIFEST'
  | 'PREVIEW_DOM_EVIDENCE'
  | 'FAITHFULNESS_REPORT'
  | 'RECOVERED_CONCEPTS'
  | 'FALLBACK_MODULE_EVIDENCE'
  | 'ACTIVE_BUILD_RESULT'
  | 'RUNTIME_ACTIVATION_STATE'
  | 'LIVE_PREVIEW_PROOF_STATE';

export const ALL_RESET_CATEGORIES: ResetCategory[] = [
  'PRODUCT_IDENTITY',
  'CANONICAL_CONTRACT',
  'CONCEPT_GRAPH',
  'MODULE_PLAN',
  'FEATURE_CONTRACT',
  'ROUTES',
  'NAVIGATION',
  'MATERIALIZATION_MANIFEST',
  'PREVIEW_DOM_EVIDENCE',
  'FAITHFULNESS_REPORT',
  'RECOVERED_CONCEPTS',
  'FALLBACK_MODULE_EVIDENCE',
  'ACTIVE_BUILD_RESULT',
  'RUNTIME_ACTIVATION_STATE',
  'LIVE_PREVIEW_PROOF_STATE',
];

export type ResetTrigger = 'NEW_PROMPT' | 'RESET_TEST' | 'NEW_BUILD_PROMPT';

export type ResetMethod = 'FRESH_SCOPE' | 'EXECUTOR' | 'NOT_APPLICABLE';

export interface ResetAction {
  category: ResetCategory;
  required: true;
  cleared: boolean;
  method: ResetMethod;
  note: string;
}

export interface PromptResetPlan {
  readOnly: true;
  trigger: ResetTrigger;
  projectId: string | null;
  /** True when the target project id has no prior workspace/state at all (guarantees clean state). */
  freshProjectScope: boolean;
  actions: ResetAction[];
  preservesPersistentProjects: true;
}

export type ResetExecutorMap = Partial<Record<ResetCategory, () => void>>;

export type StaleContextLeakageKind =
  | 'PREVIOUS_PROJECT_IDENTITY'
  | 'PREVIOUS_PRODUCT_CONCEPT'
  | 'STALE_ACTIVE_PROJECT_ID'
  | 'STALE_METADATA_KEYWORD'
  | 'STALE_FEATURE_CONTRACT'
  | 'STALE_MANIFEST'
  | 'STALE_PREVIEW_EVIDENCE'
  | 'UNJUSTIFIED_FALLBACK_MODULE';

export interface StaleContextDetection {
  kind: StaleContextLeakageKind;
  detected: boolean;
  contaminatedSource: string | null;
  detail: string;
}

export interface ModuleOriginCandidate {
  moduleId: string;
  origin: string;
  justified: boolean;
}

export interface StaleContextCheckInput {
  stage: string;
  scope: ContextScope;
  currentPromptConcepts: string[];
  canonicalIdentity: string | null;
  candidateInheritedConcepts: string[];
  candidateGeneratedConcepts: string[];
  candidateModuleOrigins?: ModuleOriginCandidate[];
  previousProjectIdentity?: string | null;
  previousMetadataKeywords?: string[];
  previousFeatureContractConcepts?: string[];
  previousManifestConcepts?: string[];
  previousPreviewEvidenceConcepts?: string[];
  /** A stale process/session "active project" value that must not silently override requestedProjectId. */
  activeProjectIdCandidate?: string | null;
  requestedProjectId?: string | null;
}

export interface StaleContextCheckResult {
  readOnly: true;
  stage: string;
  passed: boolean;
  detections: StaleContextDetection[];
}

export interface ContextIsolationReportSection {
  readOnly: true;
  decision: BuildDecisionKind;
  isNewBuild: boolean;
  productIdentity: string | null;
  inheritedProjectId: string | null;
  inheritedContextSources: ContextSourceId[];
  blockedContextSources: ContextSourceId[];
  staleContextDetections: StaleContextDetection[];
  resetActionsPerformed: ResetAction[];
  activeProjectIdFallbackBlocked: boolean;
  /** True when a prior request on this same build was AMBIGUOUS_REQUIRES_CONFIRMATION and the user was shown a confirmation panel. */
  confirmationWasRequired: boolean;
  /** The explicit choice the user made in response to that confirmation panel, if any. */
  buildIntentOverride: BuildIntentOverride | null;
  /** Populated when the user's override could not be honored safely (e.g. continuation requested but unsafe). */
  overrideRejected: BuildDecisionOverrideRejection | null;
}

export const PROJECT_CONTEXT_ISOLATION_V4_PASS_TOKEN = 'PROJECT_CONTEXT_ISOLATION_V4_PASS';
