/**
 * Unified Trust Runtime — trust state manager.
 */

import type { NormalizedTrustSignal, TrustState } from './trust-runtime-types.js';

export function computeAggregateTrustLevel(signals: NormalizedTrustSignal[]): number {
  if (signals.length === 0) return 0;

  const total = signals.reduce((sum, s) => sum + s.trustContribution, 0);
  const evidenceBonus = Math.min(10, signals.reduce((sum, s) => sum + s.evidenceCount, 0) / signals.length);
  return Math.max(0, Math.min(100, Math.round(total / signals.length + evidenceBonus)));
}

export function computeAggregateRisk(signals: NormalizedTrustSignal[]): number {
  if (signals.length === 0) return 50;
  return Math.round(signals.reduce((sum, s) => sum + s.risk, 0) / signals.length);
}

export function computeAggregateConfidence(signals: NormalizedTrustSignal[]): number {
  if (signals.length === 0) return 0;
  return Math.round(signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length);
}

export function resolveTrustState(signals: NormalizedTrustSignal[], trustLevel: number): TrustState {
  if (signals.some((s) => s.status === 'BLOCKED')) return 'BLOCKED';
  if (signals.some((s) => s.status === 'RECOVERY')) return 'TRUST_RECOVERY_REQUIRED';
  if (signals.length === 0) return 'UNKNOWN';
  if (trustLevel >= 85 && signals.some((s) => s.source.includes('VERIFICATION') || s.source === 'AUTONOMOUS_VERIFICATION')) {
    return 'VERIFIED';
  }
  if (trustLevel >= 80) return 'VERIFIED';
  if (trustLevel >= 60) return 'HIGH_TRUST';
  if (trustLevel >= 40) return 'MEDIUM_TRUST';
  if (trustLevel > 0) return 'LOW_TRUST';
  return 'UNKNOWN';
}

export function transitionTrustState(current: TrustState, next: TrustState): TrustState {
  if (current === 'BLOCKED' || next === 'BLOCKED') return 'BLOCKED';
  if (next === 'TRUST_RECOVERY_REQUIRED') return 'TRUST_RECOVERY_REQUIRED';
  return next;
}
