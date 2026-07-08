/**
 * Command Center HTTP Routing Forensic Audit V1 — in-memory trace store.
 */

import type { HttpForensicEvent, HttpRoutingForensicTrace } from './forensic-types.js';

const traces = new Map<string, HttpRoutingForensicTrace>();
let latestRequestId: string | null = null;

export function storeHttpRoutingForensicTrace(trace: HttpRoutingForensicTrace): void {
  traces.set(trace.requestId, trace);
  latestRequestId = trace.requestId;
}

export function getHttpRoutingForensicTrace(requestId: string): HttpRoutingForensicTrace | null {
  return traces.get(requestId) ?? null;
}

export function getLatestHttpRoutingForensicTrace(): HttpRoutingForensicTrace | null {
  return latestRequestId ? traces.get(latestRequestId) ?? null : null;
}

export function appendHttpForensicEvent(requestId: string, event: HttpForensicEvent): void {
  const trace = traces.get(requestId);
  if (!trace) return;
  trace.events.push(event);
  storeHttpRoutingForensicTrace(trace);
}

export function completeHttpRoutingForensicTrace(requestId: string, completedAt: number): void {
  const trace = traces.get(requestId);
  if (!trace) return;
  trace.completedAt = completedAt;
  storeHttpRoutingForensicTrace(trace);
}

export function resetHttpRoutingForensicStoreForTests(): void {
  traces.clear();
  latestRequestId = null;
}

export function listHttpRoutingForensicTraces(): HttpRoutingForensicTrace[] {
  return [...traces.values()].sort((a, b) => b.startedAt - a.startedAt);
}
