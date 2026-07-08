/**
 * Recovery Memory — types and pass token.
 */

import type { RootCauseCategory } from '../recovery-root-cause/index.js';
import type { RecoveryOperationType } from '../recovery-planner/index.js';

export const RECOVERY_MEMORY_OWNER_MODULE = 'devpulse_v2_recovery_memory';
export const RECOVERY_MEMORY_V1_PASS_TOKEN = 'RECOVERY_MEMORY_V1_PASS';

export interface RecoveryMemoryRecord {
  readOnly: true;
  recordId: string;
  projectId: string | null;
  failureStage: string;
  failureType: RootCauseCategory;
  rootCauseSummary: string;
  repairStrategy: RecoveryOperationType;
  repairDurationMs: number;
  repairSuccess: boolean;
  replayPassed: boolean;
  evidenceRefs: readonly string[];
  alternativeStrategies: readonly string[];
  recordedAt: number;
}

export interface RecoveryMemoryInput {
  projectId?: string | null;
  failureStage: string;
  failureType: RootCauseCategory;
  rootCauseSummary: string;
  repairStrategy: RecoveryOperationType;
  repairDurationMs: number;
  repairSuccess: boolean;
  replayPassed: boolean;
  evidenceRefs?: readonly string[];
  alternativeStrategies?: readonly string[];
}
