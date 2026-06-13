/**
 * Voice Notes Intelligence Authority — read-only voice intelligence orchestrator (V1).
 */

import { getStoredUpload, getStoredUploadContent } from '../upload-system/index.js';
import { detectVoiceIntents } from './intent-detection-authority.js';
import { buildProjectUnderstandingSummary } from './project-understanding-builder.js';
import {
  buildClarifyingQuestions,
  extractRequirementsFromTranscript,
  identifyMissingRequirements,
} from './requirement-extraction-authority.js';
import { resolveSupportedVoiceFormat } from './audio-metadata-reader.js';
import {
  getVoiceNotesAnalyses,
  getVoiceNotesHistory,
  recordVoiceNotesAnalysis,
} from './voice-notes-history.js';
import {
  buildVoiceNotesIntelligenceReport,
  buildVoiceNotesIntelligenceReportMarkdown,
} from './voice-notes-report-builder.js';
import { transcribeVoiceNote } from './voice-transcription-authority.js';
import type {
  AnalyzeVoiceNotesInput,
  MissingRequirementsReview,
  VoiceNotesAnalysis,
  VoiceNotesIntelligenceAssessment,
  VoiceNotesIntelligenceReport,
} from './voice-notes-types.js';

let analysisCounter = 0;

export function resetVoiceNotesCounterForTests(): void {
  analysisCounter = 0;
}

export function resetVoiceNotesIntelligenceModuleForTests(): void {
  resetVoiceNotesCounterForTests();
}

function nextAnalysisId(): string {
  analysisCounter += 1;
  return `voice-notes-${analysisCounter}`;
}

export function analyzeVoiceNotes(input: AnalyzeVoiceNotesInput): VoiceNotesAnalysis | null {
  let content: Buffer | null = null;
  let filename = input.filename ?? 'note.wav';
  let mimeType = input.mimeType ?? 'audio/wav';
  let uploadId: string | null = input.uploadId ?? null;

  if (input.content != null) {
    content = input.content instanceof Buffer ? input.content : Buffer.from(input.content);
  } else if (uploadId) {
    const record = getStoredUpload(uploadId);
    if (!record || record.verdict !== 'UPLOAD_ACCEPTED') return null;
    content = getStoredUploadContent(uploadId);
    filename = record.filename;
    mimeType = record.mimeType;
  }

  if (!content || content.length === 0) return null;

  const format = resolveSupportedVoiceFormat(filename, mimeType);
  if (!format) return null;

  const { metadata, transcript } = transcribeVoiceNote({
    buffer: content,
    filename,
    mimeType,
    transcriptFixture: input.transcriptFixture,
  });

  if (!transcript) return null;

  const intents = detectVoiceIntents(transcript.transcriptText);
  const requirements = extractRequirementsFromTranscript(transcript.transcriptText);
  const missing = identifyMissingRequirements(requirements);
  const projectUnderstanding = buildProjectUnderstandingSummary({
    transcript,
    requirements,
    intents,
  });

  const missingRequirements: MissingRequirementsReview = {
    readOnly: true,
    missingScreens: missing.missingScreens,
    missingFlows: missing.missingFlows,
    missingBusinessLogic: missing.missingBusinessLogic,
    unclearRequirements: missing.unclearRequirements,
  };

  const clarifyingQuestions = buildClarifyingQuestions({
    requirements,
    platformTargets: projectUnderstanding.platformTargets.filter((p) => p !== 'UNKNOWN'),
    missingScreens: missingRequirements.missingScreens,
    missingFlows: missingRequirements.missingFlows,
    missingBusinessLogic: missingRequirements.missingBusinessLogic,
    unclearRequirements: missingRequirements.unclearRequirements,
  });

  const analysis: VoiceNotesAnalysis = {
    readOnly: true,
    analysisId: nextAnalysisId(),
    uploadId,
    filename,
    analyzedAt: new Date().toISOString(),
    audioMetadata: metadata,
    transcript,
    intents,
    requirements,
    projectUnderstanding,
    missingRequirements,
    clarifyingQuestions,
  };

  if (!input.skipHistoryRecording) {
    recordVoiceNotesAnalysis(analysis);
  }

  return analysis;
}

export function assessVoiceNotesIntelligence(
  input: AnalyzeVoiceNotesInput = {},
): VoiceNotesIntelligenceAssessment {
  const analysis = analyzeVoiceNotes(input);

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: analysis ? 'VOICE_NOTES_INTELLIGENCE_COMPLETE' : 'VOICE_NOTES_INTELLIGENCE_FAILED',
    analysis,
    failureReason: analysis ? null : 'UNSUPPORTED_OR_UNTRANSCRIBABLE_VOICE_NOTE',
  };
}

export function buildVoiceNotesIntelligenceArtifacts(input: {
  analyses?: readonly VoiceNotesAnalysis[];
} = {}): {
  report: VoiceNotesIntelligenceReport;
  markdown: string;
} {
  const history = getVoiceNotesHistory();
  const storedAnalyses = input.analyses ?? getVoiceNotesAnalyses();
  const report = buildVoiceNotesIntelligenceReport({
    analyses: storedAnalyses,
    history,
  });

  const latestAnalyses =
    storedAnalyses.length > 0
      ? storedAnalyses
      : report.latestAnalysis
        ? [report.latestAnalysis]
        : [];

  return {
    report,
    markdown: buildVoiceNotesIntelligenceReportMarkdown(report, latestAnalyses),
  };
}
