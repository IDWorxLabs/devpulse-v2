/**
 * Live Preview Gatekeeper — product readiness preview analyzer.
 */

import type { LivePreviewInput, PreviewContext, ProductReadinessPreviewAnalysis } from './live-preview-types.js';
import { PRODUCT_READINESS_PREVIEW_PASS, clampScore } from './live-preview-types.js';
import { getCachedProductReadinessPreview, setCachedProductReadinessPreview } from './live-preview-cache.js';

export interface ProductReadinessPreviewSnapshot {
  launchSignalPresent: boolean;
  readinessGatesPresent: boolean;
  previewRuntimeValidatorPresent: boolean;
  mobileDesktopGapSignalsPresent: boolean;
}

let productReadinessAnalysisCount = 0;

export function analyzeProductReadinessPreview(
  input: LivePreviewInput,
  context: PreviewContext,
  snapshot: ProductReadinessPreviewSnapshot,
): ProductReadinessPreviewAnalysis {
  const cacheKey = [input.previewReadinessWeak, input.previewLaunchSignalMissing, context.contextType].join('|');
  const cached = getCachedProductReadinessPreview(cacheKey);
  if (cached) return cached;

  productReadinessAnalysisCount += 1;
  const readinessProblems: string[] = [];
  let penalty = 0;

  const previewReadinessWeak = input.previewReadinessWeak === true;
  const previewLaunchSignalMissing = input.previewLaunchSignalMissing === true;

  if (previewReadinessWeak) { readinessProblems.push('PREVIEW_READINESS_WEAK'); penalty += 22; }
  if (previewLaunchSignalMissing) { readinessProblems.push('PREVIEW_LAUNCH_SIGNAL_MISSING'); penalty += 20; }

  const bonus =
    (snapshot.launchSignalPresent ? 12 : 0)
    + (snapshot.readinessGatesPresent ? 14 : 0)
    + (snapshot.previewRuntimeValidatorPresent ? 12 : 0)
    + (snapshot.mobileDesktopGapSignalsPresent ? 10 : 0);

  const productReadinessPreviewScore = clampScore(74 + bonus - penalty);

  const result: ProductReadinessPreviewAnalysis = {
    productReadinessPreviewScore,
    previewReadinessWeak,
    previewLaunchSignalMissing,
    readinessProblems,
    passToken: PRODUCT_READINESS_PREVIEW_PASS,
  };
  setCachedProductReadinessPreview(cacheKey, result);
  return result;
}

export function getProductReadinessAnalysisCount(): number {
  return productReadinessAnalysisCount;
}

export function resetProductReadinessPreviewAnalyzerForTests(): void {
  productReadinessAnalysisCount = 0;
}
