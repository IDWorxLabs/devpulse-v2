/**
 * Phase 26.5 — Weighted product readiness score builder.
 */

import type {
  ProductReadinessSimulationId,
  ProductReadinessSimulationResult,
  ProductReadinessVerdict,
} from './product-readiness-types.js';

export const PRODUCT_READINESS_WEIGHTS: Record<ProductReadinessSimulationId, number> = {
  CHAT_INTELLIGENCE: 20,
  PRODUCT_CREATION_JOURNEY: 15,
  EXECUTION_REALITY: 15,
  VERIFICATION: 10,
  IDENTITY: 5,
  PROJECT_MEMORY: 10,
  LAUNCH_DAY: 15,
  FIRST_TIME_USER: 1.25,
  SKEPTICAL_FOUNDER: 1.25,
  INVESTOR: 1.25,
  NON_TECHNICAL_USER: 1.25,
  POWER_USER: 1.25,
  FRUSTRATED_USER: 1.25,
  UI_NAVIGATION: 1.25,
  CLAIM_VS_REALITY: 1.25,
};

export const CHAT_INTELLIGENCE_LAUNCH_GATE = 85;

export function verdictFromScore(score: number): ProductReadinessVerdict {
  if (score >= 90) return 'LAUNCH_READY';
  if (score >= 80) return 'LAUNCH_READY_WITH_WARNINGS';
  if (score >= 70) return 'NOT_YET_LAUNCH_READY';
  return 'LAUNCH_BLOCKED';
}

export function simulationVerdictFromScore(score: number): ProductReadinessVerdict {
  return verdictFromScore(score);
}

export function buildWeightedReadinessScore(
  simulations: Array<Pick<ProductReadinessSimulationResult, 'id' | 'score'>>,
): number {
  let total = 0;
  for (const sim of simulations) {
    const weight = PRODUCT_READINESS_WEIGHTS[sim.id] ?? 0;
    total += (sim.score * weight) / 100;
  }
  return Math.round(Math.max(0, Math.min(100, total)));
}

export function attachWeights(
  simulations: Omit<ProductReadinessSimulationResult, 'weightPercent' | 'weightedContribution'>[],
): ProductReadinessSimulationResult[] {
  return simulations.map((sim) => {
    const weightPercent = PRODUCT_READINESS_WEIGHTS[sim.id] ?? 0;
    return {
      ...sim,
      readOnly: true as const,
      weightPercent,
      weightedContribution: Math.round((sim.score * weightPercent) / 100),
    };
  });
}
