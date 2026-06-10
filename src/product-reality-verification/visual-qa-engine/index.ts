/**
 * Visual QA Engine — public exports.
 */

import { resetVisualQARegistryForTests } from './visual-qa-registry.js';
import { resetVisualQACacheForTests } from './visual-qa-cache.js';
import { resetVisualHierarchyAnalyzerForTests } from './visual-hierarchy-analyzer.js';
import { resetLayoutQualityAnalyzerForTests } from './layout-quality-analyzer.js';
import { resetSpacingConsistencyAnalyzerForTests } from './spacing-consistency-analyzer.js';
import { resetAlignmentConsistencyAnalyzerForTests } from './alignment-consistency-analyzer.js';
import { resetTypographyQualityAnalyzerForTests } from './typography-quality-analyzer.js';
import { resetColorConsistencyAnalyzerForTests } from './color-consistency-analyzer.js';
import { resetVisualClutterAnalyzerForTests } from './visual-clutter-analyzer.js';
import { resetEmptySpaceUtilizationAnalyzerForTests } from './empty-space-utilization-analyzer.js';
import { resetMobileVisualAnalyzerForTests } from './mobile-visual-analyzer.js';
import { resetDesktopVisualAnalyzerForTests } from './desktop-visual-analyzer.js';
import { resetFirstImpressionAnalyzerForTests } from './first-impression-analyzer.js';
import { resetProductProfessionalismAnalyzerForTests } from './product-professionalism-analyzer.js';
import { resetVisualQAAuthorityBuilderForTests } from './visual-qa-authority-builder.js';
import { resetVisualQAEvaluatorForTests } from './visual-qa-evaluator.js';
import { resetVisualQAHistoryForTests } from './bounded-history.js';
import { resetVisualQAReportBuilderForTests } from './visual-qa-report-builder.js';
import { resetVisualQAEngineOrchestrationForTests } from './visual-qa-engine.js';

export {
  VISUAL_QA_ENGINE_PASS_TOKEN,
  VISUAL_QA_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_VISUAL_QA_HISTORY_SIZE,
  VISUAL_HIERARCHY_PASS,
  LAYOUT_QUALITY_PASS,
  SPACING_ANALYSIS_PASS,
  ALIGNMENT_ANALYSIS_PASS,
  TYPOGRAPHY_ANALYSIS_PASS,
  COLOR_ANALYSIS_PASS,
  MOBILE_VISUAL_PASS,
  DESKTOP_VISUAL_PASS,
  FIRST_IMPRESSION_PASS,
  PROFESSIONALISM_PASS,
  REPORTING_PASS,
  VISUAL_QA_QUESTION_SIGNALS,
  isVisualQAQuestion,
  resolveVisualQAResult,
  clampScore,
} from './visual-qa-types.js';

export type {
  VisualQAResult,
  VisualSurfaceType,
  VisualViewport,
  VisualQARecord,
  VisualHierarchyAnalysis,
  LayoutQualityAnalysis,
  SpacingConsistencyAnalysis,
  AlignmentConsistencyAnalysis,
  TypographyQualityAnalysis,
  ColorConsistencyAnalysis,
  VisualClutterAnalysis,
  EmptySpaceUtilizationAnalysis,
  MobileVisualAnalysis,
  DesktopVisualAnalysis,
  FirstImpressionAnalysis,
  ProductProfessionalismAnalysis,
  VisualQAAuthority,
  VisualQAEvaluation,
  VisualQAHistoryEntry,
  VisualQAReport,
  VisualQAInput,
  VisualQAResultBundle,
  VisualQARuntimeReport,
} from './visual-qa-types.js';

export { getVisualQACacheStats, resetVisualQACacheForTests } from './visual-qa-cache.js';

export {
  registerVisualQARecord,
  getVisualQARecord,
  lookupVisualQAByProjectId,
  lookupVisualQAByWorkspaceId,
  lookupVisualQAByResult,
  listVisualQARecords,
  getVisualQARecordCount,
  resetVisualQARegistryForTests,
} from './visual-qa-registry.js';

export {
  analyzeVisualHierarchy,
  getHierarchyAnalysisCount,
  resetVisualHierarchyAnalyzerForTests,
} from './visual-hierarchy-analyzer.js';
export type { VisualHierarchySnapshot } from './visual-hierarchy-analyzer.js';

export {
  analyzeLayoutQuality,
  getLayoutAnalysisCount,
  resetLayoutQualityAnalyzerForTests,
} from './layout-quality-analyzer.js';
export type { LayoutQualitySnapshot } from './layout-quality-analyzer.js';

export {
  analyzeSpacingConsistency,
  getSpacingAnalysisCount,
  resetSpacingConsistencyAnalyzerForTests,
} from './spacing-consistency-analyzer.js';
export type { SpacingConsistencySnapshot } from './spacing-consistency-analyzer.js';

