/**
 * Validation Evidence Reuse Engine (VERE) V1 — human-readable session report.
 *
 * Aggregates a set of per-validator reuse outcomes into a single readable report: what was
 * requested, what was reused, what ran fresh, why anything was invalidated, and roughly how much
 * time reuse saved. Purely a summarizer — it never influences the reuse decision itself.
 */

import type { ValidationEvidenceCacheReport, ValidationEvidenceSessionEntry } from './validation-evidence-types.js';

export function buildValidationEvidenceCacheReport(entries: ValidationEvidenceSessionEntry[]): ValidationEvidenceCacheReport {
  const validatorsRequested = entries.map((entry) => entry.validatorName);
  const validatorsReused = entries.filter((entry) => entry.outcome.reused).map((entry) => entry.validatorName);
  const validatorsRunFresh = entries.filter((entry) => !entry.outcome.reused).map((entry) => entry.validatorName);
  const unsafeValidatorsSkippedFromReuse = entries
    .filter((entry) => !entry.outcome.reused && entry.outcome.invalidationReasons.some((reason) => reason.startsWith('FRESH_REQUIRED') || reason === 'NOT_REUSE_SAFE'))
    .map((entry) => entry.validatorName);

  const invalidationReasonsByValidator: Record<string, string[]> = {};
  for (const entry of entries) {
    if (entry.outcome.invalidationReasons.length > 0) {
      invalidationReasonsByValidator[entry.validatorName] = entry.outcome.invalidationReasons;
    }
  }

  const estimatedTimeSavedMs = entries.reduce((sum, entry) => sum + entry.outcome.timeSavedMs, 0);
  const finalStatus: 'PASSED' | 'FAILED' = entries.every((entry) => entry.outcome.status === 'PASSED') ? 'PASSED' : 'FAILED';

  return {
    validatorsRequested,
    validatorsReused,
    validatorsRunFresh,
    unsafeValidatorsSkippedFromReuse,
    cacheHitRate: validatorsRequested.length > 0 ? validatorsReused.length / validatorsRequested.length : 0,
    estimatedTimeSavedMs,
    invalidationReasonsByValidator,
    finalStatus,
  };
}

export function renderValidationEvidenceCacheReportText(report: ValidationEvidenceCacheReport): string {
  const lines: string[] = [];
  lines.push('Validation Evidence Reuse Report');
  lines.push('---------------------------------');
  lines.push(`Validators requested: ${report.validatorsRequested.length}`);
  lines.push(`Reused from cache: ${report.validatorsReused.length} (${report.validatorsReused.join(', ') || 'none'})`);
  lines.push(`Run fresh: ${report.validatorsRunFresh.length} (${report.validatorsRunFresh.join(', ') || 'none'})`);
  lines.push(`Unsafe / fresh-required (never eligible for reuse): ${report.unsafeValidatorsSkippedFromReuse.join(', ') || 'none'}`);
  lines.push(`Cache hit rate: ${(report.cacheHitRate * 100).toFixed(1)}%`);
  lines.push(`Estimated time saved: ${report.estimatedTimeSavedMs}ms`);
  const invalidationLines = Object.entries(report.invalidationReasonsByValidator).map(
    ([name, reasons]) => `  - ${name}: ${reasons.join(', ')}`,
  );
  lines.push(`Invalidation reasons:${invalidationLines.length > 0 ? `\n${invalidationLines.join('\n')}` : ' none'}`);
  lines.push(`Final status: ${report.finalStatus}`);
  return lines.join('\n');
}
