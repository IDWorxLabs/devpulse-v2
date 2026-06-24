/**
 * Product Architect Intelligence V1 — assessment history.
 */

import { MAX_PRODUCT_ARCHITECT_INTELLIGENCE_HISTORY } from './product-architect-intelligence-bounds.js';
import type {
  ProductArchitectIntelligenceHistoryEntry,
  ProductArchitectureAssessment,
} from './product-architect-intelligence-types.js';

const history: ProductArchitectIntelligenceHistoryEntry[] = [];
let lastAssessment: ProductArchitectureAssessment | null = null;

export function resetProductArchitectIntelligenceHistoryForTests(): void {
  history.length = 0;
  lastAssessment = null;
}

export function recordProductArchitectureAssessment(
  assessment: ProductArchitectureAssessment,
): ProductArchitectIntelligenceHistoryEntry {
  const entry: ProductArchitectIntelligenceHistoryEntry = {
    readOnly: true,
    runId: `pai-${Date.now()}-${history.length + 1}`,
    profile: assessment.profile,
    productName: assessment.productName,
    productDomain: assessment.productDomain,
    productReadinessScore: assessment.scores.productReadinessScore,
    readinessLabel: assessment.scores.readinessLabel,
    criticalGapCount: assessment.gapReport.criticalGapCount,
    timestamp: assessment.generatedAt,
  };

  history.unshift(entry);
  if (history.length > MAX_PRODUCT_ARCHITECT_INTELLIGENCE_HISTORY) {
    history.length = MAX_PRODUCT_ARCHITECT_INTELLIGENCE_HISTORY;
  }
  lastAssessment = assessment;
  return entry;
}

export function getLastProductArchitectureAssessment(): ProductArchitectureAssessment | null {
  return lastAssessment;
}

export function listProductArchitectIntelligenceHistory(): readonly ProductArchitectIntelligenceHistoryEntry[] {
  return history;
}

export function getProductArchitectIntelligenceHistorySize(): number {
  return history.length;
}
