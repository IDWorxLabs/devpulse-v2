/**
 * Live Preview Interaction Proof V1 — types.
 *
 * Product Stabilization Phase 2: proves whether a generated app is actually usable inside its
 * live preview, not just that a previewUrl exists. Small, deterministic, generic — no
 * application-specific logic. Every interaction is discovered generically (buttons, inputs,
 * checkboxes, selects, links, form submits) from feature contract / manifest / prompt evidence.
 */

export const LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT = 'LIVE_PREVIEW_INTERACTION_PROOF_V1' as const;

export type PreviewInteractionProofResultKind =
  | 'PREVIEW_INTERACTION_PASS'
  | 'PREVIEW_INTERACTION_PARTIAL'
  | 'PREVIEW_INTERACTION_FAIL'
  | 'PREVIEW_INTERACTION_BLOCKED';

export type PlannedInteractionType =
  | 'BUTTON_CLICK'
  | 'INPUT_SUBMIT'
  | 'CHECKBOX_TOGGLE'
  | 'SELECT_CHANGE'
  | 'LINK_NAVIGATION';

/** A generic, app-agnostic interaction the runner will attempt to perform, in order. */
export interface PlannedInteraction {
  readOnly: true;
  id: string;
  type: PlannedInteractionType;
  /** Plain-English label for reporting — never a raw CSS selector. */
  label: string;
}

export interface InteractionAttemptRecord {
  readOnly: true;
  interactionId: string;
  type: PlannedInteractionType;
  label: string;
  /** Whether a matching element was found to attempt this interaction on. */
  elementFound: boolean;
  /** Whether the interaction was actually performed (click/fill/toggle/select/navigate). */
  performed: boolean;
  /** Whether a visible state change was detected after performing the interaction. */
  stateChanged: boolean;
  detail: string;
}

/** Generic hints extracted from the feature contract, if one is available. No app-specific fields. */
export interface FeatureContractHints {
  primaryModuleName: string | null;
  featureTerms: string[];
  routes: string[];
}

/** Generic hints extracted from the materialization manifest, if one is available. */
export interface MaterializationManifestHints {
  featureModuleNames: string[];
  promptTerms: string[];
  routes: string[];
}

export interface LivePreviewInteractionProofInput {
  previewUrl: string | null;
  devServerRunning: boolean;
  prompt: string;
  featureContractHints?: FeatureContractHints | null;
  materializationManifestHints?: MaterializationManifestHints | null;
  /** Bounds — all optional, defaults enforce the safety budget documented in the runner. */
  maxLoadWaitMs?: number;
  maxInteractionAttempts?: number;
  maxTotalProofTimeMs?: number;
}

export interface LivePreviewInteractionProofEvidence {
  readOnly: true;
  previewUrl: string | null;
  pageLoaded: boolean;
  loadErrorDetail: string | null;
  consoleErrors: string[];
  fatalConsoleErrorDetected: boolean;
  rootUiFound: boolean;
  primaryFeatureTextFound: string | null;
  candidateTermsTried: string[];
  plannedInteractions: PlannedInteraction[];
  interactionAttempts: InteractionAttemptRecord[];
  durationMs: number;
  blockedReason: string | null;
}

export interface LivePreviewInteractionProofSummary {
  readOnly: true;
  headline: string;
  whatLoaded: string[];
  whatWasTested: string[];
  whatWorked: string[];
  whatFailed: string[];
  suggestedRepair: string[];
}

export interface LivePreviewInteractionProofReport {
  readOnly: true;
  contractVersion: typeof LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT;
  result: PreviewInteractionProofResultKind;
  evidence: LivePreviewInteractionProofEvidence;
  summary: LivePreviewInteractionProofSummary;
}

/** Safety budget — bounded, no infinite retries, no unbounded screenshots. */
export const LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_LOAD_WAIT_MS = 10_000;
export const LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_INTERACTION_ATTEMPTS = 5;
export const LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_TOTAL_PROOF_TIME_MS = 30_000;

export const PLAYWRIGHT_INSTALL_INSTRUCTION = 'npx playwright install chromium';
