/**
 * Planning Brief History — bounded brief history (max 32).
 */

import { MAX_PLANNING_BRIEF_HISTORY } from './planning-brief-registry.js';
import type { PlanningBrief, PlanningBriefHistoryEntry } from './planning-brief-types.js';

const history: PlanningBriefHistoryEntry[] = [];
const briefs: PlanningBrief[] = [];

export function resetPlanningBriefHistoryForTests(): void {
  history.length = 0;
  briefs.length = 0;
}

export function recordPlanningBrief(brief: PlanningBrief): void {
  const entry: PlanningBriefHistoryEntry = {
    briefId: brief.briefId,
    timestamp: brief.generatedAt,
    planningBriefConfidence: brief.planningBriefConfidence,
    planningBriefQuality: brief.planningBriefQuality,
    planningBriefReadiness: brief.planningBriefReadiness,
    screenCount: brief.screenInventory.length,
    workflowCount: brief.workflowInventory.length,
  };

  history.unshift(entry);
  briefs.unshift(brief);

  if (history.length > MAX_PLANNING_BRIEF_HISTORY) {
    history.length = MAX_PLANNING_BRIEF_HISTORY;
  }
  if (briefs.length > MAX_PLANNING_BRIEF_HISTORY) {
    briefs.length = MAX_PLANNING_BRIEF_HISTORY;
  }
}

export function getPlanningBriefHistorySize(): number {
  return history.length;
}

export function getPlanningBriefHistory(): readonly PlanningBriefHistoryEntry[] {
  return [...history];
}

export function getPlanningBriefs(): readonly PlanningBrief[] {
  return [...briefs];
}

export function getLatestPlanningBrief(): PlanningBrief | null {
  return briefs[0] ?? null;
}
