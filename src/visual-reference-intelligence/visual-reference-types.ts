/**
 * Visual Reference Intelligence — foundation types (V1).
 * Read-only screenshot / visual reference understanding — no code generation or OCR.
 */

export type SupportedVisualFormat = 'PNG' | 'JPG' | 'JPEG' | 'WEBP';

export type DetectedPlatform = 'MOBILE' | 'WEB' | 'DESKTOP' | 'UNKNOWN';

export type ScreenClassification = 'DASHBOARD' | 'APP' | 'SITE' | 'UNKNOWN';

export type LayoutRegionType =
  | 'HEADER'
  | 'FOOTER'
  | 'SIDEBAR'
  | 'NAVIGATION'
  | 'CARDS'
  | 'LISTS'
  | 'FORMS'
  | 'BUTTONS'
  | 'MODALS';

export type ComponentEvidenceToken =
  | 'HEADER_DETECTED'
  | 'FOOTER_DETECTED'
  | 'SIDEBAR_DETECTED'
  | 'NAVIGATION_DETECTED'
  | 'BOTTOM_NAVIGATION_DETECTED'
  | 'CARD_DETECTED'
  | 'LIST_DETECTED'
  | 'FORM_DETECTED'
  | 'BUTTON_DETECTED'
  | 'BUTTON_GROUP_DETECTED'
  | 'MODAL_DETECTED';

export type InferredFlowType =
  | 'AUTHENTICATION'
  | 'ONBOARDING'
  | 'DASHBOARD'
  | 'SETTINGS'
  | 'CHECKOUT'
  | 'PROFILE'
  | 'MESSAGING';

export interface ImageMetadataEvidence {
  readOnly: true;
  format: SupportedVisualFormat | null;
  width: number;
  height: number;
  aspectRatio: number;
  byteLength: number;
}

export interface ScreenDetectionResult {
  readOnly: true;
  screenCountEstimate: number;
  screenType: ScreenClassification;
  platform: DetectedPlatform;
  classification: ScreenClassification;
  evidence: readonly string[];
}

export interface LayoutRegionEvidence {
  readOnly: true;
  region: LayoutRegionType;
  confidence: number;
  evidence: readonly string[];
}

export interface ComponentDetectionEvidence {
  readOnly: true;
  token: ComponentEvidenceToken;
  confidence: number;
  evidence: readonly string[];
}

export interface FlowInferenceEvidence {
  readOnly: true;
  flow: InferredFlowType;
  confidence: number;
  evidence: readonly string[];
}

export interface VisualCompletenessReview {
  readOnly: true;
  visualCompletenessScore: number;
  missingScreens: readonly string[];
  incompleteFlows: readonly string[];
  navigationGaps: readonly string[];
  uxRisks: readonly string[];
}

export interface VisualReferenceAnalysis {
  readOnly: true;
  analysisId: string;
  uploadId: string | null;
  filename: string;
  analyzedAt: string;
  imageMetadata: ImageMetadataEvidence;
  screenDetection: ScreenDetectionResult;
  layoutRegions: readonly LayoutRegionEvidence[];
  detectedComponents: readonly ComponentDetectionEvidence[];
  inferredFlows: readonly FlowInferenceEvidence[];
  completeness: VisualCompletenessReview;
  confidenceScore: number;
  recommendations: readonly string[];
}

export interface VisualReferenceHistoryEntry {
  analysisId: string;
  timestamp: string;
  uploadId: string | null;
  filename: string;
  platform: DetectedPlatform;
  completenessScore: number;
  confidenceScore: number;
}

export interface VisualReferenceIntelligenceReport {
  readOnly: true;
  generatedAt: string;
  totalAnalyses: number;
  latestAnalysis: VisualReferenceAnalysis | null;
  historySummary: {
    totalAnalyses: number;
    byPlatform: Record<DetectedPlatform, number>;
    averageCompletenessScore: number;
    averageConfidenceScore: number;
  };
}

export interface AnalyzeVisualReferenceInput {
  /** Upload id from upload-system after UPLOAD_ACCEPTED. */
  uploadId?: string | null;
  /** Direct image buffer when bypassing storage lookup. */
  content?: Buffer | Uint8Array | null;
  filename?: string;
  mimeType?: string;
  skipHistoryRecording?: boolean;
}

export interface VisualReferenceIntelligenceAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'VISUAL_REFERENCE_INTELLIGENCE_COMPLETE' | 'VISUAL_REFERENCE_INTELLIGENCE_FAILED';
  analysis: VisualReferenceAnalysis | null;
  failureReason: string | null;
}

export interface LuminanceGridSample {
  readOnly: true;
  gridSize: number;
  width: number;
  height: number;
  /** Row-major luminance values 0–255. */
  cells: readonly number[];
}
