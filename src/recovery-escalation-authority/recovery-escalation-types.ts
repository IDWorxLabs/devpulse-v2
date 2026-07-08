/**
 * Recovery Escalation Authority — types and pass token.
 */

import type { RecoveryExecutionResult } from '../recovery-executor/index.js';
import type { RecoveryStrategy } from '../recovery-strategy-engine/index.js';

export const RECOVERY_ESCALATION_AUTHORITY_OWNER_MODULE = 'devpulse_v2_recovery_escalation_authority';
export const RECOVERY_ESCALATION_AUTHORITY_V1_PASS_TOKEN = 'RECOVERY_ESCALATION_AUTHORITY_V1_PASS';

export interface RecoveryEscalationInput {
  attemptedRecoveries: readonly RecoveryExecutionResult[];
  attemptedStrategies: readonly RecoveryStrategy[];
  blockers: readonly string[];
  evidenceRefs?: readonly string[];
}

export interface RecoveryEscalationDecision {
  readOnly: true;
  escalate: boolean;
  reason: string;
  attemptedRecoveries: readonly string[];
  evidenceCollected: readonly string[];
  remainingBlocker: string | null;
  humanJudgmentRequired: boolean;
}
