/**
 * Mobile Preview History — bounded analysis history (max 32).
 */

import { MAX_MOBILE_PREVIEW_HISTORY } from './mobile-preview-registry.js';
import type { MobilePreviewAnalysis, MobilePreviewHistoryEntry } from './mobile-preview-types.js';

const history: MobilePreviewHistoryEntry[] = [];
const analyses: MobilePreviewAnalysis[] = [];

export function resetMobilePreviewHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordMobilePreviewAnalysis(analysis: MobilePreviewAnalysis): void {
  const entry: MobilePreviewHistoryEntry = {
    analysisId: analysis.analysisId,
    timestamp: analysis.analyzedAt,
    previewReadinessScore: analysis.previewReadinessScore,
    mobilePreviewReadiness: analysis.mobilePreviewReadiness,
    navigationUsabilityScore: analysis.navigationReview.navigationUsabilityScore,
    riskCount: analysis.responsiveRiskAnalysis.riskCount,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_MOBILE_PREVIEW_HISTORY) {
    history.length = MAX_MOBILE_PREVIEW_HISTORY;
  }
  if (analyses.length > MAX_MOBILE_PREVIEW_HISTORY) {
    analyses.length = MAX_MOBILE_PREVIEW_HISTORY;
  }
}

export function getMobilePreviewHistorySize(): number {
  return history.length;
}

export function getMobilePreviewHistory(): readonly MobilePreviewHistoryEntry[] {
  return [...history];
}

export function getMobilePreviewAnalyses(): readonly MobilePreviewAnalysis[] {
  return [...analyses];
}

export function getLatestMobilePreviewAnalysis(): MobilePreviewAnalysis | null {
  return analyses[0] ?? null;
}
