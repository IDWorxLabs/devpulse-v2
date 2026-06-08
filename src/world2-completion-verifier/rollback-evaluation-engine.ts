/**
 * Rollback evaluation engine — evaluates rollback requirements.
 * Verification only. No execution.
 */

import type { RollbackRequirement } from '../world2-autonomous-builder/types.js';
import type { RollbackResult } from './types.js';

export function evaluateRollbackRequirements(
  requirements: RollbackRequirement[],
): RollbackResult[] {
  return requirements.map((req, index) => {
    const failed = req.checkpointRequired && req.triggerLikelihood === 'VERY_HIGH';
    const warning =
      req.checkpointRequired &&
      (req.triggerLikelihood === 'HIGH' || req.triggerLikelihood === 'MEDIUM');
    return {
      resultId: `world2-rollback-result-${(index + 1).toString().padStart(4, '0')}`,
      requirementId: req.requirementId,
      result: failed ? 'FAILED' : warning ? 'WARNING' : 'PASSED',
      description: `Rollback ${req.triggerLikelihood} at ${req.stageType}: ${req.description}`,
    };
  });
}

export function countFailedRollbackProtections(results: RollbackResult[]): number {
  return results.filter((r) => r.result === 'FAILED').length;
}

export function rollbackResultsKey(results: RollbackResult[]): string {
  return results.map((r) => `${r.requirementId}|${r.result}`).join(';');
}
