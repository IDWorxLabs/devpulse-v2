/**
 * VERE Adoption Phase 1 — runtime reporting.
 *
 * Turns a batch of adopted-validator run results into the four buckets a developer actually
 * cares about (executed, reused, invalidated, unsafe/not-opted-in), plus an explainability
 * listing of concrete reuse/reject reasons per validator.
 */

import { buildValidationEvidenceCacheReport, renderValidationEvidenceCacheReportText } from '../validation-evidence-reuse/index.js';
import type { ValidationEvidenceCacheReport, ValidationEvidenceReuseOutcome } from '../validation-evidence-reuse/index.js';
import type { AdoptedValidatorExplanation, AdoptedValidatorRunResult } from './vere-adoption-types.js';

export interface VereAdoptionReport {
  executedValidators: string[];
  reusedValidators: string[];
  invalidatedValidators: Record<string, string[]>;
  unsafeOrNotOptedInValidators: string[];
  estimatedTimeSavedMs: number;
  cacheHitRate: number;
  finalStatus: 'PASSED' | 'FAILED';
  underlying: ValidationEvidenceCacheReport;
}

export function buildVereAdoptionReport(
  results: Array<AdoptedValidatorRunResult & { rawOutcome: ValidationEvidenceReuseOutcome }>,
): VereAdoptionReport {
  const sessionEntries = results.map((result) => ({ validatorName: result.validatorName, outcome: result.rawOutcome }));
  const underlying = buildValidationEvidenceCacheReport(sessionEntries);

  const invalidatedValidators: Record<string, string[]> = {};
  for (const result of results) {
    const isRealInvalidation = !result.reused && result.invalidationReasons.length > 0 && !result.invalidationReasons.some((r) => r.startsWith('FRESH_REQUIRED') || r === 'NOT_REUSE_SAFE');
    if (isRealInvalidation) {
      invalidatedValidators[result.validatorName] = result.invalidationReasons;
    }
  }

  return {
    executedValidators: underlying.validatorsRunFresh,
    reusedValidators: underlying.validatorsReused,
    invalidatedValidators,
    unsafeOrNotOptedInValidators: underlying.unsafeValidatorsSkippedFromReuse,
    estimatedTimeSavedMs: underlying.estimatedTimeSavedMs,
    cacheHitRate: underlying.cacheHitRate,
    finalStatus: results.every((result) => result.ok) ? 'PASSED' : 'FAILED',
    underlying,
  };
}

export function renderVereAdoptionReportText(report: VereAdoptionReport): string {
  const lines: string[] = [];
  lines.push('VERE Adoption Phase 1 — Runtime Report');
  lines.push('---------------------------------------');
  lines.push(`Executed (ran fresh): ${report.executedValidators.join(', ') || 'none'}`);
  lines.push(`Reused (cache hit): ${report.reusedValidators.join(', ') || 'none'}`);
  const invalidatedEntries = Object.entries(report.invalidatedValidators);
  lines.push(
    `Invalidated (ran fresh because evidence no longer matched): ${
      invalidatedEntries.length > 0 ? invalidatedEntries.map(([name, reasons]) => `${name} [${reasons.join(', ')}]`).join('; ') : 'none'
    }`,
  );
  lines.push(`Unsafe / not opted-in (never eligible for reuse): ${report.unsafeOrNotOptedInValidators.join(', ') || 'none'}`);
  lines.push(`Cache hit rate: ${(report.cacheHitRate * 100).toFixed(1)}%`);
  lines.push(`Estimated time saved: ${report.estimatedTimeSavedMs}ms`);
  lines.push(`Final status: ${report.finalStatus}`);
  return lines.join('\n');
}

export function renderVereAdoptionExplainabilityText(explanations: AdoptedValidatorExplanation[]): string {
  const lines: string[] = ['VERE Adoption Phase 1 — Explainability'];
  lines.push('---------------------------------------');
  for (const explanation of explanations) {
    const verdict = explanation.wouldReuse ? 'WOULD REUSE' : 'WOULD RUN FRESH';
    const reasonText = explanation.reasons.length > 0 ? ` (${explanation.reasons.join(', ')})` : '';
    lines.push(`${explanation.validatorName}: ${verdict}${reasonText}`);
  }
  return lines.join('\n');
}

export { renderValidationEvidenceCacheReportText };
