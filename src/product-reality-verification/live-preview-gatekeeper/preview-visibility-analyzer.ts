/**
 * Live Preview Gatekeeper — preview visibility analyzer.
 */

import type { LivePreviewInput, PreviewContext, PreviewVisibilityAnalysis } from './live-preview-types.js';
import { PREVIEW_VISIBILITY_PASS, clampScore } from './live-preview-types.js';
import { getCachedPreviewVisibility, setCachedPreviewVisibility } from './live-preview-cache.js';

export interface PreviewVisibilitySnapshot {
  livePreviewRuntimePresent: boolean;
  previewSessionManagerPresent: boolean;
  previewBlockedStatePresent: boolean;
  mobilePreviewRuntimePresent: boolean;
  previewTargetRegistryPresent: boolean;
}

let previewVisibilityAnalysisCount = 0;

export function analyzePreviewVisibility(
  input: LivePreviewInput,
  context: PreviewContext,
  snapshot: PreviewVisibilitySnapshot,
): PreviewVisibilityAnalysis {
  const cacheKey = [input.previewEntryHidden, input.previewStateHidden, input.previewResultHidden, context.contextType].join('|');
  const cached = getCachedPreviewVisibility(cacheKey);
  if (cached) return cached;

  previewVisibilityAnalysisCount += 1;
  const visibilityProblems: string[] = [];
  let penalty = 0;

  const previewEntryHidden = input.previewEntryHidden === true;
  const previewStateHidden = input.previewStateHidden === true;
  const previewResultHidden = input.previewResultHidden === true;

  if (previewEntryHidden) { visibilityProblems.push('PREVIEW_ENTRY_HIDDEN'); penalty += 24; }
  if (previewStateHidden) { visibilityProblems.push('PREVIEW_STATE_HIDDEN'); penalty += 22; }
  if (previewResultHidden) { visibilityProblems.push('PREVIEW_RESULT_HIDDEN'); penalty += 20; }

  const bonus =
    (snapshot.livePreviewRuntimePresent ? 14 : 0)
    + (snapshot.previewSessionManagerPresent ? 12 : 0)
    + (snapshot.previewBlockedStatePresent ? 10 : 0)
    + (snapshot.mobilePreviewRuntimePresent ? 10 : 0)
    + (snapshot.previewTargetRegistryPresent ? 8 : 0);

  const previewVisibilityScore = clampScore(78 + bonus - penalty);

  const result: PreviewVisibilityAnalysis = {
    previewVisibilityScore,
    previewEntryHidden,
    previewStateHidden,
    previewResultHidden,
    visibilityProblems,
    passToken: PREVIEW_VISIBILITY_PASS,
  };
  setCachedPreviewVisibility(cacheKey, result);
  return result;
}

export function getPreviewVisibilityAnalysisCount(): number {
  return previewVisibilityAnalysisCount;
}

export function resetPreviewVisibilityAnalyzerForTests(): void {
  previewVisibilityAnalysisCount = 0;
}
