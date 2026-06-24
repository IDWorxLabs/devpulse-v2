/**
 * Evidence Revalidation Cycle V1 — Unified Failure Escalation bridge.
 */

import type { EvidenceRevalidationFailure } from './evidence-revalidation-cycle-v1-types.js';

export function buildRevalidationFailureRegistry(failures: readonly EvidenceRevalidationFailure[]): {
  readOnly: true;
  generatedAt: string;
  failureCount: number;
  failures: readonly EvidenceRevalidationFailure[];
} {
  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    failureCount: failures.length,
    failures,
  };
}
