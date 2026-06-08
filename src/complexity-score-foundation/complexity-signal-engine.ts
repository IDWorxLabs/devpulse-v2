/**
 * Complexity signal engine — evaluates complexity and related input signals.
 * Measurement only. May reuse drift signals as input — does not replace drift detection.
 */

import type { ComplexityAnalysisInput, ComplexityFactorType, GateRecord } from './types.js';
import { SIGNAL_PATTERNS } from './types.js';

export interface SignalEvaluationResult {
  valid: boolean;
  evaluatedSignals: string[];
  factorValues: Partial<Record<ComplexityFactorType, number>>;
  affectedSystems: string[];
  gates: GateRecord[];
}

export function complexitySignalsKey(signals: string[]): string {
  return signals.slice().sort().join('|');
}

function extractNumericValue(signal: string): number {
  const match = signal.match(/(\d+)/);
  return match ? parseInt(match[1]!, 10) : 1;
}

function matchFactorType(signal: string): ComplexityFactorType | null {
  const lower = signal.toLowerCase();
  for (const mapping of SIGNAL_PATTERNS) {
    for (const pattern of mapping.patterns) {
      if (lower.includes(pattern)) return mapping.factorType;
    }
  }
  return null;
}

function extractAffectedSystems(input: ComplexityAnalysisInput): string[] {
  const systems = new Set<string>();
  const allSignals = [
    ...input.complexitySignals,
    ...(input.driftSignals ?? []),
    ...(input.dependencySignals ?? []),
    ...(input.ownershipSignals ?? []),
    ...(input.moduleSignals ?? []),
    ...(input.workflowSignals ?? []),
  ];

  const systemPatterns: Array<[string, string]> = [
    ['architecture_drift', 'architecture_drift_detection'],
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

export function evaluateComplexitySignals(input: ComplexityAnalysisInput): SignalEvaluationResult {
  const gates: GateRecord[] = [];
  const factorValues: Partial<Record<ComplexityFactorType, number>> = {};
  const evaluatedSignals: string[] = [];

  const signalGroups: Array<[string[] | undefined, string]> = [
    [input.complexitySignals, 'complexity'],
    [input.driftSignals, 'drift'],
    [input.dependencySignals, 'dependency'],
    [input.ownershipSignals, 'ownership'],
    [input.moduleSignals, 'module'],
    [input.workflowSignals, 'workflow'],
  ];

  for (const [signals, group] of signalGroups) {
    if (!signals?.length) continue;
    for (const signal of signals) {
      if (!signal?.trim()) continue;
      evaluatedSignals.push(signal.trim());
      const factorType = matchFactorType(signal);
      if (factorType) {
        const value = extractNumericValue(signal);
        factorValues[factorType] = (factorValues[factorType] ?? 0) + value;
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
  }

  if (evaluatedSignals.length === 0) {
    gates.push({ gateId: 'sig-empty-0001', gateType: 'SIGNALS_EMPTY', status: 'CLOSED', description: 'No valid complexity signals' });
    return { valid: false, evaluatedSignals, factorValues, affectedSystems: [], gates };
  }

  gates.push({
    gateId: 'sig-eval-0001',
    gateType: 'COMPLEXITY_SIGNALS_EVALUATED',
    status: 'OPEN',
    description: `${evaluatedSignals.length} signal(s) evaluated, ${Object.keys(factorValues).length} factor type(s) detected`,
  });

  return {
    valid: true,
    evaluatedSignals,
    factorValues,
    affectedSystems: extractAffectedSystems(input),
    gates,
  };
}

export function isLowComplexitySignal(signal: string): boolean {
  return signal.toLowerCase().includes('low complexity') || signal.toLowerCase().includes('minimal');
}

export function isHighComplexitySignal(signal: string): boolean {
  return signal.toLowerCase().includes('high complexity') || signal.toLowerCase().includes('overloaded');
}
