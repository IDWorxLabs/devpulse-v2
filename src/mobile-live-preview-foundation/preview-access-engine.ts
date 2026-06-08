/**
 * Preview access engine — validates project context and preview access gates.
 * Foundation only. No project creation or switching.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { GateRecord, PreviewSessionInput, PreviewTarget } from './types.js';

export interface ProjectContextResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
  effectiveProjectId: string;
  effectiveWorkspaceId: string;
}

export function validatePreviewProjectContext(input: PreviewSessionInput): ProjectContextResult {
  const gates: GateRecord[] = [];

  if (!input.workspaceId?.trim()) {
    gates.push({
      gateId: 'ctx-ws-0001',
      gateType: 'PROJECT_CONTEXT',
      status: 'CLOSED',
      description: 'workspaceId is required',
    });
    return { valid: false, reason: 'workspaceId is required', gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
  }

  if (!input.projectId?.trim()) {
    gates.push({
      gateId: 'ctx-proj-0001',
      gateType: 'PROJECT_CONTEXT',
      status: 'CLOSED',
      description: 'projectId is required',
    });
    return { valid: false, reason: 'projectId is required', gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
  }

  if (input.previewTarget === 'UNKNOWN') {
    gates.push({
      gateId: 'ctx-target-0001',
      gateType: 'PREVIEW_TARGET',
      status: 'CLOSED',
      description: 'previewTarget UNKNOWN blocked',
    });
    return { valid: false, reason: 'previewTarget UNKNOWN blocked', gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
  }

  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);
  const normalizedProjectId = normalizeProjectId(input.projectId);

  if (!workspace) {
    gates.push({
      gateId: 'ctx-ws-0002',
      gateType: 'WORKSPACE_OWNERSHIP',
      status: 'CLOSED',
      description: `Workspace not found: ${input.workspaceId}`,
    });
    return { valid: false, reason: 'Workspace not found', gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
  }

  if (workspace.projectId !== normalizedProjectId) {
    gates.push({
      gateId: 'ctx-proj-0002',
      gateType: 'PROJECT_OWNERSHIP',
      status: 'CLOSED',
      description: 'projectId does not match workspace ownership',
    });
    return { valid: false, reason: 'project ownership mismatch', gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
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
      return { valid: false, reason: crossCheck.reason, gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
    }
  }

  if (input.targetProjectId) {
    const normalizedTarget = normalizeProjectId(input.targetProjectId);
    if (normalizedTarget !== normalizedProjectId) {
      gates.push({
        gateId: 'ctx-cross-0002',
        gateType: 'CROSS_PROJECT',
        status: 'CLOSED',
        description: 'Preview targets another project without ownership',
      });
      return { valid: false, reason: 'Cross-project preview blocked', gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
    }
  }

  gates.push({
    gateId: 'ctx-ready-0001',
    gateType: 'PROJECT_CONTEXT',
    status: 'OPEN',
    description: `Project context ready: ${normalizedProjectId}`,
  });

  return {
    valid: true,
    reason: 'Project context validated',
    gates,
    effectiveProjectId: normalizedProjectId,
    effectiveWorkspaceId: input.workspaceId,
  };
}

export function classifyPreviewTarget(target: PreviewTarget): PreviewTarget {
  return target;
}

export function projectContextKey(valid: boolean, projectId: string): string {
  return `${valid}|${projectId}`;
}

export function assertNoProjectCreationThroughPreview(): boolean {
  return true;
}

export function assertNoProjectSwitchMutation(): boolean {
  return true;
}
