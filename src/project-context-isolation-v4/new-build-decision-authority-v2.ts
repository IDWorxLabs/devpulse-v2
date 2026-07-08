/**
 * New Build Decision Authority V2 — evidence-weighted refinement of the New Build Decision
 * Authority. Fixes false-positive AMBIGUOUS_REQUIRES_CONFIRMATION decisions for prompts that are
 * clearly complete, standalone new-application requests (e.g. a long, fully-specified "Build a
 * modern, production-quality [product] platform..." prompt that happens to also contain an
 * incidental feature bullet mentioning an everyday word like "update").
 *
 * V1 (new-build-decision-authority.ts) treated continuation language as a single binary
 * keyword-presence check: any one regex hit anywhere in the prompt set continuationSignals.length
 * > 0, which was enough (absent a known project) to force AMBIGUOUS_REQUIRES_CONFIRMATION — even
 * when the prompt was, overall, an overwhelming, complete new-build specification. V2 replaces
 * that binary check with independently-scored evidence for NEW_BUILD, CONTINUATION, and AMBIGUITY,
 * so a single incidental modification-verb mention deep inside a large feature spec can never, by
 * itself, outweigh the rest of the evidence.
 *
 * Deterministic, generic (no product-domain branching), pure function — same guarantee as V1.
 */

import type { BuildDecisionKind } from './project-context-isolation-types.js';
import {
  computeAmbiguityEvidence,
  computeContinuationEvidence,
  computeNewBuildEvidence,
  isIdentityCompatible,
  sumConfidence,
  CONTINUATION_MODERATE_THRESHOLD,
  CONTINUATION_STRONG_THRESHOLD,
  LOW_THRESHOLD,
  NEW_BUILD_MODERATE_THRESHOLD,
  NEW_BUILD_STRONG_THRESHOLD,
  type DecisionEvidenceItem,
} from './new-build-decision-score.js';

export interface NewBuildDecisionV2Input {
  rawPrompt: string;
  requestedProjectId?: string | null;
  requestedProjectName?: string | null;
  /** True when the caller already knows of an existing project this request might relate to. */
  hasKnownExistingProject: boolean;
  /** Short domain/identity summary of the currently-known project, if any (for compatibility check). */
  currentProjectIdentitySummary?: string | null;
}

