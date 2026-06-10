/**
 * Visual QA Engine — types and models.
 * Read-only visual product evaluation. No UI modification or execution.
 */

export const VISUAL_QA_ENGINE_PASS_TOKEN = 'VISUAL_QA_ENGINE_V1_PASS';
export const VISUAL_QA_ENGINE_OWNER_MODULE = 'devpulse_v2_visual_qa_engine';
export const DEFAULT_MAX_VISUAL_QA_HISTORY_SIZE = 128;

export const VISUAL_HIERARCHY_PASS = 'VISUAL_HIERARCHY_PASS';
export const LAYOUT_QUALITY_PASS = 'LAYOUT_QUALITY_PASS';
export const SPACING_ANALYSIS_PASS = 'SPACING_ANALYSIS_PASS';
export const ALIGNMENT_ANALYSIS_PASS = 'ALIGNMENT_ANALYSIS_PASS';
export const TYPOGRAPHY_ANALYSIS_PASS = 'TYPOGRAPHY_ANALYSIS_PASS';
export const COLOR_ANALYSIS_PASS = 'COLOR_ANALYSIS_PASS';
export const MOBILE_VISUAL_PASS = 'MOBILE_VISUAL_PASS';
export const DESKTOP_VISUAL_PASS = 'DESKTOP_VISUAL_PASS';
export const FIRST_IMPRESSION_PASS = 'FIRST_IMPRESSION_PASS';
export const PROFESSIONALISM_PASS = 'PROFESSIONALISM_PASS';
export const REPORTING_PASS = 'REPORTING_PASS';

export type VisualQAResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type VisualSurfaceType = 'screenshot' | 'live_preview' | 'rendered_ui';
export type VisualViewport = 'desktop' | 'mobile' | 'both';

export interface VisualQARecord {
  visualQaId: string;
  projectId: string;
  workspaceId: string;
  surfaceType: VisualSurfaceType;
  viewport: VisualViewport;
  overallScore: number;
  visualQaResult: VisualQAResult;
  confidence: number;
  generatedAt: number;
}

export interface VisualHierarchyAnalysis {
  hierarchyScore: number;
  primaryActionVisible: boolean;
  primaryInformationVisible: boolean;
  navigationVisible: boolean;
  statusIndicatorsVisible: boolean;
  hierarchyWarnings: string[];
  passToken: typeof VISUAL_HIERARCHY_PASS;
}

export interface LayoutQualityAnalysis {
  layoutScore: number;
  layoutImbalance: boolean;
  layoutFragmentation: boolean;
  layoutConfusion: boolean;
  layoutProblems: string[];
  passToken: typeof LAYOUT_QUALITY_PASS;
}

export interface SpacingConsistencyAnalysis {
  spacingScore: number;
  inconsistentSpacing: boolean;
  crowdedLayout: boolean;
  wastedSpace: boolean;
  spacingProblems: string[];
  passToken: typeof SPACING_ANALYSIS_PASS;
}

export interface AlignmentConsistencyAnalysis {
  alignmentScore: number;
  alignmentDrift: boolean;
  misalignedComponents: boolean;
  alignmentProblems: string[];
  passToken: typeof ALIGNMENT_ANALYSIS_PASS;
}

export interface TypographyQualityAnalysis {
  typographyScore: number;
  typographyProblems: string[];
  passToken: typeof TYPOGRAPHY_ANALYSIS_PASS;
}

export interface ColorConsistencyAnalysis {
  colorScore: number;
  colorConflict: boolean;
  lowContrast: boolean;
  themeInconsistency: boolean;
  colorProblems: string[];
  passToken: typeof COLOR_ANALYSIS_PASS;
}

export interface VisualClutterAnalysis {
  clutterScore: number;
  overcrowding: boolean;
  competingElements: boolean;
  excessiveDensity: boolean;
  clutterProblems: string[];
}

export interface EmptySpaceUtilizationAnalysis {
  emptySpaceScore: number;
  deadSpace: boolean;
  unusedRealEstate: boolean;
  emptySpaceProblems: string[];
}

export interface MobileVisualAnalysis {
  mobileScore: number;
  mobileLayoutFailure: boolean;
  mobileDiscoverabilityRisk: boolean;
  mobileOverflowRisk: boolean;
  mobileProblems: string[];
  passToken: typeof MOBILE_VISUAL_PASS;
}

export interface DesktopVisualAnalysis {
  desktopScore: number;
  desktopLayoutFailure: boolean;
  desktopUnusedSpace: boolean;
  desktopProblems: string[];
  passToken: typeof DESKTOP_VISUAL_PASS;
}

export interface FirstImpressionAnalysis {
  firstImpressionScore: number;
  feelsModern: boolean;
  feelsIntelligent: boolean;
  feelsTrustworthy: boolean;
  feelsPolished: boolean;
  feelsPremium: boolean;
  firstImpressionProblems: string[];
  passToken: typeof FIRST_IMPRESSION_PASS;
}

