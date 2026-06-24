/**
 * Production Readiness Gate V1 — aggregate domain scores.
 */

import type {
  DomainScoresReport,
  ProductionCategoryResult,
  ProductionReadinessDomainId,
} from './production-readiness-gate-v1-types.js';

const DOMAIN_ORDER: readonly ProductionReadinessDomainId[] = [
  'SECURITY',
  'RELIABILITY',
  'OBSERVABILITY',
  'CONFIGURATION',
  'DEPLOYMENT',
  'RECOVERY',
  'SCALABILITY',
  'DATA_PROTECTION',
  'OPERATIONAL_RISK',
];

export function buildDomainScoresReport(
  results: readonly ProductionCategoryResult[],
): DomainScoresReport {
  const domains = DOMAIN_ORDER.map((domainId) => {
    const entries = results.flatMap((r) => r.domainScores.filter((d) => d.domain === domainId));
    const score =
      entries.length > 0
        ? Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length)
        : 0;
    const label = entries[0]?.label ?? domainId;
    const findings = [...new Set(entries.flatMap((e) => e.findings))].slice(0, 4);
    const status = score >= 80 ? ('MATURE' as const) : score >= 55 ? ('PARTIAL' as const) : ('MISSING' as const);
    return {
      readOnly: true as const,
      domain: domainId,
      label,
      score,
      status,
      findings,
    };
  });

  const overallScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.productionReadinessScore, 0) / results.length)
      : 0;

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    overallScore,
    domains,
  };
}
