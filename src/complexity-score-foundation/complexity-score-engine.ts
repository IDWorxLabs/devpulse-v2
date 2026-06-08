/**
 * Complexity score engine — aggregates factor scores into 0–100 complexity score.
 * Deterministic scoring only. No auto-fix.
 */

import type { FactorScore, ComplexityConfidence } from './types.js';

export function aggregateComplexityScore(factors: FactorScore[]): number {
  if (factors.length === 0) return 0;

  const raw = factors.reduce((sum, f) => sum + f.factorScore, 0);
  const normalized = Math.min(100, Math.max(0, Math.round(raw)));
  return normalized;
}

export function complexityScoreKey(score: number, factors: FactorScore[]): string {
  return `${score}|${factors.map((f) => f.factorType).sort().join(',')}`;
}

export function buildComplexityReasons(factors: FactorScore[], score: number): string[] {
  const reasons = factors.slice(0, 5).map((f) => f.factorReason);
  reasons.push(`Aggregate complexity score: ${score}/100 — measurement only, no auto-fix performed`);
  return reasons;
}

export function getTopComplexityFactors(factors: FactorScore[], count = 5): FactorScore[] {
  return [...factors].sort((a, b) => b.factorScore - a.factorScore).slice(0, count);
}

export function isScoreInRange(score: number): boolean {
  return score >= 0 && score <= 100;
}

export function isMinimumScore(score: number): boolean {
  return score === 0;
}

export function isMaximumScore(score: number): boolean {
  return score === 100;
}

export function computeComplexityConfidence(
  signalCount: number,
  factorCount: number,
  governancePass: boolean,
): ComplexityConfidence {
  let score = 0.35;
  if (signalCount >= 2) score += 0.15;
  if (signalCount >= 5) score += 0.1;
  if (factorCount >= 2) score += 0.15;
  if (factorCount >= 5) score += 0.1;
  if (governancePass) score += 0.15;

  if (score >= 0.85) return 'VERY_HIGH';
  if (score >= 0.65) return 'HIGH';
  if (score >= 0.4) return 'MEDIUM';
  return 'LOW';
}
