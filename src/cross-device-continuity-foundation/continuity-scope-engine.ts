/**
 * Continuity scope engine — classifies continuity scopes and validates project context.
 * Foundation only. Cloud workspace remains source of truth.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { ContinuityInput, ContinuityScope, GateRecord } from './types.js';
import { KNOWN_CONTINUITY_SCOPES } from './types.js';

export interface ScopeValidationResult {
  valid: boolean;
  continuityScope: ContinuityScope;
  reason: string;
  gates: GateRecord[];
  effectiveProjectId: string;
  effectiveWorkspaceId: string;
}

export function classifyContinuityScope(input: ContinuityInput): ScopeValidationResult {
  const gates: GateRecord[] = [];

  if (input.continuityScope === 'UNKNOWN') {
    gates.push({
      gateId: 'scope-type-0001',
      gateType: 'CONTINUITY_SCOPE',
      status: 'CLOSED',
      description: 'continuityScope UNKNOWN blocked',
    });
    return {
      valid: false,
      continuityScope: 'UNKNOWN',
      reason: 'continuityScope UNKNOWN blocked',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: '',
    };
  }

  if (!(KNOWN_CONTINUITY_SCOPES as readonly string[]).includes(input.continuityScope)) {
    gates.push({
      gateId: 'scope-type-0002',
      gateType: 'CONTINUITY_SCOPE',
      status: 'CLOSED',
      description: `Unknown continuity scope: ${input.continuityScope}`,
    });
    return {
      valid: false,
      continuityScope: input.continuityScope,
      reason: 'Unknown continuity scope',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: '',
    };
  }

  if (!input.workspaceId?.trim() || !input.projectId?.trim()) {
    gates.push({
      gateId: 'scope-ctx-0001',
      gateType: 'PROJECT_CONTEXT',
      status: 'CLOSED',
      description: 'workspaceId and projectId required',
    });
    return {
      valid: false,
      continuityScope: input.continuityScope,
      reason: 'Project context required',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: '',
    };
  }

  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);
  const normalizedProjectId = normalizeProjectId(input.projectId);

  if (!workspace) {
    gates.push({
      gateId: 'scope-ws-0001',
      gateType: 'WORKSPACE_OWNERSHIP',
      status: 'CLOSED',
      description: `Workspace not found: ${input.workspaceId}`,
    });
    return {
      valid: false,
      continuityScope: input.continuityScope,
      reason: 'Workspace not found',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: '',
    };
  }

  if (workspace.projectId !== normalizedProjectId) {
    gates.push({
      gateId: 'scope-proj-0001',
      gateType: 'PROJECT_OWNERSHIP',
      status: 'CLOSED',
      description: 'projectId does not match workspace ownership',
    });
    return {
      valid: false,
      continuityScope: input.continuityScope,
      reason: 'Project ownership mismatch',
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
        gateId: 'scope-cross-0001',
        gateType: 'CROSS_WORKSPACE',
        status: 'CLOSED',
        description: crossCheck.reason,
      });
      return {
        valid: false,
        continuityScope: input.continuityScope,
        reason: crossCheck.reason,
        gates,
        effectiveProjectId: '',
        effectiveWorkspaceId: '',
      };
    }
  }

  if (input.targetProjectId) {
    const normalizedTarget = normalizeProjectId(input.targetProjectId);
    if (normalizedTarget !== normalizedProjectId) {
      gates.push({
        gateId: 'scope-cross-0002',
        gateType: 'CROSS_PROJECT',
        status: 'CLOSED',
        description: 'Continuity targets another project without ownership',
      });
      return {
        valid: false,
        continuityScope: input.continuityScope,
        reason: 'Cross-project continuity blocked',
        gates,
        effectiveProjectId: '',
        effectiveWorkspaceId: '',
      };
    }
  }

  gates.push({
    gateId: 'scope-type-0003',
    gateType: 'CONTINUITY_SCOPE',
    status: 'OPEN',
    description: `Continuity scope classified: ${input.continuityScope}`,
  });

  return {
    valid: true,
    continuityScope: input.continuityScope,
    reason: 'Continuity scope classified',
    gates,
    effectiveProjectId: normalizedProjectId,
    effectiveWorkspaceId: input.workspaceId,
  };
}

export function scopeClassificationKey(scope: ContinuityScope, valid: boolean): string {
  return `${scope}|${valid}`;
}

export function requiresCloudStateRefresh(scope: ContinuityScope): boolean {
  return (
    scope === 'FULL_COMMAND_CONTEXT' ||
    scope === 'BUILD_PROGRESS_CONTEXT' ||
    scope === 'APPROVAL_CONTEXT' ||
    scope === 'PREVIEW_CONTEXT'
  );
}
