/**
 * Product Evolution Reality Authority — bounded history.
 */

import { MAX_PRODUCT_EVOLUTION_REALITY_HISTORY } from './product-evolution-reality-registry.js';
import type {
  ProductEvolutionRealityAssessment,
  ProductEvolutionRealityHistoryEntry,
  ProductEvolutionRealityHistorySummary,
} from './product-evolution-reality-types.js';

const history: ProductEvolutionRealityHistoryEntry[] = [];

export function resetProductEvolutionRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordProductEvolutionRealityAssessment(
  assessment: ProductEvolutionRealityAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    productEvolutionState: report.productEvolutionState,
    overallEvolutionScore: report.overallEvolutionScore,
    feedbackLearningObserved: report.feedbackLearningObserved,
  });
  if (history.length > MAX_PRODUCT_EVOLUTION_REALITY_HISTORY) {
    history.length = MAX_PRODUCT_EVOLUTION_REALITY_HISTORY;
  }
}

export function getProductEvolutionRealityHistorySize(): number {
  return history.length;
}

export function buildProductEvolutionRealityHistorySummary(
  entries: readonly ProductEvolutionRealityHistoryEntry[] = history,
): ProductEvolutionRealityHistorySummary {
  return {
    totalAssessments: entries.length,
    learningProductAssessments: entries.filter(
      (e) =>
        e.productEvolutionState === 'LEARNING_PRODUCT' ||
        e.productEvolutionState === 'EVOLVING_PRODUCT' ||
        e.productEvolutionState === 'ADAPTIVE_PRODUCT',
    ).length,
    evolvingProductAssessments: entries.filter(
      (e) => e.productEvolutionState === 'EVOLVING_PRODUCT' || e.productEvolutionState === 'ADAPTIVE_PRODUCT',
    ).length,
    adaptiveProductAssessments: entries.filter((e) => e.productEvolutionState === 'ADAPTIVE_PRODUCT').length,
  };
}
