/** DevPulse V2 World 2 Completion Verifier Foundation — types. */

import type { CompletionCriterion } from '../world2-execution-planner/types.js';
import type {
  ConfidenceLevel,
  LikelihoodLevel,
} from '../world2-simulation-runtime/types.js';
import type {
  ApprovalRequirement,
  ProtectionCheck,
  RiskControl,
  RollbackRequirement,
  VerificationRequirement,
} from '../world2-autonomous-builder/types.js';

export type VerifierState =
  | 'VERIFICATION_REQUEST_RECEIVED'
  | 'OWNERSHIP_VALIDATED'
  | 'GOVERNANCE_VALIDATED'
  | 'COMPLETION_CRITERIA_EVALUATED'
  | 'VERIFICATION_REQUIREMENTS_EVALUATED'
  | 'RISK_CONTROLS_EVALUATED'
  | 'ROLLBACK_REQUIREMENTS_EVALUATED'
  | 'WORKSPACE_INTEGRITY_EVALUATED'
  | 'EVIDENCE_EVALUATED'
  | 'COMPLETION_DECISION_CREATED'
  | 'VERIFICATION_READY';

export type CompletionStatus =
  | 'NOT_STARTED'
  | 'INCOMPLETE'
  | 'PARTIALLY_COMPLETE'
  | 'COMPLETE'
  | 'COMPLETE_WITH_WARNINGS'
  | 'REJECTED';

export type CompletionConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type EvaluationResult = 'PASSED' | 'FAILED' | 'WARNING' | 'NOT_EVALUATED';

export interface VerifierInput {
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  builderId: string;
  completionCriteria: CompletionCriterion[];
  verificationRequirements: VerificationRequirement[];
  rollbackRequirements: RollbackRequirement[];
  riskControls: RiskControl[];
  approvalRequirements: ApprovalRequirement[];
  workspaceProtectionChecks: ProtectionCheck[];
  world1ProtectionChecks: ProtectionCheck[];
  completionLikelihood: LikelihoodLevel;
  confidenceScore: ConfidenceLevel;
  evidenceReferences: string[];
}

export interface RequirementEvaluation {
  requirementId: string;
  requirementType: string;
  result: EvaluationResult;
  description: string;
}

export interface VerificationResultItem {
  resultId: string;
  pointId: string;
  result: EvaluationResult;
  description: string;
}

export interface RiskControlResult {
  resultId: string;
  controlId: string;
  result: EvaluationResult;
  description: string;
}

export interface RollbackResult {
  resultId: string;
  requirementId: string;
  result: EvaluationResult;
  description: string;
}

export interface IntegrityResult {
  resultId: string;
  checkType: string;
  result: EvaluationResult;
  description: string;
}

export interface GovernanceResult {
  resultId: string;
  checkType: string;
  result: EvaluationResult;
  description: string;
}

export interface EvidenceResult {
  resultId: string;
  evidenceId: string;
  result: EvaluationResult;
  description: string;
}

export interface VerifierConfirmation {
  verificationOnlyFoundation: true;
  noExecutionPerformed: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noCommandsExecuted: true;
}

export interface VerifierResult {
  verificationId: string;
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  builderId: string;
  completionStatus: CompletionStatus;
  completionConfidence: CompletionConfidence;
  completionReasons: string[];
  failedRequirements: RequirementEvaluation[];
  passedRequirements: RequirementEvaluation[];
  verificationResults: VerificationResultItem[];
  riskControlResults: RiskControlResult[];
  rollbackResults: RollbackResult[];
  workspaceIntegrityResults: IntegrityResult[];
  governanceResults: GovernanceResult[];
  evidenceResults: EvidenceResult[];
  recommendations: string[];
  confirmation: VerifierConfirmation;
  stateSequence: VerifierState[];
  createdAt: number;
}

export interface World2CompletionVerifierState {
  verifierId: string;
  verificationCount: number;
  warnings: string[];
  errors: string[];
}

export interface World2CompletionReport {
  ownerModule: string;
  verificationId: string;
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  builderId: string;
  completionStatus: CompletionStatus;
  completionConfidence: CompletionConfidence;
  passedRequirementCount: number;
  failedRequirementCount: number;
  verificationResultCount: number;
  riskControlResultCount: number;
  rollbackResultCount: number;
  workspaceIntegrityResultCount: number;
  governanceResultCount: number;
  evidenceResultCount: number;
  recommendationCount: number;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const WORLD2_COMPLETION_VERIFIER_OWNER_MODULE = 'devpulse_v2_world2_completion_verifier';
export const WORLD2_COMPLETION_VERIFIER_PASS_TOKEN =
  'DEVPULSE_V2_WORLD2_COMPLETION_VERIFIER_FOUNDATION_V1_PASS';

export const VERIFIER_STATE_SEQUENCE: readonly VerifierState[] = [
  'VERIFICATION_REQUEST_RECEIVED',
  'OWNERSHIP_VALIDATED',
  'GOVERNANCE_VALIDATED',
  'COMPLETION_CRITERIA_EVALUATED',
  'VERIFICATION_REQUIREMENTS_EVALUATED',
  'RISK_CONTROLS_EVALUATED',
  'ROLLBACK_REQUIREMENTS_EVALUATED',
  'WORKSPACE_INTEGRITY_EVALUATED',
  'EVIDENCE_EVALUATED',
  'COMPLETION_DECISION_CREATED',
  'VERIFICATION_READY',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'world2_workspace_foundation',
  'world2_execution_planner',
  'world2_simulation_runtime',
  'world2_autonomous_builder',
  'execution_reality_validation',
  'execution_evidence_ledger',
  'verification_gated_apply',
] as const;

export const DUPLICATE_PATTERNS = [
  'world2_completion_verifier',
  'completion_verifier',
  'completion_authority',
  'completion_validation',
  'project_completion_authority',
  'completion_truth_engine',
] as const;

export const WORLD1_PROTECTED_DOMAINS = [
  'law_enforcement',
  'foundation_enforcement',
  'execution_authority',
  'execution_reality_validation',
  'execution_evidence_ledger',
  'recovery_chains',
  'verification_gated_apply',
] as const;

export const COMPLETION_STATUSES: readonly CompletionStatus[] = [
  'NOT_STARTED',
  'INCOMPLETE',
  'PARTIALLY_COMPLETE',
  'COMPLETE',
  'COMPLETE_WITH_WARNINGS',
  'REJECTED',
] as const;

export const COMPLETION_CONFIDENCE_LEVELS: readonly CompletionConfidence[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
] as const;
