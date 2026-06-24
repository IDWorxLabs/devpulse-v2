/**
 * Production Readiness Gate V1 — assessment history.
 */

import type { ProductionReadinessGateV1Assessment } from './production-readiness-gate-v1-types.js';
import { MAX_PRODUCTION_READINESS_GATE_HISTORY } from './production-readiness-gate-v1-bounds.js';

const history: ProductionReadinessGateV1Assessment[] = [];

export function recordProductionReadinessGateAssessment(
  assessment: ProductionReadinessGateV1Assessment,
): void {
  history.unshift(assessment);
  if (history.length > MAX_PRODUCTION_READINESS_GATE_HISTORY) {
    history.length = MAX_PRODUCTION_READINESS_GATE_HISTORY;
  }
}

export function getLastProductionReadinessGateAssessment(): ProductionReadinessGateV1Assessment | null {
  return history[0] ?? null;
}

export function listProductionReadinessGateHistory(): readonly ProductionReadinessGateV1Assessment[] {
  return history;
}

export function resetProductionReadinessGateHistoryForTests(): void {
  history.length = 0;
}

export function seedProductionReadinessGateHistoryForTests(
  assessment: ProductionReadinessGateV1Assessment,
): void {
  recordProductionReadinessGateAssessment(assessment);
}
