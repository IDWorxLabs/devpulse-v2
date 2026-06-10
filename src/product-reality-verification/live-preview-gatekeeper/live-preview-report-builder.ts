/**
 * Live Preview Gatekeeper — report builder.
 */

import type {
  FounderVerificationSupportAnalysis,
  LivePreviewEvaluation,
  LivePreviewRecord,
  LivePreviewReport,
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
import { LIVE_PREVIEW_REPORTING_PASS } from './live-preview-types.js';
import { getLivePreviewCacheStats } from './live-preview-cache.js';
import { getLivePreviewHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateLivePreviewReport(
  record: LivePreviewRecord,
  evaluation: LivePreviewEvaluation,
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
): LivePreviewReport {
  reportCount += 1;
  const cache = getLivePreviewCacheStats();

  const previewContextRisks = [
    ...context.likelyConfusionRisks,
    ...visibility.visibilityProblems,
    ...understandability.understandabilityProblems,
    ...nextAction.nextActionProblems,
  ];

  const founderPreviewRisks: string[] = [];
  if (founder.founderPreviewValueWeak) founderPreviewRisks.push('Founder preview value weak for verification');
  if (founder.founderVerificationBlocked) founderPreviewRisks.push('Founder verification blocked by preview state');
  if (founder.founderNextStepFromPreviewUnclear) founderPreviewRisks.push('Founder next step from preview unclear');
  if (context.contextType === 'FOUNDER_ACCEPTANCE_REVIEW') {
    founderPreviewRisks.push(`Founder intent: ${context.previewIntent}`);
  }

  const responsivePreviewRisks: string[] = [];
  if (responsive.responsivePreviewWeak) responsivePreviewRisks.push('Responsive preview support weak');
  if (responsive.mobilePreviewUnusable) responsivePreviewRisks.push('Mobile preview unusable for verification');
  if (responsive.viewportSwitchingUnclear) responsivePreviewRisks.push('Viewport switching unclear');

  const misleadingPreviewRisks: string[] = [];
  if (misleading.previewStaleRisk) misleadingPreviewRisks.push('Preview may show stale content');
  if (misleading.previewFalseConfidence) misleadingPreviewRisks.push('Preview creates false confidence');
  if (misleading.previewCompletionMisleading) misleadingPreviewRisks.push('Preview overstates completion');
  if (unavailable.previewFalseReady) misleadingPreviewRisks.push('Preview pretends ready when unavailable');

  const readinessGaps: string[] = [];
  if (readiness.previewReadinessWeak) readinessGaps.push('Preview weak for readiness decisions');
  if (readiness.previewLaunchSignalMissing) readinessGaps.push('Launch readiness signal missing from preview');
  if (reportConnection.previewReportDisconnected) readinessGaps.push('Preview disconnected from verification reports');

  const recommendedPriorityFixes: string[] = [];
  if (unavailable.previewUnavailableHidden) recommendedPriorityFixes.push('Surface honest preview-unavailable state with reason');
  if (visibility.previewEntryHidden) recommendedPriorityFixes.push('Make live preview entry discoverable');
  if (founder.founderVerificationBlocked) recommendedPriorityFixes.push('Unblock founder verification path from preview');
  if (reportConnection.previewEvidenceNotTraceable) recommendedPriorityFixes.push('Connect preview findings to UVL and product-reality reports');
  if (recommendedPriorityFixes.length === 0 && evaluation.livePreviewResult !== 'PASS') {
    recommendedPriorityFixes.push('Address highest-severity live preview warnings');
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue live preview monitoring on product changes');
  }

  return {
    overallScore: record.overallScore,
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
    livePreviewResult: record.livePreviewResult,
    previewContextRisks: [...new Set(previewContextRisks)],
    founderPreviewRisks: [...new Set(founderPreviewRisks)],
    responsivePreviewRisks: [...new Set(responsivePreviewRisks)],
    misleadingPreviewRisks: [...new Set(misleadingPreviewRisks)],
    readinessGaps: [...new Set(readinessGaps)],
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getLivePreviewHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: LIVE_PREVIEW_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetLivePreviewReportBuilderForTests(): void {
  reportCount = 0;
}
