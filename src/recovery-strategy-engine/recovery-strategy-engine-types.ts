/**
 * Recovery Strategy Engine — types and pass token.
 */

import type { EngineeringRecoveryPlan } from '../recovery-planner/index.js';
import type { RootCauseAnalysis } from '../recovery-root-cause/index.js';

export const RECOVERY_STRATEGY_ENGINE_OWNER_MODULE = 'devpulse_v2_recovery_strategy_engine';
export const RECOVERY_STRATEGY_ENGINE_V1_PASS_TOKEN = 'RECOVERY_STRATEGY_ENGINE_V1_PASS';

export interface RecoveryStrategy {
  readOnly: true;
  strategyId: string;
  operation: import('../recovery-planner/index.js').RecoveryOperationType;
  selectedReason: string;
  expectedOutcome: string;
  evidenceRefs: readonly string[];
  confidence: number;
  rank: number;
  deterministicKey: string;
}

export interface RecoveryStrategySelection {
  readOnly: true;
  selected: RecoveryStrategy | null;
  alternatives: readonly RecoveryStrategy[];
  selectionReason: string;
}

export interface RecoveryStrategyInput {
  rootCause: RootCauseAnalysis;
  plan: EngineeringRecoveryPlan;
  evidenceRefs?: readonly string[];
}
