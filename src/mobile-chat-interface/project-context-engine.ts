/**
 * Project context engine — evaluates project context for mobile chat messages.
 * Foundation only. No execution or project state mutation.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type {
  ConversationMode,
  GateRecord,
  MobileChatInput,
  ProjectContextStatus,
} from './types.js';

export interface ProjectContextResult {
  status: ProjectContextStatus;
  reason: string;
  gates: GateRecord[];
  effectiveProjectId: string;
  effectiveWorkspaceId: string;
}

export function evaluateProjectContext(input: MobileChatInput): ProjectContextResult {
  const gates: GateRecord[] = [];
  const normalizedProjectId = input.projectId ? normalizeProjectId(input.projectId) : '';
  const selectedProjectId = input.selectedProjectId
    ? normalizeProjectId(input.selectedProjectId)
    : '';

  if (input.conversationMode === 'NEW_PROJECT') {
    if (!input.messageText?.trim()) {
      gates.push({
        gateId: 'ctx-vision-0001',
        gateType: 'PROJECT_VISION',
        status: 'CLOSED',
        description: 'Project vision required for NEW_PROJECT mode',
      });
      return {
        status: 'PROJECT_CREATION_REQUIRED',
        reason: 'Project vision required',
        gates,
        effectiveProjectId: '',
        effectiveWorkspaceId: '',
      };
    }
    if (input.worldTarget === 'UNKNOWN') {
      gates.push({
        gateId: 'ctx-world-0001',
        gateType: 'WORLD_TARGET',
        status: 'CLOSED',
        description: 'worldTarget UNKNOWN blocked for project creation',
      });
      return {
        status: 'PROJECT_CONTEXT_BLOCKED',
        reason: 'worldTarget UNKNOWN blocked for project creation',
        gates,
        effectiveProjectId: '',
        effectiveWorkspaceId: '',
      };
    }
    gates.push({
      gateId: 'ctx-create-0001',
      gateType: 'PROJECT_CREATION',
      status: 'REQUIRED',
      description: 'Project creation request required',
    });
    return {
      status: 'PROJECT_CREATION_REQUIRED',
      reason: 'No project exists — creation request required',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: '',
    };
  }

  if (input.conversationMode === 'PROJECT_SWITCH') {
    if (!selectedProjectId && !input.targetProjectId) {
      gates.push({
        gateId: 'ctx-switch-0001',
        gateType: 'PROJECT_SELECTION',
        status: 'REQUIRED',
        description: 'Target project required for PROJECT_SWITCH',
      });
      return {
        status: 'PROJECT_SELECTION_REQUIRED',
        reason: 'Project selection required for switch',
        gates,
        effectiveProjectId: normalizedProjectId,
        effectiveWorkspaceId: input.workspaceId,
      };
    }
    gates.push({
      gateId: 'ctx-switch-0002',
      gateType: 'PROJECT_SWITCH',
      status: 'OPEN',
      description: 'Project switch request only — no state mutation',
    });
    return {
      status: 'PROJECT_CONTEXT_READY',
      reason: 'Project switch context ready',
      gates,
      effectiveProjectId: selectedProjectId || normalizeProjectId(input.targetProjectId ?? ''),
      effectiveWorkspaceId: input.workspaceId,
    };
  }

  if (input.conversationMode === 'EXISTING_PROJECT' || input.conversationMode === 'PROJECT_CONTINUATION') {
    if (!input.workspaceId?.trim() || !normalizedProjectId) {
      gates.push({
        gateId: 'ctx-existing-0001',
        gateType: 'PROJECT_CONTEXT',
        status: 'CLOSED',
        description: 'workspaceId and projectId required for existing project',
      });
      return {
        status: 'PROJECT_CONTEXT_INVALID',
        reason: 'workspaceId and projectId required',
        gates,
        effectiveProjectId: '',
        effectiveWorkspaceId: '',
      };
    }

    const foundation = getDevPulseV2World2WorkspaceFoundation();
    const workspace = foundation.getManager().getWorkspace(input.workspaceId);

    if (!workspace) {
      gates.push({
        gateId: 'ctx-ws-0001',
        gateType: 'WORKSPACE_OWNERSHIP',
        status: 'CLOSED',
        description: `Workspace not found: ${input.workspaceId}`,
      });
      return {
        status: 'PROJECT_CONTEXT_INVALID',
        reason: 'Workspace not found',
        gates,
        effectiveProjectId: '',
        effectiveWorkspaceId: '',
      };
    }

    if (workspace.projectId !== normalizedProjectId) {
      gates.push({
        gateId: 'ctx-proj-0001',
        gateType: 'PROJECT_OWNERSHIP',
        status: 'CLOSED',
        description: 'projectId does not match workspace ownership',
      });
      return {
        status: 'PROJECT_CONTEXT_INVALID',
        reason: 'projectId does not match workspace',
        gates,
        effectiveProjectId: '',
        effectiveWorkspaceId: '',
      };
    }

    if (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) {
      const target = foundation.getManager().getWorkspace(input.targetWorkspaceId);
      const crossCheck = checkCrossWorkspaceAccess(input.workspaceId, target);
      if (!crossCheck.allowed) {
        gates.push({
          gateId: 'ctx-cross-0001',
          gateType: 'CROSS_WORKSPACE',
          status: 'CLOSED',
          description: crossCheck.reason,
        });
        return {
          status: 'PROJECT_CONTEXT_BLOCKED',
          reason: crossCheck.reason,
          gates,
          effectiveProjectId: '',
          effectiveWorkspaceId: '',
        };
      }
    }

    if (selectedProjectId && selectedProjectId !== normalizedProjectId) {
      gates.push({
        gateId: 'ctx-select-0001',
        gateType: 'PROJECT_SELECTION',
        status: 'REQUIRED',
        description: 'Multiple projects — selection required',
      });
      return {
        status: 'PROJECT_SELECTION_REQUIRED',
        reason: 'Project selection required',
        gates,
        effectiveProjectId: normalizedProjectId,
        effectiveWorkspaceId: input.workspaceId,
      };
    }

    gates.push({
      gateId: 'ctx-ready-0001',
      gateType: 'PROJECT_CONTEXT',
      status: 'OPEN',
      description: `Project context ready: ${normalizedProjectId}`,
    });
    return {
      status: 'PROJECT_CONTEXT_READY',
      reason: 'Existing project context ready',
      gates,
      effectiveProjectId: normalizedProjectId,
      effectiveWorkspaceId: input.workspaceId,
    };
  }

  if (!normalizedProjectId && !input.projectCreationRequestId) {
    gates.push({
      gateId: 'ctx-unknown-0001',
      gateType: 'PROJECT_CONTEXT',
      status: 'REQUIRED',
      description: 'No project context — creation or selection required',
    });
    return {
      status: 'PROJECT_CREATION_REQUIRED',
      reason: 'No project context',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: input.workspaceId,
    };
  }

  gates.push({
    gateId: 'ctx-default-0001',
    gateType: 'PROJECT_CONTEXT',
    status: 'OPEN',
    description: 'Default project context evaluated',
  });
  return {
    status: 'PROJECT_CONTEXT_READY',
    reason: 'Project context evaluated',
    gates,
    effectiveProjectId: normalizedProjectId,
    effectiveWorkspaceId: input.workspaceId,
  };
}

export function projectContextKey(status: ProjectContextStatus, projectId: string): string {
  return `${status}|${projectId}`;
}

export function inferConversationMode(input: MobileChatInput): ConversationMode {
  if (input.conversationMode !== 'UNKNOWN') return input.conversationMode;
  const text = input.messageText.toLowerCase();
  if (text.includes('new project') || text.includes('create project')) return 'NEW_PROJECT';
  if (text.includes('switch project') || text.includes('switch to')) return 'PROJECT_SWITCH';
  if (text.includes('continue') || text.includes('resume')) return 'PROJECT_CONTINUATION';
  if (input.projectId && input.workspaceId) return 'EXISTING_PROJECT';
  return 'UNKNOWN';
}
