/**
 * AiDevEngine Capability Audit V3 — maturity matrix builder.
 */

import type { CapabilityAuditV3Assessment, MaturityMatrixEntry } from './capability-audit-types.js';

export function buildMaturityMatrix(
  assessment: CapabilityAuditV3Assessment,
): readonly MaturityMatrixEntry[] {
  return assessment.capabilities.map((entry) => ({
    capabilityName: entry.name,
    category: entry.category,
    maturityScore: entry.maturity,
    status: entry.status,
  }));
}

export function buildMaturitySummary(assessment: CapabilityAuditV3Assessment): {
  byCategory: Record<
    string,
    {
      count: number;
      mature: number;
      partial: number;
      experimental: number;
      missing: number;
      avgMaturity: number;
      status: string;
    }
  >;
  overallAvgMaturity: number;
} {
  const byCategory: Record<
    string,
    {
      count: number;
      mature: number;
      partial: number;
      experimental: number;
      missing: number;
      avgMaturity: number;
      status: string;
    }
  > = {};

  for (const cat of assessment.categoryAssessments) {
    byCategory[cat.categoryId] = {
      count: cat.capabilityCount,
      mature: cat.matureCount,
      partial: cat.partialCount,
      experimental: cat.experimentalCount,
      missing: cat.missingCount,
      avgMaturity: cat.maturityScore,
      status: cat.status,
    };
  }

  const overallAvgMaturity =
    assessment.capabilityCount > 0
      ? Math.round(
          assessment.capabilities.reduce((sum, e) => sum + e.maturity, 0) /
            assessment.capabilityCount,
        )
      : 0;

  return { byCategory, overallAvgMaturity };
}
