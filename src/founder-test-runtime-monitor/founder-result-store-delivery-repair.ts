/**
 * Founder result store delivery repair — canonical runId + single final write (Phase 26.87).
 */

import {
  resolveReportHandoffRunId,
  isValidHandoffRunId,
} from './report-handoff-runid-propagation.js';
import {
  resolveStoredFounderTestReportMarkdown,
} from './founder-test-complete-report-handoff.js';
import {
  hasFounderTestRunResult,
  peekFounderTestRunResult,
  storeFounderTestRunResult,
  type StoredFounderTestRunResult,
} from './founder-test-run-result-store.js';
import type { FounderTestRuntimeSnapshot } from './founder-test-runtime-types.js';
import {
  boundFounderTestResultHandoffPayloadForStorage,
  estimateStoredFounderTestResultPayloadBytesSafely,
  safeStringifyFounderTestJson,
} from './founder-test-result-payload-crash-repair.js';
import {
  traceResultStoreWrite,
} from '../final-founder-report-delivery-trace/final-founder-report-delivery-trace-hooks.js';

export const FOUNDER_RESULT_STORE_DELIVERY_REPAIR_PASS = 'FOUNDER_RESULT_STORE_DELIVERY_REPAIR_PASS';

export const FOUNDER_RESULT_STORE_DELIVERY_RULES = [
  'Rule 1 — canonical runId from explicit request, runtime card, and session snapshot must match store key',
  'Rule 2 — staging write before COMPLETE enables handoff boundary verification',
  'Rule 3 — complete write sets finalReportReady=true exactly once per runId',
  'Rule 4 — runtime status and result endpoints read the same canonical runId',
  'Rule 5 — founder flow proof sees finalReportDelivered only after complete write',
] as const;

export type FounderTestResultHandoffPhase = 'staging' | 'complete';

export interface FounderTestResultStoreDeliveryAssessment {
  readOnly: true;
  canonicalRunId: string | null;
  requestedRunId: string | null;
  runtimeRunId: string | null;
  runIdAligned: boolean;
  resultStoreEntryExists: boolean;
  hasStoredResult: boolean;
  finalReportReady: boolean;
  finalReportDelivered: boolean;
  storedRunId: string | null;
}

export interface PersistFounderTestResultHandoffResult {
  readOnly: true;
  canonicalRunId: string;
  stored: StoredFounderTestRunResult;
  phase: FounderTestResultHandoffPhase;
  duplicateFinalWriteSkipped: boolean;
  runIdRealigned: boolean;
}

const finalDeliveryWriteCountByRunId = new Map<string, number>();

export function resetFounderResultStoreDeliveryRepairForTests(): void {
  finalDeliveryWriteCountByRunId.clear();
}

export function getFounderTestFinalDeliveryWriteCount(runId: string): number {
  return finalDeliveryWriteCountByRunId.get(runId) ?? 0;
}

export function resolveFounderTestResultStoreRunId(input: {
  requestedRunId?: string | null;
  runtimeRunId?: string | null;
  cardRunId?: string | null;
  pinnedRunId?: string | null;
}): string | null {
  return resolveReportHandoffRunId({
    explicitRunId: input.requestedRunId,
    cardRunId: input.cardRunId,
    runtimeRunId: input.runtimeRunId,
    pinnedRunId: input.pinnedRunId,
  });
}

function alignHandoffPayloadRunId(input: {
  payload: Record<string, unknown>;
  canonicalRunId: string;
}): { payload: Record<string, unknown>; runIdRealigned: boolean } {
  const payload: Record<string, unknown> = { ...input.payload, runId: input.canonicalRunId };
  const runtime = payload.runtime as FounderTestRuntimeSnapshot | undefined;
  let runIdRealigned = payload.runId !== input.payload.runId;
  if (runtime && typeof runtime === 'object') {
    if (runtime.runId !== input.canonicalRunId) {
      runIdRealigned = true;
      payload.runtime = { ...runtime, runId: input.canonicalRunId };
    }
  }
  return { payload, runIdRealigned };
}

function isFinalDeliveryStored(stored: StoredFounderTestRunResult | null): boolean {
  if (!stored?.ok) return false;
  if (stored.payload.finalReportReady !== true) return false;
  if (stored.payload.finalReportPreparing === true) return false;
  return Boolean(resolveStoredFounderTestReportMarkdown(stored)?.trim());
}

export function assessFounderTestResultStoreDelivery(input: {
  requestedRunId?: string | null;
  runtimeRunId?: string | null;
}): FounderTestResultStoreDeliveryAssessment {
  const canonicalRunId = resolveFounderTestResultStoreRunId(input);
  const stored = canonicalRunId ? peekFounderTestRunResult(canonicalRunId) : peekFounderTestRunResult(null);
  const storedRunId = stored?.runId ?? null;
  const resultStoreEntryExists = canonicalRunId
    ? hasFounderTestRunResult(canonicalRunId)
    : stored != null;
  const hasStoredResult = stored != null;
  const finalReportReady = stored?.payload?.finalReportReady === true;
  const finalReportDelivered = isFinalDeliveryStored(stored);
  const runIdAligned =
    canonicalRunId != null &&
    stored != null &&
    storedRunId != null &&
    canonicalRunId === storedRunId &&
    (stored.payload.runId == null || stored.payload.runId === canonicalRunId);

  return {
    readOnly: true,
    canonicalRunId,
    requestedRunId: input.requestedRunId ?? null,
    runtimeRunId: input.runtimeRunId ?? null,
    runIdAligned,
    resultStoreEntryExists,
    hasStoredResult,
    finalReportReady,
    finalReportDelivered,
    storedRunId,
  };
}