export {
  analyzeAlignmentConsistency,
  getAlignmentAnalysisCount,
  resetAlignmentConsistencyAnalyzerForTests,
} from './alignment-consistency-analyzer.js';
export type { AlignmentConsistencySnapshot } from './alignment-consistency-analyzer.js';

export {
  analyzeTypographyQuality,
  getTypographyAnalysisCount,
  resetTypographyQualityAnalyzerForTests,
} from './typography-quality-analyzer.js';
export type { TypographyQualitySnapshot } from './typography-quality-analyzer.js';

export {
  analyzeColorConsistency,
  getColorAnalysisCount,
  resetColorConsistencyAnalyzerForTests,
} from './color-consistency-analyzer.js';
export type { ColorConsistencySnapshot } from './color-consistency-analyzer.js';

export {
  analyzeVisualClutter,
  getClutterAnalysisCount,
  resetVisualClutterAnalyzerForTests,
} from './visual-clutter-analyzer.js';
export type { VisualClutterSnapshot } from './visual-clutter-analyzer.js';

export {
  analyzeEmptySpaceUtilization,
  getEmptySpaceAnalysisCount,
  resetEmptySpaceUtilizationAnalyzerForTests,
} from './empty-space-utilization-analyzer.js';
export type { EmptySpaceUtilizationSnapshot } from './empty-space-utilization-analyzer.js';

export {
  analyzeMobileVisual,
  getMobileAnalysisCount,
  resetMobileVisualAnalyzerForTests,
} from './mobile-visual-analyzer.js';
export type { MobileVisualSnapshot } from './mobile-visual-analyzer.js';

export {
  analyzeDesktopVisual,
  getDesktopAnalysisCount,
  resetDesktopVisualAnalyzerForTests,
} from './desktop-visual-analyzer.js';
export type { DesktopVisualSnapshot } from './desktop-visual-analyzer.js';

export {
  analyzeFirstImpression,
  getFirstImpressionAnalysisCount,
  resetFirstImpressionAnalyzerForTests,
} from './first-impression-analyzer.js';
export type { FirstImpressionSnapshot } from './first-impression-analyzer.js';

export {
  analyzeProductProfessionalism,
  getProfessionalismAnalysisCount,
  resetProductProfessionalismAnalyzerForTests,
} from './product-professionalism-analyzer.js';
export type { ProductProfessionalismSnapshot } from './product-professionalism-analyzer.js';

export {
  buildVisualQAAuthority,
  getAuthorityBuildCount,
  resetVisualQAAuthorityBuilderForTests,
} from './visual-qa-authority-builder.js';

export {
  evaluateVisualQA,
  getEvaluationCount,
  resetVisualQAEvaluatorForTests,
} from './visual-qa-evaluator.js';

export {
  recordVisualQAHistory,
  getVisualQAHistory,
  getVisualQAHistorySize,
  clearVisualQAHistory,
  resetVisualQAHistoryForTests,
} from './bounded-history.js';

export {
  generateVisualQAReport,
  getReportCount,
  resetVisualQAReportBuilderForTests,
} from './visual-qa-report-builder.js';

export {
  getDevPulseV2VisualQAEngine,
  registerVisualQAEngineWithSurface,
  registerVisualQAEngineWithInteractiveExplanations,
  registerVisualQAEngineWithFoundation,
  registerVisualQAEngineWithCapabilityRegistry,
  registerVisualQAEngineWithFindPanel,
  registerVisualQAEngineWithUvl,
  evaluateVisualQAEngine,
  getVisualQARuntimeReport,
} from './visual-qa-engine.js';

export type { VisualQASurfaceSnapshot } from './visual-qa-engine.js';

export function resetVisualQAEngineForTests(): void {
  resetVisualQARegistryForTests();
  resetVisualQACacheForTests();
  resetVisualHierarchyAnalyzerForTests();
  resetLayoutQualityAnalyzerForTests();
  resetSpacingConsistencyAnalyzerForTests();
  resetAlignmentConsistencyAnalyzerForTests();
  resetTypographyQualityAnalyzerForTests();
  resetColorConsistencyAnalyzerForTests();
  resetVisualClutterAnalyzerForTests();
  resetEmptySpaceUtilizationAnalyzerForTests();
  resetMobileVisualAnalyzerForTests();
  resetDesktopVisualAnalyzerForTests();
  resetFirstImpressionAnalyzerForTests();
  resetProductProfessionalismAnalyzerForTests();
  resetVisualQAAuthorityBuilderForTests();
  resetVisualQAEvaluatorForTests();
  resetVisualQAHistoryForTests();
  resetVisualQAReportBuilderForTests();
  resetVisualQAEngineOrchestrationForTests();
}
