/**
 * Multi-Project Concurrent Execution V1 — verification assessment across concurrent projects.
 */

import type {
  ConcurrentProjectResult,
  ConcurrentVerificationAssessment,
} from './multi-project-concurrent-execution-v1-types.js';

function rate(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

export function assessConcurrentVerification(
  projectResults: readonly ConcurrentProjectResult[],
): ConcurrentVerificationAssessment {
  const total = projectResults.length;
  const buildPassed = projectResults.filter((r) => r.buildProof).length;
  const previewPassed = projectResults.filter((r) => r.previewProof).length;
  const verificationPassed = projectResults.filter((r) => r.verificationProof).length;
  const productionPassed = projectResults.filter(
    (r) => (r.productionReadinessScore ?? 0) >= 70,
  ).length;
  const allPassed = projectResults.filter((r) => r.passed).length;

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    projectsTotal: total,
    buildSuccessRate: rate(buildPassed, total),
    previewSuccessRate: rate(previewPassed, total),
    verificationSuccessRate: rate(verificationPassed, total),
    productionReadinessRate: rate(productionPassed, total),
    concurrentPassRate: rate(allPassed, total),
  };
}
