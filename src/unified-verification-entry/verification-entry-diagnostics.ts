/**
 * Unified verification entry diagnostics tracker.
 */

import type {
  UnifiedVerificationEntryDiagnostics,
  VerificationAuthorityState,
} from './unified-verification-types.js';

const diagnostics: UnifiedVerificationEntryDiagnostics = {
  entryAuthorityActive: false,
  authorityId: null,
  requestCount: 0,
  sessionCount: 0,
  historyEntryCount: 0,
  lastQuery: null,
  lastState: null,
};

export function unifiedVerificationEntryKey(): string {
  return 'unified_verification_entry';
}

export function getVerificationEntryDiagnostics(): UnifiedVerificationEntryDiagnostics {
  return { ...diagnostics };
}

export function updateVerificationEntryDiagnostics(
  query: string,
  state: VerificationAuthorityState,
  authorityId: string,
  requestCount: number,
  sessionCount: number,
  historyEntryCount: number,
): void {
  diagnostics.entryAuthorityActive = true;
  diagnostics.lastQuery = query;
  diagnostics.lastState = state;
  diagnostics.authorityId = authorityId;
  diagnostics.requestCount = requestCount;
  diagnostics.sessionCount = sessionCount;
  diagnostics.historyEntryCount = historyEntryCount;
}

export function resetVerificationEntryDiagnostics(): void {
  diagnostics.entryAuthorityActive = false;
  diagnostics.authorityId = null;
  diagnostics.requestCount = 0;
  diagnostics.sessionCount = 0;
  diagnostics.historyEntryCount = 0;
  diagnostics.lastQuery = null;
  diagnostics.lastState = null;
}
