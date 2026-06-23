/**
 * Phase 27.02 — Founder Simulation Degradation Root Cause types (V1).
 */

import type { FounderSimulationCompletionEventId } from '../founder-simulation-completion-boundary-repair/founder-simulation-completion-boundary-repair-types.js';
import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';

export type DegradationRootCauseClass =
  | 'SIMULATION_BUDGET_EXCEEDED'
  | 'AUTHORITY_TIMEOUT'
  | 'HEAVY_ORCHESTRATION'
  | 'RECURSION_GUARD_TRIGGERED'
  | 'FALLBACK_PATH_USED'
  | 'WARNING_COMPLETION_PATH'
  | 'BLOCKING_SYNC_OPERATION'
  | 'REPORT_GENERATION_OVERHEAD'
  | 'RESULT_STORE_DELAY'
  | 'UNKNOWN';

export type DegradationSignalKind =
  | 'RUNTIME_EXCEEDS_BUDGET'
  | 'TIMEOUT_RECOVERY'
  | 'FALLBACK_PATH'
  | 'RECURSION_GUARD'
  | 'WARNING_COMPLETION'
  | 'REPAIR_PLANNER'
  | 'DEGRADED_COMPLETION_PATH'
  | 'PAYLOAD_GUARD_DEGRADED';

export interface FounderSimulationAuthorityProfile {
  readOnly: true;
  authorityId: string;
  authorityName: string;
  stageId: string | null;
  startTime: string | null;
  endTime: string | null;
  elapsedMs: number;
  workspaceId: string | null;
  runId: string | null;
  verdict: string | null;
  proofLevel: string | null;
  rank: number;
  runtimePercent: number;
}

export interface FounderSimulationSubstepProfile {
  readOnly: true;
  substepId: string;
  substepLabel: string;
  stageId: string | null;
  authorityName: string | null;
  startTime: string;
  endTime: string;
  elapsedMs: number;
  completionStatus: string;
  rank: number;
  runtimePercent: number;
}

export interface FounderSimulationDegradationSignal {
  readOnly: true;
  kind: DegradationSignalKind;
  detail: string;
  operationId: string | null;
  stageId: string | null;
}

export interface FounderSimulationDegradationFinding {
  readOnly: true;
  rootCause: DegradationRootCauseClass;
  authority: string;
  substep: string | null;
  elapsedMs: number;
  runtimePercent: number;
  impact: string;
  recommendedRepair: string;
  warningPathEmitter: boolean;
}

export interface FounderSimulationDegradationRepairPlan {
  readOnly: true;
  actions: readonly string[];
  primaryBottleneckAuthority: string | null;
  primaryBottleneckSubstep: string | null;
  warningCompletionAuthority: string | null;
  totalSimulationRuntimeMs: number;
}

export interface FounderSimulationDegradationRootCauseReport {
  readOnly: true;
  investigationId: string;
  generatedAt: string;
  coreQuestion: string;
  runId: string | null;
  completionEventId: FounderSimulationCompletionEventId | null;
  degraded: boolean;
  totalSimulationRuntimeMs: number;
  authorityProfiles: FounderSimulationAuthorityProfile[];
  substepProfiles: FounderSimulationSubstepProfile[];
  degradationSignals: FounderSimulationDegradationSignal[];
  findings: FounderSimulationDegradationFinding[];
  repairPlan: FounderSimulationDegradationRepairPlan;
  slowestAuthority: FounderSimulationAuthorityProfile | null;
  slowestSubstep: FounderSimulationSubstepProfile | null;
  timelineCaptured: boolean;
  passToken: string | null;
}

export interface FounderSimulationDegradationRootCauseAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_COMPLETE';
  report: FounderSimulationDegradationRootCauseReport;
  cacheKey: string;
}

export interface AssessFounderSimulationDegradationRootCauseInput {
  rootDir?: string;
  runtimeSnapshot?: FounderTestRuntimeSnapshot | null;
  simulationElapsedMs?: number;
  completionEventId?: FounderSimulationCompletionEventId | null;
  degraded?: boolean;
  budgetExceeded?: boolean;
  errorMessage?: string | null;
  payloadGuardDegraded?: boolean;
  runId?: string | null;
  skipHistoryRecording?: boolean;
}
