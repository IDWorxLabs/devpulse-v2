/**
 * Live Preview Gatekeeper — responsive preview support analyzer.
 */

import type { LivePreviewInput, PreviewContext, ResponsivePreviewSupportAnalysis } from './live-preview-types.js';
import { RESPONSIVE_PREVIEW_SUPPORT_PASS, clampScore } from './live-preview-types.js';
import { getCachedResponsivePreviewSupport, setCachedResponsivePreviewSupport } from './live-preview-cache.js';

export interface ResponsivePreviewSupportSnapshot {
  mobilePreviewBlockedReasonPresent: boolean;
  viewportPolicyPresent: boolean;
  desktopRequiredPresent: boolean;
  mobilePreviewRuntimePresent: boolean;
}

let responsivePreviewAnalysisCount = 0;

export function analyzeResponsivePreviewSupport(
  input: LivePreviewInput,
  context: PreviewContext,
  snapshot: ResponsivePreviewSupportSnapshot,
): ResponsivePreviewSupportAnalysis {
  const cacheKey = [input.responsivePreviewWeak, input.mobilePreviewUnusable, input.viewportSwitchingUnclear, context.contextType].join('|');
  const cached = getCachedResponsivePreviewSupport(cacheKey);
  if (cached) return cached;

  responsivePreviewAnalysisCount += 1;
  const responsiveProblems: string[] = [];
  let penalty = 0;

  const responsivePreviewWeak = input.responsivePreviewWeak === true;
  const mobilePreviewUnusable = input.mobilePreviewUnusable === true;
  const viewportSwitchingUnclear = input.viewportSwitchingUnclear === true;

  if (responsivePreviewWeak) { responsiveProblems.push('RESPONSIVE_PREVIEW_WEAK'); penalty += 20; }
  if (mobilePreviewUnusable) { responsiveProblems.push('MOBILE_PREVIEW_UNUSABLE'); penalty += 22; }
  if (viewportSwitchingUnclear) { responsiveProblems.push('VIEWPORT_SWITCHING_UNCLEAR'); penalty += 18; }

  const bonus =
    (snapshot.mobilePreviewBlockedReasonPresent ? 12 : 0)
    + (snapshot.viewportPolicyPresent ? 12 : 0)
    + (snapshot.desktopRequiredPresent ? 10 : 0)
    + (snapshot.mobilePreviewRuntimePresent ? 14 : 0);

  const responsivePreviewSupportScore = clampScore(74 + bonus - penalty);

  const result: ResponsivePreviewSupportAnalysis = {
    responsivePreviewSupportScore,
    responsivePreviewWeak,
    mobilePreviewUnusable,
    viewportSwitchingUnclear,
    responsiveProblems,
    passToken: RESPONSIVE_PREVIEW_SUPPORT_PASS,
  };
  setCachedResponsivePreviewSupport(cacheKey, result);
  return result;
}

export function getResponsivePreviewAnalysisCount(): number {
  return responsivePreviewAnalysisCount;
}

export function resetResponsivePreviewSupportAnalyzerForTests(): void {
  responsivePreviewAnalysisCount = 0;
}
