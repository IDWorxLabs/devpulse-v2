/**
 * Real Build Execution Pipeline V1.1 — execution matrix.
 */

import type { RealBuildCategoryResult } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';
import type { ExecutionMatrixEntry } from './real-build-execution-pipeline-v11-types.js';

export function buildExecutionMatrix(
  results: readonly RealBuildCategoryResult[],
): readonly ExecutionMatrixEntry[] {
  return results.map((result) => ({
    readOnly: true,
    productName: result.productName,
    profile: result.profile,
    status: result.executionProof.proofComplete ? 'PASS' : 'FAIL',
    proofComplete: result.executionProof.proofComplete,
  }));
}

export function formatExecutionMatrixText(matrix: readonly ExecutionMatrixEntry[]): string {
  const maxLen = Math.max(...matrix.map((e) => e.productName.length), 8);
  return matrix
    .map((entry) => {
      const dots = '.'.repeat(Math.max(1, maxLen - entry.productName.length + 4));
      return `${entry.productName} ${dots} ${entry.status}`;
    })
    .join('\n');
}
