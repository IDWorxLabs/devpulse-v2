/** DevPulse V2 Phase 8.2 Mobile Chat Interface Foundation — types. */

import type {
  AuthStatus,
  CloudConnectionStatus,
  GovernanceStatus,
} from '../mobile-command-foundation/types.js';

export type { AuthStatus, CloudConnectionStatus, GovernanceStatus };

export type WorldTarget = 'WORLD_1' | 'WORLD_2' | 'AUTO_SELECT' | 'UNKNOWN';

export type ConversationMode =
  | 'NEW_PROJECT'
  | 'EXISTING_PROJECT'
  | 'PROJECT_SWITCH'
  | 'PROJECT_CONTINUATION'
  | 'APPROVAL_CONTEXT'
  | 'STATUS_CONTEXT'
  | 'UNKNOWN';

export type MessageIntent =
  | 'CREATE_PROJECT'
  | 'START_WORLD1_PROJECT'
  | 'START_WORLD2_PROJECT'
  | 'CONTINUE_PROJECT'
  | 'SWITCH_PROJECT'
  | 'ASK_PROJECT_STATUS'
  | 'SEND_BUILD_INSTRUCTION'
  | 'SEND_PROJECT_VISION'
  | 'REQUEST_LIVE_PREVIEW_SUMMARY'
  | 'REQUEST_OPERATOR_FEED_SUMMARY'
  | 'REQUEST_APPROVALS'
  | 'ANSWER_NOTIFICATION'
  | 'UNKNOWN';

export type ChatState =
  | 'CHAT_REQUEST_RECEIVED'
  | 'MOBILE_SESSION_VALIDATED'
  | 'CLOUD_SESSION_VALIDATED'
  | 'PROJECT_CONTEXT_EVALUATED'
  | 'WORLD_TARGET_CLASSIFIED'
  | 'MESSAGE_INTENT_CLASSIFIED'
  | 'CONVERSATION_PACKET_CREATED'
  | 'PROJECT_CREATION_REQUEST_CREATED'
  | 'PROJECT_SWITCH_REQUEST_CREATED'
  | 'CHAT_READY'
  | 'CHAT_BLOCKED';

export type ProjectContextStatus =
  | 'PROJECT_CONTEXT_READY'
  | 'PROJECT_CREATION_REQUIRED'
  | 'PROJECT_SELECTION_REQUIRED'
  | 'PROJECT_CONTEXT_INVALID'
  | 'PROJECT_CONTEXT_BLOCKED';

export type ChatReadiness =
  | 'NOT_READY'
  | 'NEEDS_AUTH'
  | 'NEEDS_CLOUD_CONNECTION'
  | 'NEEDS_MOBILE_SESSION'
  | 'NEEDS_PROJECT_CONTEXT'
  | 'NEEDS_PROJECT_SELECTION'
  | 'READY_PROJECT_CREATION'
  | 'READY_PROJECT_COMMAND';

export type ProjectCreationStatus =
  | 'REQUEST_CREATED'
  | 'NEEDS_WORLD_TARGET'
  | 'NEEDS_MORE_DETAIL'
  | 'BLOCKED';

export type SafeCommandType =
  | 'PROJECT_CREATION_REQUEST'
  | 'PROJECT_CONTEXT_UPDATE_REQUEST'
  | 'PROJECT_SWITCH_REQUEST'
  | 'PROJECT_STATUS_REQUEST'
  | 'OPERATOR_FEED_SUMMARY_REQUEST'
  | 'LIVE_PREVIEW_SUMMARY_REQUEST'
  | 'APPROVALS_VIEW_REQUEST'
  | 'NOTIFICATION_ANSWER_REQUEST'
  | 'BUILD_INSTRUCTION_REQUEST';

