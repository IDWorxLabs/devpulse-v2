/**
 * Contract-to-Module Traceability Authority V1 — finding deduplication.
 */

import type { TraceabilityFinding } from './contract-to-module-traceability-types.js';

export function generateTraceabilityFindings(findings: readonly TraceabilityFinding[]): TraceabilityFinding[] {
  const byRoot = new Map<string, TraceabilityFinding>();
  for (const finding of findings) {
    const key = `${finding.diagnosticCode}|${finding.firstBrokenBoundary}|${finding.expectedNodeId}`;
    if (!byRoot.has(key)) byRoot.set(key, finding);
  }
  return [...byRoot.values()].sort((a, b) => a.findingId.localeCompare(b.findingId));
}

export function detectTraceabilityAliasConflict(): string[] {
  return [];
}