export interface ProductProfessionalismAnalysis {
  professionalismScore: number;
  founderAcceptable: boolean;
  customerAcceptable: boolean;
  investorAcceptable: boolean;
  professionalismProblems: string[];
  passToken: typeof PROFESSIONALISM_PASS;
}

export interface VisualQAAuthority {
  authorityId: string;
  overallScore: number;
  hierarchyScore: number;
  layoutScore: number;
  spacingScore: number;
  alignmentScore: number;
  typographyScore: number;
  colorScore: number;
  clutterScore: number;
  emptySpaceScore: number;
  mobileScore: number;
  desktopScore: number;
  firstImpressionScore: number;
  professionalismScore: number;
  visualQaResult: VisualQAResult;
  confidence: number;
  createdAt: number;
}

export interface VisualQAEvaluation {
  overallScore: number;
  visualQaResult: VisualQAResult;
  confidence: number;
  productionReadiness: number;
  hierarchyScore: number;
  layoutScore: number;
  spacingScore: number;
  alignmentScore: number;
  typographyScore: number;
  colorScore: number;
  clutterScore: number;
  emptySpaceScore: number;
  mobileScore: number;
  desktopScore: number;
  firstImpressionScore: number;
  professionalismScore: number;
}

export interface VisualQAHistoryEntry {
  visualQaId: string;
  overallScore: number;
  visualQaResult: VisualQAResult;
  recordedAt: number;
}

export interface VisualQAReport {
  overallScore: number;
  visualQuality: number;
  hierarchyQuality: number;
  layoutQuality: number;
  spacingQuality: number;
  alignmentQuality: number;
  typographyQuality: number;
  colorQuality: number;
  clutterRating: number;
  mobileRating: number;
  desktopRating: number;
  firstImpressionRating: number;
  professionalismRating: number;
  visualQaResult: VisualQAResult;
  detectedProblems: string[];
  improvementOpportunities: string[];
  recommendedPriorityFixes: string[];
  evaluation: VisualQAEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof REPORTING_PASS;
}

export interface VisualQAInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  surfaceType?: VisualSurfaceType;
  viewport?: VisualViewport;
  screenshotAvailable?: boolean;
  livePreviewAvailable?: boolean;
  renderedUiAvailable?: boolean;
  missingPrimaryAction?: boolean;
  missingPrimaryInformation?: boolean;
  missingNavigationClarity?: boolean;
  missingStatusIndicators?: boolean;
  layoutImbalance?: boolean;
  layoutFragmentation?: boolean;
  layoutConfusion?: boolean;
  inconsistentSpacing?: boolean;
  crowdedLayout?: boolean;
  wastedSpace?: boolean;
  alignmentDrift?: boolean;
  misalignedComponents?: boolean;
  missingFontConsistency?: boolean;
  missingHeadingHierarchy?: boolean;
  poorReadability?: boolean;
  poorScanability?: boolean;
  colorConflict?: boolean;
  lowContrast?: boolean;
  themeInconsistency?: boolean;
  overcrowding?: boolean;
  competingElements?: boolean;
  excessiveDensity?: boolean;
  deadSpace?: boolean;
  unusedRealEstate?: boolean;
  mobileLayoutFailure?: boolean;
  mobileDiscoverabilityRisk?: boolean;
  mobileOverflowRisk?: boolean;
  desktopLayoutFailure?: boolean;
  desktopUnusedSpace?: boolean;
  lacksModernFeel?: boolean;
  lacksIntelligentFeel?: boolean;
  lacksTrustworthyFeel?: boolean;
  lacksPolishedFeel?: boolean;
  lacksPremiumFeel?: boolean;
  founderUnacceptable?: boolean;
  customerUnacceptable?: boolean;
  investorUnacceptable?: boolean;
  governanceBlocked?: boolean;
}

export interface VisualQAResultBundle {
  record: VisualQARecord;
  report: VisualQAReport;
}

export interface VisualQARuntimeReport {
  hierarchyAnalysisCount: number;
  layoutAnalysisCount: number;
  spacingAnalysisCount: number;
  alignmentAnalysisCount: number;
  typographyAnalysisCount: number;
  colorAnalysisCount: number;
  clutterAnalysisCount: number;
  emptySpaceAnalysisCount: number;
  mobileAnalysisCount: number;
  desktopAnalysisCount: number;
  firstImpressionAnalysisCount: number;
  professionalismAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const VISUAL_QA_QUESTION_SIGNALS = [
  'visual qa',
  'visual quality',
  'ui quality',
  'product appearance',
  'visual hierarchy',
  'layout quality',
  'first impression',
  'professionalism',
] as const;

export function isVisualQAQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return VISUAL_QA_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveVisualQAResult(
  overallScore: number,
  criticalFailures: number,
  warningCount: number,
  blocked?: boolean,
): VisualQAResult {
  if (blocked === true) return 'FAIL';
  if (criticalFailures > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
