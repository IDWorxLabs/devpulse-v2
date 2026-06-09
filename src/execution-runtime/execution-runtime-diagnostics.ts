/**
 * Execution Runtime Foundation diagnostics.
 */

import type { ExecutionPacket, ExecutionRuntimeDiagnostics } from './execution-runtime-types.js';

let diagnostics: ExecutionRuntimeDiagnostics = {
  executionRuntimeActive: false,
  executionPacketCount: 0,
  readyCount: 0,
  blockedCount: 0,
  readinessScore: 0,
  lastExecutionQuery: null,
};

export function getExecutionRuntimeDiagnostics(): ExecutionRuntimeDiagnostics {
  return { ...diagnostics };
}

export function updateExecutionRuntimeDiagnostics(
  query: string,
  packets: ExecutionPacket[],
): void {
  const readyCount = packets.filter(
    (p) => p.state === 'READY' || p.state === 'SIMULATION_ONLY' || p.state === 'WAITING_APPROVAL',
  ).length;
  const blockedCount = packets.filter((p) => p.state === 'BLOCKED').length;
  const avgScore =
    packets.length === 0
      ? 0
      : Math.round(
          packets.reduce((sum, p) => sum + p.readiness.readinessScore, 0) / packets.length,
        );

  diagnostics = {
    executionRuntimeActive: true,
    executionPacketCount: packets.length,
    readyCount,
    blockedCount,
    readinessScore: avgScore,
    lastExecutionQuery: query,
  };
}

export function resetExecutionRuntimeDiagnostics(): void {
  diagnostics = {
    executionRuntimeActive: false,
    executionPacketCount: 0,
    readyCount: 0,
    blockedCount: 0,
    readinessScore: 0,
    lastExecutionQuery: null,
  };
}

export function executionRuntimeKey(): string {
  const d = diagnostics;
  return [
    String(d.executionRuntimeActive),
    String(d.executionPacketCount),
    String(d.readyCount),
    String(d.blockedCount),
    String(d.readinessScore),
    d.lastExecutionQuery ?? 'none',
  ].join('|');
}
