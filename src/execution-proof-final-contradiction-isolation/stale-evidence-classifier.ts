/**
 * Phase 27.06 — Stale evidence classifier (V1).
 * Applies Rules 1–4 without creating a reconciliation authority.
 */

import type { FinalContradictionDivergenceClass } from './execution-proof-final-contradiction-isolation-types.js';
import type { AuthoritativeConvergedEvidence } from './execution-proof-final-contradiction-isolation-types.js';

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function classifyFinalContradictionDivergence(input: {
  authoritative: AuthoritativeConvergedEvidence;
  consumerTimestamp: string | null;
  consumerVerdict: string;
  expectedVerdict: string;
  workspaceId?: string | null;
  runId?: string | null;
  manifestId?: string | null;
  convergencePassed: boolean;
  contradictionEliminationPassed: boolean;
  rootCauseHint?: string;
  staleConsumer?: boolean;
}): FinalContradictionDivergenceClass {
  const consumer = input.consumerVerdict.toUpperCase();
  const expected = input.expectedVerdict.toUpperCase();
  if (consumer === expected) return 'NONE';

  if (
    expected === 'UNKNOWN' &&
    consumer !== 'UNKNOWN' &&
    input.staleConsumer &&
    input.convergencePassed &&
    input.contradictionEliminationPassed
  ) {
    return 'AUTHORITY_STILL_USING_STALE_EVIDENCE';
  }

  if (
    expected === 'UNKNOWN' &&
    consumer !== 'UNKNOWN' &&
    input.rootCauseHint &&
    input.rootCauseHint !== 'REAL_PRODUCT_GAP'
  ) {
    if (input.rootCauseHint === 'EVIDENCE_PROPAGATION_FAILURE') {
      return 'EVIDENCE_PROPAGATION_FAILURE';
    }
    if (input.rootCauseHint === 'AUTHORITY_DISAGREEMENT') {
      return 'AUTHORITY_DISAGREEMENT';
    }
    return 'AUTHORITY_STILL_USING_STALE_EVIDENCE';
  }

  if (
    input.authoritative.missingArtifacts === 0 &&
    input.authoritative.applicationProven &&
    /MISREPORT|ARTIFACTS_MISREPORTED/i.test(input.rootCauseHint ?? '')
  ) {
    return 'ARTIFACTS_MISREPORTED_MISSING';
  }

  if (/PROOF_STALE|STALE_VS_DISK/i.test(input.rootCauseHint ?? '')) {
    return 'PROOF_STALE_VS_DISK';
  }

  if (input.rootCauseHint === 'EVIDENCE_PROPAGATION_FAILURE') {
    return 'EVIDENCE_PROPAGATION_FAILURE';
  }

  if (input.rootCauseHint === 'AUTHORITY_DISAGREEMENT') {
    return 'AUTHORITY_DISAGREEMENT';
  }

  const authTs = parseTimestamp(input.authoritative.proofTimestamp);
  const consumerTs = parseTimestamp(input.consumerTimestamp);
  if (
    authTs > 0 &&
    consumerTs > 0 &&
    consumerTs < authTs &&
    input.convergencePassed &&
    input.contradictionEliminationPassed
  ) {
    return 'STALE_PROOF_CONSUMER';
  }

  const workspaceAligned =
    !input.workspaceId ||
    !input.authoritative.workspaceId ||
    input.workspaceId === input.authoritative.workspaceId;
  const runAligned =
    !input.runId ||
    !input.authoritative.runId ||
    input.runId === input.authoritative.runId;
  const manifestAligned =
    !input.manifestId ||
    !input.authoritative.manifestId ||
    input.manifestId === input.authoritative.manifestId;
  const timestampAligned = consumerTs === 0 || authTs === 0 || consumerTs >= authTs;

  if (
    workspaceAligned &&
    runAligned &&
    manifestAligned &&
    timestampAligned &&
    input.convergencePassed &&
    input.contradictionEliminationPassed
  ) {
    return 'POST_CONVERGENCE_VERDICT_DRIFT';
  }

  if (input.staleConsumer && input.convergencePassed && input.contradictionEliminationPassed) {
    return 'AUTHORITY_STILL_USING_STALE_EVIDENCE';
  }

  if (input.convergencePassed && input.contradictionEliminationPassed) {
    return 'AUTHORITY_STILL_USING_STALE_EVIDENCE';
  }

  return 'EVIDENCE_PROPAGATION_FAILURE';
}
