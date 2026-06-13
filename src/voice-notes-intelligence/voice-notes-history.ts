/**
 * Voice Notes History — bounded analysis history (max 32).
 */

import { MAX_VOICE_NOTES_HISTORY } from './voice-notes-registry.js';
import type { VoiceNotesAnalysis, VoiceNotesHistoryEntry } from './voice-notes-types.js';

const history: VoiceNotesHistoryEntry[] = [];
const analyses: VoiceNotesAnalysis[] = [];

export function resetVoiceNotesHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordVoiceNotesAnalysis(analysis: VoiceNotesAnalysis): void {
  const entry: VoiceNotesHistoryEntry = {
    analysisId: analysis.analysisId,
    timestamp: analysis.analyzedAt,
    uploadId: analysis.uploadId,
    filename: analysis.filename,
    primaryIntent: analysis.intents.primaryIntent,
    confidenceScore: analysis.projectUnderstanding.confidenceScore,
    wordCount: analysis.transcript.wordCount,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_VOICE_NOTES_HISTORY) {
    history.length = MAX_VOICE_NOTES_HISTORY;
  }
  if (analyses.length > MAX_VOICE_NOTES_HISTORY) {
    analyses.length = MAX_VOICE_NOTES_HISTORY;
  }
}

export function getVoiceNotesHistorySize(): number {
  return history.length;
}

export function getVoiceNotesHistory(): readonly VoiceNotesHistoryEntry[] {
  return [...history];
}

export function getVoiceNotesAnalyses(): readonly VoiceNotesAnalysis[] {
  return [...analyses];
}

export function getLatestVoiceNotesAnalysis(): VoiceNotesAnalysis | null {
  return analyses[0] ?? null;
}