export interface NewBuildDecisionV2Result {
  readOnly: true;
  decision: BuildDecisionKind;
  /** 0-1, derived from the winning score — never a hardcoded/magic constant unrelated to evidence. */
  confidence: number;
  newBuildScore: number;
  continuationScore: number;
  ambiguityScore: number;
  newBuildEvidence: DecisionEvidenceItem[];
  continuationEvidence: DecisionEvidenceItem[];
  ambiguityEvidence: DecisionEvidenceItem[];
  /** The evidence category that actually drove the decision. */
  winningEvidence: DecisionEvidenceItem[];
  /** Every other evidence item that was outweighed, blocked, or otherwise not decisive. */
  rejectedEvidence: DecisionEvidenceItem[];
  /** Human-readable explanation of why this decision (and not another) was reached. */
  explanation: string;
  /** User-facing clarification question, populated only for AMBIGUOUS_REQUIRES_CONFIRMATION. */
  message: string | null;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function classifyNewBuildDecisionV2(input: NewBuildDecisionV2Input): NewBuildDecisionV2Result {
  const rawPrompt = input.rawPrompt ?? '';

  const continuationEvidence = computeContinuationEvidence({
    rawPrompt,
    requestedProjectId: input.requestedProjectId,
    requestedProjectName: input.requestedProjectName,
  });
  const newBuildEvidence = computeNewBuildEvidence({
    rawPrompt,
    requestedProjectId: input.requestedProjectId,
    requestedProjectName: input.requestedProjectName,
    currentProjectIdentitySummary: input.currentProjectIdentitySummary,
    continuationEvidenceCount: continuationEvidence.length,
  });
  const newBuildScore = sumConfidence(newBuildEvidence);
  const continuationScore = sumConfidence(continuationEvidence);
  const ambiguityEvidence = computeAmbiguityEvidence({
    newBuildScore,
    continuationScore,
    hasKnownExistingProject: input.hasKnownExistingProject,
  });
  const ambiguityScore = sumConfidence(ambiguityEvidence);

  const identityHasSummary = Boolean(
    input.currentProjectIdentitySummary && input.currentProjectIdentitySummary.trim(),
  );
  const identityCompatible = isIdentityCompatible(rawPrompt, input.currentProjectIdentitySummary);

  let decision: BuildDecisionKind;
  let explanation: string;
  let message: string | null = null;
  let winningEvidence: DecisionEvidenceItem[];
  let rejectedEvidence: DecisionEvidenceItem[];

  const CONFIRM_MESSAGE_NO_PROJECT =
    'This looks like a request to continue or modify an existing project, but no project was specified or is currently active, and the prompt does not describe a full product on its own. Do you want to start a brand-new app from this description, or continue a specific existing project?';
  const CONFIRM_MESSAGE_BOTH_PLAUSIBLE =
    'Both a new build and a continuation of the current project are plausible readings of this prompt. Do you want to start a brand-new app from this description, or continue the existing project?';
  const CONFIRM_MESSAGE_TOO_VAGUE =
    'It is not clear whether this is a request to start a new app or continue an existing project. Please describe the app you want to build, or specify which existing project to continue.';

  if (identityHasSummary && !identityCompatible) {
    // Decisive: continuation-context compatibility (requirement — continuation requires BOTH
    // explicit continuation intent AND a compatible existing project) is the strongest possible
    // safety signal, and never depends on generic-word overlap (see isIdentityCompatible).
    decision = 'NEW_BUILD';
    winningEvidence = newBuildEvidence.filter((e) => e.id === 'FRESH_PRODUCT_IDENTITY');
    rejectedEvidence = [...continuationEvidence, ...ambiguityEvidence];
    explanation =
      "The current project's identity summary shares no meaningful (non-generic) vocabulary with this prompt, so continuation is unsafe regardless of any continuation-flavored wording elsewhere in the prompt — treated decisively as a new build.";
  } else if (continuationScore >= CONTINUATION_STRONG_THRESHOLD && continuationScore > newBuildScore) {
    if (input.hasKnownExistingProject) {
      decision = 'CONTINUE_EXISTING_PROJECT';
      winningEvidence = continuationEvidence;
      rejectedEvidence = [...newBuildEvidence, ...ambiguityEvidence];
      explanation = 'Continuation evidence is strong and clearly dominant, and a known existing project is available to continue.';
    } else if (newBuildScore >= NEW_BUILD_MODERATE_THRESHOLD) {
      decision = 'NEW_BUILD';
      winningEvidence = newBuildEvidence;
      rejectedEvidence = [...continuationEvidence, ...ambiguityEvidence];
      explanation =
        'Continuation language is present, but no existing project is known and the prompt carries enough standalone product content to safely default to a new build rather than blocking on a project that does not exist.';
    } else {
      decision = 'AMBIGUOUS_REQUIRES_CONFIRMATION';
      winningEvidence = ambiguityEvidence;
      rejectedEvidence = [...newBuildEvidence, ...continuationEvidence];
      message = CONFIRM_MESSAGE_NO_PROJECT;
      explanation =
        'Continuation language is present with no existing project to continue and insufficient standalone product content — both interpretations are genuinely unresolved.';
    }
  } else if (newBuildScore >= NEW_BUILD_STRONG_THRESHOLD) {
    decision = 'NEW_BUILD';
    winningEvidence = newBuildEvidence;
    rejectedEvidence = [...continuationEvidence, ...ambiguityEvidence];
    explanation =
      'New-build evidence is strong and clearly dominant, regardless of any incidental continuation-flavored wording elsewhere in the prompt.';
  } else if (continuationScore >= CONTINUATION_MODERATE_THRESHOLD && newBuildScore >= NEW_BUILD_MODERATE_THRESHOLD) {
    decision = 'AMBIGUOUS_REQUIRES_CONFIRMATION';
    winningEvidence = ambiguityEvidence;
    rejectedEvidence = [...newBuildEvidence, ...continuationEvidence];
    message = CONFIRM_MESSAGE_BOTH_PLAUSIBLE;
    explanation = 'New-build evidence and continuation evidence are both moderate and neither clearly dominates — genuinely ambiguous.';
  } else if (continuationScore >= CONTINUATION_MODERATE_THRESHOLD && continuationScore > newBuildScore) {
    if (input.hasKnownExistingProject) {
      decision = 'CONTINUE_EXISTING_PROJECT';
      winningEvidence = continuationEvidence;
      rejectedEvidence = [...newBuildEvidence, ...ambiguityEvidence];
      explanation = 'Continuation evidence moderately dominates and a known existing project is available to continue.';
    } else if (newBuildScore >= LOW_THRESHOLD) {
      decision = 'NEW_BUILD';
      winningEvidence = newBuildEvidence;
      rejectedEvidence = [...continuationEvidence, ...ambiguityEvidence];
      explanation = 'Continuation language is present but no existing project is known; defaulting to a new build rather than blocking on a project that does not exist.';
    } else {
      decision = 'AMBIGUOUS_REQUIRES_CONFIRMATION';
      winningEvidence = ambiguityEvidence;
      rejectedEvidence = [...newBuildEvidence, ...continuationEvidence];
      message = CONFIRM_MESSAGE_NO_PROJECT;
      explanation = 'Continuation language is present with no existing project and negligible standalone product content.';
    }
  } else if (newBuildScore < LOW_THRESHOLD && continuationScore < LOW_THRESHOLD) {
    decision = 'AMBIGUOUS_REQUIRES_CONFIRMATION';
    winningEvidence = ambiguityEvidence;
    rejectedEvidence = [...newBuildEvidence, ...continuationEvidence];
    message = CONFIRM_MESSAGE_TOO_VAGUE;
    explanation = 'Neither new-build nor continuation evidence reaches even a low confidence bar — the prompt is too vague to classify safely.';
  } else {
    decision = 'NEW_BUILD';
    winningEvidence = newBuildEvidence;
    rejectedEvidence = [...continuationEvidence, ...ambiguityEvidence];
    explanation = 'No dominant continuation intent was found; proceeding as a new build rather than requiring unnecessary confirmation.';
  }

  const confidence =
    decision === 'NEW_BUILD'
      ? clamp01(Math.max(newBuildScore, 0.5))
      : decision === 'CONTINUE_EXISTING_PROJECT'
        ? clamp01(Math.max(continuationScore, 0.5))
        : clamp01(Math.max(ambiguityScore, 0.4));

  return {
    readOnly: true,
    decision,
    confidence,
    newBuildScore,
    continuationScore,
    ambiguityScore,
    newBuildEvidence,
    continuationEvidence,
    ambiguityEvidence,
    winningEvidence,
    rejectedEvidence,
    explanation,
    message,
  };
}
