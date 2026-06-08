/**
 * Workspace integrity engine — evaluates workspace protection checks.
 * Verification only. No workspace mutation.
 */

import type { ProtectionCheck } from '../world2-autonomous-builder/types.js';
import type { IntegrityResult } from './types.js';

export function evaluateWorkspaceIntegrity(
  checks: ProtectionCheck[],
): IntegrityResult[] {
  return checks.map((check, index) => ({
    resultId: `world2-integrity-${(index + 1).toString().padStart(4, '0')}`,
    checkType: check.checkType,
    result: check.status === 'PROTECTED' ? 'PASSED' : 'FAILED',
    description: `Workspace integrity ${check.checkType}: ${check.description}`,
  }));
}

export function workspaceIntegrityFailed(checks: IntegrityResult[]): boolean {
  return checks.some((c) => c.result === 'FAILED');
}

export function workspaceIntegrityKey(results: IntegrityResult[]): string {
  return results.map((r) => `${r.checkType}|${r.result}`).join(';');
}
