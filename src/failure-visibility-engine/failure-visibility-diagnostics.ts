/**
 * Failure Visibility diagnostics.
 */

import { compareFailureSeverity } from './failure-visibility-types.js';
import type { FailureRecord, FailureVisibilityDiagnostics } from './failure-visibility-types.js';

let diagnostics: FailureVisibilityDiagnostics = {
  failureVisibilityActive: false,
  failureCount: 0,
  criticalFailureCount: 0,
  blockedCapabilityCount: 0,
  mostSevereFailure: null,
  lastFailureQuery: null,
};

export function getFailureVisibilityDiagnostics(): FailureVisibilityDiagnostics {
  return { ...diagnostics };
}

export function updateFailureVisibilityDiagnostics(query: string, records: FailureRecord[]): void {
  const criticalCount = records.filter((r) => r.severity === 'Critical').length;
  const blockedCaps = new Set(records.flatMap((r) => r.blockedCapabilities));

  let mostSevere: FailureRecord | null = null;
  for (const r of records) {
    if (!mostSevere || compareFailureSeverity(r.severity, mostSevere.severity) > 0) {
      mostSevere = r;
    }
  }

  diagnostics = {
    failureVisibilityActive: true,
    failureCount: records.length,
    criticalFailureCount: criticalCount,
    blockedCapabilityCount: blockedCaps.size,
    mostSevereFailure: mostSevere?.title ?? null,
    lastFailureQuery: query,
  };
}

export function resetFailureVisibilityDiagnostics(): void {
  diagnostics = {
    failureVisibilityActive: false,
    failureCount: 0,
    criticalFailureCount: 0,
    blockedCapabilityCount: 0,
    mostSevereFailure: null,
    lastFailureQuery: null,
  };
}

export function failureVisibilityKey(): string {
  const d = diagnostics;
  return [
    String(d.failureVisibilityActive),
    String(d.failureCount),
    String(d.criticalFailureCount),
    String(d.blockedCapabilityCount),
  ].join('|');
}
