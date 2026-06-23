/**
 * Phase 26.97 — Founder Simulation Payload Guard types (V1).
 */

export type FounderSimulationPayloadFailureClass =
  | 'UNDEFINED_ARRAY_FIELD'
  | 'UNDEFINED_STRING_FIELD'
  | 'UNDEFINED_OBJECT_FIELD'
  | 'MISSING_SIMULATION_RESULT'
  | 'MISSING_WARNINGS_ARRAY'
  | 'MISSING_BLOCKERS_ARRAY'
  | 'MISSING_FINDINGS_ARRAY'
  | 'MISSING_RECOMMENDATIONS_ARRAY'
  | 'MISSING_SCENARIOS_ARRAY'
  | 'REPORT_BUILDER_UNGUARDED_LENGTH_ACCESS'
  | 'UNKNOWN_PAYLOAD_SHAPE_FAILURE';

export interface FounderSimulationPayloadFieldRepair {
  readOnly: true;
  path: string;
  failureClass: FounderSimulationPayloadFailureClass;
  defaultApplied: string;
}

export interface FounderSimulationPayloadGuardMetadata {
  readOnly: true;
  degraded: boolean;
  completionEvent: string | null;
  originalError: string | null;
  missingFields: readonly string[];
  repairs: readonly FounderSimulationPayloadFieldRepair[];
  crashLocation?: string | null;
  crashFieldPath?: string | null;
  patchApplied?: boolean;
  originalStack?: string | null;
}

export interface GuardedFounderSimulationExecutionResult {
  readOnly: true;
  report: Record<string, unknown> | null;
  verificationResults: Record<string, unknown> | null;
  changeIntelligence: Record<string, unknown> | null;
  founderActionCenter: Record<string, unknown> | null;
  founderSensemaking: Record<string, unknown> | null;
  founderFrictionHeatmap: Record<string, unknown> | null;
  phaseFeedEvents: readonly unknown[];
  guard: FounderSimulationPayloadGuardMetadata;
}

export interface FounderSimulationPayloadGuardReport {
  readOnly: true;
  guardId: string;
  generatedAt: string;
  coreQuestion: string;
  repairsApplied: number;
  missingFields: readonly string[];
  degraded: boolean;
  completionEvent: string | null;
  reportGenerationSafe: boolean;
  passToken: string | null;
}

export interface FounderSimulationPayloadGuardAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'FOUNDER_SIMULATION_PAYLOAD_GUARD_COMPLETE';
  report: FounderSimulationPayloadGuardReport;
  guardedResult: GuardedFounderSimulationExecutionResult;
  cacheKey: string;
}

export interface ApplyFounderSimulationPayloadGuardInput {
  rawResult: unknown;
  degraded?: boolean;
  completionEvent?: string | null;
  originalError?: string | null;
  skipHistoryRecording?: boolean;
}
