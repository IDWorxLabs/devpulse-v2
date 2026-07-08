/**
 * Fresh Build Artifact Purge + Runtime Evidence Isolation V4 — types.
 *
 * Engine-wide, generic authority ensuring every NEW_BUILD starts with clean generated artifacts,
 * clean runtime evidence, clean preview evidence, and clean UI build-result state, and that a
 * CONTINUE_EXISTING_PROJECT build never mixes in unrelated build/project/session evidence.
 *
 * Nothing in this module or its siblings branches on product domain. All inputs/outputs are
 * generic ids/strings/tokens supplied by callers.
 */

import type { BuildDecisionKind } from '../project-context-isolation-v4/index.js';

export type { BuildDecisionKind };

// ---------------------------------------------------------------------------------------------
// Purge authority
// ---------------------------------------------------------------------------------------------

export type PurgeCategory =
  | 'GENERATED_WORKSPACE_PATH_REFERENCE'
  | 'WORKSPACE_TAB_REGISTRY_ENTRY'
  | 'MATERIALIZATION_MANIFEST'
  | 'GENERATED_MODULE_MANIFEST'
  | 'GENERATED_ROUTES'
  | 'GENERATED_NAVIGATION'
  | 'PREVIEW_DOM_EVIDENCE'
  | 'LIVE_PREVIEW_PROOF_EVIDENCE'
  | 'PRODUCT_FAITHFULNESS_REPORT'
  | 'GENERATION_FAITHFULNESS_AUDIT'
  | 'RECOVERED_CONCEPTS'
  | 'FALLBACK_MODULE_EVIDENCE'
  | 'ACTIVE_BUILD_RESULT'
  | 'RUNTIME_ACTIVATION_RESULT'
  | 'ENGINEERING_REPORT_SUMMARY'
  | 'UI_PROJECT_SUMMARY'
  | 'FAILURE_SUMMARY';

export const ALL_PURGE_CATEGORIES: PurgeCategory[] = [
  'GENERATED_WORKSPACE_PATH_REFERENCE',
  'WORKSPACE_TAB_REGISTRY_ENTRY',
  'MATERIALIZATION_MANIFEST',
  'GENERATED_MODULE_MANIFEST',
  'GENERATED_ROUTES',
  'GENERATED_NAVIGATION',
  'PREVIEW_DOM_EVIDENCE',
  'LIVE_PREVIEW_PROOF_EVIDENCE',
  'PRODUCT_FAITHFULNESS_REPORT',
  'GENERATION_FAITHFULNESS_AUDIT',
  'RECOVERED_CONCEPTS',
  'FALLBACK_MODULE_EVIDENCE',
  'ACTIVE_BUILD_RESULT',
  'RUNTIME_ACTIVATION_RESULT',
  'ENGINEERING_REPORT_SUMMARY',
  'UI_PROJECT_SUMMARY',
  'FAILURE_SUMMARY',
];

/**
 * Categories that represent artifacts *required to continue an existing project* — never purged
 * for CONTINUE_EXISTING_PROJECT (requirement: "do not purge required project artifacts"). Purged
 * for NEW_BUILD, where they are guaranteed absent by construction (a fresh project id has no prior
 * workspace/state under that id at all).
 */
export const PROJECT_ARTIFACT_PURGE_CATEGORIES: PurgeCategory[] = [
  'GENERATED_WORKSPACE_PATH_REFERENCE',
  'WORKSPACE_TAB_REGISTRY_ENTRY',
  'MATERIALIZATION_MANIFEST',
  'GENERATED_MODULE_MANIFEST',
  'GENERATED_ROUTES',
  'GENERATED_NAVIGATION',
];

/**
 * Categories that represent *per-build runtime evidence* — invalidated for every build regardless
 * of decision, because each build (even a continuation) must (re)compute its own evidence rather
 * than display a previous build's evidence while the current one is in flight or after it fails.
 */