export interface MobileChatInput {
  mobileSessionId: string;
  cloudSessionId: string;
  userId: string;
  deviceId: string;
  workspaceId: string;
  projectId: string;
  conversationId: string;
  messageId: string;
  messageText: string;
  worldTarget: WorldTarget;
  selectedProjectId: string;
  projectCreationRequestId: string;
  conversationMode: ConversationMode;
  requestedAction: string;
  timestamp: number;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
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

export interface ProjectCreationRequest {
  projectCreationRequestId: string;
  userId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  projectVision: string;
  worldTarget: WorldTarget;
  requestedProjectMode: 'START_WORLD1' | 'START_WORLD2';
  sourceMessageId: string;
  status: ProjectCreationStatus;
}

export interface ProjectSwitchRequest {
  switchRequestId: string;
  userId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  fromProjectId: string;
  toProjectId: string;
  sourceMessageId: string;
  status: 'REQUEST_CREATED' | 'BLOCKED';
}

export interface CloudCommandPacket {
  cloudCommandPacketId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  projectId: string;
  projectCreationRequestId: string;
  worldTarget: WorldTarget;
  messageIntent: MessageIntent;
  safeCommandType: SafeCommandType;
  payloadSummary: string;
  requiresApproval: boolean;
  governanceStatus: GovernanceStatus;
}

export interface AiDevConversationPacket {
  packetId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  conversationId: string;
  projectId: string;
  projectCreationRequestId: string;
  worldTarget: WorldTarget;
  messageIntent: MessageIntent;
  messageSummary: string;
  intentOnly: true;
  executed: false;
}

export interface MobileChatConfirmation {
  mobileChatFoundationOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noApprovalSelfGranted: true;
}

export interface MobileChatResult {
  chatPacketId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  userId: string;
  workspaceId: string;
  projectId: string;
  conversationId: string;
  messageId: string;
  chatState: ChatState;
  worldTarget: WorldTarget;
  messageIntent: MessageIntent;
  conversationMode: ConversationMode;
  projectContextStatus: ProjectContextStatus;
  chatReadiness: ChatReadiness;
  projectCreationRequestId: string;
  projectCreationRequest: ProjectCreationRequest | null;
  projectSwitchRequest: ProjectSwitchRequest | null;
  aiDevConversationPacket: AiDevConversationPacket | null;
  cloudCommandPacket: CloudCommandPacket | null;
  blockedReason: string;
  ownershipGates: GateRecord[];
  governanceGates: GateRecord[];
  cloudGates: GateRecord[];
  projectContextGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: MobileChatConfirmation;
  stateSequence: ChatState[];
  createdAt: number;
}

export interface MobileChatInterfaceState {
  foundationId: string;
  chatPacketCount: number;
  warnings: string[];
  errors: string[];
}

export interface MobileChatReport {
  ownerModule: string;
  chatPacketId: string;
  mobileSessionId: string;
  cloudSessionId: string;
  userId: string;
  workspaceId: string;
  projectId: string;
  conversationId: string;
  messageId: string;
  chatState: ChatState;
  chatReadiness: ChatReadiness;
  worldTarget: WorldTarget;
  messageIntent: MessageIntent;
  conversationMode: ConversationMode;
  projectContextStatus: ProjectContextStatus;
  projectCreationRequestId: string;
  cloudCommandPacketId: string;
  ownershipGateCount: number;
  governanceGateCount: number;
  cloudGateCount: number;
  projectContextGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: MobileChatConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const MOBILE_CHAT_INTERFACE_OWNER_MODULE = 'devpulse_v2_mobile_chat_interface';
export const MOBILE_CHAT_INTERFACE_PASS_TOKEN =
  'DEVPULSE_V2_MOBILE_CHAT_INTERFACE_FOUNDATION_V1_PASS';

export const CHAT_STATE_SEQUENCE: readonly ChatState[] = [
  'CHAT_REQUEST_RECEIVED',
  'MOBILE_SESSION_VALIDATED',
  'CLOUD_SESSION_VALIDATED',
  'PROJECT_CONTEXT_EVALUATED',
  'WORLD_TARGET_CLASSIFIED',
  'MESSAGE_INTENT_CLASSIFIED',
  'CONVERSATION_PACKET_CREATED',
  'CHAT_READY',
] as const;

export const KNOWN_MESSAGE_INTENTS: readonly MessageIntent[] = [
  'CREATE_PROJECT',
  'START_WORLD1_PROJECT',
  'START_WORLD2_PROJECT',
  'CONTINUE_PROJECT',
  'SWITCH_PROJECT',
  'ASK_PROJECT_STATUS',
  'SEND_BUILD_INSTRUCTION',
  'SEND_PROJECT_VISION',
  'REQUEST_LIVE_PREVIEW_SUMMARY',
  'REQUEST_OPERATOR_FEED_SUMMARY',
  'REQUEST_APPROVALS',
  'ANSWER_NOTIFICATION',
] as const;

export const CHAT_READINESS_LEVELS: readonly ChatReadiness[] = [
  'NOT_READY',
  'NEEDS_AUTH',
  'NEEDS_CLOUD_CONNECTION',
  'NEEDS_MOBILE_SESSION',
  'NEEDS_PROJECT_CONTEXT',
  'NEEDS_PROJECT_SELECTION',
  'READY_PROJECT_CREATION',
  'READY_PROJECT_COMMAND',
] as const;

export const SAFE_COMMAND_TYPES: readonly SafeCommandType[] = [
  'PROJECT_CREATION_REQUEST',
  'PROJECT_CONTEXT_UPDATE_REQUEST',
  'PROJECT_SWITCH_REQUEST',
  'PROJECT_STATUS_REQUEST',
  'OPERATOR_FEED_SUMMARY_REQUEST',
  'LIVE_PREVIEW_SUMMARY_REQUEST',
  'APPROVALS_VIEW_REQUEST',
  'NOTIFICATION_ANSWER_REQUEST',
  'BUILD_INSTRUCTION_REQUEST',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'mobile_command_foundation',
  'world2_workspace_foundation',
  'controlled_execution_bridge',
  'execution_evidence_ledger',
  'verification_gated_apply',
  'founder_approval_execution_gate',
  'execution_authority',
] as const;

export const DUPLICATE_PATTERNS = [
  'mobile_chat_interface',
  'mobile_conversation',
  'mobile_project_chat',
  'project_command_interface',
  'chat_project_router',
  'mobile_aidev_conversation',
] as const;

export const EXECUTION_BLOCKED_PATTERNS = [
  'execute command',
  'run command',
  'run build',
  'execute now',
  'deploy now',
  'deploy app',
] as const;

export const FILE_MOD_BLOCKED_PATTERNS = [
  'modify file',
  'write file',
  'delete file',
  'change file',
] as const;

export const CODE_GEN_BLOCKED_PATTERNS = [
  'generate code',
  'write code',
  'create code',
  'code generation',
] as const;

export const DEPLOY_BLOCKED_PATTERNS = [
  'deploy',
  'publish app',
  'release to production',
] as const;
