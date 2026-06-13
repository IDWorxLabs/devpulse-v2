/**
 * Voice Notes Intelligence — foundation types (V1).
 * Read-only transcription and requirement understanding — no code generation.
 */

export type SupportedVoiceFormat = 'MP3' | 'WAV' | 'M4A' | 'OGG';

export type VoiceIntentType =
  | 'BUILD_REQUEST'
  | 'FEATURE_REQUEST'
  | 'BUG_REPORT'
  | 'ROADMAP_REQUEST'
  | 'DESIGN_REQUEST'
  | 'PLANNING_REQUEST';

export type ProductType =
  | 'MOBILE_APP'
  | 'WEB_APP'
  | 'SAAS_PLATFORM'
  | 'INTERNAL_TOOL'
  | 'MARKETPLACE'
  | 'UNKNOWN';

export type PlatformTarget = 'IOS' | 'ANDROID' | 'WEB' | 'DESKTOP' | 'CROSS_PLATFORM' | 'UNKNOWN';

export interface AudioMetadataEvidence {
  readOnly: true;
  format: SupportedVoiceFormat | null;
  durationSeconds: number;
  byteLength: number;
  sampleRate: number | null;
  channels: number | null;
}

export interface VoiceTranscript {
  readOnly: true;
  transcriptText: string;
  confidence: number;
  durationSeconds: number;
  wordCount: number;
  evidence: readonly string[];
}

export interface IntentDetectionResult {
  readOnly: true;
  primaryIntent: VoiceIntentType;
  detectedIntents: readonly {
    intent: VoiceIntentType;
    confidence: number;
    evidence: readonly string[];
  }[];
}

export interface ExtractedRequirements {
  readOnly: true;
  screens: readonly string[];
  userRoles: readonly string[];
  workflows: readonly string[];
  businessRules: readonly string[];
  integrations: readonly string[];
  notifications: readonly string[];
  authentication: readonly string[];
  dataEntities: readonly string[];
}

export interface MissingRequirementsReview {
  readOnly: true;
  missingScreens: readonly string[];
  missingFlows: readonly string[];
  missingBusinessLogic: readonly string[];
  unclearRequirements: readonly string[];
}

export interface ClarifyingQuestion {
  readOnly: true;
  question: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: readonly string[];
}

export interface ProjectUnderstandingSummary {
  readOnly: true;
  productType: ProductType;
  platformTargets: readonly PlatformTarget[];
  keyWorkflows: readonly string[];
  featureInventory: readonly string[];
  confidenceScore: number;
}

export interface VoiceNotesAnalysis {
  readOnly: true;
  analysisId: string;
  uploadId: string | null;
  filename: string;
  analyzedAt: string;
  audioMetadata: AudioMetadataEvidence;
  transcript: VoiceTranscript;
  intents: IntentDetectionResult;
  requirements: ExtractedRequirements;
  projectUnderstanding: ProjectUnderstandingSummary;
  missingRequirements: MissingRequirementsReview;
  clarifyingQuestions: readonly ClarifyingQuestion[];
}

export interface VoiceNotesHistoryEntry {
  analysisId: string;
  timestamp: string;
  uploadId: string | null;
  filename: string;
  primaryIntent: VoiceIntentType;
  confidenceScore: number;
  wordCount: number;
}

export interface VoiceNotesIntelligenceReport {
  readOnly: true;
  generatedAt: string;
  totalAnalyses: number;
  latestAnalysis: VoiceNotesAnalysis | null;
  historySummary: {
    totalAnalyses: number;
    byIntent: Record<VoiceIntentType, number>;
    averageConfidenceScore: number;
  };
}

export interface AnalyzeVoiceNotesInput {
  uploadId?: string | null;
  content?: Buffer | Uint8Array | null;
  filename?: string;
  mimeType?: string;
  /** Test-only transcript override when audio has no embedded transcript marker. */
  transcriptFixture?: string | null;
  skipHistoryRecording?: boolean;
}

export interface VoiceNotesIntelligenceAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'VOICE_NOTES_INTELLIGENCE_COMPLETE' | 'VOICE_NOTES_INTELLIGENCE_FAILED';
  analysis: VoiceNotesAnalysis | null;
  failureReason: string | null;
}
