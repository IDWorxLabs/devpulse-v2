/**
 * Autonomous Recovery Authority — types and pass tokens.
 */

import type { RecoveryReport } from '../recovery-report-builder/index.js';
import type { RecoveryExecutionHost } from '../recovery-executor/index.js';
import type { ValidationReplayHost } from '../validation-replay-engine/index.js';
import type { EngineeringContinuationHost } from '../engineering-continuation/index.js';

export const AUTONOMOUS_RECOVERY_AUTHORITY_OWNER_MODULE = 'devpulse_v2_autonomous_recovery_authority';
export const AUTONOMOUS_RECOVERY_ENGINE_V1_PASS_TOKEN = 'AUTONOMOUS_RECOVERY_ENGINE_V1_PASS';
export const AEP_PHASE3_PASS_TOKEN = 'AEP_PHASE3_PASS';

export interface EngineeringRecoveryHost
  extends RecoveryExecutionHost, ValidationReplayHost, EngineeringContinuationHost {}

export interface EngineeringRecoveryInput {
  projectId?: string | null;
  failureStage: string;
  failureReason: string;
  blockers?: readonly string[];
  evidenceRefs?: readonly string[];
  rawPrompt?: string;
  host?: EngineeringRecoveryHost;
}

export interface EngineeringRecoveryResult {
  readOnly: true;
  recoveryId: string;
  recovered: boolean;
  continued: boolean;
  escalated: boolean;
  userActionRequired: boolean;
  report: RecoveryReport;
  attempts: number;
}

export interface SpecializedRecoveryInput {
  projectId?: string | null;
  failureReason: string;
  host?: EngineeringRecoveryHost;
}
