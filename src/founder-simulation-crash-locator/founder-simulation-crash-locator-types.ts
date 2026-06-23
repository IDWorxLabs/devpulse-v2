/**
 * Phase 26.99 — Founder Simulation Crash Locator types (V1).
 */

export type FounderSimulationCrashFailureClass =
  | 'V5_REPORT_BUILDER_UNDEFINED_LENGTH'
  | 'DIAGNOSTIC_REPORT_UNDEFINED_LENGTH'
  | 'RESULT_STORE_HANDOFF_UNDEFINED_LENGTH'
  | 'FINAL_REPORT_AGGREGATION_UNDEFINED_LENGTH'
  | 'RUNTIME_STATUS_UNDEFINED_LENGTH'
  | 'PAYLOAD_GUARD_MISSED_FIELD'
  | 'UNKNOWN_UNDEFINED_LENGTH_CRASH'
  | 'NONE';

export type CrashFieldKind = 'array-like' | 'string-like' | 'unknown';

export interface UndefinedLengthStackFrame {
  readOnly: true;
  functionName: string | null;
  filePath: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  raw: string;
}

export interface FounderSimulationCrashContext {
  readOnly: true;
  runId: string | null;
  stage: string | null;
  completionEvent: string | null;
  degraded: boolean;
  originalError: string;
  originalStack: string | null;
  crashLocation: string | null;
  crashFieldPath: string | null;
  crashFieldName: string | null;
  parentObjectType: string | null;
  fieldKind: CrashFieldKind;
  failureClass: FounderSimulationCrashFailureClass;
  occurredBeforePayloadGuard: boolean;
  guardNormalizedParent: boolean;
  guardMissedField: boolean;
  patchApplied: boolean;
  patchedFieldPath: string | null;
}

export interface FounderSimulationCrashLocatorReport {
  readOnly: true;
  locatorId: string;
  generatedAt: string;
  context: FounderSimulationCrashContext;
  stackFrames: readonly UndefinedLengthStackFrame[];
  likelyFieldPaths: readonly string[];
  passToken: string | null;
}

export interface FounderSimulationCrashLocatorAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: FounderSimulationCrashLocatorReport;
}

export interface LocateFounderSimulationCrashInput {
  error: unknown;
  rawResult?: unknown;
  runId?: string | null;
  stage?: string | null;
  completionEvent?: string | null;
  degraded?: boolean;
  guardApplied?: boolean;
  guardMissingFields?: readonly string[];
  nowMs?: number;
}

export interface ApplyFounderSimulationCrashPatchInput {
  rawResult: unknown;
  crashContext: FounderSimulationCrashContext;
}
