/**
 * Trust signal engine — evaluates trust signals from existing systems.
 * Aggregation only. Does not replace source systems.
 */

import type { TrustAssessmentInput, TrustFactorType, GateRecord } from './types.js';
import { RISK_TRUST_FACTORS, SIGNAL_PATTERNS } from './types.js';

export interface TrustSignalEvaluationResult {
  valid: boolean;
  evaluatedSignals: string[];
  factorValues: Partial<Record<TrustFactorType, number>>;
  factorSignalCounts: Partial<Record<TrustFactorType, number>>;
  sourceSystems: string[];
  gates: GateRecord[];
}

export function trustSignalsKey(signals: string[]): string {
  return signals.slice().sort().join('|');
}

function extractNumericValue(signal: string): number {
  const match = signal.match(/(\d+)/);
  if (match) return parseInt(match[1]!, 10);

  const lower = signal.toLowerCase();
  if (lower.includes('critical') || lower.includes('very high')) return 9;
  if (lower.includes('high') || lower.includes('strong')) return 7;
  if (lower.includes('medium') || lower.includes('moderate')) return 5;
  if (lower.includes('weak') || lower.includes('missing') || lower.includes('fail')) return 3;
  if (lower.includes('low') || lower.includes('minimal')) return 2;
  return 4;
}

function matchFactorType(signal: string): TrustFactorType | null {
  const lower = signal.toLowerCase();
  for (const mapping of SIGNAL_PATTERNS) {
    for (const pattern of mapping.patterns) {
      if (lower.includes(pattern)) return mapping.factorType;
    }
  }
  return null;
}

function extractSourceSystems(input: TrustAssessmentInput): string[] {
  const systems = new Set<string>();
  const allSignals = [
    ...(input.evidenceSignals ?? []),
    ...(input.verificationSignals ?? []),
    ...(input.completionSignals ?? []),
    ...(input.realitySignals ?? []),
    ...(input.governanceSignals ?? []),
    ...(input.predictionSignals ?? []),
    ...(input.complexitySignals ?? []),
    ...(input.driftSignals ?? []),
    ...(input.learningSignals ?? []),
  ];

  for (const signal of allSignals) {
    const lower = signal.toLowerCase();
    for (const mapping of SIGNAL_PATTERNS) {
      if (mapping.sourceSystem) {
        for (const pattern of mapping.patterns) {
          if (lower.includes(pattern)) systems.add(mapping.sourceSystem);
        }
      }
    }
  }

  const sourceMap: Array<[string[] | undefined, string]> = [
    [input.evidenceSignals, 'execution_evidence_ledger'],
    [input.verificationSignals, 'verification_gated_apply'],
    [input.completionSignals, 'world2_completion_verifier'],
    [input.realitySignals, 'execution_reality_validation'],
    [input.predictionSignals, 'future_problem_prediction'],
    [input.complexitySignals, 'complexity_score_foundation'],
    [input.driftSignals, 'architecture_drift_detection'],
    [input.learningSignals, 'self_learning_engine'],
    [input.governanceSignals, 'founder_approval_execution_gate'],
  ];

  for (const [signals, system] of sourceMap) {
    if (signals?.length) systems.add(system);
  }

  return [...systems];
}

