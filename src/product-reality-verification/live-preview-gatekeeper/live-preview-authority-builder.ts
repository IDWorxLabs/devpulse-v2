/**
 * Live Preview Gatekeeper — unified authority builder.
 */

import type {
  FounderVerificationSupportAnalysis,
  LivePreviewAuthority,
  LivePreviewInput,
  LivePreviewResult,
  PreviewContext,
  PreviewMisleadingRiskAnalysis,
  PreviewNextActionAnalysis,
  PreviewReportConnectionAnalysis,
  PreviewStateMeaningfulnessAnalysis,
  PreviewUnderstandabilityAnalysis,
  PreviewUnavailableHonestyAnalysis,
  PreviewVisibilityAnalysis,
  ProductReadinessPreviewAnalysis,
  ResponsivePreviewSupportAnalysis,
} from './live-preview-types.js';
import { resolveLivePreviewResult } from './live-preview-types.js';
import { getCachedLivePreviewAuthority, setCachedLivePreviewAuthority } from './live-preview-cache.js';

const ANALYZER_WEIGHT = 0.1;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildLivePreviewAuthority(
  requestId: string,
  context: PreviewContext,
  visibility: PreviewVisibilityAnalysis,
  understandability: PreviewUnderstandabilityAnalysis,
  meaningfulness: PreviewStateMeaningfulnessAnalysis,
  founder: FounderVerificationSupportAnalysis,
  responsive: ResponsivePreviewSupportAnalysis,
  unavailable: PreviewUnavailableHonestyAnalysis,
  misleading: PreviewMisleadingRiskAnalysis,
  nextAction: PreviewNextActionAnalysis,
  reportConnection: PreviewReportConnectionAnalysis,
  readiness: ProductReadinessPreviewAnalysis,
  input: LivePreviewInput,
): LivePreviewAuthority {
  const cacheKey = [
    requestId,
    context.contextType,
    visibility.previewVisibilityScore,
    understandability.previewUnderstandabilityScore,
    meaningfulness.previewMeaningfulnessScore,
    founder.founderVerificationSupportScore,
    responsive.responsivePreviewSupportScore,
    unavailable.previewUnavailableHonestyScore,
    misleading.misleadingRiskScore,
    nextAction.previewNextActionScore,
    reportConnection.previewReportConnectionScore,
    readiness.productReadinessPreviewScore,
  ].join('|');

  const cached = getCachedLivePreviewAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const overallScore = Math.round(
    visibility.previewVisibilityScore * ANALYZER_WEIGHT
      + understandability.previewUnderstandabilityScore * ANALYZER_WEIGHT
      + meaningfulness.previewMeaningfulnessScore * ANALYZER_WEIGHT
      + founder.founderVerificationSupportScore * ANALYZER_WEIGHT
      + responsive.responsivePreviewSupportScore * ANALYZER_WEIGHT
      + unavailable.previewUnavailableHonestyScore * ANALYZER_WEIGHT
      + misleading.misleadingRiskScore * ANALYZER_WEIGHT
      + nextAction.previewNextActionScore * ANALYZER_WEIGHT
      + reportConnection.previewReportConnectionScore * ANALYZER_WEIGHT
      + readiness.productReadinessPreviewScore * ANALYZER_WEIGHT,
  );

  const criticalFailures =
    (unavailable.previewUnavailableHidden ? 1 : 0)
    + (unavailable.previewFalseReady ? 1 : 0)
    + (founder.founderVerificationBlocked && context.contextType === 'FOUNDER_ACCEPTANCE_REVIEW' ? 1 : 0)
    + (visibility.previewEntryHidden ? 1 : 0);

  const warningCount =
    visibility.visibilityProblems.length
    + understandability.understandabilityProblems.length
    + meaningfulness.meaningfulnessProblems.length
    + founder.founderVerificationProblems.length
    + responsive.responsiveProblems.length
    + unavailable.unavailableHonestyProblems.length
    + misleading.misleadingProblems.length
    + nextAction.nextActionProblems.length
    + reportConnection.reportConnectionProblems.length
    + readiness.readinessProblems.length
    + context.likelyConfusionRisks.length;

  const livePreviewResult: LivePreviewResult = resolveLivePreviewResult(
    overallScore,
    criticalFailures,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (overallScore + unavailable.previewUnavailableHonestyScore + misleading.misleadingRiskScore) / 3,
  ));

  const authority: LivePreviewAuthority = {
    authorityId: `live-preview-authority-${authorityCounter}`,
    overallScore,
    previewVisibilityScore: visibility.previewVisibilityScore,
    previewUnderstandabilityScore: understandability.previewUnderstandabilityScore,
    previewMeaningfulnessScore: meaningfulness.previewMeaningfulnessScore,
    founderVerificationSupportScore: founder.founderVerificationSupportScore,
    responsivePreviewSupportScore: responsive.responsivePreviewSupportScore,
    previewUnavailableHonestyScore: unavailable.previewUnavailableHonestyScore,
    misleadingRiskScore: misleading.misleadingRiskScore,
    previewNextActionScore: nextAction.previewNextActionScore,
    previewReportConnectionScore: reportConnection.previewReportConnectionScore,
    productReadinessPreviewScore: readiness.productReadinessPreviewScore,
    livePreviewResult,
    confidence,
    createdAt: Date.now(),
  };

  setCachedLivePreviewAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetLivePreviewAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
