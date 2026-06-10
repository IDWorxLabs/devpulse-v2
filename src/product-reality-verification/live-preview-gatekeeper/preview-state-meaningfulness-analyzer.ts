/**
 * Live Preview Gatekeeper — preview state meaningfulness analyzer.
 */

import type { LivePreviewInput, PreviewContext, PreviewStateMeaningfulnessAnalysis } from './live-preview-types.js';
import { PREVIEW_STATE_MEANINGFULNESS_PASS, clampScore } from './live-preview-types.js';
import { getCachedPreviewMeaningfulness, setCachedPreviewMeaningfulness } from './live-preview-cache.js';

export interface PreviewStateMeaningfulnessSnapshot {
  previewTargetRegistryPresent: boolean;
  previewUrlSupportPresent: boolean;
  liveViewCapabilityPresent: boolean;
  previewSessionSupportPresent: boolean;
}

let previewMeaningfulnessAnalysisCount = 0;

export function analyzePreviewStateMeaningfulness(
  input: LivePreviewInput,
  context: PreviewContext,
  snapshot: PreviewStateMeaningfulnessSnapshot,
): PreviewStateMeaningfulnessAnalysis {
  const cacheKey = [input.previewNotMeaningful, input.previewPlaceholderRisk, input.previewNotRepresentative, context.contextType].join('|');
  const cached = getCachedPreviewMeaningfulness(cacheKey);
  if (cached) return cached;

  previewMeaningfulnessAnalysisCount += 1;
  const meaningfulnessProblems: string[] = [];
  let penalty = 0;

  const previewNotMeaningful = input.previewNotMeaningful === true;
  const previewPlaceholderRisk = input.previewPlaceholderRisk === true;
  const previewNotRepresentative = input.previewNotRepresentative === true;

  if (previewNotMeaningful) { meaningfulnessProblems.push('PREVIEW_NOT_MEANINGFUL'); penalty += 24; }
  if (previewPlaceholderRisk) { meaningfulnessProblems.push('PREVIEW_PLACEHOLDER_RISK'); penalty += 22; }
  if (previewNotRepresentative) { meaningfulnessProblems.push('PREVIEW_NOT_REPRESENTATIVE'); penalty += 20; }

  const bonus =
    (snapshot.previewTargetRegistryPresent ? 14 : 0)
    + (snapshot.previewUrlSupportPresent ? 12 : 0)
    + (snapshot.liveViewCapabilityPresent ? 12 : 0)
    + (snapshot.previewSessionSupportPresent ? 10 : 0);

  const previewMeaningfulnessScore = clampScore(74 + bonus - penalty);

  const result: PreviewStateMeaningfulnessAnalysis = {
    previewMeaningfulnessScore,
    previewNotMeaningful,
    previewPlaceholderRisk,
    previewNotRepresentative,
    meaningfulnessProblems,
    passToken: PREVIEW_STATE_MEANINGFULNESS_PASS,
  };
  setCachedPreviewMeaningfulness(cacheKey, result);
  return result;
}

export function getPreviewMeaningfulnessAnalysisCount(): number {
  return previewMeaningfulnessAnalysisCount;
}

export function resetPreviewStateMeaningfulnessAnalyzerForTests(): void {
  previewMeaningfulnessAnalysisCount = 0;
}
