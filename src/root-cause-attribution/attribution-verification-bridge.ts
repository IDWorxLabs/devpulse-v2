/**
 * Verification Loop bridge — Verification Loop remains owner; attribution consumes verification history.
 */

import { getDevPulseV2VerificationLoopAuthority } from '../verification-loop/verification-loop-authority.js';
import { LOOP_OWNER_MODULE } from '../verification-loop/types.js';

export interface VerificationAttributionSignals {
  failureCount: number;
  partialCount: number;
  conflictCount: number;
  evidenceIds: string[];
  reviewIds: string[];
}

export function analyzeVerificationHistory(): VerificationAttributionSignals {
  const reviews = getDevPulseV2VerificationLoopAuthority().listVerifications();
  const failures = reviews.filter(
    (r) => r.status === 'UNVERIFIED' || r.status === 'CONFLICT' || r.errors.length > 0,
  );
  const partial = reviews.filter((r) => r.status === 'PARTIAL');
  const conflict = reviews.filter((r) => r.status === 'CONFLICT');

  return {
    failureCount: failures.length,
    partialCount: partial.length,
    conflictCount: conflict.length,
    evidenceIds: reviews.flatMap((r) => r.evidenceIds),
    reviewIds: reviews.map((r) => r.verificationId),
  };
}

export function getVerificationAttributionSummary(): string {
  const signals = analyzeVerificationHistory();
  if (signals.failureCount === 0 && signals.reviewIds.length === 0) {
    return 'No verification history available for attribution.';
  }
  return `Verification signals: ${signals.failureCount} failure(s), ${signals.partialCount} partial, ${signals.conflictCount} conflict.`;
}

export function assertVerificationLoopOwnershipUnchanged(): boolean {
  const loop = getDevPulseV2VerificationLoopAuthority();
  return (
    loop.constructor.name === 'DevPulseV2VerificationLoopAuthority' &&
    typeof loop.listVerifications === 'function' &&
    typeof (loop as { generateAttributions?: unknown }).generateAttributions === 'undefined'
  );
}

export function getVerificationLoopOwnerForBridge(): string {
  return LOOP_OWNER_MODULE;
}
