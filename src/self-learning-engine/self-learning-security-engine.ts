/**
 * Self-learning security engine — blocks unsafe learning requests.
 * Security gate only. No execution.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { GateRecord, LearningEventInput } from './types.js';

export interface SecurityEvaluationResult {
  valid: boolean;
  blocked: boolean;
  reason: string;
  gates: GateRecord[];
  warnings: string[];
}

export function evaluateLearningProjectContext(input: LearningEventInput): SecurityEvaluationResult {
  const gates: GateRecord[] = [];
  const warnings: string[] = [];

  if (!input.workspaceId?.trim() || !input.projectId?.trim()) {
    return {
      valid: false,
      blocked: true,
      reason: 'Missing workspace or project context',
      gates,
      warnings,
    };
  }

  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);
  const normalizedProject = normalizeProjectId(input.projectId);

  if (!workspace) {
    gates.push({
      gateId: 'sec-ws-miss-0001',
      gateType: 'WORKSPACE_NOT_FOUND',
      status: 'CLOSED',
      description: `Workspace not found: ${input.workspaceId}`,
    });
    return {
      valid: false,
      blocked: true,
      reason: `Workspace not found: ${input.workspaceId}`,
      gates,
      warnings,
    };
  }

  if (workspace.projectId !== normalizedProject) {
    gates.push({
      gateId: 'sec-ws-mismatch-0001',
      gateType: 'WORKSPACE_MISMATCH',
      status: 'CLOSED',
      description: 'projectId does not match workspace ownership',
    });
    return {
      valid: false,
      blocked: true,
      reason: 'projectId does not match workspace ownership',
      gates,
      warnings,
    };
  }

  if (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) {
    const target = foundation.getManager().getWorkspace(input.targetWorkspaceId);
    const cross = checkCrossWorkspaceAccess(input.workspaceId, target);
    if (!cross.allowed) {
      gates.push({
        gateId: 'sec-cross-ws-0001',
        gateType: 'CROSS_WORKSPACE',
        status: 'CLOSED',
        description: cross.reason,
      });
      return {
        valid: false,
        blocked: true,
        reason: cross.reason,
        gates,
        warnings,
      };
    }
  }

  if (input.targetProjectId) {
    const normalizedTarget = normalizeProjectId(input.targetProjectId);
    if (normalizedTarget !== normalizedProject) {
      gates.push({
        gateId: 'sec-cross-proj-0001',
        gateType: 'CROSS_PROJECT',
        status: 'CLOSED',
        description: 'Cross-project learning blocked',
      });
      return {
        valid: false,
        blocked: true,
        reason: 'Cross-project learning blocked',
        gates,
        warnings,
      };
    }
  }

  gates.push({
    gateId: 'sec-ctx-0001',
    gateType: 'CONTEXT_EVALUATED',
    status: 'OPEN',
    description: `Project context validated for ${normalizedProject}`,
  });

  return { valid: true, blocked: false, reason: 'Project context validated', gates, warnings };
}

export function ownershipGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}:${g.status}`).sort().join('|');
}

export function assertNoExecutionMethods(obj: object): boolean {
  const forbidden = ['execute', 'modifyFiles', 'generateCode', 'runCommand', 'deploy', 'trainModel', 'autoApply'];
  return forbidden.every((m) => typeof (obj as Record<string, unknown>)[m] === 'undefined');
}
