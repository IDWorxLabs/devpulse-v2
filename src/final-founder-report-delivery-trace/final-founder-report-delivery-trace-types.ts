/**
 * Phase 27.07 — Final Founder Report Delivery Trace types (diagnostic only).
 */

export type DeliveryTraceBoundaryId =
  | 'FOUNDER_TEST_START'
  | 'INTAKE_VALIDATION'
  | 'PLANNING_GATE'
  | 'PLANNING_BRIEF'
  | 'ARCHITECTURE_BRIEF'
  | 'BUILD_PLAN'
  | 'FOUNDER_SIMULATION_ENGINE'
  | 'CROSS_SYSTEM_ORCHESTRATION_PROOF'
  | 'EXECUTION_READINESS_GATE'
  | 'REPORT_GENERATION'
  | 'RESULT_STORE_WRITE'
  | 'RESULT_RETRIEVAL_API'
  | 'CLIENT_CACHE'
  | 'FOUNDER_REPORT_RENDER';

export interface DeliveryTraceSourceLocation {
  readOnly: true;
  file: string;
  function: string;
  line: number;
}

export interface DeliveryTraceBoundaryRecord {
  readOnly: true;
  boundaryId: DeliveryTraceBoundaryId;
  entered: boolean;
  completed: boolean;
  enteredAt: string | null;
  completedAt: string | null;
  elapsedMs: number | null;
  outputExists: boolean;
  outputSize: number | null;
  nextBoundaryInvoked: DeliveryTraceBoundaryId | null;
  succeeded: boolean;
  source: DeliveryTraceSourceLocation | null;
  exception: string | null;
  runId: string | null;
  missingArtifact: string | null;
  details: Record<string, unknown>;
}

export interface DeliveryTraceRunSnapshot {
  readOnly: true;
  runId: string;
  startedAt: string;
  finalizedAt: string | null;
  boundaries: DeliveryTraceBoundaryRecord[];
}

export interface DeliveryTraceAnalysis {
  readOnly: true;
  runId: string | null;
  lastSuccessfulBoundary: DeliveryTraceBoundaryId | null;
  firstFailedBoundary: DeliveryTraceBoundaryId | null;
  verdict: string;
  sourceFile: string | null;
  sourceFunction: string | null;
  sourceLine: number | null;
  exception: string | null;
  missingArtifact: string | null;
}

export interface DeliveryTraceReport {
  readOnly: true;
  diagnosticOnly: true;
  generatedAt: string;
  runId: string | null;
  analysis: DeliveryTraceAnalysis;
  boundaries: DeliveryTraceBoundaryRecord[];
  passToken: string | null;
}