export function buildFounderTestRuntimeStatusDeliveryFields(input: {
  requestedRunId?: string | null;
  runtimeRunId?: string | null;
}): Record<string, unknown> {
  const delivery = assessFounderTestResultStoreDelivery(input);
  return {
    readOnly: true,
    canonicalRunId: delivery.canonicalRunId,
    resultStoreEntryExists: delivery.resultStoreEntryExists,
    hasStoredResult: delivery.hasStoredResult,
    finalReportReady: delivery.finalReportReady,
    finalReportDelivered: delivery.finalReportDelivered,
    storedRunId: delivery.storedRunId,
    runIdAligned: delivery.runIdAligned,
  };
}

function resolveStoredPayloadBytes(stored: StoredFounderTestRunResult | null): number | null {
  if (!stored) return null;
  const estimated = estimateStoredFounderTestResultPayloadBytesSafely(stored);
  const serialized = safeStringifyFounderTestJson(stored);
  if (serialized.ok) {
    return Buffer.byteLength(serialized.json, 'utf8');
  }
  return estimated;
}

export function persistFounderTestResultHandoff(input: {
  phase: FounderTestResultHandoffPhase;
  requestedRunId: string;
  runtimeRunId?: string | null;
  ok: boolean;
  completedAt: string;
  payload: Record<string, unknown>;
  errorMessage: string | null;
}): PersistFounderTestResultHandoffResult {
  const canonicalRunId =
    resolveFounderTestResultStoreRunId({
      requestedRunId: input.requestedRunId,
      runtimeRunId: input.runtimeRunId,
    }) ?? (isValidHandoffRunId(input.requestedRunId) ? String(input.requestedRunId).trim() : null);

  if (!canonicalRunId) {
    throw new Error('Founder result store delivery repair: canonical runId could not be resolved');
  }

  const existing = peekFounderTestRunResult(canonicalRunId);
  if (input.phase === 'complete' && getFounderTestFinalDeliveryWriteCount(canonicalRunId) >= 1) {
    traceResultStoreWrite(canonicalRunId, {
      storeWriteAttempted: true,
      storeWriteSucceeded: Boolean(existing),
      storedRunId: canonicalRunId,
      storedPayloadBytes: resolveStoredPayloadBytes(existing),
      storedReportLength: existing ? (resolveStoredFounderTestReportMarkdown(existing)?.length ?? 0) : null,
      phase: input.phase,
      duplicateFinalWriteSkipped: true,
    });
    return {
      readOnly: true,
      canonicalRunId,
      stored: existing ?? {
        readOnly: true,
        runId: canonicalRunId,
        ok: input.ok,
        completedAt: input.completedAt,
        payload: input.payload,
        errorMessage: input.errorMessage,
      },
      phase: input.phase,
      duplicateFinalWriteSkipped: true,
      runIdRealigned: false,
    };
  }

  if (input.phase === 'complete' && isFinalDeliveryStored(existing)) {
    finalDeliveryWriteCountByRunId.set(canonicalRunId, 1);
    traceResultStoreWrite(canonicalRunId, {
      storeWriteAttempted: true,
      storeWriteSucceeded: true,
      storedRunId: canonicalRunId,
      storedPayloadBytes: resolveStoredPayloadBytes(existing),
      storedReportLength: existing ? (resolveStoredFounderTestReportMarkdown(existing)?.length ?? 0) : null,
      phase: input.phase,
      duplicateFinalWriteSkipped: true,
    });
    return {
      readOnly: true,
      canonicalRunId,
      stored: existing!,
      phase: input.phase,
      duplicateFinalWriteSkipped: true,
      runIdRealigned: false,
    };
  }

  const aligned = alignHandoffPayloadRunId({
    payload: input.payload,
    canonicalRunId,
  });

  const bounded = boundFounderTestResultHandoffPayloadForStorage(aligned.payload);

  const stored: StoredFounderTestRunResult = {
    readOnly: true,
    runId: canonicalRunId,
    ok: input.ok,
    completedAt: input.completedAt,
    payload: bounded.payload,
    errorMessage: input.errorMessage,
  };

  storeFounderTestRunResult(stored);

  const storedMarkdown = resolveStoredFounderTestReportMarkdown(stored);
  const storedReportLength = storedMarkdown?.length ?? 0;
  const storedPayloadBytes = resolveStoredPayloadBytes(stored);

  traceResultStoreWrite(canonicalRunId, {
    storeWriteAttempted: true,
    storeWriteSucceeded: true,
    storedRunId: canonicalRunId,
    storedPayloadBytes,
    storedReportLength,
    phase: input.phase,
    duplicateFinalWriteSkipped: false,
  });

  if (isFinalDeliveryStored(stored)) {
    finalDeliveryWriteCountByRunId.set(
      canonicalRunId,
      Math.max(finalDeliveryWriteCountByRunId.get(canonicalRunId) ?? 0, 1),
    );
  } else if (input.phase === 'complete' && input.ok && aligned.payload.finalReportReady === true) {
    finalDeliveryWriteCountByRunId.set(
      canonicalRunId,
      (finalDeliveryWriteCountByRunId.get(canonicalRunId) ?? 0) + 1,
    );
  }

  return {
    readOnly: true,
    canonicalRunId,
    stored,
    phase: input.phase,
    duplicateFinalWriteSkipped: false,
    runIdRealigned: aligned.runIdRealigned,
  };
}
