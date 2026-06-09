/**
 * Verification registry diagnostics tracker.
 */

import type { VerificationRegistryDiagnostics, VerificationRegistryState } from './types.js';

const diagnostics: VerificationRegistryDiagnostics = {
  verificationRegistryActive: false,
  verificationTargetCount: 0,
  verificationDependencyCount: 0,
  verificationRequirementCount: 0,
  lastQuery: null,
  lastState: null,
};

export function verificationRegistryKey(): string {
  return 'verification_registry';
}

export function getVerificationRegistryDiagnostics(): VerificationRegistryDiagnostics {
  return { ...diagnostics };
}

export function updateVerificationRegistryDiagnostics(
  query: string,
  state: VerificationRegistryState,
  targetCount: number,
  dependencyCount: number,
  requirementCount: number,
): void {
  diagnostics.verificationRegistryActive = true;
  diagnostics.lastQuery = query;
  diagnostics.lastState = state;
  diagnostics.verificationTargetCount = targetCount;
  diagnostics.verificationDependencyCount = dependencyCount;
  diagnostics.verificationRequirementCount = requirementCount;
}

export function resetVerificationRegistryDiagnostics(): void {
  diagnostics.verificationRegistryActive = false;
  diagnostics.verificationTargetCount = 0;
  diagnostics.verificationDependencyCount = 0;
  diagnostics.verificationRequirementCount = 0;
  diagnostics.lastQuery = null;
  diagnostics.lastState = null;
}
