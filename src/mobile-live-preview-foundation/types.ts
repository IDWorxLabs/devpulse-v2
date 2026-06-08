/** DevPulse V2 Phase 8.3 Mobile Live Preview Foundation — types. */

import type {
  AuthStatus,
  CloudConnectionStatus,
  DeviceType,
  GovernanceStatus,
  NetworkStatus,
  Platform,
} from '../mobile-command-foundation/types.js';

export type { AuthStatus, CloudConnectionStatus, DeviceType, GovernanceStatus, NetworkStatus, Platform };

export type PreviewTarget =
  | 'PROJECT_OVERVIEW'
  | 'MOBILE_APP'
  | 'WEB_APP'
  | 'DESKTOP_APP'
  | 'BACKEND_API'
  | 'SYSTEM_TOPOLOGY'
  | 'BUILD_PROGRESS'
  | 'UNKNOWN';

export type PreviewType =
  | 'SUMMARY_ONLY'
  | 'STATIC_SNAPSHOT'
  | 'RESPONSIVE_SCREEN_SUMMARY'
  | 'LIVE_STREAM_SUMMARY'
  | 'DESKTOP_REQUIRED_NOTICE'
  | 'UNAVAILABLE';

export type PreviewSourceStatus =
  | 'AVAILABLE'
  | 'BUILDING'
  | 'NOT_CREATED'
  | 'FAILED'
  | 'STALE'
  | 'UNKNOWN';

export type PreviewCapability =
  | 'VIEW_PREVIEW_SUMMARY'
  | 'VIEW_STATIC_SNAPSHOT'
  | 'VIEW_RESPONSIVE_SUMMARY'
  | 'VIEW_BUILD_PROGRESS_PREVIEW'
  | 'VIEW_SYSTEM_TOPOLOGY_SUMMARY'
  | 'REQUEST_DESKTOP_PREVIEW_NOTICE'
  | 'REQUEST_PREVIEW_REFRESH'
  | 'VIEW_PREVIEW_WARNINGS';

export type PreviewState =
  | 'PREVIEW_REQUEST_RECEIVED'
  | 'MOBILE_SESSION_VALIDATED'
  | 'CHAT_CONTEXT_VALIDATED'
  | 'CLOUD_SESSION_VALIDATED'
  | 'PROJECT_CONTEXT_VALIDATED'
  | 'PREVIEW_SOURCE_EVALUATED'
  | 'DEVICE_SUITABILITY_EVALUATED'
  | 'PREVIEW_ACCESS_CLASSIFIED'
  | 'PREVIEW_PACKET_CREATED'
  | 'PREVIEW_READY'
  | 'PREVIEW_BLOCKED';

export type PreviewReadiness =
  | 'NOT_READY'
  | 'NEEDS_AUTH'
  | 'NEEDS_CLOUD_CONNECTION'
  | 'NEEDS_MOBILE_SESSION'
  | 'NEEDS_CHAT_CONTEXT'
  | 'NEEDS_PROJECT_CONTEXT'
  | 'PREVIEW_UNAVAILABLE'
  | 'DESKTOP_REQUIRED'
  | 'READY_SUMMARY_ONLY'
  | 'READY_MOBILE_SAFE_PREVIEW';