export const PER_BUILD_RUNTIME_PURGE_CATEGORIES: PurgeCategory[] = [
  'PREVIEW_DOM_EVIDENCE',
  'LIVE_PREVIEW_PROOF_EVIDENCE',
  'PRODUCT_FAITHFULNESS_REPORT',
  'GENERATION_FAITHFULNESS_AUDIT',
  'RECOVERED_CONCEPTS',
  'FALLBACK_MODULE_EVIDENCE',
  'ACTIVE_BUILD_RESULT',
  'RUNTIME_ACTIVATION_RESULT',
  'ENGINEERING_REPORT_SUMMARY',
  'UI_PROJECT_SUMMARY',
  'FAILURE_SUMMARY',
];

export type PurgeMethod = 'FRESH_SCOPE' | 'EXECUTOR' | 'NOT_APPLICABLE';

export interface PurgeAction {
  category: PurgeCategory;
  required: true;
  purged: boolean;
  method: PurgeMethod;
  note: string;
}

export interface PurgeAuthorityInput {
  decision: BuildDecisionKind;
  requestId: string;
  buildId: string;
  projectId: string;
  /** True when resolveProjectContext actually minted a brand-new project id for this build. */
  freshProjectScope: boolean;
  /**
   * Per-build runtime evidence categories for which the caller actually wired an in-process
   * executor that clears a real module-level store. Categories not listed here are still
   * guaranteed fresh (they are computed statelessly per build call downstream, with no
   * orchestrator-level cache to clear) and are reported with method FRESH_SCOPE instead of
   * EXECUTOR, so the report never claims an executor ran when none exists.
   */
  categoriesWithLiveExecutor?: PurgeCategory[];
}

export interface PurgeAuthorityResult {
  readOnly: true;
  decision: BuildDecisionKind;
  actions: PurgeAction[];
  /** Always true — the purge authority never deletes persistent saved project history/registry. */
  persistentProjectsPreserved: true;
}

export type PurgeExecutorMap = Partial<Record<PurgeCategory, () => void>>;

// ---------------------------------------------------------------------------------------------
// Runtime evidence scope authority
// ---------------------------------------------------------------------------------------------

export type EvidenceNamespaceId =
  | 'CURRENT_REQUEST_EVIDENCE'
  | 'CURRENT_BUILD_EVIDENCE'
  | 'CURRENT_PROJECT_EVIDENCE'
  | 'INHERITED_PROJECT_EVIDENCE'
  | 'PREVIOUS_BUILD_EVIDENCE'
  | 'PREVIOUS_PROJECT_EVIDENCE'
  | 'PREVIOUS_SESSION_EVIDENCE'
  | 'UNSCOPED_EVIDENCE';

export interface RuntimeEvidenceScopeInput {
  requestId: string;
  buildId: string;
  projectId: string;
  decision: BuildDecisionKind;
  promptHash: string;
}

export interface RuntimeEvidenceScope {
  readOnly: true;
  requestId: string;
  buildId: string;
  projectId: string;
  decision: BuildDecisionKind;
  promptHash: string;
  workspaceScopeId: string;
  runtimeScopeId: string;
  previewEvidenceScopeId: string;
  faithfulnessEvidenceScopeId: string;
  materializationEvidenceScopeId: string;
  allowedEvidenceNamespaces: EvidenceNamespaceId[];
  blockedEvidenceNamespaces: EvidenceNamespaceId[];
  purgeActionsPerformed: PurgeAction[];
  staleEvidenceDetections: StaleEvidenceDetection[];
}

// ---------------------------------------------------------------------------------------------
// Evidence metadata
// ---------------------------------------------------------------------------------------------

export type EvidenceKind =
  | 'WORKSPACE_PATH_REFERENCE'
  | 'MATERIALIZATION_MANIFEST'
  | 'GENERATED_MODULE_MANIFEST'
  | 'GENERATED_ROUTES'
  | 'GENERATED_NAVIGATION'
  | 'PREVIEW_DOM_EVIDENCE'
  | 'LIVE_PREVIEW_PROOF'
  | 'PRODUCT_FAITHFULNESS_REPORT'
  | 'GENERATION_FAITHFULNESS_AUDIT'
  | 'RECOVERED_CONCEPTS'
  | 'FALLBACK_MODULE_EVIDENCE'
  | 'RUNTIME_ACTIVATION_RESULT'
  | 'ENGINEERING_REPORT_SUMMARY'
  | 'UI_PROJECT_SUMMARY';

