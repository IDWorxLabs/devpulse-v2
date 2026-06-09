/**
 * Visual verification diagnostics tracker.
 */

import type { VerificationStatus, VisualVerificationDiagnostics } from './types.js';

const diagnostics: VisualVerificationDiagnostics = {
  visualVerificationActive: false,
  verificationTargetCount: 0,
  verifiedCount: 0,
  blockedVerificationCount: 0,
  lastQuery: null,
  lastStatus: null,
};

export function visualVerificationKey(): string {
  return 'visual_verification_engine';
}

export function getVisualVerificationDiagnostics(): VisualVerificationDiagnostics {
  return { ...diagnostics };
}

export function updateVisualVerificationDiagnostics(
  query: string,
  status: VerificationStatus,
  targetCount: number,
  verifiedCount: number,
): void {
  diagnostics.visualVerificationActive = true;
  diagnostics.lastQuery = query;
  diagnostics.lastStatus = status;
  diagnostics.verificationTargetCount = targetCount;
  diagnostics.verifiedCount = verifiedCount;
  if (status === 'VERIFICATION_BLOCKED' || status === 'FAILED_VERIFICATION') {
    diagnostics.blockedVerificationCount += 1;
  }
}

export function resetVisualVerificationDiagnostics(): void {
  diagnostics.visualVerificationActive = false;
  diagnostics.verificationTargetCount = 0;
  diagnostics.verifiedCount = 0;
  diagnostics.blockedVerificationCount = 0;
  diagnostics.lastQuery = null;
  diagnostics.lastStatus = null;
}
