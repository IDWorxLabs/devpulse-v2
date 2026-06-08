/** DevPulse V2 Phase 8.5 Cross-device Continuity Foundation — types. */

import type {
  AuthStatus,
  CloudConnectionStatus,
  DeviceType,
  GovernanceStatus,
  Platform,
} from '../mobile-command-foundation/types.js';

export type { AuthStatus, CloudConnectionStatus, DeviceType, GovernanceStatus, Platform };

export type HandoffType =
  | 'PHONE_TO_DESKTOP'
  | 'DESKTOP_TO_PHONE'
  | 'PHONE_TO_TABLET'
  | 'TABLET_TO_PHONE'
  | 'WEB_TO_PHONE'
  | 'PHONE_TO_WEB'
  | 'SAME_DEVICE_RESUME'
  | 'UNKNOWN';

export type ContinuityScope =
  | 'PROJECT_CONTEXT'
  | 'CHAT_CONTEXT'
  | 'APPROVAL_CONTEXT'
  | 'PREVIEW_CONTEXT'
  | 'OPERATOR_FEED_CONTEXT'
  | 'BUILD_PROGRESS_CONTEXT'
  | 'FULL_COMMAND_CONTEXT'
  | 'UNKNOWN';

export type ContinuityCapability =
  | 'RESUME_PROJECT_CONTEXT'
  | 'RESUME_CHAT_CONTEXT'
  | 'RESUME_APPROVAL_CONTEXT'
  | 'RESUME_PREVIEW_CONTEXT'
  | 'RESUME_OPERATOR_FEED_CONTEXT'
  | 'RESUME_BUILD_PROGRESS_CONTEXT'
  | 'REQUEST_CLOUD_STATE_REFRESH'
  | 'REQUEST_DEVICE_HANDOFF_SUMMARY'
  | 'REQUEST_CONTINUITY_REPORT';

export type ContinuityState =
  | 'CONTINUITY_REQUEST_RECEIVED'
  | 'SOURCE_DEVICE_VALIDATED'
  | 'TARGET_DEVICE_VALIDATED'
  | 'CLOUD_SESSION_VALIDATED'
  | 'PROJECT_CONTEXT_VALIDATED'
  | 'HANDOFF_CLASSIFIED'
  | 'SCOPE_EVALUATED'
  | 'CAPABILITIES_EVALUATED'
  | 'CONTINUITY_PACKET_CREATED'
  | 'CONTINUITY_READY'
  | 'CONTINUITY_BLOCKED'
  | 'CONTINUITY_REVOKED';

export type ContinuityReadiness =
  | 'NOT_READY'
  | 'NEEDS_AUTH'
  | 'NEEDS_CLOUD_CONNECTION'
  | 'NEEDS_SOURCE_DEVICE'
  | 'NEEDS_TARGET_DEVICE'
  | 'NEEDS_PROJECT_CONTEXT'
  | 'NEEDS_GOVERNANCE'
  | 'READY_CONTEXT_RESUME'
  | 'READY_CLOUD_STATE_REFRESH';

export interface ContinuityInput {
  continuitySessionId: string;
  fromDeviceId: string;
  toDeviceId: string;
  userId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  workspaceId: string;
  projectId: string;
  handoffRequestId: string;
  handoffType: HandoffType;
  continuityScope: ContinuityScope;
  sourceDeviceType: DeviceType;
  targetDeviceType: DeviceType;
  sourcePlatform: Platform;
  targetPlatform: Platform;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
  cloudConnectionStatus: CloudConnectionStatus;
  requestedContinuityCapabilities: string[];
  handoffNotes?: string;
  targetWorkspaceId?: string;
  targetProjectId?: string;
}

export interface GateRecord {
  gateId: string;
  gateType: string;
  status: 'OPEN' | 'CLOSED' | 'REQUIRED';
  description: string;
}

export interface CapabilityClassification {
  capability: string;
  allowed: boolean;
  blockReason: string;
}

