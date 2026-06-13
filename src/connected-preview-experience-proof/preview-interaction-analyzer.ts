/**
 * Preview Interaction Analyzer — verify founder can interact with preview.
 */

import type {
  PreviewInteractionAssessment,
  PreviewInteractionState,
  PreviewRenderAssessment,
  PreviewSessionEvidence,
} from './connected-preview-experience-proof-types.js';

export function analyzePreviewInteraction(input: {
  render: PreviewRenderAssessment;
  sessionEvidence?: PreviewSessionEvidence;
}): PreviewInteractionAssessment {
  const injected = input.sessionEvidence;
  const interactiveElements = injected?.interactiveElements ?? [];
  const interactionEvidence = injected?.interactionEvidence ?? [];

  if (interactiveElements.length === 0 && interactionEvidence.length === 0) {
    return {
      readOnly: true,
      interactionState: 'NOT_INTERACTIVE',
      interactionObserved: false,
      interactiveElements: [],
      interactionEvidence: [],
      confidence: 0,
    };
  }

  const hasInteractionProof =
    interactionEvidence.length > 0 &&
    interactiveElements.length > 0;

  let interactionState: PreviewInteractionState = 'PARTIAL';
  if (hasInteractionProof) interactionState = 'INTERACTIVE';

  return {
    readOnly: true,
    interactionState,
    interactionObserved: true,
    interactiveElements,
    interactionEvidence,
    confidence: interactionState === 'INTERACTIVE' ? 90 : 60,
  };
}

export function isPreviewInteractive(assessment: PreviewInteractionAssessment): boolean {
  return assessment.interactionState === 'INTERACTIVE' && assessment.interactionObserved;
}
