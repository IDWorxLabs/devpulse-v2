/**
 * Planning Gate History — bounded analysis history (max 32).
 */

import { MAX_PLANNING_GATE_HISTORY } from './planning-gate-registry.js';
import type { PlanningGateAnalysis, PlanningGateHistoryEntry } from './planning-gate-types.js';

const history: PlanningGateHistoryEntry[] = [];
const analyses: PlanningGateAnalysis[] = [];

export function resetPlanningGateHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordPlanningGateAnalysis(analysis: PlanningGateAnalysis): void {
  const entry: PlanningGateHistoryEntry = {
    analysisId: analysis.analysisId,
    timestamp: analysis.analyzedAt,
    planningReadinessScore: analysis.planningReadiness.planningReadinessScore,
    planningGateDecision: analysis.planningGateDecision,
    safeToPlan: analysis.safeToPlan,
    riskCount: analysis.planningRiskAnalysis.riskCount,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_PLANNING_GATE_HISTORY) {
    history.length = MAX_PLANNING_GATE_HISTORY;
  }
  if (analyses.length > MAX_PLANNING_GATE_HISTORY) {
    analyses.length = MAX_PLANNING_GATE_HISTORY;
  }
}

export function getPlanningGateHistorySize(): number {
  return history.length;
}

export function getPlanningGateHistory(): readonly PlanningGateHistoryEntry[] {
  return [...history];
}

export function getPlanningGateAnalyses(): readonly PlanningGateAnalysis[] {
  return [...analyses];
}

export function getLatestPlanningGateAnalysis(): PlanningGateAnalysis | null {
  return analyses[0] ?? null;
}
