/**
 * Project creation request engine — creates project creation requests only.
 * No execution, no project state mutation.
 */

import type {
  MessageIntent,
  MobileChatInput,
  ProjectCreationRequest,
  ProjectCreationStatus,
  WorldTarget,
} from './types.js';
import { isWorldTargetValidForCreation } from './world-target-classifier.js';

let creationCounter = 0;

export function resetProjectCreationCounterForTests(): void {
  creationCounter = 0;
}

function createRequestId(): string {
  creationCounter += 1;
  return `proj-create-req-${creationCounter.toString().padStart(4, '0')}`;
}

export function createProjectCreationRequest(
  input: MobileChatInput,
  intent: MessageIntent,
  worldTarget: WorldTarget,
): ProjectCreationRequest | null {
  const creationIntents: MessageIntent[] = [
    'CREATE_PROJECT',
    'START_WORLD1_PROJECT',
    'START_WORLD2_PROJECT',
    'SEND_PROJECT_VISION',
  ];

  if (!creationIntents.includes(intent) && input.conversationMode !== 'NEW_PROJECT') {
    return null;
  }

  let effectiveTarget = worldTarget;
  if (intent === 'START_WORLD1_PROJECT') effectiveTarget = 'WORLD_1';
  if (intent === 'START_WORLD2_PROJECT') effectiveTarget = 'WORLD_2';

  if (!isWorldTargetValidForCreation(effectiveTarget)) {
    if (effectiveTarget === 'AUTO_SELECT') {
      return {
        projectCreationRequestId: createRequestId(),
        userId: input.userId,
        mobileSessionId: input.mobileSessionId,
        cloudSessionId: input.cloudSessionId,
        projectVision: input.messageText,
        worldTarget: 'AUTO_SELECT',
        requestedProjectMode: 'START_WORLD2',
        sourceMessageId: input.messageId,
        status: 'NEEDS_WORLD_TARGET',
      };
    }
    return {
      projectCreationRequestId: createRequestId(),
      userId: input.userId,
      mobileSessionId: input.mobileSessionId,
      cloudSessionId: input.cloudSessionId,
      projectVision: input.messageText,
      worldTarget: effectiveTarget,
      requestedProjectMode: 'START_WORLD2',
      sourceMessageId: input.messageId,
      status: 'BLOCKED',
    };
  }

  if (!input.messageText?.trim() || input.messageText.trim().length < 10) {
    return {
      projectCreationRequestId: createRequestId(),
      userId: input.userId,
      mobileSessionId: input.mobileSessionId,
      cloudSessionId: input.cloudSessionId,
      projectVision: input.messageText,
      worldTarget: effectiveTarget,
      requestedProjectMode: effectiveTarget === 'WORLD_1' ? 'START_WORLD1' : 'START_WORLD2',
      sourceMessageId: input.messageId,
      status: 'NEEDS_MORE_DETAIL',
    };
  }

  const status: ProjectCreationStatus = 'REQUEST_CREATED';
  return {
    projectCreationRequestId: createRequestId(),
    userId: input.userId,
    mobileSessionId: input.mobileSessionId,
    cloudSessionId: input.cloudSessionId,
    projectVision: input.messageText,
    worldTarget: effectiveTarget,
    requestedProjectMode: effectiveTarget === 'WORLD_1' ? 'START_WORLD1' : 'START_WORLD2',
    sourceMessageId: input.messageId,
    status,
  };
}

export function projectCreationKey(req: ProjectCreationRequest | null): string {
  if (!req) return 'none';
  return `${req.status}|${req.worldTarget}|${req.requestedProjectMode}`;
}
