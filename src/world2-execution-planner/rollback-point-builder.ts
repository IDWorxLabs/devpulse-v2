/**
 * Rollback point builder — creates rollback checkpoints for execution plans.
 * Planning only. No execution.
 */

import type { ExecutionStage, RollbackPoint, RollbackPointType } from './types.js';

let rollbackCounter = 0;

export function resetRollbackCounterForTests(): void {
  rollbackCounter = 0;
}

function createRollbackId(): string {
  rollbackCounter += 1;
  return `world2-rollback-${rollbackCounter.toString().padStart(4, '0')}`;
}

const ROLLBACK_STAGES: Array<{ stageType: ExecutionStage['stageType']; pointType: RollbackPointType }> = [
  { stageType: 'ARCHITECTURE', pointType: 'checkpointRecommended' },
  { stageType: 'IMPLEMENTATION', pointType: 'checkpointCreated' },
  { stageType: 'VERIFICATION', pointType: 'checkpointRequired' },
  { stageType: 'STABILIZATION', pointType: 'checkpointRequired' },
];

export function buildRollbackPoints(stages: ExecutionStage[]): RollbackPoint[] {
  const stageTypes = new Set(stages.map((s) => s.stageType));

  return ROLLBACK_STAGES.filter((r) => stageTypes.has(r.stageType)).map((r) => {
    const stage = stages.find((s) => s.stageType === r.stageType)!;
    return {
      pointId: createRollbackId(),
      pointType: r.pointType,
      stageType: r.stageType,
      description: `${r.pointType} checkpoint at ${stage.stageName}`,
    };
  });
}

export function rollbackOutputKey(points: RollbackPoint[]): string {
  return points.map((p) => `${p.pointType}|${p.stageType}`).join(';');
}
