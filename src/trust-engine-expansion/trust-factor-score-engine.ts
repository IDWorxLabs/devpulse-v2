/**
 * Trust factor score engine — creates weighted factor scores from signal evaluation.
 * Aggregation only. No auto-fix.
 */

import type { TrustFactorScore, TrustFactorType } from './types.js';
import { KNOWN_TRUST_FACTORS, POSITIVE_TRUST_FACTORS, TRUST_FACTOR_WEIGHTS, nextFactorId } from './types.js';
import type { TrustSignalEvaluationResult } from './trust-signal-engine.js';
import { isRiskFactor } from './trust-signal-engine.js';

export function factorScoresKey(factors: TrustFactorScore[]): string {
  return factors.map((f) => `${f.factorType}:${f.factorScore}:${f.sourceSignalCount}`).sort().join(';');
}

function computeFactorScore(factorType: TrustFactorType, rawValue: number): number {
  const weight = TRUST_FACTOR_WEIGHTS[factorType] ?? 0.05;
  const normalized = Math.min(100, Math.max(0, rawValue * weight * 10));
  return Math.round(normalized * 100) / 100;
}

function factorReason(factorType: TrustFactorType, rawValue: number, signalCount: number): string {
  const direction = isRiskFactor(factorType) ? 'risk pressure' : 'trust support';
  return `${factorType.replace(/_/g, ' ').toLowerCase()}: ${rawValue} from ${signalCount} signal(s) — ${direction}`;
}

export function createTrustFactorScores(signalEval: TrustSignalEvaluationResult): TrustFactorScore[] {
  const factors: TrustFactorScore[] = [];

  for (const factorType of KNOWN_TRUST_FACTORS) {
    const rawValue = signalEval.factorValues[factorType];
    const signalCount = signalEval.factorSignalCounts[factorType] ?? 0;
    if (rawValue === undefined || rawValue <= 0) continue;

    factors.push({
      factorId: nextFactorId(),
      factorType,
      factorScore: computeFactorScore(factorType, rawValue),
      factorWeight: TRUST_FACTOR_WEIGHTS[factorType],
      factorReason: factorReason(factorType, rawValue, signalCount),
      sourceSignalCount: signalCount,
    });
  }

  if (factors.length === 0) {
    factors.push({
      factorId: nextFactorId(),
      factorType: 'EVIDENCE_QUALITY',
      factorScore: computeFactorScore('EVIDENCE_QUALITY', 3),
      factorWeight: TRUST_FACTOR_WEIGHTS.EVIDENCE_QUALITY,
      factorReason: 'Baseline evidence quality from general trust signals',
      sourceSignalCount: signalEval.evaluatedSignals.length,
    });
  }

  return factors.sort((a, b) => b.factorScore - a.factorScore);
}

export function countPositiveFactors(factors: TrustFactorScore[]): number {
  return factors.filter((f) => (POSITIVE_TRUST_FACTORS as readonly string[]).includes(f.factorType)).length;
}

export function countRiskFactors(factors: TrustFactorScore[]): number {
  return factors.filter((f) => isRiskFactor(f.factorType)).length;
}

export function getFactorByType(factors: TrustFactorScore[], type: TrustFactorType): TrustFactorScore | null {
  return factors.find((f) => f.factorType === type) ?? null;
}

export function isEvidenceQualityFactor(type: TrustFactorType): boolean {
  return type === 'EVIDENCE_QUALITY';
}

export function isVerificationStrengthFactor(type: TrustFactorType): boolean {
  return type === 'VERIFICATION_STRENGTH';
}

export function isPredictionRiskFactor(type: TrustFactorType): boolean {
  return type === 'PREDICTION_RISK';
}
