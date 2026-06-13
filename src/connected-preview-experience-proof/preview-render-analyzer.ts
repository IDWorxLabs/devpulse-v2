/**
 * Preview Render Analyzer — verify application rendered in preview.
 */

import type {
  PreviewRenderAssessment,
  PreviewRenderState,
  PreviewSessionEvidence,
  PreviewUrlAssessment,
} from './connected-preview-experience-proof-types.js';

export function analyzePreviewRender(input: {
  url: PreviewUrlAssessment;
  sessionEvidence?: PreviewSessionEvidence;
}): PreviewRenderAssessment {
  const injected = input.sessionEvidence;
  const renderEvidence: string[] = [];

  if (injected?.htmlResponse) renderEvidence.push('HTML response observed');
  if (injected?.domSnapshot) renderEvidence.push('DOM snapshot captured');
  if (injected?.renderCapturePath) renderEvidence.push(`Render capture: ${injected.renderCapturePath}`);
  if (injected?.applicationTitle) renderEvidence.push(`Application title: ${injected.applicationTitle}`);
  if (injected?.applicationRoot) renderEvidence.push(`Application root: ${injected.applicationRoot}`);

  const hasRenderSignal =
    renderEvidence.length > 0 ||
    Boolean(injected?.applicationTitle) ||
    Boolean(injected?.domSnapshot) ||
    injected?.htmlResponse === true;

  if (!hasRenderSignal) {
    return {
      readOnly: true,
      renderState: 'NOT_RENDERED',
      renderObserved: false,
      applicationRendered: false,
      renderEvidence: [],
      applicationTitle: null,
      applicationRoot: null,
      confidence: 0,
    };
  }

  const fullRender =
    (injected?.htmlResponse || injected?.domSnapshot) &&
    (injected?.applicationTitle || injected?.applicationRoot);

  let renderState: PreviewRenderState = 'PARTIAL';
  if (fullRender || (injected?.htmlResponse && injected?.applicationRoot)) {
    renderState = 'RENDERED';
  }

  return {
    readOnly: true,
    renderState,
    renderObserved: true,
    applicationRendered: renderState === 'RENDERED',
    renderEvidence,
    applicationTitle: injected?.applicationTitle ?? null,
    applicationRoot: injected?.applicationRoot ?? null,
    confidence: renderState === 'RENDERED' ? 90 : 65,
  };
}

export function isApplicationRendered(assessment: PreviewRenderAssessment): boolean {
  return assessment.applicationRendered && assessment.renderState === 'RENDERED';
}
