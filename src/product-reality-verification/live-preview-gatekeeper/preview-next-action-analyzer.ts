/**
 * Live Preview Gatekeeper — preview next action analyzer.
 */

import type { LivePreviewInput, PreviewContext, PreviewNextActionAnalysis } from './live-preview-types.js';
import { PREVIEW_NEXT_ACTION_PASS, clampScore } from './live-preview-types.js';
import { getCachedPreviewNextAction, setCachedPreviewNextAction } from './live-preview-cache.js';

export interface PreviewNextActionSnapshot {
  previewNextStepPresent: boolean;
  uvlConnectionPresent: boolean;
  previewReportCopyPresent: boolean;
  previewFixPathPresent: boolean;
}

let previewNextActionAnalysisCount = 0;

export function analyzePreviewNextAction(
  input: LivePreviewInput,
  context: PreviewContext,
  snapshot: PreviewNextActionSnapshot,
): PreviewNextActionAnalysis {
  const cacheKey = [input.previewNextActionMissing, input.previewToVerificationGap, input.previewToFixGap, context.contextType].join('|');
  const cached = getCachedPreviewNextAction(cacheKey);
  if (cached) return cached;

  previewNextActionAnalysisCount += 1;
  const nextActionProblems: string[] = [];
  let penalty = 0;

  const previewNextActionMissing = input.previewNextActionMissing === true;
  const previewToVerificationGap = input.previewToVerificationGap === true;
  const previewToFixGap = input.previewToFixGap === true;

  if (previewNextActionMissing) { nextActionProblems.push('PREVIEW_NEXT_ACTION_MISSING'); penalty += 22; }
  if (previewToVerificationGap) { nextActionProblems.push('PREVIEW_TO_VERIFICATION_GAP'); penalty += 20; }
  if (previewToFixGap) { nextActionProblems.push('PREVIEW_TO_FIX_GAP'); penalty += 18; }

  const bonus =
    (snapshot.previewNextStepPresent ? 12 : 0)
    + (snapshot.uvlConnectionPresent ? 14 : 0)
    + (snapshot.previewReportCopyPresent ? 10 : 0)
    + (snapshot.previewFixPathPresent ? 10 : 0);

  const previewNextActionScore = clampScore(76 + bonus - penalty);

  const result: PreviewNextActionAnalysis = {
    previewNextActionScore,
    previewNextActionMissing,
    previewToVerificationGap,
    previewToFixGap,
    nextActionProblems,
    passToken: PREVIEW_NEXT_ACTION_PASS,
  };
  setCachedPreviewNextAction(cacheKey, result);
  return result;
}

export function getPreviewNextActionAnalysisCount(): number {
  return previewNextActionAnalysisCount;
}

export function resetPreviewNextActionAnalyzerForTests(): void {
  previewNextActionAnalysisCount = 0;
}
