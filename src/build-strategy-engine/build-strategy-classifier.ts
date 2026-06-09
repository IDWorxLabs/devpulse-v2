/**
 * Build Strategy Engine — build strategy classifier (strategy/planning only).
 */

import {
  nextBuildStrategyClassificationId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyClassification,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import { recordBuildStrategyLifecycleEvent } from './build-strategy-lifecycle.js';
import type { BuildStrategyClassification, BuildStrategyCategory } from './build-strategy-types.js';

export function classifyBuildStrategy(input: {
  buildStrategyId: string;
  category?: BuildStrategyCategory;
  classificationReason?: string;
}): BuildStrategyClassification | null {
  const record = getStoredBuildStrategyRecord(input.buildStrategyId);
  if (!record) return null;

  const category = input.category ?? record.strategyCategory;
  const classification: BuildStrategyClassification = {
    classificationId: nextBuildStrategyClassificationId(),
    buildStrategyId: input.buildStrategyId,
    category,
    classificationReason: input.classificationReason ?? `Classified as ${category} — strategy/planning only`,
    classifiedAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyClassification(classification);
  storeBuildStrategyRecord({
    ...record,
    strategyCategory: category,
    strategyClassification: classification,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId: input.buildStrategyId,
    category: 'CLASSIFICATION',
    summary: `Classification ${classification.classificationId}: ${category}`,
    scopeUsed: classification.classificationId,
  });

  recordBuildStrategyLifecycleEvent(
    input.buildStrategyId,
    'STRATEGY_CLASSIFIED',
    classification.classificationReason,
  );

  return classification;
}

export function getBuildStrategyClassification(buildStrategyId: string): BuildStrategyClassification | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyClassification ?? null;
}
