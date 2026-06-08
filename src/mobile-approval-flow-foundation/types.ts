/** DevPulse V2 Phase 8.4 Mobile Approval Flow Foundation — types. */

import type {
  AuthStatus,
  CloudConnectionStatus,
  GovernanceStatus,
} from '../mobile-command-foundation/types.js';

export type { AuthStatus, CloudConnectionStatus, GovernanceStatus };

export type ApprovalType =
  | 'PROJECT_CREATION'
  | 'PROJECT_SWITCH'
  | 'WORLD1_ACTION'
  | 'WORLD2_ACTION'
  | 'CONTROLLED_EXECUTION'
  | 'DEPENDENCY_CHANGE'
  | 'CONFIGURATION_CHANGE'
  | 'DEPLOYMENT_REQUEST'
  | 'DELETE_REQUEST'
  | 'ROLLBACK_REQUEST'
  | 'UNKNOWN';

export type ApprovalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ApprovalRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ApprovalDecision = 'APPROVE' | 'REJECT' | 'DEFER' | 'REQUEST_INFORMATION';

export type ApprovalStatus = 'PENDING' | 'DECIDED' | 'DEFERRED' | 'BLOCKED';

export type ApprovalState =
  | 'APPROVAL_REQUEST_RECEIVED'
  | 'MOBILE_SESSION_VALIDATED'
  | 'CLOUD_SESSION_VALIDATED'
  | 'PROJECT_CONTEXT_VALIDATED'
  | 'APPROVAL_CLASSIFIED'
  | 'DECISION_RECORDED'
  | 'APPROVAL_RESPONSE_PACKET_CREATED'
  | 'APPROVAL_READY'
  | 'APPROVAL_BLOCKED';

export type ApprovalReadiness =
  | 'NOT_READY'
  | 'NEEDS_AUTH'
  | 'NEEDS_CLOUD_CONNECTION'
  | 'NEEDS_MOBILE_SESSION'
  | 'NEEDS_PROJECT_CONTEXT'
  | 'READY_FOR_DECISION';

export interface ApprovalInput {
  approvalRequestId: string;
  approvalPacketId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  userId: string;
  deviceId: string;
  workspaceId: string;
  projectId: string;
  approvalType: ApprovalType;
  approvalTarget: string;
  approvalSummary: string;
  approvalReason: string;
  approvalRiskLevel: ApprovalRiskLevel;
  approvalPriority: ApprovalPriority;
  approvalStatus: ApprovalStatus;
  requestedBy: string;
  timestamp: number;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
  cloudConnectionStatus: CloudConnectionStatus;
  approvalDecision: ApprovalDecision;
  approvalNotes: string;
  targetWorkspaceId?: string;
  targetProjectId?: string;
}

export interface GateRecord {
  gateId: string;
  gateType: string;
  status: 'OPEN' | 'CLOSED' | 'REQUIRED';
  description: string;
}

export interface ApprovalAuditRecord {
  auditId: string;
  approvalRequestId: string;
  approvalResponseId: string;
  userId: string;
  decision: ApprovalDecision;
  timestamp: number;
  deviceId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  projectId: string;
  workspaceId: string;
}

export interface ApprovalResponsePacket {
  responsePacketId: string;
  approvalRequestId: string;
  approvalPacketId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  approvalType: ApprovalType;
  approvalDecision: ApprovalDecision;
  payloadSummary: string;
  decisionOnly: true;
  executed: false;
}

export interface MobileApprovalConfirmation {
  mobileApprovalFoundationOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noApprovalSelfGranted: true;
  noApprovalSourceOfTruthClaim: true;
}

