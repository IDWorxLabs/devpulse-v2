/**
 * CQI Maturity V1 — requirement coverage matrix.
 */

import type { RequirementCoverageRow, RequirementCoverageStatus, RequirementGapCategory } from './cqi-maturity-types.js';
import {
  REQUIREMENT_GAP_CATEGORY_DEFINITIONS,
  scoreRequirementCategory,
} from './cqi-requirement-gap-detector.js';

function statusFromScore(score: number): RequirementCoverageStatus {
  if (score >= 85) return 'Complete';
  if (score >= 50) return 'Partial';
  return 'Missing';
}

export function buildRequirementCoverageMatrix(evidenceText: string): RequirementCoverageRow[] {
  return REQUIREMENT_GAP_CATEGORY_DEFINITIONS.map((categoryDef) => {
    const score = scoreRequirementCategory({ evidenceText, category: categoryDef });
    return {
      category: categoryDef.category,
      status: statusFromScore(score),
      score,
    };
  });
}

export function summarizeCoverageMatrix(matrix: readonly RequirementCoverageRow[]): string[] {
  return matrix.map((row) => `${row.category}: ${row.status}`);
}

export function computeRequirementConfidenceScore(
  categoryScores: Readonly<Record<RequirementGapCategory, number>>,
): number {
  const values = Object.values(categoryScores);
  if (values.length === 0) return 0;
  const total = values.reduce((sum, score) => sum + score, 0);
  return Math.max(0, Math.min(100, Math.round(total / values.length)));
}
