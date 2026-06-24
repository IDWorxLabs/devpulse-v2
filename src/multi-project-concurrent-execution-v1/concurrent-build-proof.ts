/**
 * Multi-Project Concurrent Execution V1 — build proof with timestamps.
 */

import type {
  ConcurrentBuildProof,
  ConcurrentProjectResult,
} from './multi-project-concurrent-execution-v1-types.js';

export function buildConcurrentBuildProof(
  projectResults: readonly ConcurrentProjectResult[],
): ConcurrentBuildProof {
  const generatedAt = new Date().toISOString();
  const entries = projectResults.map((result) => {
    const exec = result.executionResult;
    const started = exec?.job.requestedAt ?? generatedAt;
    const completed = exec?.job.completedAt ?? generatedAt;
    return {
      readOnly: true as const,
      projectId: result.projectId,
      profile: result.profile,
      productName: result.productName,
      buildStartedAt: started,
      buildCompletedAt: completed,
      previewStartedAt: started,
      previewCompletedAt: completed,
      verificationCompletedAt: completed,
      buildProof: result.buildProof,
      previewProof: result.previewProof,
      verificationProof: result.verificationProof,
    };
  });

  return {
    readOnly: true,
    generatedAt,
    entries,
    allBuildProofComplete: entries.every(
      (e) => e.buildProof && e.previewProof && e.verificationProof,
    ),
  };
}
