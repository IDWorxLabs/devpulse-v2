/**
 * Voice Notes Intelligence — public API (V1).
 */

export {
  VOICE_NOTES_INTELLIGENCE_PASS_TOKEN,
  VOICE_NOTES_INTELLIGENCE_OWNER_MODULE,
  VOICE_NOTES_INTELLIGENCE_PHASE,
  VOICE_NOTES_INTELLIGENCE_REPORT_TITLE,
  MAX_VOICE_NOTES_HISTORY,
  SUPPORTED_VOICE_EXTENSIONS,
  VOICE_INTENT_TYPES,
  REQUIREMENT_CATEGORIES,
  SAFETY_GUARANTEES,
} from './voice-notes-registry.js';

export type {
  SupportedVoiceFormat,
  VoiceIntentType,
  ProductType,
  PlatformTarget,
  AudioMetadataEvidence,
  VoiceTranscript,
  IntentDetectionResult,
  ExtractedRequirements,
  MissingRequirementsReview,
  ClarifyingQuestion,
  ProjectUnderstandingSummary,
  VoiceNotesAnalysis,
  VoiceNotesHistoryEntry,
  VoiceNotesIntelligenceReport,
  AnalyzeVoiceNotesInput,
  VoiceNotesIntelligenceAssessment,
} from './voice-notes-types.js';

export {
  resetVoiceNotesHistoryForTests,
  recordVoiceNotesAnalysis,
  getVoiceNotesHistorySize,
  getVoiceNotesHistory,
  getVoiceNotesAnalyses,
  getLatestVoiceNotesAnalysis,
} from './voice-notes-history.js';

export {
  analyzeVoiceNotes,
  assessVoiceNotesIntelligence,
  buildVoiceNotesIntelligenceArtifacts,
  resetVoiceNotesCounterForTests,
  resetVoiceNotesIntelligenceModuleForTests,
} from './voice-notes-intelligence-authority.js';

export {
  buildVoiceNotesIntelligenceReport,
  buildVoiceNotesIntelligenceReportMarkdown,
} from './voice-notes-report-builder.js';

export { transcribeVoiceNote, extractEmbeddedTranscript } from './voice-transcription-authority.js';
export { detectVoiceIntents } from './intent-detection-authority.js';
export {
  extractRequirementsFromTranscript,
  identifyMissingRequirements,
  buildClarifyingQuestions,
} from './requirement-extraction-authority.js';
export { buildProjectUnderstandingSummary } from './project-understanding-builder.js';
export { extractAudioMetadata, resolveSupportedVoiceFormat } from './audio-metadata-reader.js';