export interface ContinuityConfirmation {
  crossDeviceContinuityFoundationOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noApprovalSelfGranted: true;
  noDuplicateProjectTruthCreated: true;
}

export interface ContinuityResult {
  continuityPacketId: string;
  continuitySessionId: string;
  fromDeviceId: string;
  toDeviceId: string;
  userId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  workspaceId: string;
  projectId: string;
  handoffRequestId: string;
  handoffType: HandoffType;
  continuityState: ContinuityState;
  continuityReadiness: ContinuityReadiness;
  continuityScope: ContinuityScope;
  allowedContinuityCapabilities: CapabilityClassification[];
  blockedContinuityCapabilities: CapabilityClassification[];
  handoffSummary: string;
  cloudStateRefreshRequired: boolean;
  ownershipGates: GateRecord[];
  governanceGates: GateRecord[];
  cloudGates: GateRecord[];
  deviceGates: GateRecord[];
  scopeGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: ContinuityConfirmation;
  stateSequence: ContinuityState[];
  createdAt: number;
}

export interface CrossDeviceContinuityFoundationState {
  foundationId: string;
  continuityPacketCount: number;
  warnings: string[];
  errors: string[];
}

export interface ContinuityReport {
  ownerModule: string;
  continuityPacketId: string;
  continuitySessionId: string;
  fromDeviceId: string;
  toDeviceId: string;
  userId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  workspaceId: string;
  projectId: string;
  handoffRequestId: string;
  handoffType: HandoffType;
  continuityState: ContinuityState;
  continuityReadiness: ContinuityReadiness;
  continuityScope: ContinuityScope;
  allowedContinuityCapabilityCount: number;
  blockedContinuityCapabilityCount: number;
  cloudStateRefreshRequired: boolean;
  ownershipGateCount: number;
  governanceGateCount: number;
  cloudGateCount: number;
  deviceGateCount: number;
  scopeGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: ContinuityConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE =
  'devpulse_v2_cross_device_continuity_foundation';
export const CROSS_DEVICE_CONTINUITY_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_CROSS_DEVICE_CONTINUITY_FOUNDATION_V1_PASS';

export const CONTINUITY_STATE_SEQUENCE: readonly ContinuityState[] = [
  'CONTINUITY_REQUEST_RECEIVED',
  'SOURCE_DEVICE_VALIDATED',
  'TARGET_DEVICE_VALIDATED',
  'CLOUD_SESSION_VALIDATED',
  'PROJECT_CONTEXT_VALIDATED',
  'HANDOFF_CLASSIFIED',
  'SCOPE_EVALUATED',
  'CAPABILITIES_EVALUATED',
  'CONTINUITY_PACKET_CREATED',
  'CONTINUITY_READY',
] as const;

export const KNOWN_HANDOFF_TYPES: readonly HandoffType[] = [
  'PHONE_TO_DESKTOP',
  'DESKTOP_TO_PHONE',
  'PHONE_TO_TABLET',
  'TABLET_TO_PHONE',
  'WEB_TO_PHONE',
  'PHONE_TO_WEB',
  'SAME_DEVICE_RESUME',
] as const;

export const KNOWN_CONTINUITY_SCOPES: readonly ContinuityScope[] = [
  'PROJECT_CONTEXT',
  'CHAT_CONTEXT',
  'APPROVAL_CONTEXT',
  'PREVIEW_CONTEXT',
  'OPERATOR_FEED_CONTEXT',
  'BUILD_PROGRESS_CONTEXT',
  'FULL_COMMAND_CONTEXT',
] as const;

export const KNOWN_CONTINUITY_CAPABILITIES: readonly ContinuityCapability[] = [
  'RESUME_PROJECT_CONTEXT',
  'RESUME_CHAT_CONTEXT',
  'RESUME_APPROVAL_CONTEXT',
  'RESUME_PREVIEW_CONTEXT',
  'RESUME_OPERATOR_FEED_CONTEXT',
  'RESUME_BUILD_PROGRESS_CONTEXT',
  'REQUEST_CLOUD_STATE_REFRESH',
  'REQUEST_DEVICE_HANDOFF_SUMMARY',
  'REQUEST_CONTINUITY_REPORT',
] as const;

export const CONTINUITY_READINESS_LEVELS: readonly ContinuityReadiness[] = [
  'NOT_READY',
  'NEEDS_AUTH',
  'NEEDS_CLOUD_CONNECTION',
  'NEEDS_SOURCE_DEVICE',
  'NEEDS_TARGET_DEVICE',
  'NEEDS_PROJECT_CONTEXT',
  'NEEDS_GOVERNANCE',
  'READY_CONTEXT_RESUME',
  'READY_CLOUD_STATE_REFRESH',
] as const;

export const EXECUTION_BLOCKED_PATTERNS = [
  'execute',
  'run command',
  'self execute',
] as const;

export const FILE_MOD_BLOCKED_PATTERNS = [
  'modify file',
  'write file',
  'transfer full project',
  'sync project files',
  'duplicate project state',
  'duplicate project vault',
] as const;

export const CODE_GEN_BLOCKED_PATTERNS = [
  'generate code',
  'write code',
] as const;

export const DEPLOY_BLOCKED_PATTERNS = [
  'deploy',
  'publish',
] as const;

export const DUPLICATE_TRUTH_BLOCKED_PATTERNS = [
  'duplicate chat truth',
  'duplicate preview truth',
  'duplicate approval truth',
  'duplicate execution truth',
  'duplicate workspace truth',
  'second project vault',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'mobile_command_foundation',
  'mobile_chat_interface',
  'mobile_live_preview_foundation',
  'mobile_approval_flow_foundation',
  'world2_workspace_foundation',
  'controlled_execution_bridge',
  'founder_approval_execution_gate',
  'verification_gated_apply',
  'execution_authority',
  'execution_evidence_ledger',
] as const;

export const DUPLICATE_PATTERNS = [
  'cross_device_continuity',
  'device_continuity',
  'session_continuity',
  'continuity_session',
  'device_handoff',
  'cross_device_resume',
] as const;

export const SCOPE_CAPABILITY_MAP: Record<ContinuityScope, ContinuityCapability[]> = {
  PROJECT_CONTEXT: ['RESUME_PROJECT_CONTEXT', 'REQUEST_CLOUD_STATE_REFRESH', 'REQUEST_DEVICE_HANDOFF_SUMMARY', 'REQUEST_CONTINUITY_REPORT'],
  CHAT_CONTEXT: ['RESUME_CHAT_CONTEXT', 'REQUEST_CLOUD_STATE_REFRESH', 'REQUEST_DEVICE_HANDOFF_SUMMARY', 'REQUEST_CONTINUITY_REPORT'],
  APPROVAL_CONTEXT: ['RESUME_APPROVAL_CONTEXT', 'REQUEST_CLOUD_STATE_REFRESH', 'REQUEST_DEVICE_HANDOFF_SUMMARY', 'REQUEST_CONTINUITY_REPORT'],
  PREVIEW_CONTEXT: ['RESUME_PREVIEW_CONTEXT', 'REQUEST_CLOUD_STATE_REFRESH', 'REQUEST_DEVICE_HANDOFF_SUMMARY', 'REQUEST_CONTINUITY_REPORT'],
  OPERATOR_FEED_CONTEXT: ['RESUME_OPERATOR_FEED_CONTEXT', 'REQUEST_CLOUD_STATE_REFRESH', 'REQUEST_DEVICE_HANDOFF_SUMMARY', 'REQUEST_CONTINUITY_REPORT'],
  BUILD_PROGRESS_CONTEXT: ['RESUME_BUILD_PROGRESS_CONTEXT', 'REQUEST_CLOUD_STATE_REFRESH', 'REQUEST_DEVICE_HANDOFF_SUMMARY', 'REQUEST_CONTINUITY_REPORT'],
  FULL_COMMAND_CONTEXT: [...KNOWN_CONTINUITY_CAPABILITIES],
  UNKNOWN: [],
};
