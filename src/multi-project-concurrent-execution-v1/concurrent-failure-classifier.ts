/**
 * Multi-Project Concurrent Execution V1 — failure classification.
 */

import type {
  ConcurrentFailureClassification,
  ConcurrentFailureClass,
  ConcurrentProjectResult,
} from './multi-project-concurrent-execution-v1-types.js';

function classifyFailure(result: ConcurrentProjectResult): ConcurrentFailureClass | null {
  if (result.passed) return null;
  if (!result.contaminationCheckPassed) return 'Isolation Failure';
  if (!result.buildProof) return 'Build Failure';
  if (!result.previewProof) return 'Preview Failure';
  if (!result.verificationProof) return 'Verification Failure';
  const verdict = result.executionResult?.aflaVerdict;
  if (!verdict) return 'Authority Failure';
  return 'Verification Failure';
}

export function classifyConcurrentFailures(
  projectResults: readonly ConcurrentProjectResult[],
): ConcurrentFailureClassification {
  const failures = projectResults
    .map((result) => {
      const failureClass = classifyFailure(result);
      if (!failureClass) return null;
      return {
        readOnly: true as const,
        projectId: result.projectId,
        profile: result.profile,
        failureClass,
        detail: `${result.productName} failed during concurrent execution`,
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    failures,
    totalFailures: failures.length,
  };
}
