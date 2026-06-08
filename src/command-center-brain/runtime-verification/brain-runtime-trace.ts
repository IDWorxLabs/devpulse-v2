/**
 * Brain runtime trace — ordered pipeline stages for verification and Operator Feed.
 */

export type BrainRuntimeTraceStage =
  | 'CHAT_SUBMIT'
  | 'UI_EVENT'
  | 'BRAIN_API_CALL'
  | 'BRAIN_PROCESSING'
  | 'BRAIN_RESPONSE'
  | 'UI_RENDERING'
  | 'OPERATOR_FEED_EVENTS'
  | 'FINAL_CHAT_OUTPUT';

export const BRAIN_RUNTIME_TRACE_SEQUENCE: readonly BrainRuntimeTraceStage[] = [
  'CHAT_SUBMIT',
  'UI_EVENT',
  'BRAIN_API_CALL',
  'BRAIN_PROCESSING',
  'BRAIN_RESPONSE',
  'UI_RENDERING',
  'OPERATOR_FEED_EVENTS',
  'FINAL_CHAT_OUTPUT',
] as const;

export interface BrainRuntimeTraceEntry {
  stage: BrainRuntimeTraceStage;
  status: 'pending' | 'active' | 'complete' | 'failed';
  timestamp: number;
  detail: string;
}

export function createInitialTrace(timestamp: number): BrainRuntimeTraceEntry[] {
  return BRAIN_RUNTIME_TRACE_SEQUENCE.map((stage) => ({
    stage,
    status: 'pending' as const,
    timestamp,
    detail: `Awaiting ${stage.replace(/_/g, ' ').toLowerCase()}`,
  }));
}

export function markTraceStage(
  trace: BrainRuntimeTraceEntry[],
  stage: BrainRuntimeTraceStage,
  status: 'active' | 'complete' | 'failed',
  detail: string,
  timestamp: number,
): BrainRuntimeTraceEntry[] {
  return trace.map((entry) => {
    if (entry.stage !== stage) return entry;
    return { ...entry, status, detail, timestamp };
  });
}

export function traceStageKey(trace: BrainRuntimeTraceEntry[]): string {
  return trace.map((e) => `${e.stage}:${e.status}`).join('|');
}

export function findFailedTraceStage(trace: BrainRuntimeTraceEntry[]): BrainRuntimeTraceEntry | undefined {
  return trace.find((e) => e.status === 'failed');
}
