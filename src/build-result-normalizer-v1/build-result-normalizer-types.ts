/**
 * Build Result Normalizer V1 — types.
 *
 * Product Stabilization Phase 1: turns the many internal authority signals produced by the
 * build pipeline (npm install/build, live preview gate, workspace reality audit, launch
 * readiness, materialization quality, etc.) into ONE clear, honest result plus a plain-English
 * summary a founder can read without understanding any internal system.
 *
 * This module does not run new checks, call new engines, or change build behavior — it only
 * reads the existing build result and summarizes it. No application-specific logic.
 */

export const BUILD_RESULT_NORMALIZER_V1_CONTRACT = 'BUILD_RESULT_NORMALIZER_V1' as const;

/** One clear, founder-facing result — always exactly one of these. */
export type NormalizedBuildResultKind =
  | 'BUILT_SUCCESSFULLY'
  | 'BUILT_WITH_WARNINGS'
  | 'BUILT_WITH_PRODUCT_MISMATCH'
  | 'BUILT_WITH_LOW_FAITHFULNESS'
  | 'BUILT_AFTER_FAITHFULNESS_REPAIR'
  | 'FAILED_PRODUCT_DRIFT'
  | 'FAILED_CONTRACT_INCONSISTENCY'
  | 'FAILED_WITH_REPAIR_AVAILABLE'
  | 'FAILED_BLOCKED';

/**
 * Separated end-to-end build reality stages. These are independent facts, not a single
 * pass/fail — a build can have working output and a working preview while still having
 * validation or launch-readiness gates that have not cleared yet.
 */
export interface NormalizedBuildRealityStages {
  readOnly: true;
  /** Phase 3: the generated workspace was complete/internally-consistent (or safely repaired) before npm install ran. */
  workspaceReady: boolean;
  /** Phase 3: npm install succeeded. */
  dependenciesReady: boolean;
  /** Phase 3: npm build succeeded. */
  buildReady: boolean;
  /** npm install AND npm build both succeeded. Kept for backward compatibility — equals dependenciesReady && buildReady. */
  buildOutputReady: boolean;
  /** Dev server is running and a preview URL is reachable. */
  previewReady: boolean;
  /** Internal validators (quality score, workspace reality audit, feature reality, etc.) found issues. */
  validationNeedsWork: boolean;
  /** Launch-readiness / production-proof gates are not satisfied yet — a later concern, not a local-testing blocker. */
  launchNotReady: boolean;
  /** Phase 2: whether AiDevEngine actually ran the live preview interaction proof. */
  interactionProofChecked: boolean;
  /** Phase 2: whether that proof confirmed the app is genuinely usable — null when not checked. */
  interactionProofPassed: boolean | null;
  /** Phase 4: execution ran to completion (or recovered) without an unresolved stall/failure. */
  executionHealthy: boolean;
}

/** Phase 3: a light, UI-ready view of the workspace materialization stabilizer — no raw evidence. */
export interface NormalizedWorkspaceMaterializationSummary {
  readOnly: true;
  status:
    | 'WORKSPACE_COMPLETE'
    | 'WORKSPACE_REPAIRED'
    | 'WORKSPACE_INCOMPLETE'
    | 'WORKSPACE_CORRUPTED'
    | 'WORKSPACE_BLOCKED';
  headline: string;
  repaired: string[];
  stillMissing: string[];
}

/** Phase 4: a light, UI-ready view of build execution health — no raw process logs. */
export interface NormalizedBuildExecutionSummary {
  readOnly: true;
  state:
    | 'RUNNING'
    | 'WAITING'
    | 'STALL_DETECTED'
    | 'RECOVERING'
    | 'RECOVERED'
    | 'FAILED'
    | 'COMPLETED'
    | 'BLOCKED';
  currentStageLabel: string;
  elapsedLabel: string;
  heartbeatLabel: string;
  recoveryLabel: string | null;
  nextStepLabel: string;
  headline: string;
}

