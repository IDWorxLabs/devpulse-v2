/**
 * Trust score engine — aggregates factor scores into 0–100 unified trust score.
 * Deterministic scoring only. No execution.
 */

import type { TrustFactorScore, TrustLevel, TrustRiskLevel } from './types.js';
import { POSITIVE_TRUST_FACTORS, TRUST_LEVEL_THRESHOLDS } from './types.js';
import { isRiskFactor } from './trust-signal-engine.js';

const BASE_TRUST_SCORE = 50;

export function aggregateTrustScore(factors: TrustFactorScore[]): number {
  if (factors.length === 0) return BASE_TRUST_SCORE;

  let score = BASE_TRUST_SCORE;

  for (const factor of factors) {
    const contribution = factor.factorScore * factor.factorWeight * 10;
    if ((POSITIVE_TRUST_FACTORS as readonly string[]).includes(factor.factorType)) {
      score += contribution;
    } else if (isRiskFactor(factor.factorType)) {
      score -= contribution;
    }
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function trustScoreKey(score: number, factors: TrustFactorScore[]): string {
  return `${score}|${factors.map((f) => f.factorType).sort().join(',')}`;
}

export function computeTrustLevel(score: number): TrustLevel {
  for (const threshold of TRUST_LEVEL_THRESHOLDS) {
    if (score >= threshold.min) return threshold.level;
  }
  return 'VERY_LOW';
}

export function computeTrustRiskLevel(score: number, factors: TrustFactorScore[]): TrustRiskLevel {
  const riskFactorTotal = factors
    .filter((f) => isRiskFactor(f.factorType))
    .reduce((sum, f) => sum + f.factorScore, 0);

  if (score <= 19 || riskFactorTotal >= 15) return 'CRITICAL';
  if (score <= 39 || riskFactorTotal >= 10) return 'HIGH';
  if (score <= 64 || riskFactorTotal >= 5) return 'MEDIUM';
  return 'LOW';
}

export function buildTrustReasons(factors: TrustFactorScore[], score: number, level: TrustLevel): string[] {
  const reasons = factors.slice(0, 5).map((f) => f.factorReason);
  reasons.push(`Unified trust score: ${score}/100 (${level}) — aggregation only, source systems not replaced`);
  return reasons;
}

export function getTopTrustFactors(factors: TrustFactorScore[], count = 5): TrustFactorScore[] {
  return [...factors].sort((a, b) => b.factorScore - a.factorScore).slice(0, count);
}

export function isScoreInRange(score: number): boolean {
  return score >= 0 && score <= 100;
}

export function isVeryLowTrust(level: TrustLevel): boolean {
  return level === 'VERY_LOW';
}

export function isVeryHighTrust(level: TrustLevel): boolean {
  return level === 'VERY_HIGH';
}

export function isCriticalRisk(risk: TrustRiskLevel): boolean {
  return risk === 'CRITICAL';
}

export function scoreForTrustLevel(level: TrustLevel): number {
  const map: Record<TrustLevel, number> = {
    VERY_LOW: 10,
    LOW: 30,
    MEDIUM: 50,
    HIGH: 75,
    VERY_HIGH: 90,
  };
  return map[level];
}
