/**
 * Recovery Memory — persistent recovery intelligence store.
 */

import type { RecoveryMemoryInput, RecoveryMemoryRecord } from './recovery-memory-types.js';
import type { RootCauseCategory } from '../recovery-root-cause/index.js';

const memoryStore: RecoveryMemoryRecord[] = [];
let recordCounter = 0;

export function resetRecoveryMemoryForTests(): void {
  memoryStore.length = 0;
  recordCounter = 0;
}

export function recordRecoveryOutcome(input: RecoveryMemoryInput): RecoveryMemoryRecord {
  recordCounter += 1;
  const record: RecoveryMemoryRecord = {
    readOnly: true,
    recordId: `recovery-memory-${recordCounter}-${Date.now()}`,
    projectId: input.projectId ?? null,
    failureStage: input.failureStage,
    failureType: input.failureType,
    rootCauseSummary: input.rootCauseSummary,
    repairStrategy: input.repairStrategy,
    repairDurationMs: input.repairDurationMs,
    repairSuccess: input.repairSuccess,
    replayPassed: input.replayPassed,
    evidenceRefs: input.evidenceRefs ?? [],
    alternativeStrategies: input.alternativeStrategies ?? [],
    recordedAt: Date.now(),
  };
  memoryStore.push(record);
  return record;
}

export function listRecoveryMemoryRecords(): readonly RecoveryMemoryRecord[] {
  return [...memoryStore];
}

export function findSimilarRecoveryRecords(input: {
  failureType: RootCauseCategory;
  failureStage?: string;
}): RecoveryMemoryRecord[] {
  return memoryStore.filter(
    (r) =>
      r.failureType === input.failureType &&
      (!input.failureStage || r.failureStage === input.failureStage),
  );
}

export function getRecoverySuccessRate(failureType: RootCauseCategory): number {
  const matches = memoryStore.filter((r) => r.failureType === failureType);
  if (matches.length === 0) return 0;
  const successes = matches.filter((r) => r.repairSuccess && r.replayPassed).length;
  return successes / matches.length;
}
