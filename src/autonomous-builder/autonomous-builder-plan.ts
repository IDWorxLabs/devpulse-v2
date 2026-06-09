/**
 * Autonomous Builder Foundation — plan metadata (planning only).
 */

import {
  nextAutonomousBuildPlanId,
  getStoredAutonomousBuildRecord,
  storeAutonomousBuildRecord,
  storeAutonomousBuildPlan,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import { recordAutonomousBuildLifecycleEvent } from './autonomous-builder-lifecycle.js';
import type { AutonomousBuildPlan } from './autonomous-builder-types.js';
import { resolveDefaultStageNamesForCategory } from './autonomous-builder-types.js';

export function createAutonomousPlan(input: {
  autonomousBuildId: string;
  planName?: string;
  planSummary?: string;
  stageCount?: number;
}): AutonomousBuildPlan | null {
  const record = getStoredAutonomousBuildRecord(input.autonomousBuildId);
  if (!record) return null;

  const defaultStages = resolveDefaultStageNamesForCategory(record.buildCategory);
  const plan: AutonomousBuildPlan = {
    planId: nextAutonomousBuildPlanId(),
    autonomousBuildId: input.autonomousBuildId,
    planName: input.planName ?? `${record.buildMetadata.buildName} Plan`,
    planSummary: input.planSummary ?? `Planning metadata for ${record.buildMetadata.buildName}`,
    stageCount: input.stageCount ?? defaultStages.length,
    planningOnly: true,
    createdAt: Date.now(),
  };

  storeAutonomousBuildPlan(plan);
  storeAutonomousBuildRecord({ ...record, buildPlan: plan, updatedAt: Date.now() });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId: input.autonomousBuildId,
    category: 'PLAN',
    summary: `Plan ${plan.planId}: ${plan.planName} stages=${plan.stageCount}`,
    scopeUsed: plan.planId,
  });

  recordAutonomousBuildLifecycleEvent(input.autonomousBuildId, 'BUILD_PLAN_CREATED', `Plan created: ${plan.planName}`);
  recordAutonomousBuildLifecycleEvent(input.autonomousBuildId, 'BUILD_PLANNING', 'Build planning started');
  return plan;
}

export function getAutonomousBuildPlan(autonomousBuildId: string): AutonomousBuildPlan | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildPlan ?? null;
}
