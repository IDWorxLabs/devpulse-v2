/**
 * Live Preview Gatekeeper — preview understandability analyzer.
 */

import type { LivePreviewInput, PreviewContext, PreviewUnderstandabilityAnalysis } from './live-preview-types.js';
import { PREVIEW_UNDERSTANDABILITY_PASS, clampScore } from './live-preview-types.js';
import { getCachedPreviewUnderstandability, setCachedPreviewUnderstandability } from './live-preview-cache.js';

export interface PreviewUnderstandabilitySnapshot {
  previewStateLabelsPresent: boolean;
  previewLimitationCopyPresent: boolean;
  previewBlockedReasonPresent: boolean;
  previewCapabilityLabelsPresent: boolean;
}

let previewUnderstandabilityAnalysisCount = 0;

export function analyzePreviewUnderstandability(
  input: LivePreviewInput,
  context: PreviewContext,
  snapshot: PreviewUnderstandabilitySnapshot,
): PreviewUnderstandabilityAnalysis {
  const cacheKey = [input.previewContextUnclear, input.previewLimitationUnclear, input.previewFreshnessUnclear, context.contextType].join('|');
  const cached = getCachedPreviewUnderstandability(cacheKey);
  if (cached) return cached;

  previewUnderstandabilityAnalysisCount += 1;
  const understandabilityProblems: string[] = [];
  let penalty = 0;

  const previewContextUnclear = input.previewContextUnclear === true;
  const previewLimitationUnclear = input.previewLimitationUnclear === true;
  const previewFreshnessUnclear = input.previewFreshnessUnclear === true;

  if (previewContextUnclear) { understandabilityProblems.push('PREVIEW_CONTEXT_UNCLEAR'); penalty += 22; }
  if (previewLimitationUnclear) { understandabilityProblems.push('PREVIEW_LIMITATION_UNCLEAR'); penalty += 20; }
  if (previewFreshnessUnclear) { understandabilityProblems.push('PREVIEW_FRESHNESS_UNCLEAR'); penalty += 18; }

  const bonus =
    (snapshot.previewStateLabelsPresent ? 14 : 0)
    + (snapshot.previewLimitationCopyPresent ? 12 : 0)
    + (snapshot.previewBlockedReasonPresent ? 10 : 0)
    + (snapshot.previewCapabilityLabelsPresent ? 8 : 0);

  const previewUnderstandabilityScore = clampScore(76 + bonus - penalty);

  const result: PreviewUnderstandabilityAnalysis = {
    previewUnderstandabilityScore,
    previewContextUnclear,
    previewLimitationUnclear,
    previewFreshnessUnclear,
    understandabilityProblems,
    passToken: PREVIEW_UNDERSTANDABILITY_PASS,
  };
  setCachedPreviewUnderstandability(cacheKey, result);
  return result;
}

export function getPreviewUnderstandabilityAnalysisCount(): number {
  return previewUnderstandabilityAnalysisCount;
}

export function resetPreviewUnderstandabilityAnalyzerForTests(): void {
  previewUnderstandabilityAnalysisCount = 0;
}
