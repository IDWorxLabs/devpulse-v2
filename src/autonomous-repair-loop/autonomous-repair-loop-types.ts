/**
 * Autonomous Repair Loop — core models.
 * Orchestration only — recommends actions, does not perform them.
 */

import type { AdaptiveAutoFixAssessment } from '../adaptive-autofix-intelligence/adaptive-autofix-types.js';
import type { ExecutionProofAssessment, ExecutionProofVerdict } from '../execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment, FounderAcceptanceState } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';

export type RepairLoopSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RepairLoopAction =
  | 'RETRY_FIX'
  | 'APPLY_DIFFERENT_FIX'
  | 'RETEST'
  | 'ACCEPT_FIX'
  | 'REVERT_FIX'
  | 'ESCALATE'
  | 'STOP';

export type RepairLoopState =
  | 'IDLE'
  | 'FINDING_DETECTED'
  | 'FIX_PROPOSED'
  | 'PROOF_PENDING'
  | 'PROOF_COMPLETE'
  | 'ACCEPTANCE_PENDING'
  | 'ACCEPTED'
  | 'FAILED'
  | 'ESCALATED'
  | 'STOPPED';

export interface RepairLoopFinding {
  findingId: string;
  severity: RepairLoopSeverity;
  summary: string;
  sourceAuthority: string;
  category: string;
}

export interface RepairLoopAttempt {
  attemptNumber: number;
  action: RepairLoopAction;
  executionProofVerdict: ExecutionProofVerdict | null;
  founderAcceptanceState: FounderAcceptanceState | null;
  recordedAt: string;
}

export interface RepairLoopEscalationGuidance {
  whyLoopStopped: string;
  whyEscalationHappened: string;
  missingCapabilitySuggestions: string[];
  missingEvidenceSuggestions: string[];
  diagnosticRecommendations: string[];
}

export interface RepairLoopInputSnapshot {
  finding: RepairLoopFinding | null;
  founderTestAssessment: FounderTestAssessment | null;
  adaptiveAutofixAssessment: AdaptiveAutoFixAssessment | null;
  executionProofAssessment: ExecutionProofAssessment | null;
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null;
  executionProofVerdict: ExecutionProofVerdict | null;
  founderAcceptanceState: FounderAcceptanceState | null;
  priorAttemptCount: number;
  attemptBudget: number;
  budgetExceeded: boolean;
  regressionPresent: boolean;
  loopRiskPresent: boolean;
}

export interface RepairLoopDecision {
  recommendedAction: RepairLoopAction;
  loopState: RepairLoopState;
  decisionReason: string;
  escalationGuidance: RepairLoopEscalationGuidance | null;
}

export interface AutonomousRepairLoopAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  inputSnapshot: RepairLoopInputSnapshot;
  decision: RepairLoopDecision;
  attempts: RepairLoopAttempt[];
  cacheKey: string;
}

export interface AutonomousRepairLoopReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: AutonomousRepairLoopAssessment;
  passToken: string;
}

export interface AssessAutonomousRepairLoopInput {
  finding?: RepairLoopFinding | null;
  founderTestAssessment?: FounderTestAssessment;
  adaptiveAutofixAssessment?: AdaptiveAutoFixAssessment;
  executionProofAssessment?: ExecutionProofAssessment;
  founderAcceptanceAssessment?: FounderAcceptanceAssessment;
  priorAttemptCount?: number;
  priorAttempts?: RepairLoopAttempt[];
  rootDir?: string;
}

export interface AutonomousRepairLoopHistorySummary {
  totalLoops: number;
  acceptedFixes: number;
  revertedFixes: number;
  escalations: number;
  retries: number;
  stoppedLoops: number;
}
