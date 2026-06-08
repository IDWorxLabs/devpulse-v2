/** DevPulse V2 Phase 8.1 Mobile Command Foundation — types. */

export type DeviceType = 'PHONE' | 'TABLET' | 'DESKTOP_BROWSER' | 'UNKNOWN';

export type Platform = 'ANDROID' | 'IOS' | 'WEB' | 'WINDOWS' | 'MACOS' | 'UNKNOWN';

export type ConnectionMode =
  | 'LOCAL_NETWORK'
  | 'CLOUD_RELAY'
  | 'MANUAL_CODE'
  | 'QR_PAIRING'
  | 'UNKNOWN';

export type CloudConnectionStatus =
  | 'CONNECTED'
  | 'CONNECTING'
  | 'DISCONNECTED'
  | 'DEGRADED';

export type AuthStatus = 'PASS' | 'FAIL';

export type GovernanceStatus = 'PASS' | 'FAIL' | 'PENDING';

export type NetworkStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';

export type MobileCapability =
  | 'CREATE_PROJECT_REQUEST'
  | 'START_WORLD1_PROJECT'
  | 'START_WORLD2_PROJECT'
  | 'SEND_PROJECT_VISION'
  | 'VIEW_PROJECT_STATUS'
  | 'VIEW_OPERATOR_FEED'
  | 'VIEW_NOTIFICATIONS'
  | 'VIEW_LIVE_PREVIEW_SUMMARY'
  | 'SEND_CHAT_INTENT'
  | 'REQUEST_APPROVAL_DECISION'
  | 'VIEW_APPROVAL_REQUESTS'
  | 'VIEW_BUILD_PROGRESS'
  | 'VIEW_WORKSPACE_SUMMARY';

export type SessionState =
  | 'SESSION_REQUEST_RECEIVED'
  | 'DEVICE_VALIDATED'
  | 'OWNERSHIP_VALIDATED'
  | 'GOVERNANCE_VALIDATED'
  | 'CLOUD_SESSION_VALIDATED'
  | 'CAPABILITIES_EVALUATED'
  | 'SESSION_READY'
  | 'SESSION_BLOCKED'
  | 'SESSION_REVOKED';

export type ConnectionReadiness =
  | 'NOT_READY'
  | 'NEEDS_AUTH'
  | 'NEEDS_OWNERSHIP'
  | 'NEEDS_GOVERNANCE'
  | 'NEEDS_CLOUD_CONNECTION'
  | 'READY_READ_ONLY'
  | 'READY_COMMAND_INTENT_ONLY';

export interface MobileSessionInput {
  deviceId: string;
  userId: string;
  sessionId: string;
  workspaceId: string;
  projectId: string;
  deviceType: DeviceType;
  deviceName: string;
  platform: Platform;
  connectionMode: ConnectionMode;
  requestedCapabilities: string[];
  networkStatus: NetworkStatus;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
  cloudSessionId: string;
  cloudWorkspaceId: string;
  cloudExecutionRegion: string;
  cloudConnectionStatus: CloudConnectionStatus;
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
  intentOnly: boolean;
}

export interface MobileCommandConfirmation {
  mobileCommandFoundationOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noApprovalSelfGranted: true;
}

export interface MobileSessionResult {
  mobileSessionId: string;
  cloudSessionId: string;
  deviceId: string;
  userId: string;
  workspaceId: string;
  projectId: string;
  sessionState: SessionState;
  allowedCapabilities: CapabilityClassification[];
  blockedCapabilities: CapabilityClassification[];
  connectionReadiness: ConnectionReadiness;
  cloudConnectionStatus: CloudConnectionStatus;
  cloudSessionReadiness: boolean;
  governanceGates: GateRecord[];
  ownershipGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: MobileCommandConfirmation;
  stateSequence: SessionState[];
  createdAt: number;
}

export interface MobileCommandFoundationState {
  foundationId: string;
  sessionCount: number;
  warnings: string[];
  errors: string[];
}

