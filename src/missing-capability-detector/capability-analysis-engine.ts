/**
 * Capability analysis engine — validates analysis inputs and project context.
 * Detection only. No acquisition or execution.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { CapabilityAnalysisInput, GateRecord } from './types.js';
import {
  ACQUISITION_BLOCKED_PATTERNS,
  CODE_GEN_BLOCKED_PATTERNS,
  DEPLOY_BLOCKED_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
} from './types.js';

export interface AnalysisValidationResult {
  valid: boolean;
  blocked: boolean;
  reason: string;
  gates: GateRecord[];
  warnings: string[];
}

function detectBlockedPattern(text: string, patterns: readonly string[], reason: string): string | null {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    if (lower.includes(pattern)) return reason;
  }
  return null;
}

export function validateAnalysisInput(input: CapabilityAnalysisInput): AnalysisValidationResult {
  const gates: GateRecord[] = [];
  const warnings: string[] = [];
  const context = `${input.analysisContext} ${input.requestedOutcome} ${input.goalSummary}`;

  if (!input.analysisId?.trim()) {
    gates.push({ gateId: 'ana-id-0001', gateType: 'ANALYSIS_ID', status: 'CLOSED', description: 'analysisId is required' });
    return { valid: false, blocked: true, reason: 'analysisId is required', gates, warnings };
  }

  if (!input.workspaceId?.trim() || !input.projectId?.trim()) {
    gates.push({ gateId: 'ana-ctx-0001', gateType: 'PROJECT_CONTEXT', status: 'CLOSED', description: 'workspaceId and projectId required' });
    return { valid: false, blocked: true, reason: 'Project context required', gates, warnings };
  }

  if (input.analysisSource === 'UNKNOWN') {
    gates.push({ gateId: 'ana-src-0001', gateType: 'ANALYSIS_SOURCE', status: 'CLOSED', description: 'analysisSource UNKNOWN blocked' });
    return { valid: false, blocked: true, reason: 'analysisSource UNKNOWN blocked', gates, warnings };
  }

  const blocks = [
    detectBlockedPattern(context, EXECUTION_BLOCKED_PATTERNS, 'Execution attempt blocked — detection only'),
    detectBlockedPattern(context, FILE_MOD_BLOCKED_PATTERNS, 'File modification attempt blocked'),
    detectBlockedPattern(context, CODE_GEN_BLOCKED_PATTERNS, 'Code generation attempt blocked'),
    detectBlockedPattern(context, DEPLOY_BLOCKED_PATTERNS, 'Deployment attempt blocked'),
    detectBlockedPattern(context, ACQUISITION_BLOCKED_PATTERNS, 'Capability acquisition attempt blocked'),
  ].filter(Boolean) as string[];

  if (blocks.length > 0) {
    return { valid: false, blocked: true, reason: blocks[0]!, gates, warnings };
  }

  gates.push({
    gateId: 'ana-id-0002',
    gateType: 'ANALYSIS_INPUT',
    status: 'OPEN',
    description: `Analysis input validated: ${input.analysisId}`,
  });

  return { valid: true, blocked: false, reason: 'Analysis input validated', gates, warnings };
}

export interface ContextValidationResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
  effectiveProjectId: string;
  effectiveWorkspaceId: string;
}

export function evaluateProjectContext(input: CapabilityAnalysisInput): ContextValidationResult {
  const gates: GateRecord[] = [];
  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);
  const normalizedProjectId = normalizeProjectId(input.projectId);

  if (!workspace) {
    gates.push({ gateId: 'ctx-ws-0001', gateType: 'WORKSPACE_OWNERSHIP', status: 'CLOSED', description: `Workspace not found: ${input.workspaceId}` });
    return { valid: false, reason: 'Workspace not found', gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
  }

  if (workspace.projectId !== normalizedProjectId) {
    gates.push({ gateId: 'ctx-proj-0001', gateType: 'PROJECT_OWNERSHIP', status: 'CLOSED', description: 'projectId does not match workspace ownership' });
    return { valid: false, reason: 'Project ownership mismatch', gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
  }

  if (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) {
    const target = foundation.getManager().getWorkspace(input.targetWorkspaceId);
    const crossCheck = checkCrossWorkspaceAccess(input.workspaceId, target);
    if (!crossCheck.allowed) {
      gates.push({ gateId: 'ctx-cross-0001', gateType: 'CROSS_WORKSPACE', status: 'CLOSED', description: crossCheck.reason });
      return { valid: false, reason: crossCheck.reason, gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
    }
  }

  if (input.targetProjectId) {
    const normalizedTarget = normalizeProjectId(input.targetProjectId);
    if (normalizedTarget !== normalizedProjectId) {
      gates.push({ gateId: 'ctx-cross-0002', gateType: 'CROSS_PROJECT', status: 'CLOSED', description: 'Analysis targets another project without ownership' });
      return { valid: false, reason: 'Cross-project analysis blocked', gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
    }
  }

  gates.push({
    gateId: 'ctx-eval-0001',
    gateType: 'CONTEXT_EVALUATED',
    status: 'OPEN',
    description: `Context evaluated for ${normalizedProjectId}`,
  });

  return {
    valid: true,
    reason: 'Context evaluated',
    gates,
    effectiveProjectId: normalizedProjectId,
    effectiveWorkspaceId: input.workspaceId,
  };
}

export function analysisKey(input: CapabilityAnalysisInput): string {
  return [input.analysisId, input.workspaceId, input.projectId, input.analysisSource].join('|');
}
