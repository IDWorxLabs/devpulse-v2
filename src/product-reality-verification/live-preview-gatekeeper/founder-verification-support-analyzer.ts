/**
 * Live Preview Gatekeeper — founder verification support analyzer.
 */

import type { FounderVerificationSupportAnalysis, LivePreviewInput, PreviewContext } from './live-preview-types.js';
import { FOUNDER_VERIFICATION_SUPPORT_PASS, clampScore } from './live-preview-types.js';
import { getCachedFounderVerificationSupport, setCachedFounderVerificationSupport } from './live-preview-cache.js';

export interface FounderVerificationSupportSnapshot {
  founderPreviewCategoryPresent: boolean;
  previewReportPresent: boolean;
  desktopRecommendationPresent: boolean;
  previewComparisonSupportPresent: boolean;
}

let founderVerificationAnalysisCount = 0;

export function analyzeFounderVerificationSupport(
  input: LivePreviewInput,
  context: PreviewContext,
  snapshot: FounderVerificationSupportSnapshot,
): FounderVerificationSupportAnalysis {
  const cacheKey = [input.founderPreviewValueWeak, input.founderVerificationBlocked, input.founderNextStepFromPreviewUnclear, context.contextType].join('|');
  const cached = getCachedFounderVerificationSupport(cacheKey);
  if (cached) return cached;

  founderVerificationAnalysisCount += 1;
  const founderVerificationProblems: string[] = [];
  let penalty = 0;

  const founderPreviewValueWeak = input.founderPreviewValueWeak === true;
  const founderVerificationBlocked = input.founderVerificationBlocked === true;
  const founderNextStepFromPreviewUnclear = input.founderNextStepFromPreviewUnclear === true;

  if (founderPreviewValueWeak) { founderVerificationProblems.push('FOUNDER_PREVIEW_VALUE_WEAK'); penalty += 22; }
  if (founderVerificationBlocked) { founderVerificationProblems.push('FOUNDER_VERIFICATION_BLOCKED'); penalty += 24; }
  if (founderNextStepFromPreviewUnclear) { founderVerificationProblems.push('FOUNDER_NEXT_STEP_FROM_PREVIEW_UNCLEAR'); penalty += 20; }

  const bonus =
    (snapshot.founderPreviewCategoryPresent ? 14 : 0)
    + (snapshot.previewReportPresent ? 12 : 0)
    + (snapshot.desktopRecommendationPresent ? 10 : 0)
    + (snapshot.previewComparisonSupportPresent ? 10 : 0);

  const founderVerificationSupportScore = clampScore(76 + bonus - penalty);

  const result: FounderVerificationSupportAnalysis = {
    founderVerificationSupportScore,
    founderPreviewValueWeak,
    founderVerificationBlocked,
    founderNextStepFromPreviewUnclear,
    founderVerificationProblems,
    passToken: FOUNDER_VERIFICATION_SUPPORT_PASS,
  };
  setCachedFounderVerificationSupport(cacheKey, result);
  return result;
}

export function getFounderVerificationAnalysisCount(): number {
  return founderVerificationAnalysisCount;
}

export function resetFounderVerificationSupportAnalyzerForTests(): void {
  founderVerificationAnalysisCount = 0;
}
