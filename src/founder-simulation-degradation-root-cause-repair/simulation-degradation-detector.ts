/**
 * Phase 27.02 — Simulation degradation detector (V1).
 */

import {
  FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  FOUNDER_SIMULATION_STAGE_BUDGET_MS,
} from '../founder-simulation-completion-boundary-repair/index.js';
import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import { DEGRADATION_TRACE_PATTERNS } from './founder-simulation-degradation-root-cause-registry.js';
import type {
  DegradationSignalKind,
  FounderSimulationDegradationSignal,
} from './founder-simulation-degradation-root-cause-types.js';

export function detectSimulationDegradationSignals(input: {
  snapshot: FounderTestRuntimeSnapshot;
  completionEventId?: string | null;
  degraded?: boolean;
  budgetExceeded?: boolean;
  errorMessage?: string | null;
  payloadGuardDegraded?: boolean;
  simulationElapsedMs?: number;
}): FounderSimulationDegradationSignal[] {
  const signals: FounderSimulationDegradationSignal[] = [];

  if (input.completionEventId === FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS) {
    signals.push({
      readOnly: true,
      kind: 'WARNING_COMPLETION',
      detail: 'FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS emitted',
      operationId: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
      stageId: 'FOUNDER_SIMULATION_ENGINE',
    });
  }

  if (input.degraded) {
    signals.push({
      readOnly: true,
      kind: 'DEGRADED_COMPLETION_PATH',
      detail: 'Founder simulation marked degraded on completion',
      operationId: null,
      stageId: 'FOUNDER_SIMULATION_ENGINE',
    });
  }

  if (input.budgetExceeded || (input.simulationElapsedMs ?? 0) > FOUNDER_SIMULATION_STAGE_BUDGET_MS) {
    signals.push({
      readOnly: true,
      kind: 'RUNTIME_EXCEEDS_BUDGET',
      detail: `Elapsed ${input.simulationElapsedMs ?? input.snapshot.elapsedMs}ms exceeds stage budget ${FOUNDER_SIMULATION_STAGE_BUDGET_MS}ms`,
      operationId: null,
      stageId: 'FOUNDER_SIMULATION_ENGINE',
    });
  }

  if (input.payloadGuardDegraded) {
    signals.push({
      readOnly: true,
      kind: 'PAYLOAD_GUARD_DEGRADED',
      detail: 'Founder simulation payload guard marked result degraded',
      operationId: 'founder-simulation-payload-guard',
      stageId: 'FOUNDER_SIMULATION_ENGINE',
    });
  }

  if (input.errorMessage) {
    signals.push({
      readOnly: true,
      kind: 'TIMEOUT_RECOVERY',
      detail: input.errorMessage,
      operationId: null,
      stageId: 'FOUNDER_SIMULATION_ENGINE',
    });
  }

  for (const event of input.snapshot.traceEvents) {
    const haystack = `${event.operationId} ${event.operationLabel} ${event.displayLine}`;
    if (!DEGRADATION_TRACE_PATTERNS.some((pattern) => pattern.test(haystack))) continue;

    let kind: DegradationSignalKind = 'DEGRADED_COMPLETION_PATH';
    if (/SIMULATION_BUDGET|budget exceeded/i.test(haystack)) kind = 'RUNTIME_EXCEEDS_BUDGET';
    else if (/RECURSION|authority-recursion/i.test(haystack)) kind = 'RECURSION_GUARD';
    else if (/fallback/i.test(haystack)) kind = 'FALLBACK_PATH';
    else if (/repair|payload guard/i.test(haystack)) kind = 'REPAIR_PLANNER';
    else if (/WITH_WARNINGS|warning/i.test(haystack)) kind = 'WARNING_COMPLETION';

    signals.push({
      readOnly: true,
      kind,
      detail: event.displayLine,
      operationId: event.operationId,
      stageId: event.stageId,
    });
  }

  for (const feedEvent of input.snapshot.feed.events) {
    if (feedEvent.severity !== 'WARNING' && feedEvent.severity !== 'ERROR') continue;
    signals.push({
      readOnly: true,
      kind: feedEvent.severity === 'ERROR' ? 'TIMEOUT_RECOVERY' : 'WARNING_COMPLETION',
      detail: feedEvent.message,
      operationId: null,
      stageId: feedEvent.stageId,
    });
  }

  return dedupeSignals(signals);
}

function dedupeSignals(
  signals: FounderSimulationDegradationSignal[],
): FounderSimulationDegradationSignal[] {
  const seen = new Set<string>();
  const out: FounderSimulationDegradationSignal[] = [];
  for (const signal of signals) {
    const key = `${signal.kind}:${signal.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(signal);
  }
  return out;
}

export function isDegradedSimulation(input: {
  completionEventId?: string | null;
  degraded?: boolean;
  signals: readonly FounderSimulationDegradationSignal[];
}): boolean {
  return (
    Boolean(input.degraded) ||
    input.completionEventId === FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS ||
    input.signals.length > 0
  );
}
