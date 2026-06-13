/**
 * Runtime Progress Estimator — stage-based progress without fake percentages (V1).
 */

import { STAGE_HISTORICAL_AVERAGE_MS } from './founder-test-runtime-registry.js';
import type { FounderTestProgress, FounderTestRuntimeStageRecord } from './founder-test-runtime-types.js';
import { countCompletedStages, getCurrentRunningStage } from './runtime-stage-tracker.js';

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function estimateFounderTestProgress(input: {
  stages: readonly FounderTestRuntimeStageRecord[];
  startedAt: string | null;
  totalStages: number;
  now?: number;
}): FounderTestProgress {
  const nowMs = input.now ?? Date.now();
  const elapsedMs = input.startedAt ? Math.max(0, nowMs - new Date(input.startedAt).getTime()) : 0;
  const completedStages = countCompletedStages(input.stages);
  const remainingStages = Math.max(0, input.totalStages - completedStages);
  const percentComplete = clampPercent((completedStages / input.totalStages) * 100);

  const running = getCurrentRunningStage(input.stages);
  let estimatedRemainingMs: number | null = null;

  const pendingStageIds = input.stages
    .filter((stage) => stage.status === 'PENDING' || stage.status === 'RUNNING')
    .map((stage) => stage.stageId);

  if (pendingStageIds.length > 0) {
    estimatedRemainingMs = pendingStageIds.reduce(
      (sum, stageId) => sum + (STAGE_HISTORICAL_AVERAGE_MS[stageId] ?? 1000),
      0,
    );
    if (running?.startedAt) {
      const stageElapsed = nowMs - new Date(running.startedAt).getTime();
      const stageAverage = STAGE_HISTORICAL_AVERAGE_MS[running.stageId] ?? 5000;
      estimatedRemainingMs -= Math.min(stageElapsed, stageAverage);
      estimatedRemainingMs = Math.max(0, estimatedRemainingMs);
    }
  } else {
    estimatedRemainingMs = 0;
  }

  return {
    readOnly: true,
    currentStage: running?.stageId ?? null,
    currentStageLabel: running?.label ?? null,
    currentStageOrder: running?.order ?? completedStages,
    totalStages: input.totalStages,
    completedStages,
    remainingStages,
    percentComplete,
    elapsedMs,
    estimatedRemainingMs,
  };
}

export function formatDurationClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
