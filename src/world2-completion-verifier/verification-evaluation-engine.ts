/**
 * Verification evaluation engine — evaluates verification requirements.
 * Verification only. No execution.
 */

import type { VerificationRequirement } from '../world2-autonomous-builder/types.js';
import type { VerificationResultItem } from './types.js';

export function evaluateVerificationRequirements(
  requirements: VerificationRequirement[],
): VerificationResultItem[] {
  return requirements.map((req, index) => {
    const failed = req.forecastResult === 'LIKELY_FAIL';
    const warning = req.forecastResult === 'LIKELY_PARTIAL';
    return {
      resultId: `world2-verify-result-${(index + 1).toString().padStart(4, '0')}`,
      pointId: req.pointId,
      result: failed ? 'FAILED' : warning ? 'WARNING' : 'PASSED',
      description: `Verification ${req.forecastResult} at ${req.stageType}: ${req.description}`,
    };
  });
}

export function countFailedVerifications(results: VerificationResultItem[]): number {
  return results.filter((r) => r.result === 'FAILED').length;
}

export function verificationResultsKey(results: VerificationResultItem[]): string {
  return results.map((r) => `${r.pointId}|${r.result}`).join(';');
}
