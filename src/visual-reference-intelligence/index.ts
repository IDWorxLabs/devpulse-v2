/**
 * Visual Reference Intelligence — public API (V1).
 */

export {
  VISUAL_REFERENCE_INTELLIGENCE_PASS_TOKEN,
  VISUAL_REFERENCE_INTELLIGENCE_OWNER_MODULE,
  VISUAL_REFERENCE_INTELLIGENCE_PHASE,
  VISUAL_REFERENCE_INTELLIGENCE_REPORT_TITLE,
  MAX_VISUAL_REFERENCE_HISTORY,
  SUPPORTED_VISUAL_EXTENSIONS,
  LAYOUT_REGION_TYPES,
  COMPONENT_EVIDENCE_TOKENS,
  INFERRED_FLOW_TYPES,
  SAFETY_GUARANTEES,
} from './visual-reference-registry.js';

export type {
  SupportedVisualFormat,
  DetectedPlatform,
  ScreenClassification,
  LayoutRegionType,
  ComponentEvidenceToken,
  InferredFlowType,
  ImageMetadataEvidence,
  ScreenDetectionResult,
  LayoutRegionEvidence,
  ComponentDetectionEvidence,
  FlowInferenceEvidence,
  VisualCompletenessReview,
  VisualReferenceAnalysis,
  VisualReferenceHistoryEntry,
  VisualReferenceIntelligenceReport,
  AnalyzeVisualReferenceInput,
  VisualReferenceIntelligenceAssessment,
  LuminanceGridSample,
} from './visual-reference-types.js';

export {
  resetVisualReferenceHistoryForTests,
  recordVisualReferenceAnalysis,
  getVisualReferenceHistorySize,
  getVisualReferenceHistory,
  getVisualReferenceAnalyses,
  getLatestVisualReferenceAnalysis,
} from './visual-reference-history.js';

export {
  analyzeVisualReference,
  assessVisualReferenceIntelligence,
  buildVisualReferenceIntelligenceArtifacts,
  resetVisualReferenceCounterForTests,
  resetVisualReferenceIntelligenceModuleForTests,
} from './visual-reference-authority.js';

export {
  buildVisualReferenceIntelligenceReport,
  buildVisualReferenceIntelligenceReportMarkdown,
} from './visual-reference-report-builder.js';

export { extractUiLayout } from './ui-layout-extractor.js';
export { detectUiComponents } from './component-detector.js';
export { detectScreenContext, extractScreenFlows } from './screen-flow-extractor.js';
export {
  extractImageMetadata,
  sampleLuminanceGrid,
  resolveSupportedFormat,
  parsePngDimensions,
} from './visual-reference-analyzer.js';
