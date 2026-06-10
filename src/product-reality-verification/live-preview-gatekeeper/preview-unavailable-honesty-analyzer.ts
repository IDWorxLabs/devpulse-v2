/**
 * Live Preview Gatekeeper — preview unavailable honesty analyzer.
 */

import type { LivePreviewInput, PreviewContext, PreviewUnavailableHonestyAnalysis } from './live-preview-types.js';
import { PREVIEW_UNAVAILABLE_HONESTY_PASS, clampScore } from './live-preview-types.js';
import { getCachedPreviewUnavailableHonesty, setCachedPreviewUnavailableHonesty } from './live-preview-cache.js';

export interface PreviewUnavailableHonestySnapshot {
  previewFailureContextPresent: boolean;
  previewBlockedReasonPresent: boolean;
  buildPreviewFailureContextPresent: boolean;
  previewBlockedStatePresent: boolean;
}

let unavailableHonestyAnalysisCount = 0;

export function analyzePreviewUnavailableHonesty(
  input: LivePreviewInput,
  context: PreviewContext,
  snapshot: PreviewUnavailableHonestySnapshot,
): PreviewUnavailableHonestyAnalysis {
  const cacheKey = [input.previewUnavailableHidden, input.previewFalseReady, input.previewFailureReasonMissing, context.contextType].join('|');
  const cached = getCachedPreviewUnavailableHonesty(cacheKey);
  if (cached) return cached;

  unavailableHonestyAnalysisCount += 1;
  const unavailableHonestyProblems: string[] = [];
  let penalty = 0;

  const previewUnavailableHidden = input.previewUnavailableHidden === true;
  const previewFalseReady = input.previewFalseReady === true;
  const previewFailureReasonMissing = input.previewFailureReasonMissing === true;

  if (previewUnavailableHidden) { unavailableHonestyProblems.push('PREVIEW_UNAVAILABLE_HIDDEN'); penalty += 26; }
  if (previewFalseReady) { unavailableHonestyProblems.push('PREVIEW_FALSE_READY'); penalty += 24; }
  if (previewFailureReasonMissing) { unavailableHonestyProblems.push('PREVIEW_FAILURE_REASON_MISSING'); penalty += 20; }

  const bonus =
    (snapshot.previewFailureContextPresent ? 14 : 0)
    + (snapshot.previewBlockedReasonPresent ? 12 : 0)
    + (snapshot.buildPreviewFailureContextPresent ? 12 : 0)
    + (snapshot.previewBlockedStatePresent ? 10 : 0);

  const previewUnavailableHonestyScore = clampScore(78 + bonus - penalty);

  const result: PreviewUnavailableHonestyAnalysis = {
    previewUnavailableHonestyScore,
    previewUnavailableHidden,
    previewFalseReady,
    previewFailureReasonMissing,
    unavailableHonestyProblems,
    passToken: PREVIEW_UNAVAILABLE_HONESTY_PASS,
  };
  setCachedPreviewUnavailableHonesty(cacheKey, result);
  return result;
}

export function getUnavailableHonestyAnalysisCount(): number {
  return unavailableHonestyAnalysisCount;
}

export function resetPreviewUnavailableHonestyAnalyzerForTests(): void {
  unavailableHonestyAnalysisCount = 0;
}