function processSignalGroup(
  signals: string[] | undefined,
  group: string,
  factorValues: Partial<Record<TrustFactorType, number>>,
  factorSignalCounts: Partial<Record<TrustFactorType, number>>,
  evaluatedSignals: string[],
  gates: GateRecord[],
): void {
  if (!signals?.length) return;

  for (const signal of signals) {
    if (!signal?.trim()) continue;
    evaluatedSignals.push(signal.trim());
    const factorType = matchFactorType(signal);
    if (factorType) {
      const value = extractNumericValue(signal);
      factorValues[factorType] = (factorValues[factorType] ?? 0) + value;
      factorSignalCounts[factorType] = (factorSignalCounts[factorType] ?? 0) + 1;
    }
  }

  const reuseGates: Record<string, { gateType: string; system: string }> = {
    evidence: { gateType: 'EVIDENCE_LEDGER_INPUT', system: 'execution_evidence_ledger' },
    verification: { gateType: 'VERIFICATION_GATED_APPLY_INPUT', system: 'verification_gated_apply' },
    completion: { gateType: 'COMPLETION_VERIFIER_INPUT', system: 'world2_completion_verifier' },
    reality: { gateType: 'REALITY_VALIDATION_INPUT', system: 'execution_reality_validation' },
    prediction: { gateType: 'FUTURE_PREDICTION_INPUT', system: 'future_problem_prediction' },
    complexity: { gateType: 'COMPLEXITY_SCORE_INPUT', system: 'complexity_score_foundation' },
    drift: { gateType: 'DRIFT_DETECTION_INPUT', system: 'architecture_drift_detection' },
  };

  const reuse = reuseGates[group];
  if (reuse && signals.length > 0) {
    gates.push({
      gateId: `sig-${group}-0001`,
      gateType: reuse.gateType,
      status: 'OPEN',
      description: `${reuse.system} signals reused as input — source system not replaced`,
    });
  }
}

export function evaluateTrustSignals(input: TrustAssessmentInput): TrustSignalEvaluationResult {
  const gates: GateRecord[] = [];
  const factorValues: Partial<Record<TrustFactorType, number>> = {};
  const factorSignalCounts: Partial<Record<TrustFactorType, number>> = {};
  const evaluatedSignals: string[] = [];

  processSignalGroup(input.evidenceSignals, 'evidence', factorValues, factorSignalCounts, evaluatedSignals, gates);
  processSignalGroup(input.verificationSignals, 'verification', factorValues, factorSignalCounts, evaluatedSignals, gates);
  processSignalGroup(input.completionSignals, 'completion', factorValues, factorSignalCounts, evaluatedSignals, gates);
  processSignalGroup(input.realitySignals, 'reality', factorValues, factorSignalCounts, evaluatedSignals, gates);
  processSignalGroup(input.governanceSignals, 'governance', factorValues, factorSignalCounts, evaluatedSignals, gates);
  processSignalGroup(input.predictionSignals, 'prediction', factorValues, factorSignalCounts, evaluatedSignals, gates);
  processSignalGroup(input.complexitySignals, 'complexity', factorValues, factorSignalCounts, evaluatedSignals, gates);
  processSignalGroup(input.driftSignals, 'drift', factorValues, factorSignalCounts, evaluatedSignals, gates);
  processSignalGroup(input.learningSignals, 'learning', factorValues, factorSignalCounts, evaluatedSignals, gates);

  if (evaluatedSignals.length === 0) {
    gates.push({ gateId: 'sig-empty-0001', gateType: 'SIGNALS_EMPTY', status: 'CLOSED', description: 'No valid trust signals' });
    return { valid: false, evaluatedSignals, factorValues, factorSignalCounts, sourceSystems: [], gates };
  }

  gates.push({
    gateId: 'sig-eval-0001',
    gateType: 'TRUST_SIGNALS_EVALUATED',
    status: 'OPEN',
    description: `${evaluatedSignals.length} signal(s) evaluated, ${Object.keys(factorValues).length} factor type(s) detected`,
  });

  return {
    valid: true,
    evaluatedSignals,
    factorValues,
    factorSignalCounts,
    sourceSystems: extractSourceSystems(input),
    gates,
  };
}

export function isStrongTrustSignal(signal: string): boolean {
  const lower = signal.toLowerCase();
  return lower.includes('strong') || lower.includes('high') || lower.includes('pass');
}

export function isWeakTrustSignal(signal: string): boolean {
  const lower = signal.toLowerCase();
  return lower.includes('weak') || lower.includes('missing') || lower.includes('fail');
}

export function isRiskFactor(type: TrustFactorType): boolean {
  return (RISK_TRUST_FACTORS as readonly string[]).includes(type);
}
