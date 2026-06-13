/**
 * Connected Preview Experience Proof — bounded history.
 */

import { MAX_PREVIEW_EXPERIENCE_PROOF_HISTORY } from './connected-preview-experience-proof-registry.js';
import type {
  PreviewExperienceProofAssessment,
  PreviewExperienceProofHistoryEntry,
  PreviewExperienceProofHistorySummary,
} from './connected-preview-experience-proof-types.js';

const history: PreviewExperienceProofHistoryEntry[] = [];

export function resetPreviewExperienceProofHistoryForTests(): void {
  history.length = 0;
}

export function recordPreviewExperienceProofAssessment(
  assessment: PreviewExperienceProofAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    previewProofLevel: report.previewProofLevel,
    previewState: report.previewState,
    previewLinkageConnected: report.linkage.previewLinkageConnected,
  });
  if (history.length > MAX_PREVIEW_EXPERIENCE_PROOF_HISTORY) {
    history.length = MAX_PREVIEW_EXPERIENCE_PROOF_HISTORY;
  }
}

export function getPreviewExperienceProofHistorySize(): number {
  return history.length;
}

export function buildPreviewExperienceProofHistorySummary(
  entries: readonly PreviewExperienceProofHistoryEntry[] = history,
): PreviewExperienceProofHistorySummary {
  return {
    totalAssessments: entries.length,
    provenPreviews: entries.filter((e) => e.previewProofLevel === 'PROVEN').length,
    partialPreviews: entries.filter((e) => e.previewProofLevel === 'PARTIAL').length,
    notProvenPreviews: entries.filter((e) => e.previewProofLevel === 'NOT_PROVEN').length,
  };
}