export interface NormalizedBuildPlainEnglishSummary {
  readOnly: true;
  /** Short list of what actually worked, in plain English. */
  whatWorked: string[];
  /** Short list of what actually failed or needs attention, in plain English. */
  whatFailed: string[];
  /** Short list of repair/recovery actions AiDevEngine already attempted. */
  whatAiDevEngineTried: string[];
  /** A single, direct instruction for what the user should do next. */
  whatToDoNext: string;
  /** One-sentence headline suitable for a status banner. */
  headline: string;
}

/** Phase 2: a light, UI-ready view of the live preview interaction proof — no raw evidence. */
export interface NormalizedLivePreviewProofSummary {
  readOnly: true;
  result: 'PREVIEW_INTERACTION_PASS' | 'PREVIEW_INTERACTION_PARTIAL' | 'PREVIEW_INTERACTION_FAIL' | 'PREVIEW_INTERACTION_BLOCKED';
  headline: string;
  whatWorked: string[];
  whatFailed: string[];
  suggestedRepair: string[];
}

/**
 * Product Faithfulness Milestone 1: a light, UI-ready view of whether the generated app is
 * recognizably the app the user asked for — a separate question from whether it runs. Raw
 * concept-level comparison detail belongs in Advanced Diagnostics, not here.
 */
export interface NormalizedProductFaithfulnessSummary {
  readOnly: true;
  score: number;
  verdict:
    | 'PRODUCT_FAITHFUL'
    | 'PRODUCT_MOSTLY_FAITHFUL'
    | 'PARTIALLY_FAITHFUL'
    | 'LOW_FAITHFULNESS'
    | 'PRODUCT_MISMATCH';
  headline: string;
  reason: string;
  topMatched: string[];
  topMissing: string[];
  topUnexpected: string[];
}

/**
 * Product Faithfulness Milestone 2: a light, UI-ready view of whether product identity was
 * preserved throughout generation (not just in the finished app) — canonical product identity,
 * concept retention/drift, and any repairs AiDevEngine already applied during generation. Raw
 * per-stage evidence and the concept graph belong in Advanced Diagnostics, not here.
 */
export interface NormalizedGenerationFaithfulnessSummary {
  readOnly: true;
  productIdentity: string;
  conceptRetentionPercent: number;
  conceptDriftPercent: number;
  verdict: 'CONSISTENT' | 'DRIFTED' | 'SUBSTITUTED' | 'INCONSISTENT';
  repairsPerformed: string[];
  recoveredConcepts: string[];
  remainingMissingConcepts: string[];
  unexpectedDominantConcepts: string[];
  headline: string;
  reason: string;
}

export interface NormalizedBuildResult {
  readOnly: true;
  contractVersion: typeof BUILD_RESULT_NORMALIZER_V1_CONTRACT;
  result: NormalizedBuildResultKind;
  stages: NormalizedBuildRealityStages;
  summary: NormalizedBuildPlainEnglishSummary;
  /** True when the live preview should be shown prominently (previewUrl exists and dev server is running). */
  showLivePreview: boolean;
  previewUrl: string | null;
  /** Phase 2: plain-English proof that the app is actually usable, when the proof has run. */
  livePreviewProof: NormalizedLivePreviewProofSummary | null;
  /** Phase 3: plain-English workspace materialization stabilizer outcome, when it has run. */
  workspaceMaterialization: NormalizedWorkspaceMaterializationSummary | null;
  /** Phase 4: plain-English build execution health, when the execution stabilizer has run. */
  buildExecution: NormalizedBuildExecutionSummary | null;
  /** Product Faithfulness Milestone 1: whether the generated app is the requested product, when evaluated. */
  productFaithfulness: NormalizedProductFaithfulnessSummary | null;
  /** Product Faithfulness Milestone 2: whether product identity survived generation, when evaluated. */
  generationFaithfulness: NormalizedGenerationFaithfulnessSummary | null;
}