export interface MobileCommandReport {
  ownerModule: string;
  mobileSessionId: string;
  cloudSessionId: string;
  deviceId: string;
  userId: string;
  workspaceId: string;
  projectId: string;
  sessionState: SessionState;
  connectionReadiness: ConnectionReadiness;
  cloudConnectionStatus: CloudConnectionStatus;
  allowedCapabilityCount: number;
  blockedCapabilityCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: MobileCommandConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const MOBILE_COMMAND_FOUNDATION_OWNER_MODULE = 'devpulse_v2_mobile_command_foundation';
export const MOBILE_COMMAND_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_MOBILE_COMMAND_FOUNDATION_V1_PASS';

export const SESSION_STATE_SEQUENCE: readonly SessionState[] = [
  'SESSION_REQUEST_RECEIVED',
  'DEVICE_VALIDATED',
  'OWNERSHIP_VALIDATED',
  'GOVERNANCE_VALIDATED',
  'CLOUD_SESSION_VALIDATED',
  'CAPABILITIES_EVALUATED',
  'SESSION_READY',
] as const;

export const KNOWN_CAPABILITIES: readonly MobileCapability[] = [
  'CREATE_PROJECT_REQUEST',
  'START_WORLD1_PROJECT',
  'START_WORLD2_PROJECT',
  'SEND_PROJECT_VISION',
  'VIEW_PROJECT_STATUS',
  'VIEW_OPERATOR_FEED',
  'VIEW_NOTIFICATIONS',
  'VIEW_LIVE_PREVIEW_SUMMARY',
  'SEND_CHAT_INTENT',
  'REQUEST_APPROVAL_DECISION',
  'VIEW_APPROVAL_REQUESTS',
  'VIEW_BUILD_PROGRESS',
  'VIEW_WORKSPACE_SUMMARY',
] as const;

export const READ_ONLY_CAPABILITIES: readonly MobileCapability[] = [
  'VIEW_PROJECT_STATUS',
  'VIEW_OPERATOR_FEED',
  'VIEW_NOTIFICATIONS',
  'VIEW_LIVE_PREVIEW_SUMMARY',
  'VIEW_APPROVAL_REQUESTS',
  'VIEW_BUILD_PROGRESS',
  'VIEW_WORKSPACE_SUMMARY',
] as const;

export const COMMAND_INTENT_CAPABILITIES: readonly MobileCapability[] = [
  'CREATE_PROJECT_REQUEST',
  'START_WORLD1_PROJECT',
  'START_WORLD2_PROJECT',
  'SEND_PROJECT_VISION',
  'SEND_CHAT_INTENT',
  'REQUEST_APPROVAL_DECISION',
] as const;

export const APPROVAL_REQUIRED_CAPABILITIES: readonly MobileCapability[] = [
  'REQUEST_APPROVAL_DECISION',
  'START_WORLD1_PROJECT',
  'START_WORLD2_PROJECT',
] as const;

export const EXECUTION_BLOCKED_CAPABILITIES = [
  'EXECUTE_COMMAND',
  'RUN_BUILD',
  'EXECUTE_ACTION',
  'LOCAL_EXECUTION',
  'RUN_COMMAND',
] as const;

export const FILE_MOD_BLOCKED_CAPABILITIES = [
  'MODIFY_FILES',
  'WRITE_FILES',
  'DELETE_FILES',
  'FILE_MODIFICATION',
] as const;

export const CODE_GEN_BLOCKED_CAPABILITIES = [
  'GENERATE_CODE',
  'CODE_GENERATION',
  'WRITE_CODE',
] as const;

export const DEPLOY_BLOCKED_CAPABILITIES = [
  'DEPLOY_PROJECT',
  'DEPLOY_APPLICATION',
  'DEPLOY',
] as const;

export const CONNECTION_READINESS_LEVELS: readonly ConnectionReadiness[] = [
  'NOT_READY',
  'NEEDS_AUTH',
  'NEEDS_OWNERSHIP',
  'NEEDS_GOVERNANCE',
  'NEEDS_CLOUD_CONNECTION',
  'READY_READ_ONLY',
  'READY_COMMAND_INTENT_ONLY',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'world2_workspace_foundation',
  'controlled_execution_bridge',
  'execution_evidence_ledger',
  'verification_gated_apply',
  'founder_approval_execution_gate',
  'execution_authority',
] as const;

export const DUPLICATE_PATTERNS = [
  'mobile_command_foundation',
  'mobile_remote_control',
  'remote_command_center',
  'mobile_session_registry',
  'device_command_session',
] as const;

export const WORLD1_TARGET_PATTERNS = [
  'world1/',
  'governance/',
  'foundation/',
  'ownership-registry',
] as const;
