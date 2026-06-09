/**
 * Autonomous Builder Foundation — stage metadata (planning only).
 */

import {
  nextAutonomousBuildStageId,
  getStoredAutonomousBuildRecord,
  storeAutonomousBuildRecord,
  storeAutonomousBuildStage,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import { recordAutonomousBuildLifecycleEvent } from './autonomous-builder-lifecycle.js';
import type { AutonomousBuildStage } from './autonomous-builder-types.js';
import { resolveDefaultStageNamesForCategory } from './autonomous-builder-types.js';

export function createAutonomousStage(input: {
  autonomousBuildId: string;
  stageName?: string;
  stageOrder?: number;
  stageReason?: string;
}): AutonomousBuildStage | null {
  const record = getStoredAutonomousBuildRecord(input.autonomousBuildId);
  if (!record) return null;

  const planId = record.buildPlan?.planId ?? '';
  const existingCount = record.buildStages.length;
  const defaultNames = resolveDefaultStageNamesForCategory(record.buildCategory);
  const stageName = input.stageName ?? defaultNames[existingCount] ?? `Stage ${existingCount + 1}`;

  const stage: AutonomousBuildStage = {
    stageId: nextAutonomousBuildStageId(),
    autonomousBuildId: input.autonomousBuildId,
    planId,
    stageName,
    stageOrder: input.stageOrder ?? existingCount + 1,
    stageReason: input.stageReason ?? `Planning stage for ${record.buildMetadata.buildName}`,
    planningOnly: true,
    createdAt: Date.now(),
  };

  storeAutonomousBuildStage(stage);
  const updatedStages = [...record.buildStages, stage];
  storeAutonomousBuildRecord({ ...record, buildStages: updatedStages, updatedAt: Date.now() });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId: input.autonomousBuildId,
    category: 'STAGE',
    summary: `Stage ${stage.stageId}: ${stage.stageName} order=${stage.stageOrder}`,
    scopeUsed: stage.stageId,
  });

  recordAutonomousBuildLifecycleEvent(
    input.autonomousBuildId,
    'BUILD_STAGE_CREATED',
    `Stage created: ${stage.stageName}`,
  );
  return stage;
}

export function createAutonomousStagesForPlan(autonomousBuildId: string): AutonomousBuildStage[] {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return [];

  const stageCount = record.buildPlan?.stageCount ?? resolveDefaultStageNamesForCategory(record.buildCategory).length;
  const created: AutonomousBuildStage[] = [];
  for (let i = record.buildStages.length; i < stageCount; i++) {
    const stage = createAutonomousStage({ autonomousBuildId });
    if (stage) created.push(stage);
  }
  return created;
}

export function getAutonomousBuildStages(autonomousBuildId: string): AutonomousBuildStage[] {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildStages ?? [];
}
