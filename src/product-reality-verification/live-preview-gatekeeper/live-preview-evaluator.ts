/**
 * Live Preview Gatekeeper — final evaluation.
 */

import type { LivePreviewAuthority, LivePreviewEvaluation } from './live-preview-types.js';
import { getCachedLivePreviewEvaluation, setCachedLivePreviewEvaluation } from './live-preview-cache.js';

let evaluationCount = 0;

const READINESS_VERDICT: Record<LivePreviewEvaluation['livePreviewResult'], string> = {
  PASS: 'Live preview is useful, visible, and honest for founder verification',
  PASS_WITH_WARNINGS: 'Live preview usable with noted visibility, honesty, or readiness gaps',
  FAIL: 'Live preview not safe for founder verification without priority fixes',
};

export function evaluateLivePreview(authority: LivePreviewAuthority): LivePreviewEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.overallScore,
    authority.livePreviewResult,
  ].join('|');

  const cached = getCachedLivePreviewEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: LivePreviewEvaluation = {
    overallScore: authority.overallScore,
    livePreviewResult: authority.livePreviewResult,
    confidence: authority.confidence,
    readinessVerdict: READINESS_VERDICT[authority.livePreviewResult],
    previewVisibilityScore: authority.previewVisibilityScore,
    previewUnderstandabilityScore: authority.previewUnderstandabilityScore,
    previewMeaningfulnessScore: authority.previewMeaningfulnessScore,
    founderVerificationSupportScore: authority.founderVerificationSupportScore,
    responsivePreviewSupportScore: authority.responsivePreviewSupportScore,
    previewUnavailableHonestyScore: authority.previewUnavailableHonestyScore,
    misleadingRiskScore: authority.misleadingRiskScore,
    previewNextActionScore: authority.previewNextActionScore,
    previewReportConnectionScore: authority.previewReportConnectionScore,
    productReadinessPreviewScore: authority.productReadinessPreviewScore,
  };

  setCachedLivePreviewEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetLivePreviewEvaluationForTests(): void {
  evaluationCount = 0;
}
