/**
 * Product Reality Orchestrator — experience aggregation builder.
 */

import type {
  ProductRealityAggregate,
  ProductRealityInput,
  ResponsiveRealityReport,
  UpstreamReportBundle,
} from './product-reality-types.js';
import { PRODUCT_REALITY_AGGREGATE_PASS, clampScore } from './product-reality-types.js';
import { getCachedAggregate, setCachedAggregate } from './product-reality-cache.js';

let aggregateBuildCount = 0;

export function deriveResponsiveRealityReport(
  visualQa: UpstreamReportBundle['visualQa'],
  livePreview: UpstreamReportBundle['livePreview'],
  mobileNavPresent: boolean,
): ResponsiveRealityReport {
  const tabletScore = Math.round((visualQa.desktopRating + visualQa.mobileRating) / 2);
  const overallScore = Math.round(
    (visualQa.mobileRating + visualQa.desktopRating + tabletScore + livePreview.responsivePreviewSupportScore) / 4,
  );
  return {
    overallScore,
    mobileScore: visualQa.mobileRating,
    desktopScore: visualQa.desktopRating,
    tabletScore,
    responsivePreviewScore: livePreview.responsivePreviewSupportScore,
    mobileNavPresent,
    derivedFrom: 'VISUAL_QA_AND_LIVE_PREVIEW',
  };
}

function countIssues(reports: UpstreamReportBundle, input: ProductRealityInput): {
  critical: number;
  major: number;
  minor: number;
} {
  let critical = 0;
  let major = 0;
  let minor = 0;

  const bump = (result: string): void => {
    if (result === 'FAIL') critical += 1;
    else if (result === 'PASS_WITH_WARNINGS') major += 1;
    else minor += 1;
  };

  bump(reports.visualQa.visualQaResult);
  bump(reports.uxHeuristics.uxHeuristicResult);
  bump(reports.firstImpression.firstImpressionResult);
  bump(reports.livePreview.livePreviewResult);
  bump(reports.autoPolish.autoPolishResult);
  bump(reports.productExperience.productExperienceResult);

  if (input.experienceFragmented === true) critical += 1;
  if (input.workflowBroken === true) critical += 1;
  if (input.trustGap === true) major += 1;
  if (input.responsiveWeak === true) major += 1;

  return { critical, major, minor };
}

export function buildProductRealityAggregate(
  requestId: string,
  reports: UpstreamReportBundle,
  input: ProductRealityInput,
): ProductRealityAggregate {
  const cacheKey = [
    requestId,
    reports.visualQa.overallScore,
    reports.productExperience.overallProductExperienceScore,
    input.governanceBlocked,
  ].join('|');
  const cached = getCachedAggregate(cacheKey);
  if (cached) return cached;

  aggregateBuildCount += 1;

  const visualScore = reports.visualQa.overallScore;
  const responsiveScore = reports.responsiveReality.overallScore;
  const usabilityScore = reports.uxHeuristics.overallScore;
  const firstImpressionScore = reports.firstImpression.overallScore;
  const previewScore = reports.livePreview.overallScore;
  const polishScore = reports.autoPolish.overallScore;
  const experienceScore = reports.productExperience.overallProductExperienceScore;

  const trustScore = Math.round(
    (reports.firstImpression.trustworthinessScore
      + reports.uxHeuristics.trustClarityScore
      + reports.productExperience.trustContinuityScore) / 3,
  );
  const continuityScore = Math.round(
    (reports.productExperience.experienceContinuityScore
      + reports.productExperience.workflowContinuityScore
      + reports.productExperience.navigationContinuityScore) / 3,
  );
  const coherenceScore = reports.productExperience.productCoherenceScore;
  const launchReadinessScore = Math.round(
    (reports.firstImpression.launchReadinessPerceptionScore
      + reports.productExperience.launchReadinessScore
      + reports.autoPolish.overallScore) / 3,
  );

  const issues = countIssues(reports, input);

  const overallExperienceScore = clampScore(Math.round(
    visualScore * 0.08
      + responsiveScore * 0.07
      + usabilityScore * 0.1
      + firstImpressionScore * 0.1
      + previewScore * 0.08
      + polishScore * 0.1
      + experienceScore * 0.2
      + trustScore * 0.1
      + continuityScore * 0.09
      + coherenceScore * 0.08,
  ) - issues.critical * 5 - issues.major * 2);

  const result: ProductRealityAggregate = {
    overallExperienceScore,
    visualScore,
    responsiveScore,
    usabilityScore,
    firstImpressionScore,
    previewScore,
    polishScore,
    experienceScore,
    launchReadinessScore,
    trustScore,
    continuityScore,
    coherenceScore,
    criticalIssueCount: issues.critical,
    majorIssueCount: issues.major,
    minorIssueCount: issues.minor,
    passToken: PRODUCT_REALITY_AGGREGATE_PASS,
  };

  setCachedAggregate(cacheKey, result);
  return result;
}

export function getAggregateBuildCount(): number {
  return aggregateBuildCount;
}

export function resetExperienceAggregationBuilderForTests(): void {
  aggregateBuildCount = 0;
}
