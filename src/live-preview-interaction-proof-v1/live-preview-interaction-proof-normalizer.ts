/**
 * Live Preview Interaction Proof V1 — normalizer.
 *
 * Pure decision logic: turns raw evidence (page load, console errors, root UI, primary feature
 * text, interaction attempts) into exactly one PreviewInteractionProofResultKind. No Playwright
 * calls here — fully unit-testable with synthetic evidence.
 */

import type {
  InteractionAttemptRecord,
  LivePreviewInteractionProofEvidence,
  PreviewInteractionProofResultKind,
} from './live-preview-interaction-proof-types.js';

export function classifyInteractionProof(
  evidence: LivePreviewInteractionProofEvidence,
): PreviewInteractionProofResultKind {
  if (evidence.blockedReason) return 'PREVIEW_INTERACTION_BLOCKED';
  if (!evidence.pageLoaded) return 'PREVIEW_INTERACTION_FAIL';
  if (evidence.fatalConsoleErrorDetected) return 'PREVIEW_INTERACTION_FAIL';
  if (!evidence.rootUiFound) return 'PREVIEW_INTERACTION_FAIL';

  const attempted = evidence.interactionAttempts.filter((a) => a.elementFound);
  const succeeded = evidence.interactionAttempts.filter((a) => a.performed && a.stateChanged);

  if (attempted.length === 0) {
    // Root UI exists, but nothing generically interactive could even be found to test.
    return evidence.primaryFeatureTextFound ? 'PREVIEW_INTERACTION_PARTIAL' : 'PREVIEW_INTERACTION_FAIL';
  }

  if (succeeded.length > 0) return 'PREVIEW_INTERACTION_PASS';

  // Interactive elements existed and were attempted, but none demonstrably changed state.
  return 'PREVIEW_INTERACTION_PARTIAL';
}

export function pickSucceededInteraction(
  attempts: InteractionAttemptRecord[],
): InteractionAttemptRecord | null {
  return attempts.find((a) => a.performed && a.stateChanged) ?? null;
}

export function pickAttemptedButUnchangedInteraction(
  attempts: InteractionAttemptRecord[],
): InteractionAttemptRecord | null {
  return attempts.find((a) => a.performed && !a.stateChanged) ?? null;
}
