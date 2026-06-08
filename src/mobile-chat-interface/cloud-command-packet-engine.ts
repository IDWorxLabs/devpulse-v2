/**
 * Cloud command packet engine — creates safe cloud command packets only.
 * No execution. Packets are intent-only for AiDev Engine.
 */

import type {
  CloudCommandPacket,
  GovernanceStatus,
  MessageIntent,
  MobileChatInput,
  ProjectCreationRequest,
  SafeCommandType,
  WorldTarget,
} from './types.js';

let packetCounter = 0;
let aiDevPacketCounter = 0;

export function resetCloudPacketCounterForTests(): void {
  packetCounter = 0;
  aiDevPacketCounter = 0;
}

function createPacketId(): string {
  packetCounter += 1;
  return `cloud-cmd-pkt-${packetCounter.toString().padStart(4, '0')}`;
}

function createAiDevPacketId(): string {
  aiDevPacketCounter += 1;
  return `aidev-conv-pkt-${aiDevPacketCounter.toString().padStart(4, '0')}`;
}

export function mapIntentToSafeCommandType(intent: MessageIntent): SafeCommandType {
  const mapping: Partial<Record<MessageIntent, SafeCommandType>> = {
    CREATE_PROJECT: 'PROJECT_CREATION_REQUEST',
    START_WORLD1_PROJECT: 'PROJECT_CREATION_REQUEST',
    START_WORLD2_PROJECT: 'PROJECT_CREATION_REQUEST',
    SEND_PROJECT_VISION: 'PROJECT_CREATION_REQUEST',
    CONTINUE_PROJECT: 'PROJECT_CONTEXT_UPDATE_REQUEST',
    SWITCH_PROJECT: 'PROJECT_SWITCH_REQUEST',
    ASK_PROJECT_STATUS: 'PROJECT_STATUS_REQUEST',
    SEND_BUILD_INSTRUCTION: 'BUILD_INSTRUCTION_REQUEST',
    REQUEST_LIVE_PREVIEW_SUMMARY: 'LIVE_PREVIEW_SUMMARY_REQUEST',
    REQUEST_OPERATOR_FEED_SUMMARY: 'OPERATOR_FEED_SUMMARY_REQUEST',
    REQUEST_APPROVALS: 'APPROVALS_VIEW_REQUEST',
    ANSWER_NOTIFICATION: 'NOTIFICATION_ANSWER_REQUEST',
  };
  return mapping[intent] ?? 'PROJECT_CONTEXT_UPDATE_REQUEST';
}

export function createCloudCommandPacket(
  input: MobileChatInput,
  intent: MessageIntent,
  worldTarget: WorldTarget,
  projectId: string,
  creationRequest: ProjectCreationRequest | null,
  governanceStatus: GovernanceStatus,
): CloudCommandPacket {
  const requiresApproval =
    intent === 'REQUEST_APPROVALS' ||
    intent === 'SEND_BUILD_INSTRUCTION' ||
    governanceStatus === 'PENDING';

  return {
    cloudCommandPacketId: createPacketId(),
    mobileSessionId: input.mobileSessionId,
    cloudSessionId: input.cloudSessionId,
    conversationId: input.conversationId,
    projectId,
    projectCreationRequestId: creationRequest?.projectCreationRequestId ?? input.projectCreationRequestId,
    worldTarget,
    messageIntent: intent,
    safeCommandType: mapIntentToSafeCommandType(intent),
    payloadSummary: input.messageText.slice(0, 200),
    requiresApproval,
    governanceStatus,
  };
}

export function createAiDevConversationPacket(
  input: MobileChatInput,
  intent: MessageIntent,
  worldTarget: WorldTarget,
  projectId: string,
  creationRequest: ProjectCreationRequest | null,
) {
  return {
    packetId: createAiDevPacketId(),
    mobileSessionId: input.mobileSessionId,
    cloudSessionId: input.cloudSessionId,
    conversationId: input.conversationId,
    projectId,
    projectCreationRequestId: creationRequest?.projectCreationRequestId ?? input.projectCreationRequestId,
    worldTarget,
    messageIntent: intent,
    messageSummary: input.messageText.slice(0, 200),
    intentOnly: true as const,
    executed: false as const,
  };
}

export function cloudPacketKey(packet: CloudCommandPacket | null): string {
  if (!packet) return 'none';
  return `${packet.safeCommandType}|${packet.messageIntent}|${packet.requiresApproval}`;
}