export interface EvidenceMetadata {
  requestId: string;
  buildId: string;
  projectId: string;
  promptHash: string;
  productIdentity: string | null;
  createdAt: string;
  evidenceKind: EvidenceKind;
}

/** A candidate evidence object being considered for use in the current build's result/report. */
export interface EvidenceCandidate {
  evidenceKind: EvidenceKind;
  /** Null/undefined/partial metadata is itself evidence of staleness (requirement 5). */
  metadata: Partial<EvidenceMetadata> | null | undefined;
  workspacePathReferenced?: string | null;
  conceptGraph?: string[];
  /**
   * CONTINUE_EXISTING_PROJECT only: set true when this evidence is a *required project artifact*
   * (workspace path / manifest / routes / navigation) intentionally carried over from an earlier
   * turn in the *same* project — an explicit, justified inheritance, not an accidental leak. Never
   * exempts a projectId mismatch.
   */
  explicitlyInheritedProjectArtifact?: boolean;
}

// ---------------------------------------------------------------------------------------------
// Staleness detector
// ---------------------------------------------------------------------------------------------

export type StaleEvidenceLeakageKind =
  | 'PREVIOUS_BUILD_ID_EVIDENCE'
  | 'PREVIOUS_REQUEST_ID_EVIDENCE'
  | 'PREVIOUS_PROJECT_ID_EVIDENCE'
  | 'PREVIOUS_PROMPT_HASH_EVIDENCE'
  | 'PREVIOUS_WORKSPACE_PATH_EVIDENCE'
  | 'UNSCOPED_PREVIEW_DOM_EVIDENCE'
  | 'UNSCOPED_PRODUCT_FAITHFULNESS_REPORT'
  | 'STALE_GENERATED_MODULE'
  | 'STALE_ROUTES_NAVIGATION'
  | 'STALE_MATERIALIZATION_MANIFEST'
  | 'STALE_RUNTIME_ACTIVATION_RESULT'
  | 'STALE_ENGINEERING_REPORT_SUMMARY'
  | 'STALE_UI_PROJECT_SUMMARY'
  | 'UNSCOPED_EVIDENCE_MISSING_METADATA';

export interface StaleEvidenceDetection {
  kind: StaleEvidenceLeakageKind;
  detected: true;
  blocked: true;
  evidenceKind: EvidenceKind | null;
  detail: string;
}

export interface StalenessCheckInput {
  scope: RuntimeEvidenceScope;
  evidenceObjects: EvidenceCandidate[];
}

export interface StalenessCheckResult {
  readOnly: true;
  passed: boolean;
  detections: StaleEvidenceDetection[];
  blockedEvidenceKinds: EvidenceKind[];
  usableEvidenceKinds: EvidenceKind[];
}

// ---------------------------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------------------------

export interface FreshBuildArtifactIsolationReportSection {
  readOnly: true;
  runtimeEvidenceScopeId: string;
  decision: BuildDecisionKind;
  purgeActionsPerformed: PurgeAction[];
  staleArtifactsBlocked: StaleEvidenceDetection[];
  staleEvidenceBlocked: StaleEvidenceDetection[];
  unscopedEvidenceBlocked: StaleEvidenceDetection[];
  previousWorkspaceReferencesBlocked: string[];
  uiStateClearedForFreshBuild: boolean;
  productFaithfulnessUsedOnlyCurrentBuildEvidence: boolean;
}

export const FRESH_BUILD_ARTIFACT_ISOLATION_V4_PASS_TOKEN = 'FRESH_BUILD_ARTIFACT_ISOLATION_V4_PASS';
