/**
 * Visual Reference History — bounded analysis history (max 32).
 */

import { MAX_VISUAL_REFERENCE_HISTORY } from './visual-reference-registry.js';
import type { VisualReferenceAnalysis, VisualReferenceHistoryEntry } from './visual-reference-types.js';

const history: VisualReferenceHistoryEntry[] = [];
const analyses: VisualReferenceAnalysis[] = [];

export function resetVisualReferenceHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordVisualReferenceAnalysis(analysis: VisualReferenceAnalysis): void {
  const entry: VisualReferenceHistoryEntry = {
    analysisId: analysis.analysisId,
    timestamp: analysis.analyzedAt,
    uploadId: analysis.uploadId,
    filename: analysis.filename,
    platform: analysis.screenDetection.platform,
    completenessScore: analysis.completeness.visualCompletenessScore,
    confidenceScore: analysis.confidenceScore,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_VISUAL_REFERENCE_HISTORY) {
    history.length = MAX_VISUAL_REFERENCE_HISTORY;
  }
  if (analyses.length > MAX_VISUAL_REFERENCE_HISTORY) {
    analyses.length = MAX_VISUAL_REFERENCE_HISTORY;
  }
}

export function getVisualReferenceHistorySize(): number {
  return history.length;
}

export function getVisualReferenceHistory(): readonly VisualReferenceHistoryEntry[] {
  return [...history];
}

export function getVisualReferenceAnalyses(): readonly VisualReferenceAnalysis[] {
  return [...analyses];
}

export function getLatestVisualReferenceAnalysis(): VisualReferenceAnalysis | null {
  return analyses[0] ?? null;
}
