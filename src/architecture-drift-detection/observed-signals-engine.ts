/**
 * Observed signals engine — evaluates observed architecture signals.
 * Read-only observer. Does not modify architecture.
 */

import type { DriftAnalysisInput, GateRecord } from './types.js';

export interface ObservedSignalsResult {
  valid: boolean;
  evaluatedSignals: string[];
  signalFlags: string[];
  gates: GateRecord[];
}

export function observedSignalsKey(signals: string[]): string {
  return signals.slice().sort().join('|');
}

export function evaluateObservedArchitectureSignals(input: DriftAnalysisInput): ObservedSignalsResult {
  const gates: GateRecord[] = [];
  const evaluatedSignals = input.observedArchitectureSignals.filter((s) => s?.trim()).map((s) => s.trim());
  const signalFlags: string[] = [];

  if (evaluatedSignals.length === 0) {
    gates.push({ gateId: 'sig-empty-0001', gateType: 'OBSERVED_SIGNALS_EMPTY', status: 'CLOSED', description: 'No valid observed signals' });
    return { valid: false, evaluatedSignals, signalFlags, gates };
  }

  for (const signal of evaluatedSignals) {
    const lower = signal.toLowerCase();
    if (lower.includes('drift') || lower.includes('duplicate') || lower.includes('bypass') || lower.includes('overlap')) {
      signalFlags.push(`DRIFT_SIGNAL:${signal.slice(0, 40)}`);
    }
    if (lower.includes('clean') || lower.includes('no drift') || lower.includes('compliant')) {
      signalFlags.push(`CLEAN_SIGNAL:${signal.slice(0, 40)}`);
    }
  }

  gates.push({
    gateId: 'sig-eval-0001',
    gateType: 'OBSERVED_SIGNALS_EVALUATED',
    status: 'OPEN',
    description: `${evaluatedSignals.length} observed signal(s) evaluated, ${signalFlags.length} flag(s) raised`,
  });

  return { valid: true, evaluatedSignals, signalFlags, gates };
}
