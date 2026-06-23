/**
 * Phase 27.07 — Final Founder Report Delivery Trace recorder (diagnostic only).
 */

import {
  DELIVERY_TRACE_BOUNDARY_ORDER,
  nextDeliveryTraceBoundary,
} from './final-founder-report-delivery-trace-registry.js';
import type {
  DeliveryTraceBoundaryId,
  DeliveryTraceBoundaryRecord,
  DeliveryTraceRunSnapshot,
  DeliveryTraceSourceLocation,
} from './final-founder-report-delivery-trace-types.js';

const tracesByRunId = new Map<string, DeliveryTraceRunSnapshot>();
let activeRunId: string | null = null;

function emptyRecord(boundaryId: DeliveryTraceBoundaryId): DeliveryTraceBoundaryRecord {
  return {
    readOnly: true,
    boundaryId,
    entered: false,
    completed: false,
    enteredAt: null,
    completedAt: null,
    elapsedMs: null,
    outputExists: false,
    outputSize: null,
    nextBoundaryInvoked: null,
    succeeded: false,
    source: null,
    exception: null,
    runId: null,
    missingArtifact: null,
    details: {},
  };
}

function ensureRun(runId: string): DeliveryTraceRunSnapshot {
  const existing = tracesByRunId.get(runId);
  if (existing) return existing;
  const snapshot: DeliveryTraceRunSnapshot = {
    readOnly: true,
    runId,
    startedAt: new Date().toISOString(),
    finalizedAt: null,
    boundaries: DELIVERY_TRACE_BOUNDARY_ORDER.map((boundaryId) => emptyRecord(boundaryId)),
  };
  tracesByRunId.set(runId, snapshot);
  return snapshot;
}

function findRecord(runId: string, boundaryId: DeliveryTraceBoundaryId): DeliveryTraceBoundaryRecord {
  const run = ensureRun(runId);
  const record = run.boundaries.find((entry) => entry.boundaryId === boundaryId);
  if (!record) throw new Error(`Missing delivery trace boundary record: ${boundaryId}`);
  return record;
}

export function resetFinalFounderReportDeliveryTraceForTests(): void {
  tracesByRunId.clear();
  activeRunId = null;
}

export function startFinalFounderReportDeliveryTrace(runId: string): void {
  activeRunId = runId;
  ensureRun(runId);
}

export function getActiveDeliveryTraceRunId(): string | null {
  return activeRunId;
}

export function getDeliveryTraceRunSnapshot(runId?: string | null): DeliveryTraceRunSnapshot | null {
  const resolved = runId ?? activeRunId;
  if (!resolved) return null;
  return tracesByRunId.get(resolved) ?? null;
}

export function enterDeliveryTraceBoundary(input: {
  boundaryId: DeliveryTraceBoundaryId;
  runId?: string | null;
  source?: DeliveryTraceSourceLocation;
  details?: Record<string, unknown>;
}): void {
  const runId = input.runId ?? activeRunId;
  if (!runId) return;
  const record = findRecord(runId, input.boundaryId);
  const enteredAt = new Date().toISOString();
  Object.assign(record, {
    entered: true,
    enteredAt,
    runId,
    source: input.source ?? record.source,
    details: { ...record.details, ...(input.details ?? {}) },
  });
}

export function completeDeliveryTraceBoundary(input: {
  boundaryId: DeliveryTraceBoundaryId;
  runId?: string | null;
  outputExists?: boolean;
  outputSize?: number | null;
  nextBoundaryInvoked?: DeliveryTraceBoundaryId | null;
  details?: Record<string, unknown>;
}): void {
  const runId = input.runId ?? activeRunId;
  if (!runId) return;
  const record = findRecord(runId, input.boundaryId);
  const completedAt = new Date().toISOString();
  const enteredMs = record.enteredAt ? Date.parse(record.enteredAt) : Date.now();
  Object.assign(record, {
    completed: true,
    completedAt,
    elapsedMs: Math.max(0, Date.now() - enteredMs),
    outputExists: input.outputExists ?? true,
    outputSize: input.outputSize ?? record.outputSize,
    nextBoundaryInvoked:
      input.nextBoundaryInvoked ?? nextDeliveryTraceBoundary(input.boundaryId),
    succeeded: true,
    exception: null,
    missingArtifact: null,
    details: { ...record.details, ...(input.details ?? {}) },
  });
}

export function failDeliveryTraceBoundary(input: {
  boundaryId: DeliveryTraceBoundaryId;
  runId?: string | null;
  exception?: string | null;
  missingArtifact?: string | null;
  outputExists?: boolean;
  outputSize?: number | null;
  details?: Record<string, unknown>;
  source?: DeliveryTraceSourceLocation;
}): void {
  const runId = input.runId ?? activeRunId;
  if (!runId) return;
  const record = findRecord(runId, input.boundaryId);
  const completedAt = new Date().toISOString();
  const enteredMs = record.enteredAt ? Date.parse(record.enteredAt) : Date.now();
  Object.assign(record, {
    entered: record.entered || true,
    completed: true,
    completedAt,
    elapsedMs: Math.max(0, Date.now() - enteredMs),
    outputExists: input.outputExists ?? false,
    outputSize: input.outputSize ?? null,
    nextBoundaryInvoked: null,
    succeeded: false,
    exception: input.exception ?? 'boundary failed',
    missingArtifact: input.missingArtifact ?? null,
    source: input.source ?? record.source,
    details: { ...record.details, ...(input.details ?? {}) },
  });
}

export function recordClientDeliveryTraceEvent(input: {
  boundaryId: 'CLIENT_CACHE' | 'FOUNDER_REPORT_RENDER';
  runId: string;
  succeeded: boolean;
  details?: Record<string, unknown>;
  exception?: string | null;
  missingArtifact?: string | null;
}): void {
  enterDeliveryTraceBoundary({
    boundaryId: input.boundaryId,
    runId: input.runId,
    source: {
      readOnly: true,
      file: 'public/founder-reality/app.js',
      function: input.boundaryId === 'CLIENT_CACHE' ? 'fetchFounderTestResultWithRetry' : 'applyFounderTestFinalReport',
      line: 0,
    },
    details: input.details,
  });
  if (input.succeeded) {
    completeDeliveryTraceBoundary({
      boundaryId: input.boundaryId,
      runId: input.runId,
      outputExists: true,
      outputSize:
        typeof input.details?.responseSize === 'number'
          ? (input.details.responseSize as number)
          : typeof input.details?.reportMarkdownLength === 'number'
            ? (input.details.reportMarkdownLength as number)
            : null,
      details: input.details,
    });
  } else {
    failDeliveryTraceBoundary({
      boundaryId: input.boundaryId,
      runId: input.runId,
      exception: input.exception ?? null,
      missingArtifact: input.missingArtifact ?? null,
      details: input.details,
    });
  }
}

export function finalizeDeliveryTraceRun(runId?: string | null): DeliveryTraceRunSnapshot | null {
  const resolved = runId ?? activeRunId;
  if (!resolved) return null;
  const run = tracesByRunId.get(resolved);
  if (!run) return null;
  run.finalizedAt = new Date().toISOString();
  return run;
}

export function deliveryTraceSource(
  file: string,
  functionName: string,
  line: number,
): DeliveryTraceSourceLocation {
  return { readOnly: true, file, function: functionName, line };
}
