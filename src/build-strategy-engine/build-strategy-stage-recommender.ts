/**
 * Build Strategy Engine — stage recommender (strategy/planning only).
 */

import {
  nextBuildStrategyStageId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyStage,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import { recordBuildStrategyLifecycleEvent } from './build-strategy-lifecycle.js';
import type { BuildStrategyStageRecommendation } from './build-strategy-types.js';
import { resolveDefaultStageNamesForCategory } from './build-strategy-types.js';

export function recommendBuildStage(input: {
  buildStrategyId: string;
  stageName: string;
  stageOrder: number;
  stageReason?: string;
}): BuildStrategyStageRecommendation | null {
  const record = getStoredBuildStrategyRecord(input.buildStrategyId);
  if (!record) return null;

  const stage: BuildStrategyStageRecommendation = {
    stageId: nextBuildStrategyStageId(),
    buildStrategyId: input.buildStrategyId,
    stageName: input.stageName,
    stageOrder: input.stageOrder,
    stageReason: input.stageReason ?? `Recommended stage ${input.stageName} — metadata only`,
    recommendedAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyStage(stage);
  const updated = [...record.strategyStages, stage].sort((a, b) => a.stageOrder - b.stageOrder);
  storeBuildStrategyRecord({ ...record, strategyStages: updated, updatedAt: Date.now() });

  recordBuildStrategyHistoryEntry({
    buildStrategyId: input.buildStrategyId,
    category: 'STAGES',
    summary: `Stage ${stage.stageId}: ${input.stageName}`,
    scopeUsed: stage.stageId,
  });

  return stage;
}

export function recommendBuildStages(buildStrategyId: string): BuildStrategyStageRecommendation[] {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return [];

  const stageNames = resolveDefaultStageNamesForCategory(record.strategyCategory);
  const created: BuildStrategyStageRecommendation[] = [];

  stageNames.forEach((name, index) => {
    const stage = recommendBuildStage({
      buildStrategyId,
      stageName: name,
      stageOrder: index + 1,
    });
    if (stage) created.push(stage);
  });

  recordBuildStrategyLifecycleEvent(
    buildStrategyId,
    'STRATEGY_STAGES_RECOMMENDED',
    `Recommended ${created.length} stages — strategy/planning only`,
  );

  return created;
}

export function getBuildStrategyStages(buildStrategyId: string): BuildStrategyStageRecommendation[] {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyStages ?? [];
}
