/**
 * Runtime Stall Detector — detects slow or stalled founder test runs (V1).
 */

import {
  STAGE_HISTORICAL_AVERAGE_MS,
  STAGE_STALL_MESSAGES,
  STAGE_TIMEOUT_MS,
  STALL_SLOW_THRESHOLD_MS,
  STALL_STALLED_THRESHOLD_MS,
} from './founder-test-runtime-registry.js';
import type { FounderTestRuntimeStageRecord, StallAnalysis, StallHealth } from './founder-test-runtime-types.js';
import { getCurrentRunningStage } from './runtime-stage-tracker.js';

function buildStallMessage(stageLabel: string, stageId: string, elapsedSeconds: number): string {
  const prefix = STAGE_STALL_MESSAGES[stageId];
  if (prefix) {
    return `${prefix} ${elapsedSeconds}s`;
  }
  return `No progress on ${stageLabel} for ${elapsedSeconds}s — stage may be frozen.`;
}

export function analyzeRuntimeStall(input: {
  stages: readonly FounderTestRuntimeStageRecord[];
  lastHeartbeatAt?: string | null;
  now?: number;
}): StallAnalysis {
  const nowMs = input.now ?? Date.now();
  const running = getCurrentRunningStage(input.stages);

  if (!running || !running.startedAt) {
    return {
      readOnly: true,
      health: 'HEALTHY',
      currentStageId: null,
      stageElapsedMs: 0,
      stageAverageMs: null,
      warningMessage: null,
      stallReason: null,
      currentStageTimeoutMs: null,
      secondsSinceLastHeartbeat: 0,
    };
  }

  const stageElapsedMs = Math.max(0, nowMs - new Date(running.startedAt).getTime());
  const stageAverageMs = STAGE_HISTORICAL_AVERAGE_MS[running.stageId] ?? null;
  const currentStageTimeoutMs = STAGE_TIMEOUT_MS[running.stageId] ?? null;
  const heartbeatAt = running.lastHeartbeatAt ?? input.lastHeartbeatAt ?? running.startedAt;
  const secondsSinceLastHeartbeat = Math.max(
    0,
    Math.round((nowMs - new Date(heartbeatAt).getTime()) / 1000),
  );

  let health: StallHealth = 'HEALTHY';
  let warningMessage: string | null = null;

  const slowThreshold = Math.max(
    STALL_SLOW_THRESHOLD_MS,
    stageAverageMs != null ? stageAverageMs * 2 : STALL_SLOW_THRESHOLD_MS,
  );
  const stalledThreshold = Math.max(
    STALL_STALLED_THRESHOLD_MS,
    stageAverageMs != null ? stageAverageMs * 4 : STALL_STALLED_THRESHOLD_MS,
  );

  const elapsedSeconds = Math.round(stageElapsedMs / 1000);

  if (stageElapsedMs >= stalledThreshold) {
    health = 'STALLED';
    warningMessage = buildStallMessage(running.label, running.stageId, elapsedSeconds);
  } else if (stageElapsedMs >= slowThreshold) {
    health = 'SLOW';
    warningMessage = `${running.label} is taking longer than usual (${elapsedSeconds}s elapsed).`;
  } else if (stageAverageMs != null && stageElapsedMs > stageAverageMs * 3) {
    health = 'SLOW';
    warningMessage = `${running.label} exceeds historical average duration.`;
  }

  if (
    currentStageTimeoutMs != null &&
    stageElapsedMs >= currentStageTimeoutMs &&
    health !== 'STALLED'
  ) {
    health = 'STALLED';
    warningMessage = buildStallMessage(running.label, running.stageId, elapsedSeconds);
  }

  const stallReason = health === 'HEALTHY' ? null : warningMessage;

  return {
    readOnly: true,
    health,
    currentStageId: running.stageId,
    stageElapsedMs,
    stageAverageMs,
    warningMessage,
    stallReason,
    currentStageTimeoutMs,
    secondsSinceLastHeartbeat,
  };
}
