/**
 * Signal evaluation engine — evaluates historical, drift, complexity, and capability signals.
 * Consumes upstream system outputs. Does not replace drift detection or complexity scoring.
 */

import type { GateRecord, PredictionAnalysisInput, PredictionType } from './types.js';
import { PREDICTION_SIGNAL_PATTERNS } from './types.js';

export interface SignalEvaluationResult {
  valid: boolean;
  evaluatedSignals: string[];
  predictionStrengths: Partial<Record<PredictionType, number>>;
  affectedSystems: string[];
  gates: GateRecord[];
  evidence: string[];
}

export function predictionSignalsKey(signals: string[]): string {
  return signals.slice().sort().join('|');
}

function extractNumericValue(signal: string): number {
  const match = signal.match(/(\d+)/);
  return match ? parseInt(match[1]!, 10) : 1;
}

function matchPredictionType(signal: string): PredictionType | null {
  const lower = signal.toLowerCase();
  for (const mapping of PREDICTION_SIGNAL_PATTERNS) {
    for (const pattern of mapping.patterns) {
      if (lower.includes(pattern)) return mapping.predictionType;
    }
  }
  return null;
}

function extractAffectedSystems(input: PredictionAnalysisInput): string[] {
  const systems = new Set<string>();
  const allSignals = [
    ...(input.complexitySignals ?? []),
    ...(input.driftSignals ?? []),
    ...(input.learningSignals ?? []),
    ...(input.capabilitySignals ?? []),
    ...(input.dependencySignals ?? []),
    ...(input.workflowSignals ?? []),
  ];

  const systemPatterns: Array<[string, string]> = [
    ['architecture_drift', 'architecture_drift_detection'],
    ['complexity_score', 'complexity_score_foundation'],
    ['self_learning', 'self_learning_engine'],
    ['missing_capability', 'missing_capability_detector'],
    ['safe_capability', 'safe_capability_acquisition'],
    ['world2', 'world2_learning_loop'],
    ['mobile_command', 'mobile_command_foundation'],
    ['mobile_chat', 'mobile_chat_interface'],
    ['mobile_preview', 'mobile_live_preview_foundation'],
    ['mobile_approval', 'mobile_approval_flow_foundation'],
    ['cross_device', 'cross_device_continuity_foundation'],
    ['execution_authority', 'execution_authority'],
    ['verification_gated', 'verification_gated_apply'],
  ];

  for (const signal of allSignals) {
    const lower = signal.toLowerCase();
    for (const [pattern, system] of systemPatterns) {
      if (lower.includes(pattern)) systems.add(system);
    }
  }

  if (input.sourceSystem) systems.add(input.sourceSystem);
  if (systems.size === 0 && input.systemArea !== 'UNKNOWN') {
    systems.add(input.systemArea.toLowerCase());
  }

  return [...systems];
}

export function evaluatePredictionSignals(input: PredictionAnalysisInput): SignalEvaluationResult {
  const gates: GateRecord[] = [];
  const predictionStrengths: Partial<Record<PredictionType, number>> = {};
  const evaluatedSignals: string[] = [];
  const evidence: string[] = [];

  const signalGroups: Array<[string[] | undefined, string]> = [
    [input.complexitySignals, 'complexity'],
    [input.driftSignals, 'drift'],
    [input.learningSignals, 'learning'],
    [input.capabilitySignals, 'capability'],
    [input.dependencySignals, 'dependency'],
    [input.workflowSignals, 'workflow'],
  ];

  for (const [signals, group] of signalGroups) {
    if (!signals?.length) continue;
    for (const signal of signals) {
      if (!signal?.trim()) continue;
      evaluatedSignals.push(signal.trim());
      evidence.push(`${group}: ${signal.trim()}`);
      const predictionType = matchPredictionType(signal);
      if (predictionType) {
        const value = extractNumericValue(signal);
        predictionStrengths[predictionType] = (predictionStrengths[predictionType] ?? 0) + value;
      }
    }
    if (group === 'drift' && signals.length > 0) {
      gates.push({
        gateId: 'sig-drift-0001',
        gateType: 'ARCHITECTURE_DRIFT_INPUT',
        status: 'OPEN',
        description: 'Architecture drift signals reused as input — drift detection not replaced',
      });
    }
    if (group === 'complexity' && signals.length > 0) {
      gates.push({
        gateId: 'sig-cx-0001',
        gateType: 'COMPLEXITY_SCORE_INPUT',
        status: 'OPEN',
        description: 'Complexity score signals reused as input — complexity scorer not replaced',
      });
    }
    if (group === 'learning' && signals.length > 0) {
      gates.push({
        gateId: 'sig-sle-0001',
        gateType: 'SELF_LEARNING_INPUT',
        status: 'OPEN',
        description: 'Self-learning signals reused as input — self-learning engine not replaced',
      });
    }
    if (group === 'capability' && signals.length > 0) {
      gates.push({
        gateId: 'sig-cap-0001',
        gateType: 'CAPABILITY_INPUT',
        status: 'OPEN',
        description: 'Capability signals reused from missing capability detector and safe acquisition',
      });
    }
  }

  if (evaluatedSignals.length === 0) {
    evaluatedSignals.push('baseline future risk signal');
    evidence.push('baseline: low future risk baseline');
  }

  if (Object.keys(predictionStrengths).length === 0) {
    predictionStrengths.COMPLEXITY_FAILURE_RISK = 1;
    evidence.push('baseline: default complexity failure risk from signal evaluation');
  }

  gates.push({
    gateId: 'sig-eval-0001',
    gateType: 'SIGNALS_EVALUATED',
    status: 'OPEN',
    description: `${evaluatedSignals.length} signal(s) evaluated, ${Object.keys(predictionStrengths).length} prediction type(s) detected`,
  });

  return {
    valid: true,
    evaluatedSignals,
    predictionStrengths,
    affectedSystems: extractAffectedSystems(input),
    gates,
    evidence,
  };
}

export function isLowRiskSignal(signal: string): boolean {
  return signal.toLowerCase().includes('low risk') || signal.toLowerCase().includes('minimal future risk');
}

export function isHighRiskSignal(signal: string): boolean {
  return signal.toLowerCase().includes('high risk') || signal.toLowerCase().includes('critical future');
}
