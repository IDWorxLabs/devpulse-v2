/**
 * Verification runtime diagnostics tracker.
 */

import type { VerificationRuntimeDiagnostics, VerificationRuntimeState } from './types.js';

const diagnostics: VerificationRuntimeDiagnostics = {
  uvlRuntimeActive: false,
  providerCount: 0,
  sessionCount: 0,
  completedSessionCount: 0,
  blockedSessionCount: 0,
  lastQuery: null,
  lastState: null,
};

export function uvlRuntimeKey(): string {
  return 'unified_verification_lab_runtime';
}

export function getVerificationRuntimeDiagnostics(): VerificationRuntimeDiagnostics {
  return { ...diagnostics };
}

export function updateVerificationRuntimeDiagnostics(
  query: string,
  state: VerificationRuntimeState,
  providerCount: number,
  sessionCount: number,
  completedCount: number,
  blockedCount: number,
): void {
  diagnostics.uvlRuntimeActive = true;
  diagnostics.lastQuery = query;
  diagnostics.lastState = state;
  diagnostics.providerCount = providerCount;
  diagnostics.sessionCount = sessionCount;
  diagnostics.completedSessionCount = completedCount;
  diagnostics.blockedSessionCount = blockedCount;
}

export function resetVerificationRuntimeDiagnostics(): void {
  diagnostics.uvlRuntimeActive = false;
  diagnostics.providerCount = 0;
  diagnostics.sessionCount = 0;
  diagnostics.completedSessionCount = 0;
  diagnostics.blockedSessionCount = 0;
  diagnostics.lastQuery = null;
  diagnostics.lastState = null;
}
