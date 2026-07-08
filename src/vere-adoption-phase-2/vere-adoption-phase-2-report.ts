/**
 * VERE Adoption Phase 2 — runtime reporting.
 *
 * Turns a batch of adopted-validator run results into an explainability listing (executed,
 * reused, invalidated, or skipped-as-unsafe, each with its exact reason) plus totals grouped by
 * risk class, so it is easy to see at a glance which categories of validator are contributing
 * reuse savings and which are (correctly) always running fresh.
 */

import { buildValidationEvidenceCacheReport, renderValidationEvidenceCacheReportText } from '../validation-evidence-reuse/index.js';
import type { ValidationEvidenceCacheReport, ValidationEvidenceReuseOutcome } from '../validation-evidence-reuse/index.js';
import type { Phase2AdoptedValidatorRunResult, Phase2ValidatorRiskClass } from './vere-adoption-phase-2-types.js';

export interface Phase2RiskClassTotals {
  riskClass: Phase2ValidatorRiskClass;
  total: number;
  executed: number;
  reused: number;
  invalidated: number;
  skippedUnsafe: number;
  timeSavedMs: number;
}

export interface VereAdoptionPhase2Report {
  executedValidators: string[];
  reusedValidators: string[];
  invalidatedValidators: Record<string, string[]>;
  unsafeOrNotOptedInValidators: string[];
  estimatedTimeSavedMs: number;
  cacheHitRate: number;
  finalStatus: 'PASSED' | 'FAILED';
  totalsByRiskClass: Phase2RiskClassTotals[];
  underlying: ValidationEvidenceCacheReport;
}

export function buildVereAdoptionPhase2Report(
  results: Array<Phase2AdoptedValidatorRunResult & { rawOutcome: ValidationEvidenceReuseOutcome }>,
): VereAdoptionPhase2Report {
  const sessionEntries = results.map((result) => ({ validatorName: result.validatorName, outcome: result.rawOutcome }));
  const underlying = buildValidationEvidenceCacheReport(sessionEntries);

  const invalidatedValidators: Record<string, string[]> = {};
  for (const result of results) {
    const isRealInvalidation =
      !result.reused && result.invalidationReasons.length > 0 && !result.invalidationReasons.some((r) => r.startsWith('FRESH_REQUIRED') || r === 'NOT_REUSE_SAFE');
    if (isRealInvalidation) {
      invalidatedValidators[result.validatorName] = result.invalidationReasons;
    }
  }

  const totalsByRiskClassMap = new Map<Phase2ValidatorRiskClass, Phase2RiskClassTotals>();
  for (const result of results) {
    const bucket = totalsByRiskClassMap.get(result.riskClass) ?? {
      riskClass: result.riskClass,
      total: 0,
      executed: 0,
      reused: 0,
      invalidated: 0,
      skippedUnsafe: 0,
      timeSavedMs: 0,
    };
    bucket.total += 1;
    if (result.outcomeKind === 'EXECUTED') bucket.executed += 1;
    if (result.outcomeKind === 'REUSED') bucket.reused += 1;
    if (result.outcomeKind === 'INVALIDATED') bucket.invalidated += 1;
    if (result.outcomeKind === 'SKIPPED_UNSAFE') bucket.skippedUnsafe += 1;
    bucket.timeSavedMs += result.timeSavedMs;
    totalsByRiskClassMap.set(result.riskClass, bucket);
  }

  return {
    executedValidators: underlying.validatorsRunFresh,
    reusedValidators: underlying.validatorsReused,
    invalidatedValidators,
    unsafeOrNotOptedInValidators: underlying.unsafeValidatorsSkippedFromReuse,
    estimatedTimeSavedMs: underlying.estimatedTimeSavedMs,
    cacheHitRate: underlying.cacheHitRate,
    finalStatus: results.every((result) => result.ok) ? 'PASSED' : 'FAILED',
    totalsByRiskClass: Array.from(totalsByRiskClassMap.values()),
    underlying,
  };
}

export function renderVereAdoptionPhase2ReportText(report: VereAdoptionPhase2Report): string {
  const lines: string[] = [];
  lines.push('VERE Adoption Phase 2 — Runtime Report');
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
  lines.push('Totals by risk class:');
  for (const bucket of report.totalsByRiskClass) {
    lines.push(
      `  ${bucket.riskClass}: total=${bucket.total} executed=${bucket.executed} reused=${bucket.reused} invalidated=${bucket.invalidated} skippedUnsafe=${bucket.skippedUnsafe} timeSavedMs=${bucket.timeSavedMs}`,
    );
  }
  lines.push(`Final status: ${report.finalStatus}`);
  return lines.join('\n');
}

export function renderVereAdoptionPhase2ExplainabilityText(
  results: Array<Pick<Phase2AdoptedValidatorRunResult, 'validatorName' | 'riskClass' | 'outcomeKind' | 'reused' | 'invalidationReasons' | 'timeSavedMs' | 'detail'>>,
): string {
  const lines: string[] = ['VERE Adoption Phase 2 — Explainability'];
  lines.push('---------------------------------------');
  for (const result of results) {
    const reasonText = result.invalidationReasons.length > 0 ? ` (${result.invalidationReasons.join(', ')})` : ` (${result.detail})`;
    const savedText = result.outcomeKind === 'REUSED' && result.timeSavedMs > 0 ? ` — estimated time saved: ${result.timeSavedMs}ms` : '';
    lines.push(`${result.validatorName} [${result.riskClass}]: ${result.outcomeKind}${reasonText}${savedText}`);
  }
  return lines.join('\n');
}

export { renderValidationEvidenceCacheReportText };
