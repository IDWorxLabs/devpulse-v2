/**
 * Project switch request engine — creates project switch requests only.
 * No project state mutation in this phase.
 */

import type { MobileChatInput, ProjectSwitchRequest } from './types.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';

let switchCounter = 0;

export function resetProjectSwitchCounterForTests(): void {
  switchCounter = 0;
}

function createSwitchId(): string {
  switchCounter += 1;
  return `proj-switch-req-${switchCounter.toString().padStart(4, '0')}`;
}

export function createProjectSwitchRequest(
  input: MobileChatInput,
  effectiveProjectId: string,
): ProjectSwitchRequest | null {
  if (input.conversationMode !== 'PROJECT_SWITCH') return null;

  const toProjectId = input.selectedProjectId
    ? normalizeProjectId(input.selectedProjectId)
    : input.targetProjectId
      ? normalizeProjectId(input.targetProjectId)
      : '';

  if (!toProjectId) {
    return {
      switchRequestId: createSwitchId(),
      userId: input.userId,
      mobileSessionId: input.mobileSessionId,
      cloudSessionId: input.cloudSessionId,
      fromProjectId: normalizeProjectId(input.projectId),
      toProjectId: '',
      sourceMessageId: input.messageId,
      status: 'BLOCKED',
    };
  }

  return {
    switchRequestId: createSwitchId(),
    userId: input.userId,
    mobileSessionId: input.mobileSessionId,
    cloudSessionId: input.cloudSessionId,
    fromProjectId: normalizeProjectId(input.projectId) || effectiveProjectId,
    toProjectId,
    sourceMessageId: input.messageId,
    status: 'REQUEST_CREATED',
  };
}

export function projectSwitchKey(req: ProjectSwitchRequest | null): string {
  if (!req) return 'none';
  return `${req.status}|${req.toProjectId}`;
}
