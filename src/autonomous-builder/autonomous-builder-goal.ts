/**
 * Autonomous Builder Foundation — goal metadata (planning only).
 */

import {
  nextAutonomousBuildGoalId,
  getStoredAutonomousBuildRecord,
  storeAutonomousBuildRecord,
  storeAutonomousBuildGoal,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import { recordAutonomousBuildLifecycleEvent } from './autonomous-builder-lifecycle.js';
import type { AutonomousBuildGoal, AutonomousBuildCategory } from './autonomous-builder-types.js';

export function createAutonomousGoal(input: {
  autonomousBuildId: string;
  goalName?: string;
  goalDescription?: string;
  category?: AutonomousBuildCategory;
}): AutonomousBuildGoal | null {
  const record = getStoredAutonomousBuildRecord(input.autonomousBuildId);
  if (!record) return null;

  const category = input.category ?? record.buildCategory;
  const goal: AutonomousBuildGoal = {
    goalId: nextAutonomousBuildGoalId(),
    autonomousBuildId: input.autonomousBuildId,
    goalName: input.goalName ?? `${record.buildMetadata.buildName} Goal`,
    goalDescription: input.goalDescription ?? `Planning goal for ${record.buildMetadata.buildName}`,
    category,
    planningOnly: true,
    createdAt: Date.now(),
  };

  storeAutonomousBuildGoal(goal);
  storeAutonomousBuildRecord({ ...record, buildGoal: goal, updatedAt: Date.now() });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId: input.autonomousBuildId,
    category: 'GOAL',
    summary: `Goal ${goal.goalId}: ${goal.goalName}`,
    scopeUsed: goal.goalId,
  });

  recordAutonomousBuildLifecycleEvent(input.autonomousBuildId, 'BUILD_GOAL_CREATED', `Goal created: ${goal.goalName}`);
  return goal;
}

export function getAutonomousBuildGoal(autonomousBuildId: string): AutonomousBuildGoal | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildGoal ?? null;
}
