/**
 * Runtime Trace Builder — operator feed trace events (V1).
 */

import { FOUNDER_TEST_RUNTIME_STAGES } from './founder-test-runtime-registry.js';
import {
  MAX_FOUNDER_TEST_TRACE_EVENTS,
  OPERATION_NEXT_EXPECTED,
  STAGE_NEXT_EXPECTED,
} from './runtime-trace-registry.js';
import type {
  FounderTestRuntimeTraceEvent,
  FounderTestTraceEventStatus,
} from './founder-test-runtime-types.js';

let traceEventCounter = 0;

export function resetRuntimeTraceCounterForTests(): void {
  traceEventCounter = 0;
}

function formatDisplayTime(date: Date): string {
  return date.toTimeString().slice(0, 8);
}

function stageMeta(stageId: string | null | undefined): {
  stageLabel: string | null;
  stageOrder: number | null;
} {
  if (!stageId) return { stageLabel: null, stageOrder: null };
  const stage = FOUNDER_TEST_RUNTIME_STAGES.find((entry) => entry.stageId === stageId);
  return stage ? { stageLabel: stage.label, stageOrder: stage.order } : { stageLabel: stageId, stageOrder: null };
}

function buildDisplayLine(input: {
  displayTime: string;
  stageOrder: number | null;
  stageLabel: string | null;
  operationLabel: string;
  status: FounderTestTraceEventStatus;
}): string {
  const stagePrefix =
    input.stageOrder != null && input.stageLabel
      ? `Stage ${input.stageOrder} ${input.stageLabel}`
      : input.stageLabel ?? 'Founder Test';
  return `[${input.displayTime}] ${stagePrefix} — ${input.operationLabel} — ${input.status}`;
}

export function buildTraceEventId(operationId: string, status: FounderTestTraceEventStatus): string {
  return `${operationId}:${status}`;
}

export function appendRuntimeTraceEvent(input: {
  events: FounderTestRuntimeTraceEvent[];
  operationId: string;
  stageId?: string | null;
  operationLabel: string;
  status: FounderTestTraceEventStatus;
  at?: Date;
}): {
  events: FounderTestRuntimeTraceEvent[];
  event: FounderTestRuntimeTraceEvent;
  appended: boolean;
} {
  const at = input.at ?? new Date();
  const meta = stageMeta(input.stageId);
  const traceEventId = buildTraceEventId(input.operationId, input.status);
  const existingIndex = input.events.findIndex((event) => event.traceEventId === traceEventId);
  const event: FounderTestRuntimeTraceEvent = {
    readOnly: true,
    traceEventId,
    operationId: input.operationId,
    stageId: input.stageId ?? null,
    stageOrder: meta.stageOrder,
    stageLabel: meta.stageLabel,
    operationLabel: input.operationLabel,
    status: input.status,
    timestamp: at.toISOString(),
    displayTime: formatDisplayTime(at),
    displayLine: buildDisplayLine({
      displayTime: formatDisplayTime(at),
      stageOrder: meta.stageOrder,
      stageLabel: meta.stageLabel,
      operationLabel: input.operationLabel,
      status: input.status,
    }),
  };

  if (existingIndex >= 0) {
    const next = input.events.map((entry, index) => (index === existingIndex ? event : entry));
    return { events: next, event, appended: false };
  }

  traceEventCounter += 1;
  const next = [...input.events, event];
  if (next.length > MAX_FOUNDER_TEST_TRACE_EVENTS) {
    next.splice(0, next.length - MAX_FOUNDER_TEST_TRACE_EVENTS);
  }
  return { events: next, event, appended: true };
}

export function resolveNextExpectedOperation(input: {
  operationId?: string | null;
  stageId?: string | null;
}): string | null {
  if (input.operationId && OPERATION_NEXT_EXPECTED[input.operationId]) {
    return OPERATION_NEXT_EXPECTED[input.operationId];
  }
  if (input.stageId && STAGE_NEXT_EXPECTED[input.stageId]) {
    return STAGE_NEXT_EXPECTED[input.stageId];
  }
  return null;
}

export function resolveTraceStageStatus(input: {
  runtimeState: string;
  stallHealth: string;
}): FounderTestTraceEventStatus | 'IDLE' {
  if (input.runtimeState === 'IDLE') return 'IDLE';
  if (input.runtimeState === 'COMPLETE') return 'COMPLETE';
  if (input.runtimeState === 'FAILED' || input.runtimeState === 'CANCELLED') return 'FAILED';
  if (input.runtimeState === 'STALLED' || input.stallHealth === 'STALLED') return 'STALLED';
  if (input.stallHealth === 'SLOW') return 'SLOW';
  return 'RUNNING';
}

export function formatRuntimeTraceEvents(events: readonly FounderTestRuntimeTraceEvent[]): string[] {
  return events.map((event) => event.displayLine);
}
