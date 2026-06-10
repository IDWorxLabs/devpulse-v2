/**
 * Visual QA Engine — visual quality report builder.
 */

import type {
  AlignmentConsistencyAnalysis,
  ColorConsistencyAnalysis,
  DesktopVisualAnalysis,
  EmptySpaceUtilizationAnalysis,
  FirstImpressionAnalysis,
  LayoutQualityAnalysis,
  MobileVisualAnalysis,
  ProductProfessionalismAnalysis,
  SpacingConsistencyAnalysis,
  TypographyQualityAnalysis,
  VisualClutterAnalysis,
  VisualHierarchyAnalysis,
  VisualQARecord,
  VisualQAReport,
  VisualQAEvaluation,
} from './visual-qa-types.js';
import { REPORTING_PASS } from './visual-qa-types.js';
import { getVisualQACacheStats } from './visual-qa-cache.js';
import { getVisualQAHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateVisualQAReport(
  record: VisualQARecord,
  evaluation: VisualQAEvaluation,
  hierarchy: VisualHierarchyAnalysis,
  layout: LayoutQualityAnalysis,
  spacing: SpacingConsistencyAnalysis,
  alignment: AlignmentConsistencyAnalysis,
  typography: TypographyQualityAnalysis,
  color: ColorConsistencyAnalysis,
  clutter: VisualClutterAnalysis,
  emptySpace: EmptySpaceUtilizationAnalysis,
  mobile: MobileVisualAnalysis,
  desktop: DesktopVisualAnalysis,
  firstImpression: FirstImpressionAnalysis,
  professionalism: ProductProfessionalismAnalysis,
): VisualQAReport {
  reportCount += 1;
  const cache = getVisualQACacheStats();

  const detectedProblems = [
    ...hierarchy.hierarchyWarnings,
    ...layout.layoutProblems,
    ...spacing.spacingProblems,
    ...alignment.alignmentProblems,
    ...typography.typographyProblems,
    ...color.colorProblems,
    ...clutter.clutterProblems,
    ...emptySpace.emptySpaceProblems,
    ...mobile.mobileProblems,
    ...desktop.desktopProblems,
    ...firstImpression.firstImpressionProblems,
    ...professionalism.professionalismProblems,
  ];

  const improvementOpportunities: string[] = [];
  if (hierarchy.hierarchyScore < 80) improvementOpportunities.push('Strengthen primary action and navigation hierarchy');
  if (layout.layoutScore < 80) improvementOpportunities.push('Rebalance panel structure and content grouping');
  if (spacing.spacingScore < 80) improvementOpportunities.push('Normalize spacing rhythm across components');
  if (alignment.alignmentScore < 80) improvementOpportunities.push('Correct component alignment drift');
  if (typography.typographyScore < 80) improvementOpportunities.push('Improve heading hierarchy and readability');
  if (color.colorScore < 80) improvementOpportunities.push('Resolve theme and contrast inconsistencies');
  if (clutter.clutterScore < 75) improvementOpportunities.push('Reduce visual clutter and competing elements');
  if (emptySpace.emptySpaceScore < 75) improvementOpportunities.push('Balance whitespace utilization');
  if (mobile.mobileScore < 80) improvementOpportunities.push('Improve mobile layout and discoverability');
  if (desktop.desktopScore < 80) improvementOpportunities.push('Optimize desktop workspace utilization');
  if (firstImpression.firstImpressionScore < 80) improvementOpportunities.push('Elevate first-impression polish and premium feel');
  if (professionalism.professionalismScore < 80) improvementOpportunities.push('Raise product professionalism for stakeholder review');

  const recommendedPriorityFixes: string[] = [];
  if (layout.layoutConfusion) recommendedPriorityFixes.push('Resolve layout confusion before release');
  if (mobile.mobileLayoutFailure) recommendedPriorityFixes.push('Fix mobile layout failures');
  if (color.lowContrast) recommendedPriorityFixes.push('Address low contrast accessibility risks');
  if (desktop.desktopLayoutFailure) recommendedPriorityFixes.push('Fix desktop layout failures');
  if (professionalism.founderAcceptable === false) recommendedPriorityFixes.push('Founder acceptance visual review required');
  if (recommendedPriorityFixes.length === 0 && evaluation.visualQaResult !== 'PASS') {
    recommendedPriorityFixes.push('Address highest-severity visual QA warnings');
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue visual QA monitoring on UI changes');
  }

  return {
    overallScore: record.overallScore,
    visualQuality: evaluation.overallScore,
    hierarchyQuality: hierarchy.hierarchyScore,
    layoutQuality: layout.layoutScore,
    spacingQuality: spacing.spacingScore,
    alignmentQuality: alignment.alignmentScore,
    typographyQuality: typography.typographyScore,
    colorQuality: color.colorScore,
    clutterRating: clutter.clutterScore,
    mobileRating: mobile.mobileScore,
    desktopRating: desktop.desktopScore,
    firstImpressionRating: firstImpression.firstImpressionScore,
    professionalismRating: professionalism.professionalismScore,
    visualQaResult: record.visualQaResult,
    detectedProblems: [...new Set(detectedProblems)],
    improvementOpportunities: [...new Set(improvementOpportunities)],
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getVisualQAHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetVisualQAReportBuilderForTests(): void {
  reportCount = 0;
}
