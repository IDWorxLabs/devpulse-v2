/**
 * Execution Trace & Conversational Architecture V1 — runtime event model.
 * Execution Trace records observable runtime evidence; Chat explains outcomes.
 */

export type ExecutionTraceSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type ExecutionTraceStatus =
  | 'Queued'
  | 'Active'
  | 'Completed'
  | 'Blocked'
  | 'Warning'
  | 'PASS'
  | 'FAIL'
  | 'NO';

export type ExecutionTraceViewMode = 'stream' | 'compact' | 'errors' | 'artifacts';

export type ExecutionTraceEventMetadata = Record<
  string,
  string | number | boolean | string[] | null | undefined
>;

/** Canonical runtime event — flight-recorder evidence, not conversation. */
export interface ExecutionTraceEvent {
  eventId: string;
  timestamp: number;
  runtimeStage: string;
  component: string;
  severity: ExecutionTraceSeverity;
  eventTitle: string;
  technicalDetail: string;
  evidence?: string;
  artifactLinks?: string[];
  durationMs?: number;
  status?: ExecutionTraceStatus;
  metadata?: ExecutionTraceEventMetadata;
  /** Legacy stream compat — mapped from eventTitle/detail for existing UI adapters. */
  informationalOnly?: true;
  eventType?: string;
  section?: string;
  action?: string;
  detail?: string;
  stepIndex?: number;
  stepTotal?: number;
}

export interface ExecutionTraceEvidenceSummary {
  eventCount: number;
  errorCount: number;
  warningCount: number;
  completedStages: string[];
  artifacts: string[];
  previewUrl: string | null;
  buildStatus: string | null;
}

/** Evidence bundle consumed by Chat LLM — authoritative runtime facts. */
export interface ExecutionTraceEvidenceBundle {
  readOnly: true;
  source: 'runtime';
  buildRunId?: string;
  projectId?: string | null;
  events: ExecutionTraceEvent[];
  summary: ExecutionTraceEvidenceSummary;
}

export const EXECUTION_TRACE_ARCHITECTURE_V1_PASS_TOKEN =
  'EXECUTION_TRACE_ARCHITECTURE_V1_PASS';

/** Mechanical chat markers that belong in Execution Trace, not Chat. */
export const CHAT_MECHANICAL_RUNTIME_MARKERS = [
  'Build run:',
  'Workspace:',
  'Profile:',
  'PASS\nPreview:',
  'Build execution started for project',
] as const;

/** Conversational phrases Execution Trace must not emit. */
export const EXECUTION_TRACE_CONVERSATIONAL_MARKERS = [
  'I recommend',
  'You should',
  'Let me explain',
  'In my opinion',
  'I analyzed your request',
] as const;