export interface MobileApprovalResult {
  approvalResponseId: string;
  approvalRequestId: string;
  approvalPacketId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  userId: string;
  workspaceId: string;
  projectId: string;
  approvalType: ApprovalType;
  approvalDecision: ApprovalDecision;
  approvalState: ApprovalState;
  approvalReason: string;
  approvalNotes: string;
  decisionTimestamp: number;
  approvalReadiness: ApprovalReadiness;
  approvalAuditRecord: ApprovalAuditRecord | null;
  approvalResponsePacket: ApprovalResponsePacket | null;
  ownershipGates: GateRecord[];
  governanceGates: GateRecord[];
  cloudGates: GateRecord[];
  approvalGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: MobileApprovalConfirmation;
  stateSequence: ApprovalState[];
  createdAt: number;
}

export interface MobileApprovalFlowFoundationState {
  foundationId: string;
  approvalResponseCount: number;
  warnings: string[];
  errors: string[];
}

export interface MobileApprovalReport {
  ownerModule: string;
  approvalResponseId: string;
  approvalRequestId: string;
  approvalPacketId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  userId: string;
  workspaceId: string;
  projectId: string;
  approvalType: ApprovalType;
  approvalDecision: ApprovalDecision;
  approvalState: ApprovalState;
  approvalReadiness: ApprovalReadiness;
  approvalRiskLevel: ApprovalRiskLevel;
  approvalPriority: ApprovalPriority;
  auditId: string;
  ownershipGateCount: number;
  governanceGateCount: number;
  cloudGateCount: number;
  approvalGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: MobileApprovalConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE =
  'devpulse_v2_mobile_approval_flow_foundation';
export const MOBILE_APPROVAL_FLOW_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_MOBILE_APPROVAL_FLOW_FOUNDATION_V1_PASS';

export const APPROVAL_STATE_SEQUENCE: readonly ApprovalState[] = [
  'APPROVAL_REQUEST_RECEIVED',
  'MOBILE_SESSION_VALIDATED',
  'CLOUD_SESSION_VALIDATED',
  'PROJECT_CONTEXT_VALIDATED',
  'APPROVAL_CLASSIFIED',
  'DECISION_RECORDED',
  'APPROVAL_RESPONSE_PACKET_CREATED',
  'APPROVAL_READY',
] as const;

export const KNOWN_APPROVAL_TYPES: readonly ApprovalType[] = [
  'PROJECT_CREATION',
  'PROJECT_SWITCH',
  'WORLD1_ACTION',
  'WORLD2_ACTION',
  'CONTROLLED_EXECUTION',
  'DEPENDENCY_CHANGE',
  'CONFIGURATION_CHANGE',
  'DEPLOYMENT_REQUEST',
  'DELETE_REQUEST',
  'ROLLBACK_REQUEST',
] as const;

export const APPROVAL_DECISIONS: readonly ApprovalDecision[] = [
  'APPROVE',
  'REJECT',
  'DEFER',
  'REQUEST_INFORMATION',
] as const;

export const APPROVAL_READINESS_LEVELS: readonly ApprovalReadiness[] = [
  'NOT_READY',
  'NEEDS_AUTH',
  'NEEDS_CLOUD_CONNECTION',
  'NEEDS_MOBILE_SESSION',
  'NEEDS_PROJECT_CONTEXT',
  'READY_FOR_DECISION',
] as const;

export const EXECUTION_BLOCKED_PATTERNS = [
  'execute',
  'run command',
  'self execute',
  'auto approve',
] as const;

export const FILE_MOD_BLOCKED_PATTERNS = [
  'modify file',
  'write file',
  'delete file',
] as const;

export const CODE_GEN_BLOCKED_PATTERNS = [
  'generate code',
  'write code',
] as const;

export const DEPLOY_BLOCKED_PATTERNS = [
  'deploy',
  'publish',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'mobile_command_foundation',
  'mobile_chat_interface',
  'mobile_live_preview_foundation',
  'controlled_execution_bridge',
  'founder_approval_execution_gate',
  'verification_gated_apply',
  'execution_authority',
  'execution_evidence_ledger',
] as const;

export const DUPLICATE_PATTERNS = [
  'mobile_approval_flow_foundation',
  'mobile_approval_flow',
  'mobile_approval_center',
  'mobile_approval_packet',
  'approval_response_registry',
  'mobile_decision_flow',
] as const;
