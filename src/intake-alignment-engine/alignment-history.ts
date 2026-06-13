/**
 * Intake Alignment History — bounded analysis history (max 32).
 */

import { MAX_INTAKE_ALIGNMENT_HISTORY } from './intake-alignment-registry.js';
import type { IntakeAlignmentAnalysis, IntakeAlignmentHistoryEntry } from './intake-alignment-types.js';

const history: IntakeAlignmentHistoryEntry[] = [];
const analyses: IntakeAlignmentAnalysis[] = [];

export function resetIntakeAlignmentHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordIntakeAlignmentAnalysis(analysis: IntakeAlignmentAnalysis): void {
  const entry: IntakeAlignmentHistoryEntry = {
    analysisId: analysis.analysisId,
    timestamp: analysis.analyzedAt,
    alignmentScore: analysis.alignmentScore,
    alignmentCategory: analysis.alignmentCategory,
    alignedConfidence: analysis.alignedConfidence,
    falseConflictCount: analysis.falseConflictCount,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_INTAKE_ALIGNMENT_HISTORY) {
    history.length = MAX_INTAKE_ALIGNMENT_HISTORY;
  }
  if (analyses.length > MAX_INTAKE_ALIGNMENT_HISTORY) {
    analyses.length = MAX_INTAKE_ALIGNMENT_HISTORY;
  }
}

export function getIntakeAlignmentHistorySize(): number {
  return history.length;
}

export function getIntakeAlignmentHistory(): readonly IntakeAlignmentHistoryEntry[] {
  return [...history];
}

export function getIntakeAlignmentAnalyses(): readonly IntakeAlignmentAnalysis[] {
  return [...analyses];
}

export function getLatestIntakeAlignmentAnalysis(): IntakeAlignmentAnalysis | null {
  return analyses[0] ?? null;
}
