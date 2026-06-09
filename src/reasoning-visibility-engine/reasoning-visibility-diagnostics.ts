/**
 * Reasoning Visibility Engine diagnostics.
 */

import type { ReasoningVisibilityDiagnostics, ReasoningVisibilityRecord } from './reasoning-visibility-types.js';

let diagnostics: ReasoningVisibilityDiagnostics = {
  reasoningVisibilityActive: false,
  reasoningCount: 0,
  evidenceCount: 0,
  blockerCount: 0,
  riskCount: 0,
  lastReasoningSource: null,
  lastQuery: null,
};

export function getReasoningVisibilityDiagnostics(): ReasoningVisibilityDiagnostics {
  return { ...diagnostics };
}

export function updateReasoningVisibilityDiagnostics(
  query: string,
  records: ReasoningVisibilityRecord[],
): void {
  const evidenceCount = records.reduce((sum, r) => sum + r.evidence.length, 0);
  const blockerCount = records.reduce((sum, r) => sum + r.blockers.length, 0);
  const riskCount = records.reduce((sum, r) => sum + r.risks.length, 0);

  diagnostics = {
    reasoningVisibilityActive: true,
    reasoningCount: records.length,
    evidenceCount,
    blockerCount,
    riskCount,
    lastReasoningSource: records[0]?.sourceSystem ?? null,
    lastQuery: query,
  };
}

export function resetReasoningVisibilityDiagnostics(): void {
  diagnostics = {
    reasoningVisibilityActive: false,
    reasoningCount: 0,
    evidenceCount: 0,
    blockerCount: 0,
    riskCount: 0,
    lastReasoningSource: null,
    lastQuery: null,
  };
}

export function reasoningVisibilityKey(): string {
  const d = diagnostics;
  return [
    String(d.reasoningVisibilityActive),
    String(d.reasoningCount),
    String(d.evidenceCount),
    String(d.blockerCount),
    String(d.riskCount),
  ].join('|');
}
