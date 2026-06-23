/**
 * Phase 27.02 — Substep runtime profiler (V1).
 */

import type { FounderTestRuntimeTraceEvent } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import { OPERATION_TO_AUTHORITY } from './founder-simulation-degradation-root-cause-registry.js';
import type { FounderSimulationSubstepProfile } from './founder-simulation-degradation-root-cause-types.js';

function parseTimestampMs(timestamp: string): number {
  const ms = Date.parse(timestamp);
  return Number.isFinite(ms) ? ms : 0;
}

function isSubstepOperation(operationId: string): boolean {
  return (
    operationId.includes('substep') ||
    operationId.includes('progress') ||
    operationId.includes('hydrat') ||
    operationId.includes('simulation') ||
    operationId.includes('stress') ||
    operationId.includes('readiness') ||
    operationId.includes('artifact') ||
    operationId.includes('report-generation') ||
    operationId.includes('chat-stress') ||
    operationId.includes('product-readiness')
  );
}

export function profileSubstepRuntime(input: {
  traceEvents: readonly FounderTestRuntimeTraceEvent[];
  totalRuntimeMs: number;
}): FounderSimulationSubstepProfile[] {
  const sorted = [...input.traceEvents]
    .filter((event) => isSubstepOperation(event.operationId))
    .sort((a, b) => parseTimestampMs(a.timestamp) - parseTimestampMs(b.timestamp));

  const profiles: FounderSimulationSubstepProfile[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const event = sorted[i]!;
    const startMs = parseTimestampMs(event.timestamp);
    const next = sorted[i + 1];
    const endMs = next ? parseTimestampMs(next.timestamp) : startMs + 1;
    const elapsedMs = Math.max(endMs - startMs, 1);

    profiles.push({
      readOnly: true,
      substepId: event.operationId,
      substepLabel: event.operationLabel,
      stageId: event.stageId,
      authorityName: OPERATION_TO_AUTHORITY[event.operationId] ?? null,
      startTime: event.timestamp,
      endTime: next?.timestamp ?? event.timestamp,
      elapsedMs,
      completionStatus: event.status,
      rank: 0,
      runtimePercent: input.totalRuntimeMs > 0 ? (elapsedMs / input.totalRuntimeMs) * 100 : 0,
    });
  }

  profiles.sort((a, b) => b.elapsedMs - a.elapsedMs);
  return profiles.map((profile, index) => ({ ...profile, rank: index + 1 }));
}
