/**
 * Visual QA Engine — unified authority builder.
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
  VisualQAAuthority,
  VisualQAInput,
  VisualQAResult,
} from './visual-qa-types.js';
import { resolveVisualQAResult } from './visual-qa-types.js';
import { getCachedVisualQAAuthority, setCachedVisualQAAuthority } from './visual-qa-cache.js';

const ANALYZER_WEIGHT = 1 / 12;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildVisualQAAuthority(
  requestId: string,
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
  input: VisualQAInput,
): VisualQAAuthority {
  const cacheKey = [
    requestId,
    hierarchy.hierarchyScore,
    layout.layoutScore,
    spacing.spacingScore,
    alignment.alignmentScore,
    typography.typographyScore,
    color.colorScore,
    clutter.clutterScore,
    emptySpace.emptySpaceScore,
    mobile.mobileScore,
    desktop.desktopScore,
    firstImpression.firstImpressionScore,
    professionalism.professionalismScore,
  ].join('|');

  const cached = getCachedVisualQAAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const overallScore = Math.round(
    hierarchy.hierarchyScore * ANALYZER_WEIGHT
      + layout.layoutScore * ANALYZER_WEIGHT
      + spacing.spacingScore * ANALYZER_WEIGHT
      + alignment.alignmentScore * ANALYZER_WEIGHT
      + typography.typographyScore * ANALYZER_WEIGHT
      + color.colorScore * ANALYZER_WEIGHT
      + clutter.clutterScore * ANALYZER_WEIGHT
      + emptySpace.emptySpaceScore * ANALYZER_WEIGHT
      + mobile.mobileScore * ANALYZER_WEIGHT
      + desktop.desktopScore * ANALYZER_WEIGHT
      + firstImpression.firstImpressionScore * ANALYZER_WEIGHT
      + professionalism.professionalismScore * ANALYZER_WEIGHT,
  );

  const criticalFailures =
    (layout.layoutConfusion ? 1 : 0)
    + (mobile.mobileLayoutFailure ? 1 : 0)
    + (desktop.desktopLayoutFailure ? 1 : 0)
    + (color.lowContrast ? 1 : 0);

  const warningCount =
    hierarchy.hierarchyWarnings.length
    + layout.layoutProblems.length
    + spacing.spacingProblems.length
    + alignment.alignmentProblems.length
    + typography.typographyProblems.length
    + color.colorProblems.length
    + clutter.clutterProblems.length
    + emptySpace.emptySpaceProblems.length
    + mobile.mobileProblems.length
    + desktop.desktopProblems.length
    + firstImpression.firstImpressionProblems.length
    + professionalism.professionalismProblems.length;

  const visualQaResult: VisualQAResult = resolveVisualQAResult(
    overallScore,
    criticalFailures,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (overallScore + hierarchy.hierarchyScore + firstImpression.firstImpressionScore) / 3,
  ));

  const authority: VisualQAAuthority = {
    authorityId: `visual-qa-authority-${authorityCounter}`,
    overallScore,
    hierarchyScore: hierarchy.hierarchyScore,
    layoutScore: layout.layoutScore,
    spacingScore: spacing.spacingScore,
    alignmentScore: alignment.alignmentScore,
    typographyScore: typography.typographyScore,
    colorScore: color.colorScore,
    clutterScore: clutter.clutterScore,
    emptySpaceScore: emptySpace.emptySpaceScore,
    mobileScore: mobile.mobileScore,
    desktopScore: desktop.desktopScore,
    firstImpressionScore: firstImpression.firstImpressionScore,
    professionalismScore: professionalism.professionalismScore,
    visualQaResult,
    confidence,
    createdAt: Date.now(),
  };

  setCachedVisualQAAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetVisualQAAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