export interface PreviewSessionInput {
  previewSessionId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  userId: string;
  deviceId: string;
  workspaceId: string;
  projectId: string;
  previewRequestId: string;
  previewTarget: PreviewTarget;
  previewType: PreviewType;
  previewSourceStatus: PreviewSourceStatus;
  deviceType: DeviceType;
  platform: Platform;
  networkStatus: NetworkStatus;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
  cloudConnectionStatus: CloudConnectionStatus;
  requestedPreviewCapabilities: string[];
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

export interface PreviewSummaryPacket {
  summaryId: string;
  previewSessionId: string;
  previewTarget: PreviewTarget;
  previewType: PreviewType;
  summaryText: string;
  sourceOfTruth: 'CLOUD_WORKSPACE';
  viewerOnly: true;
  executed: false;
}

export interface MobilePreviewConfirmation {
  mobileLivePreviewFoundationOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noApprovalSelfGranted: true;
  noPreviewSourceOfTruthClaim: true;
}

export interface MobilePreviewResult {
  mobilePreviewPacketId: string;
  previewSessionId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  userId: string;
  workspaceId: string;
  projectId: string;
  previewRequestId: string;
  previewState: PreviewState;
  previewReadiness: PreviewReadiness;
  previewTarget: PreviewTarget;
  previewType: PreviewType;
  previewSourceStatus: PreviewSourceStatus;
  allowedPreviewCapabilities: CapabilityClassification[];
  blockedPreviewCapabilities: CapabilityClassification[];
  desktopRequired: boolean;
  mobileSafe: boolean;
  previewSummary: string;
  previewWarnings: string[];
  previewAccessGates: GateRecord[];
  deviceSuitabilityGates: GateRecord[];
  cloudGates: GateRecord[];
  projectContextGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: MobilePreviewConfirmation;
  stateSequence: PreviewState[];
  createdAt: number;
}

export interface MobileLivePreviewFoundationState {
  foundationId: string;
  previewPacketCount: number;
  warnings: string[];
  errors: string[];
}

export interface MobilePreviewReport {
  ownerModule: string;
  mobilePreviewPacketId: string;
  previewSessionId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  userId: string;
  workspaceId: string;
  projectId: string;
  previewRequestId: string;
  previewState: PreviewState;
  previewReadiness: PreviewReadiness;
  previewTarget: PreviewTarget;
  previewType: PreviewType;
  previewSourceStatus: PreviewSourceStatus;
  desktopRequired: boolean;
  mobileSafe: boolean;
  allowedPreviewCapabilityCount: number;
  blockedPreviewCapabilityCount: number;
  previewWarningCount: number;
  previewAccessGateCount: number;
  deviceSuitabilityGateCount: number;
  cloudGateCount: number;
  projectContextGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: MobilePreviewConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE =
  'devpulse_v2_mobile_live_preview_foundation';
export const MOBILE_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_MOBILE_LIVE_PREVIEW_FOUNDATION_V1_PASS';

export const PREVIEW_STATE_SEQUENCE: readonly PreviewState[] = [
  'PREVIEW_REQUEST_RECEIVED',
  'MOBILE_SESSION_VALIDATED',
  'CHAT_CONTEXT_VALIDATED',
  'CLOUD_SESSION_VALIDATED',
  'PROJECT_CONTEXT_VALIDATED',
  'PREVIEW_SOURCE_EVALUATED',
  'DEVICE_SUITABILITY_EVALUATED',
  'PREVIEW_ACCESS_CLASSIFIED',
  'PREVIEW_PACKET_CREATED',
  'PREVIEW_READY',
] as const;

export const KNOWN_PREVIEW_CAPABILITIES: readonly PreviewCapability[] = [
  'VIEW_PREVIEW_SUMMARY',
  'VIEW_STATIC_SNAPSHOT',
  'VIEW_RESPONSIVE_SUMMARY',
  'VIEW_BUILD_PROGRESS_PREVIEW',
  'VIEW_SYSTEM_TOPOLOGY_SUMMARY',
  'REQUEST_DESKTOP_PREVIEW_NOTICE',
  'REQUEST_PREVIEW_REFRESH',
  'VIEW_PREVIEW_WARNINGS',
] as const;

export const MOBILE_SUITABLE_TARGETS: readonly PreviewTarget[] = [
  'PROJECT_OVERVIEW',
  'MOBILE_APP',
  'BUILD_PROGRESS',
  'SYSTEM_TOPOLOGY',
  'BACKEND_API',
] as const;

export const DESKTOP_REQUIRED_TARGETS: readonly PreviewTarget[] = [
  'DESKTOP_APP',
] as const;

export const EXECUTION_BLOCKED_CAPABILITIES = [
  'EXECUTE_PREVIEW',
  'RUN_PREVIEW_BUILD',
  'START_SERVER',
  'OPEN_BROWSER',
] as const;

export const FILE_MOD_BLOCKED_CAPABILITIES = [
  'MODIFY_FILES',
  'WRITE_FILES',
  'DELETE_FILES',
] as const;

export const CODE_GEN_BLOCKED_CAPABILITIES = [
  'GENERATE_CODE',
  'WRITE_CODE',
] as const;

export const DEPLOY_BLOCKED_CAPABILITIES = [
  'DEPLOY',
  'DEPLOY_PREVIEW',
] as const;

export const PREVIEW_READINESS_LEVELS: readonly PreviewReadiness[] = [
  'NOT_READY',
  'NEEDS_AUTH',
  'NEEDS_CLOUD_CONNECTION',
  'NEEDS_MOBILE_SESSION',
  'NEEDS_CHAT_CONTEXT',
  'NEEDS_PROJECT_CONTEXT',
  'PREVIEW_UNAVAILABLE',
  'DESKTOP_REQUIRED',
  'READY_SUMMARY_ONLY',
  'READY_MOBILE_SAFE_PREVIEW',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'mobile_command_foundation',
  'mobile_chat_interface',
  'world2_workspace_foundation',
  'controlled_execution_bridge',
  'execution_evidence_ledger',
  'verification_gated_apply',
  'founder_approval_execution_gate',
  'execution_authority',
] as const;

export const DUPLICATE_PATTERNS = [
  'mobile_live_preview_foundation',
  'mobile_live_preview',
  'mobile_preview_session',
  'remote_preview_viewer',
  'preview_access_classifier',
  'preview_mobile_viewer',
] as const;
