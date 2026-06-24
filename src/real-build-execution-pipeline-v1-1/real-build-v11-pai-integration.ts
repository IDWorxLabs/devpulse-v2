/**
 * Real Build Execution Pipeline V1.1 — Product Architect integration.
 */

import type { RealBuildCategoryResult } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';

export function classifyProductArchitectExecutionStatus(result: RealBuildCategoryResult): {
  status: 'Architecturally Complete' | 'Architecturally Complete + Executed' | 'Incomplete';
  countsTowardProof: boolean;
} {
  const paiScore = result.metrics.productReadinessScore;
  const executed = result.stageResults?.paiExecuted ?? false;
  const passed = result.stageResults?.paiPassed ?? false;

  if (passed && executed) {
    return { status: 'Architecturally Complete + Executed', countsTowardProof: true };
  }
  if (paiScore >= 60) {
    return { status: 'Architecturally Complete', countsTowardProof: false };
  }
  return { status: 'Incomplete', countsTowardProof: false };
}
