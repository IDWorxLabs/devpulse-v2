/**
 * Factor score engine — creates weighted factor scores from signal evaluation.
 * Scoring only. No auto-optimization.
 */

import type { ComplexityFactorType, FactorScore } from './types.js';
import { FACTOR_WEIGHTS, KNOWN_COMPLEXITY_FACTORS, nextFactorId } from './types.js';
import type { SignalEvaluationResult } from './complexity-signal-engine.js';

export function factorScoresKey(factors: FactorScore[]): string {
  return factors.map((f) => `${f.factorType}:${f.factorValue}:${f.factorScore}`).sort().join(';');
}

function computeFactorScore(factorType: ComplexityFactorType, value: number): number {
  const weight = FACTOR_WEIGHTS[factorType] ?? 0.05;
  const normalized = Math.min(100, value * weight * 100);
  return Math.round(normalized * 100) / 100;
}

function factorReason(factorType: ComplexityFactorType, value: number): string {
  return `${factorType.replace(/_/g, ' ').toLowerCase()}: ${value} unit(s) contributing to complexity pressure`;
}

export function createFactorScores(signalEval: SignalEvaluationResult): FactorScore[] {
  const factors: FactorScore[] = [];

  for (const factorType of KNOWN_COMPLEXITY_FACTORS) {
    const value = signalEval.factorValues[factorType];
    if (value === undefined || value <= 0) continue;

    const weight = FACTOR_WEIGHTS[factorType];
    const score = computeFactorScore(factorType, value);
    factors.push({
      factorId: nextFactorId(),
      factorType,
      factorValue: value,
      factorWeight: weight,
      factorScore: score,
      factorReason: factorReason(factorType, value),
    });
  }

  if (factors.length === 0) {
    factors.push({
      factorId: nextFactorId(),
      factorType: 'MODULE_COUNT',
      factorValue: 1,
      factorWeight: FACTOR_WEIGHTS.MODULE_COUNT,
      factorScore: computeFactorScore('MODULE_COUNT', 1),
      factorReason: 'Baseline module complexity from general signals',
    });
  }

  return factors.sort((a, b) => b.factorScore - a.factorScore);
}

export function countHighFactors(factors: FactorScore[], threshold = 5): number {
  return factors.filter((f) => f.factorScore >= threshold && f.factorScore < 10).length;
}

export function countCriticalFactors(factors: FactorScore[], threshold = 10): number {
  return factors.filter((f) => f.factorScore >= threshold).length;
}

export function isModuleCountFactor(type: ComplexityFactorType): boolean {
  return type === 'MODULE_COUNT';
}

export function isDependencyFactor(type: ComplexityFactorType): boolean {
  return type === 'DEPENDENCY_COUNT';
}

export function isDriftFactor(type: ComplexityFactorType): boolean {
  return type === 'DRIFT_FINDING_COUNT';
}
