/**
 * Phase 27.02 — Founder simulation stage profiler (V1).
 */

import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import { STAGE_TO_AUTHORITY } from './founder-simulation-degradation-root-cause-registry.js';
import type { FounderSimulationAuthorityProfile } from './founder-simulation-degradation-root-cause-types.js';

export function profileFounderSimulationStages(input: {
  snapshot: FounderTestRuntimeSnapshot;
  runId: string | null;
  totalRuntimeMs: number;
}): FounderSimulationAuthorityProfile[] {
  const profiles: FounderSimulationAuthorityProfile[] = [];

  for (const stage of input.snapshot.stages) {
    if (!stage.durationMs || stage.durationMs <= 0) continue;
    if (stage.stageId === 'FOUNDER_TEST_STARTED' || stage.stageId === 'COMPLETE') continue;

    profiles.push({
      readOnly: true,
      authorityId: stage.stageId,
      authorityName: STAGE_TO_AUTHORITY[stage.stageId] ?? stage.label,
      stageId: stage.stageId,
      startTime: stage.startedAt,
      endTime: stage.endedAt,
      elapsedMs: stage.durationMs,
      workspaceId: null,
      runId: input.runId,
      verdict: stage.status,
      proofLevel: stage.status,
      rank: 0,
      runtimePercent: input.totalRuntimeMs > 0 ? (stage.durationMs / input.totalRuntimeMs) * 100 : 0,
    });
  }

  profiles.sort((a, b) => b.elapsedMs - a.elapsedMs);
  return profiles.map((profile, index) => ({
    ...profile,
    rank: index + 1,
  }));
}

export function resolveTotalSimulationRuntimeMs(input: {
  snapshot: FounderTestRuntimeSnapshot;
  simulationElapsedMs?: number;
}): number {
  if (input.simulationElapsedMs && input.simulationElapsedMs > 0) {
    return Math.max(input.simulationElapsedMs, input.snapshot.elapsedMs);
  }
  const stageTotal = input.snapshot.stages.reduce((sum, stage) => sum + (stage.durationMs ?? 0), 0);
  return Math.max(input.snapshot.elapsedMs, stageTotal);
}
