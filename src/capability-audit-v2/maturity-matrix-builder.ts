/**
 * AiDevEngine Capability Audit V2 — maturity matrix builder.
 */

import type { CapabilityAuditV2Assessment, MaturityMatrixEntry } from './capability-audit-types.js';

export function buildMaturityMatrix(
  assessment: CapabilityAuditV2Assessment,
): readonly MaturityMatrixEntry[] {
  return assessment.capabilities.map((entry) => ({
    capabilityName: entry.name,
    category: entry.category,
    maturityScore: entry.maturity,
    status: entry.status,
  }));
}

export function buildMaturitySummary(assessment: CapabilityAuditV2Assessment): {
  byCategory: Record<string, { count: number; mature: number; partial: number; experimental: number; missing: number; avgMaturity: number }>;
  overallAvgMaturity: number;
} {
  const byCategory: Record<
    string,
    { count: number; mature: number; partial: number; experimental: number; missing: number; avgMaturity: number }
  > = {};

  for (const category of assessment.categories) {
    const entries = assessment.capabilities.filter((c) => c.category === category);
    const avgMaturity =
      entries.length > 0
        ? Math.round(entries.reduce((sum, e) => sum + e.maturity, 0) / entries.length)
        : 0;
    byCategory[category] = {
      count: entries.length,
      mature: entries.filter((e) => e.status === 'MATURE').length,
      partial: entries.filter((e) => e.status === 'PARTIAL').length,
      experimental: entries.filter((e) => e.status === 'EXPERIMENTAL').length,
      missing: entries.filter((e) => e.status === 'MISSING').length,
      avgMaturity,
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
