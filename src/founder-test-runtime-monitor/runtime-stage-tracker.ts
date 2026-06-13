/**
 * Runtime Stage Tracker — founder test stage lifecycle (V1).
 */

import { FOUNDER_TEST_RUNTIME_STAGES } from './founder-test-runtime-registry.js';
import type { FounderTestRuntimeStageRecord, FounderTestStageStatus } from './founder-test-runtime-types.js';

export function createInitialStageRecords(): FounderTestRuntimeStageRecord[] {
  const now = new Date().toISOString();
  return FOUNDER_TEST_RUNTIME_STAGES.map((stage) => ({
    readOnly: true,
    stageId: stage.stageId,
    label: stage.label,
    order: stage.order,
    status: stage.stageId === 'FOUNDER_TEST_STARTED' ? 'RUNNING' : 'PENDING',
    startedAt: stage.stageId === 'FOUNDER_TEST_STARTED' ? now : null,
    endedAt: null,
    durationMs: null,
    lastHeartbeatAt: stage.stageId === 'FOUNDER_TEST_STARTED' ? now : null,
  }));
}

export function findStageIndex(stages: FounderTestRuntimeStageRecord[], stageId: string): number {
  return stages.findIndex((stage) => stage.stageId === stageId);
}

export function markStageRunning(
  stages: FounderTestRuntimeStageRecord[],
  stageId: string,
  now = new Date(),
): FounderTestRuntimeStageRecord[] {
  const next = stages.map((stage) => ({ ...stage }));
  const index = findStageIndex(next, stageId);
  if (index < 0) return next;

  const iso = now.toISOString();
  next[index] = {
    ...next[index],
    status: 'RUNNING',
    startedAt: next[index].startedAt ?? iso,
    endedAt: null,
    durationMs: null,
    lastHeartbeatAt: iso,
  };
  return next;
}

export function markStageComplete(
  stages: FounderTestRuntimeStageRecord[],
  stageId: string,
  status: FounderTestStageStatus = 'PASSED',
  now = new Date(),
): FounderTestRuntimeStageRecord[] {
  const next = stages.map((stage) => ({ ...stage }));
  const index = findStageIndex(next, stageId);
  if (index < 0) return next;

  const iso = now.toISOString();
  const startedAt = next[index].startedAt ?? iso;
  const durationMs = now.getTime() - new Date(startedAt).getTime();

  next[index] = {
    ...next[index],
    status,
    startedAt,
    endedAt: iso,
    durationMs: Math.max(0, durationMs),
    lastHeartbeatAt: iso,
  };
  return next;
}

export function touchStageHeartbeat(
  stages: FounderTestRuntimeStageRecord[],
  stageId: string,
  now = new Date(),
): FounderTestRuntimeStageRecord[] {
  const next = stages.map((stage) => ({ ...stage }));
  const index = findStageIndex(next, stageId);
  if (index < 0) return next;
  const iso = now.toISOString();
  next[index] = {
    ...next[index],
    lastHeartbeatAt: iso,
  };
  return next;
}

export function countCompletedStages(stages: readonly FounderTestRuntimeStageRecord[]): number {
  return stages.filter((stage) => stage.status === 'PASSED' || stage.status === 'SKIPPED').length;
}

export function getCurrentRunningStage(
  stages: readonly FounderTestRuntimeStageRecord[],
): FounderTestRuntimeStageRecord | null {
  return stages.find((stage) => stage.status === 'RUNNING') ?? null;
}

export function getLatestCompletedStage(
  stages: readonly FounderTestRuntimeStageRecord[],
): FounderTestRuntimeStageRecord | null {
  const completed = stages.filter((stage) => stage.status === 'PASSED' || stage.status === 'SKIPPED');
  return completed[completed.length - 1] ?? null;
}
