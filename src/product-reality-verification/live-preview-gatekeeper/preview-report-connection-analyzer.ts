/**
 * Live Preview Gatekeeper — preview report connection analyzer.
 */

import type { LivePreviewInput, PreviewContext, PreviewReportConnectionAnalysis } from './live-preview-types.js';
import { PREVIEW_REPORT_CONNECTION_PASS, clampScore } from './live-preview-types.js';
import { getCachedPreviewReportConnection, setCachedPreviewReportConnection } from './live-preview-cache.js';

export interface PreviewReportConnectionSnapshot {
  visualQaUpstreamPresent: boolean;
  uxHeuristicUpstreamPresent: boolean;
  firstImpressionUpstreamPresent: boolean;
  uvlRowsPresent: boolean;
}

let reportConnectionAnalysisCount = 0;

export function analyzePreviewReportConnection(
  input: LivePreviewInput,
  context: PreviewContext,
  snapshot: PreviewReportConnectionSnapshot,
): PreviewReportConnectionAnalysis {
  const cacheKey = [input.previewReportDisconnected, input.previewEvidenceNotTraceable, context.contextType].join('|');
  const cached = getCachedPreviewReportConnection(cacheKey);
  if (cached) return cached;

  reportConnectionAnalysisCount += 1;
  const reportConnectionProblems: string[] = [];
  let penalty = 0;

  const previewReportDisconnected = input.previewReportDisconnected === true;
  const previewEvidenceNotTraceable = input.previewEvidenceNotTraceable === true;

  if (previewReportDisconnected) { reportConnectionProblems.push('PREVIEW_REPORT_DISCONNECTED'); penalty += 24; }
  if (previewEvidenceNotTraceable) { reportConnectionProblems.push('PREVIEW_EVIDENCE_NOT_TRACEABLE'); penalty += 22; }

  const bonus =
    (snapshot.visualQaUpstreamPresent ? 12 : 0)
    + (snapshot.uxHeuristicUpstreamPresent ? 12 : 0)
    + (snapshot.firstImpressionUpstreamPresent ? 12 : 0)
    + (snapshot.uvlRowsPresent ? 14 : 0);

  const previewReportConnectionScore = clampScore(72 + bonus - penalty);

  const result: PreviewReportConnectionAnalysis = {
    previewReportConnectionScore,
    previewReportDisconnected,
    previewEvidenceNotTraceable,
    reportConnectionProblems,
    passToken: PREVIEW_REPORT_CONNECTION_PASS,
  };
  setCachedPreviewReportConnection(cacheKey, result);
  return result;
}

export function getReportConnectionAnalysisCount(): number {
  return reportConnectionAnalysisCount;
}

export function resetPreviewReportConnectionAnalyzerForTests(): void {
  reportConnectionAnalysisCount = 0;
}
