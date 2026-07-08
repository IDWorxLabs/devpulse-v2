/**
 * Recovery Planner — types and pass token.
 */

import type { RootCauseAnalysis } from '../recovery-root-cause/index.js';

export const RECOVERY_PLANNER_OWNER_MODULE = 'devpulse_v2_recovery_planner';
export const RECOVERY_PLANNER_V1_PASS_TOKEN = 'RECOVERY_PLANNER_V1_PASS';

export type RecoveryOperationType =
  | 'REPAIR'
  | 'RESUME'
  | 'RETRY'
  | 'REPLAY'
  | 'RESTART'
  | 'REBUILD'
  | 'REGENERATE'
  | 'CONTINUE';

export interface RecoveryPlanCandidate {
  readOnly: true;
  candidateId: string;
  operation: RecoveryOperationType;
  reason: string;
  evidenceRefs: readonly string[];
  confidence: number;
  rank: number;
}

export interface EngineeringRecoveryPlan {
  readOnly: true;
  planId: string;
  rootCauseAnalysisId: string;
  failureStage: string;
  failureReason: string;
  candidates: readonly RecoveryPlanCandidate[];
  selectedCandidateId: string | null;
  createdAt: number;
}

export interface RecoveryPlannerInput {
  rootCause: RootCauseAnalysis;
  failureStage: string;
  failureReason: string;
  evidenceRefs?: readonly string[];
}
