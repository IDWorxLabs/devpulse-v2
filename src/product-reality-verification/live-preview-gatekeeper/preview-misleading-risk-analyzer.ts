/**
 * Live Preview Gatekeeper — preview misleading risk analyzer.
 */

import type { LivePreviewInput, PreviewContext, PreviewMisleadingRiskAnalysis } from './live-preview-types.js';
import { PREVIEW_MISLEADING_RISK_PASS, clampScore } from './live-preview-types.js';
import { getCachedPreviewMisleadingRisk, setCachedPreviewMisleadingRisk } from './live-preview-cache.js';

export interface PreviewMisleadingRiskSnapshot {
  previewStateHonestyPresent: boolean;
  noFalseReadyCopyPresent: boolean;
  previewGateValidationPresent: boolean;
  previewDiagnosticsPresent: boolean;
}

let misleadingRiskAnalysisCount = 0;

export function analyzePreviewMisleadingRisk(
  input: LivePreviewInput,
  context: PreviewContext,
  snapshot: PreviewMisleadingRiskSnapshot,
): PreviewMisleadingRiskAnalysis {
  const cacheKey = [input.previewStaleRisk, input.previewFalseConfidence, input.previewCompletionMisleading, context.contextType].join('|');
  const cached = getCachedPreviewMisleadingRisk(cacheKey);
  if (cached) return cached;

  misleadingRiskAnalysisCount += 1;
  const misleadingProblems: string[] = [];
  let penalty = 0;

  const previewStaleRisk = input.previewStaleRisk === true;
  const previewFalseConfidence = input.previewFalseConfidence === true;
  const previewCompletionMisleading = input.previewCompletionMisleading === true;

  if (previewStaleRisk) { misleadingProblems.push('PREVIEW_STALE_RISK'); penalty += 22; }
  if (previewFalseConfidence) { misleadingProblems.push('PREVIEW_FALSE_CONFIDENCE'); penalty += 24; }
  if (previewCompletionMisleading) { misleadingProblems.push('PREVIEW_COMPLETION_MISLEADING'); penalty += 20; }

  const bonus =
    (snapshot.previewStateHonestyPresent ? 14 : 0)
    + (snapshot.noFalseReadyCopyPresent ? 12 : 0)
    + (snapshot.previewGateValidationPresent ? 10 : 0)
    + (snapshot.previewDiagnosticsPresent ? 8 : 0);

  const misleadingRiskScore = clampScore(80 + bonus - penalty);

  const result: PreviewMisleadingRiskAnalysis = {
    misleadingRiskScore,
    previewStaleRisk,
    previewFalseConfidence,
    previewCompletionMisleading,
    misleadingProblems,
    passToken: PREVIEW_MISLEADING_RISK_PASS,
  };
  setCachedPreviewMisleadingRisk(cacheKey, result);
  return result;
}

export function getMisleadingRiskAnalysisCount(): number {
  return misleadingRiskAnalysisCount;
}

export function resetPreviewMisleadingRiskAnalyzerForTests(): void {
  misleadingRiskAnalysisCount = 0;
}
