/**
 * Production Readiness Gate V1 — production matrix builder.
 */

import type {
  ProductionCategoryResult,
  ProductionMatrixEntry,
} from './production-readiness-gate-v1-types.js';

export function buildProductionMatrix(
  results: readonly ProductionCategoryResult[],
): readonly ProductionMatrixEntry[] {
  return results.map((result) => ({
    readOnly: true,
    profile: result.profile,
    productName: result.productName,
    buildProven: result.upstreamEvidence.buildProven,
    previewProven: result.upstreamEvidence.previewProven,
    verificationProven: result.upstreamEvidence.verificationProven,
    launchReady: result.upstreamEvidence.launchReady,
    productionReadinessScore: result.productionReadinessScore,
    verdict: result.verdict,
  }));
}

export function formatProductionMatrixText(matrix: readonly ProductionMatrixEntry[]): string {
  const lines = ['Production Readiness Matrix', '==================', ''];
  for (const entry of matrix) {
    lines.push(
      `${entry.productName.padEnd(28)} build=${entry.buildProven ? 'Y' : 'N'} preview=${entry.previewProven ? 'Y' : 'N'} verify=${entry.verificationProven ? 'Y' : 'N'} launch=${entry.launchReady ? 'Y' : 'N'} score=${entry.productionReadinessScore} ${entry.verdict}`,
    );
  }
  return lines.join('\n');
}
