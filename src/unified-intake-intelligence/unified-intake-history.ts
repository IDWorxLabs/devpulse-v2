/**
 * Unified Intake History — bounded analysis history (max 32).
 */

import { MAX_UNIFIED_INTAKE_HISTORY } from './unified-intake-registry.js';
import type { UnifiedIntakeAnalysis, UnifiedIntakeHistoryEntry } from './unified-intake-types.js';

const history: UnifiedIntakeHistoryEntry[] = [];
const analyses: UnifiedIntakeAnalysis[] = [];

export function resetUnifiedIntakeHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordUnifiedIntakeAnalysis(analysis: UnifiedIntakeAnalysis): void {
  const entry: UnifiedIntakeHistoryEntry = {
    analysisId: analysis.analysisId,
    timestamp: analysis.analyzedAt,
    applicationType: analysis.projectIntent.applicationType,
    unifiedIntakeConfidence: analysis.unifiedIntakeConfidence,
    intakeReadiness: analysis.intakeReadiness,
    conflictCount: analysis.evidenceConflicts.length,
    gapCount: analysis.intakeGaps.length,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_UNIFIED_INTAKE_HISTORY) {
    history.length = MAX_UNIFIED_INTAKE_HISTORY;
  }
  if (analyses.length > MAX_UNIFIED_INTAKE_HISTORY) {
    analyses.length = MAX_UNIFIED_INTAKE_HISTORY;
  }
}

export function getUnifiedIntakeHistorySize(): number {
  return history.length;
}

export function getUnifiedIntakeHistory(): readonly UnifiedIntakeHistoryEntry[] {
  return [...history];
}

export function getUnifiedIntakeAnalyses(): readonly UnifiedIntakeAnalysis[] {
  return [...analyses];
}

export function getLatestUnifiedIntakeAnalysis(): UnifiedIntakeAnalysis | null {
  return analyses[0] ?? null;
}
