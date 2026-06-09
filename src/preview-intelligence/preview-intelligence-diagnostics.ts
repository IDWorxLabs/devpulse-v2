/**
 * Preview intelligence diagnostics tracker.
 */

import type { PreviewIntelligenceDiagnostics, PreviewReadinessLevel } from './types.js';

let diagnostics: PreviewIntelligenceDiagnostics = {
  previewIntelligenceActive: false,
  intelligenceReportCount: 0,
  blockedIntelligenceCount: 0,
  readyForObservationCount: 0,
  lastQuery: null,
  lastReadinessLevel: null,
};

export function previewIntelligenceKey(): string {
  return 'preview_intelligence';
}

export function getPreviewIntelligenceDiagnostics(): PreviewIntelligenceDiagnostics {
  return { ...diagnostics };
}

export function resetPreviewIntelligenceDiagnostics(): void {
  diagnostics = {
    previewIntelligenceActive: false,
    intelligenceReportCount: 0,
    blockedIntelligenceCount: 0,
    readyForObservationCount: 0,
    lastQuery: null,
    lastReadinessLevel: null,
  };
}

export function updatePreviewIntelligenceDiagnostics(
  query: string,
  readinessLevel: PreviewReadinessLevel,
): void {
  diagnostics.previewIntelligenceActive = true;
  diagnostics.intelligenceReportCount += 1;
  diagnostics.lastQuery = query;
  diagnostics.lastReadinessLevel = readinessLevel;
  if (readinessLevel === 'BLOCKED') {
    diagnostics.blockedIntelligenceCount += 1;
  }
  if (readinessLevel === 'READY_FOR_OBSERVATION' || readinessLevel === 'READY_FOR_FUTURE_SELF_VISION') {
    diagnostics.readyForObservationCount += 1;
  }
}
