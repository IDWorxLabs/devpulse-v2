/**
 * Verification state manager — REQUESTED through FAILED, no execution engine.
 */

import type { VerificationStateType } from './unified-verification-types.js';

const stateByRequest = new Map<string, VerificationStateType>();

export function resetVerificationStateForTests(): void {
  stateByRequest.clear();
}

export function setVerificationState(requestId: string, state: VerificationStateType): void {
  stateByRequest.set(requestId, state);
}

export function getVerificationState(requestId: string): VerificationStateType | null {
  return stateByRequest.get(requestId) ?? null;
}

export function deriveFinalState(opts: {
  blocked: boolean;
  evidenceCount: number;
  reportCount: number;
}): VerificationStateType {
  if (opts.blocked) return 'FAILED';
  if (opts.reportCount > 0 && opts.evidenceCount > 0) return 'COMPLETED';
  if (opts.reportCount > 0) return 'REPORT_AVAILABLE';
  if (opts.evidenceCount > 0) return 'EVIDENCE_AVAILABLE';
  return 'READY';
}

export function advanceVerificationState(
  requestId: string,
  from: VerificationStateType,
  to: VerificationStateType,
): VerificationStateType {
  const current = stateByRequest.get(requestId) ?? from;
  if (current === from || current === 'REQUESTED') {
    stateByRequest.set(requestId, to);
    return to;
  }
  return current;
}

export function listVerificationStates(): Array<{ requestId: string; state: VerificationStateType }> {
  return [...stateByRequest.entries()].map(([requestId, state]) => ({ requestId, state }));
}
