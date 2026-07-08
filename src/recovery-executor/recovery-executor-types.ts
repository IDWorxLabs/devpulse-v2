/**
 * Recovery Executor — types and pass token.
 */

import type { RecoveryStrategy } from '../recovery-strategy-engine/index.js';

export const RECOVERY_EXECUTOR_OWNER_MODULE = 'devpulse_v2_recovery_executor';
export const RECOVERY_EXECUTOR_V1_PASS_TOKEN = 'RECOVERY_EXECUTOR_V1_PASS';

export type RecoveryExecutionStatus = 'STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RECOVERED';

export interface RecoveryExecutionHost {
  retryStage?: () => { ok: boolean; detail: string };
  replayValidation?: () => { ok: boolean; detail: string };
  restartPreview?: () => { ok: boolean; detail: string };
  rebuildWorkspace?: () => { ok: boolean; detail: string };
  regenerateArtifacts?: () => { ok: boolean; detail: string };
  repairEngineering?: () => { ok: boolean; detail: string };
  resumePipeline?: () => { ok: boolean; detail: string };
}

export interface RecoveryExecutionResult {
  readOnly: true;
  executionId: string;
  strategyId: string;
  operation: RecoveryStrategy['operation'];
  status: RecoveryExecutionStatus;
  success: boolean;
  detail: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
}

export interface RecoveryExecutorInput {
  strategy: RecoveryStrategy;
  host?: RecoveryExecutionHost;
}
