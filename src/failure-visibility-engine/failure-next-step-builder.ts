/**
 * Failure next-step builder — advisory recovery steps (visibility only, no auto-fix).
 */

import type { FailureRecord, FailureSeverity } from './failure-visibility-types.js';

export function buildRecommendedNextStep(record: FailureRecord): string {
  switch (record.severity) {
    case 'Critical':
      return `Halt execution paths for "${record.title}" — validate governance gates and dependency prerequisites before any runtime change.`;
    case 'High':
      return `Resolve "${record.title}" by clearing blocked capabilities: ${record.blockedCapabilities.slice(0, 2).join('; ') || 'review dependency graph'}.`;
    case 'Moderate':
      return `Address "${record.title}" through phased validation — confirm affected systems before advancing.`;
    case 'Warning':
      return `Monitor "${record.title}" — defer risky moves until supporting intelligence foundations pass validation.`;
    default:
      return `Review "${record.title}" for informational follow-up — no immediate action required.`;
  }
}

export function buildAggregateNextStep(records: FailureRecord[]): string {
  if (records.length === 0) {
    return 'No visible failures — continue foundation intelligence validation.';
  }

  const critical = records.filter((r) => r.severity === 'Critical');
  if (critical.length > 0) {
    return `Address ${critical.length} critical failure(s) first: ${critical[0]!.title}. Visibility only — no auto-fix performed.`;
  }

  const high = records.filter((r) => r.severity === 'High');
  if (high.length > 0) {
    return `Prioritize high-severity failure: ${high[0]!.title}. Review blocked capabilities and dependency chains.`;
  }

  return `Review ${records.length} visible failure(s) — validate intelligence foundations before execution paths.`;
}

export function confidenceForSeverity(severity: FailureSeverity): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (severity === 'Critical' || severity === 'High') return 'HIGH';
  if (severity === 'Moderate' || severity === 'Warning') return 'MEDIUM';
  return 'LOW';
}
