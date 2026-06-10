/**
 * Completion Truth Engine — completion evidence validator.
 */

import type {
  CompletionEvidenceValidation,
  RawCompletionEvidenceInput,
} from './completion-truth-types.js';
import { getCachedEvidenceValidation, setCachedEvidenceValidation } from './completion-truth-cache.js';

let evidenceValidationCount = 0;

export function validateCompletionEvidence(
  signals: RawCompletionEvidenceInput[] = [],
): CompletionEvidenceValidation {
  const cacheKey = signals.map((s) => `${s.source}:${s.strength}:${s.verified}`).join('|') || 'empty';
  const cached = getCachedEvidenceValidation(cacheKey);
  if (cached) return cached;

  evidenceValidationCount += 1;

  if (signals.length === 0) {
    const empty: CompletionEvidenceValidation = {
      evidenceCoverageScore: 0,
      evidenceQualityScore: 0,
      evidenceAgreementScore: 0,
    };
    setCachedEvidenceValidation(cacheKey, empty);
    return empty;
  }

  const strengths = signals.map((s) => s.strength ?? 50);
  const qualities = signals.map((s) => s.quality ?? s.strength ?? 50);
  const agreed = signals.filter((s) => s.agreement !== false).length;
  const verified = signals.filter((s) => s.verified === true).length;

  const evidenceCoverageScore = Math.min(100, Math.round((signals.length / 4) * 100));
  const evidenceQualityScore = Math.round(qualities.reduce((s, v) => s + v, 0) / qualities.length);
  const evidenceAgreementScore = Math.round((agreed / signals.length) * 80 + (verified / signals.length) * 20);
  const strengthBonus = Math.round(strengths.reduce((s, v) => s + v, 0) / strengths.length * 0.3);

  const result: CompletionEvidenceValidation = {
    evidenceCoverageScore: Math.min(100, evidenceCoverageScore + strengthBonus * 0.2),
    evidenceQualityScore: Math.min(100, evidenceQualityScore),
    evidenceAgreementScore: Math.min(100, evidenceAgreementScore),
  };

  setCachedEvidenceValidation(cacheKey, result);
  return result;
}

export function getEvidenceValidationCount(): number {
  return evidenceValidationCount;
}

export function resetCompletionEvidenceValidatorForTests(): void {
  evidenceValidationCount = 0;
}
