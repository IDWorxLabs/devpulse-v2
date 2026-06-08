/** DevPulse V2 Phase 7.7 Controlled Execution Bridge Foundation — types. */

import type { CompletionConfidence, CompletionStatus } from '../world2-completion-verifier/types.js';
import type {
  ApprovalRequirement,
  BlockedAction,
  PreparedAction,
  RiskControl,
  RollbackRequirement,
  VerificationRequirement,
} from '../world2-autonomous-builder/types.js';

export type BridgeState =
  | 'BRIDGE_REQUEST_RECEIVED'
  | 'OWNERSHIP_VALIDATED'
  | 'BUILDER_PACKET_VALIDATED'
  | 'COMPLETION_VERIFICATION_VALIDATED'
  | 'LEARNING_CONTEXT_VALIDATED'
  | 'FOUNDER_APPROVAL_VALIDATED'
  | 'GOVERNANCE_VALIDATED'
  | 'PROTECTION_GATES_EVALUATED'
  | 'EXECUTION_REQUESTS_CLASSIFIED'
  | 'BRIDGE_READY'
  | 'BLOCKED';

export type ExecutionReadiness =
  | 'NOT_READY'
  | 'NEEDS_FOUNDER_APPROVAL'
  | 'NEEDS_VERIFICATION_GATE'
  | 'READY_FOR_GATED_EXECUTION'
  | 'BLOCKED';

export type ProtectionGateStatus = 'PASS' | 'FAIL';

export type GovernanceGateStatus = 'PASS' | 'FAIL' | 'PENDING';

export interface BridgeInput {
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  builderId: string;
  verificationId: string;
  learningId: string;
  preparedActions: PreparedAction[];
  blockedActions: BlockedAction[];
  approvalRequirements: ApprovalRequirement[];
  verificationRequirements: VerificationRequirement[];
  rollbackRequirements: RollbackRequirement[];
  riskControls: RiskControl[];
  founderApproved: boolean;
  specialApproval?: boolean;
  simulationPassed: boolean;
  completionStatus: CompletionStatus;
  completionConfidence: CompletionConfidence;
  workspaceIsolationStatus: ProtectionGateStatus;
  world1ProtectionStatus: ProtectionGateStatus;
  governanceStatus: GovernanceGateStatus;
}

export interface ExecutionRequest {
  requestId: string;
  actionId: string;
  actionType: PreparedAction['actionType'];
  targetPath: string;
  description: string;
  eligibility: 'ELIGIBLE' | 'BLOCKED';
  blockReason: string;
  requiresSpecialApproval: boolean;
  specialApprovalSatisfied: boolean;
  classificationOnly: true;
  executed: false;
}

export interface GateRecord {
  gateId: string;
  gateType: string;
  status: 'OPEN' | 'CLOSED' | 'REQUIRED';
  description: string;
}

export interface BridgeConfirmation {
  bridgeClassificationOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
}

export interface BridgeResult {
  bridgeId: string;
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  builderId: string;
  verificationId: string;
  learningId: string;
  bridgeState: BridgeState;
  executionReadiness: ExecutionReadiness;
  eligibleExecutionRequests: ExecutionRequest[];
  blockedExecutionRequests: ExecutionRequest[];
  approvalGates: GateRecord[];
  verificationGates: GateRecord[];
  rollbackGates: GateRecord[];
  riskGates: GateRecord[];
  protectionGates: GateRecord[];
  recommendations: string[];
  confirmation: BridgeConfirmation;
  stateSequence: BridgeState[];
  createdAt: number;
}

export interface ControlledExecutionBridgeState {
  foundationId: string;
  bridgePacketCount: number;
  warnings: string[];
  errors: string[];
}

export interface ControlledExecutionReport {
  ownerModule: string;
  bridgeId: string;
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  builderId: string;
  verificationId: string;
  learningId: string;
  executionReadiness: ExecutionReadiness;
  eligibleRequestCount: number;
  blockedRequestCount: number;
  approvalGateCount: number;
  verificationGateCount: number;
  rollbackGateCount: number;
  riskGateCount: number;
  protectionGateCount: number;
  recommendationCount: number;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE = 'devpulse_v2_controlled_execution_bridge';
export const CONTROLLED_EXECUTION_BRIDGE_PASS_TOKEN =
  'DEVPULSE_V2_CONTROLLED_EXECUTION_BRIDGE_FOUNDATION_V1_PASS';

export const BRIDGE_STATE_SEQUENCE: readonly BridgeState[] = [
  'BRIDGE_REQUEST_RECEIVED',
  'OWNERSHIP_VALIDATED',
  'BUILDER_PACKET_VALIDATED',
  'COMPLETION_VERIFICATION_VALIDATED',
  'LEARNING_CONTEXT_VALIDATED',
  'FOUNDER_APPROVAL_VALIDATED',
  'GOVERNANCE_VALIDATED',
  'PROTECTION_GATES_EVALUATED',
  'EXECUTION_REQUESTS_CLASSIFIED',
  'BRIDGE_READY',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'world2_workspace_foundation',
  'world2_execution_planner',
  'world2_simulation_runtime',
  'world2_autonomous_builder',
  'world2_completion_verifier',
  'world2_learning_loop',
  'execution_reality_validation',
  'execution_evidence_ledger',
  'verification_gated_apply',
  'founder_approval_execution_gate',
  'execution_authority',
] as const;

export const DUPLICATE_PATTERNS = [
  'controlled_execution_bridge',
  'world2_execution_bridge',
  'execution_bridge',
  'gated_execution_bridge',
  'builder_execution_bridge',
] as const;

export const SPECIAL_APPROVAL_ACTION_TYPES = ['DELETE_FILE_PROPOSED', 'RUN_COMMAND_PROPOSED'] as const;

export const EXECUTION_READINESS_LEVELS: readonly ExecutionReadiness[] = [
  'NOT_READY',
  'NEEDS_FOUNDER_APPROVAL',
  'NEEDS_VERIFICATION_GATE',
  'READY_FOR_GATED_EXECUTION',
  'BLOCKED',
] as const;

export const WORLD1_TARGET_PATTERNS = ['world1/', 'governance/', 'foundation/', 'ownership-registry'] as const;
