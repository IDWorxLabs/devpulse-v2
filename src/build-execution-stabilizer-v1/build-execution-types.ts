/**
 * Build Execution Stabilizer V1 — types.
 *
 * Product Stabilization Phase 4: makes build EXECUTION (not generation) observable, bounded,
 * recoverable, and understandable. This module does not plan, generate, or validate apps — it
 * watches the stages that are already running, detects when one has genuinely stopped making
 * progress (using real process/IO evidence, never a fake progress bar), and allows exactly one
 * bounded recovery attempt per stage before giving up honestly.
 */

export const BUILD_EXECUTION_STABILIZER_V1_CONTRACT = 'BUILD_EXECUTION_STABILIZER_V1' as const;

export type BuildExecutionStageName =
  | 'PLANNING'
  | 'GENERATION'
  | 'WORKSPACE_STABILIZATION'
  | 'NPM_INSTALL'
  | 'NPM_BUILD'
  | 'PREVIEW_STARTUP'
  | 'INTERACTION_PROOF'
  | 'VALIDATION'
  | 'RESULT';

export type BuildExecutionState =
  | 'RUNNING'
  | 'WAITING'
  | 'STALL_DETECTED'
  | 'RECOVERING'
  | 'RECOVERED'
  | 'FAILED'
  | 'COMPLETED'
  | 'BLOCKED';

export interface BuildExecutionHeartbeat {
  readOnly: true;
  stage: BuildExecutionStageName;
  atMs: number;
  elapsedMs: number;
  message: string;
}

export interface BuildExecutionTimelineEntry {
  readOnly: true;
  stage: BuildExecutionStageName;
  state: BuildExecutionState;
  startedAtMs: number;
  endedAtMs: number | null;
  durationMs: number | null;
  detail: string;
}

export type BuildExecutionRecoveryActionKind =
  | 'RESTART_NPM_INSTALL'
  | 'RESTART_NPM_BUILD'
  | 'RESTART_PREVIEW_SERVER'
  | 'RECREATE_PREVIEW_PROCESS'
  | 'TERMINATE_ORPHANED_PROCESS'
  | 'RETRY_FILESYSTEM_WATCHER'
  | 'RETRY_DEV_SERVER_STARTUP';

export interface BuildExecutionRecoveryAttempt {
  readOnly: true;
  stage: BuildExecutionStageName;
  actionKind: BuildExecutionRecoveryActionKind;
  attemptedAtMs: number;
  succeeded: boolean;
  detail: string;
}

export interface BuildExecutionStageStallConfig {
  /** No real activity (heartbeat/output/progress) within this window is treated as a stall. */
  stallTimeoutMs: number;
  /** Hard cap regardless of activity — a build must never run forever. */
  totalTimeoutMs: number;
}

export interface BuildExecutionPlainEnglishSummary {
  readOnly: true;
  headline: string;
  currentStageLabel: string;
  elapsedLabel: string;
  heartbeatLabel: string;
  recoveryLabel: string | null;
  nextStepLabel: string;
}

export interface BuildExecutionReport {
  readOnly: true;
  contractVersion: typeof BUILD_EXECUTION_STABILIZER_V1_CONTRACT;
  overallState: BuildExecutionState;
  timeline: BuildExecutionTimelineEntry[];
  heartbeats: BuildExecutionHeartbeat[];
  recoveryAttempts: BuildExecutionRecoveryAttempt[];
  summary: BuildExecutionPlainEnglishSummary;
  totalDurationMs: number;
}
