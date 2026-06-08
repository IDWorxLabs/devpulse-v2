/**
 * Capability gap validation engine — validates acquisition inputs.
 * Planning only. No acquisition or execution.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { AcquisitionInput, GateRecord } from './types.js';
import {
  CODE_GEN_BLOCKED_PATTERNS,
  DEPLOY_BLOCKED_PATTERNS,
  DOWNLOAD_BLOCKED_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  INSTALL_BLOCKED_PATTERNS,
  REGISTRY_MUTATION_BLOCKED_PATTERNS,
} from './types.js';

export interface GapValidationResult {
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

export function validateCapabilityGapInput(input: AcquisitionInput): GapValidationResult {
  const gates: GateRecord[] = [];
  const warnings: string[] = [];
  const context = `${input.gapReason} ${input.gapEvidence} ${input.gapImpact} ${input.recommendedAction}`;

  if (!input.capabilityGapId?.trim()) {
    gates.push({ gateId: 'gap-id-0001', gateType: 'CAPABILITY_GAP_ID', status: 'CLOSED', description: 'capabilityGapId is required' });
    return { valid: false, blocked: true, reason: 'capabilityGapId is required', gates, warnings };
  }

  if (!input.analysisId?.trim()) {
    gates.push({ gateId: 'gap-ana-0001', gateType: 'ANALYSIS_ID', status: 'CLOSED', description: 'analysisId is required' });
    return { valid: false, blocked: true, reason: 'analysisId is required', gates, warnings };
  }

  if (!input.workspaceId?.trim()) {
    gates.push({ gateId: 'gap-ws-0001', gateType: 'WORKSPACE_ID', status: 'CLOSED', description: 'workspaceId is required' });
    return { valid: false, blocked: true, reason: 'workspaceId is required', gates, warnings };
  }

  if (!input.projectId?.trim()) {
    gates.push({ gateId: 'gap-proj-0001', gateType: 'PROJECT_ID', status: 'CLOSED', description: 'projectId is required' });
    return { valid: false, blocked: true, reason: 'projectId is required', gates, warnings };
  }

  if (!input.capabilityName?.trim()) {
    gates.push({ gateId: 'gap-name-0001', gateType: 'CAPABILITY_NAME', status: 'CLOSED', description: 'capabilityName is required' });
    return { valid: false, blocked: true, reason: 'capabilityName is required', gates, warnings };
  }

  if (input.capabilityType === 'UNKNOWN') {
    gates.push({ gateId: 'gap-type-0001', gateType: 'CAPABILITY_TYPE', status: 'CLOSED', description: 'capabilityType UNKNOWN blocked' });
    return { valid: false, blocked: true, reason: 'capabilityType UNKNOWN blocked', gates, warnings };
  }

  if (input.requestedAcquisitionMode === 'UNKNOWN') {
    gates.push({ gateId: 'gap-mode-0001', gateType: 'ACQUISITION_MODE', status: 'CLOSED', description: 'requestedAcquisitionMode UNKNOWN blocked' });
    return { valid: false, blocked: true, reason: 'requestedAcquisitionMode UNKNOWN blocked', gates, warnings };
  }

  if (input.governanceStatus === 'FAIL') {
    gates.push({ gateId: 'gap-gov-0001', gateType: 'GOVERNANCE_STATUS', status: 'CLOSED', description: 'governanceStatus FAIL blocked' });
    return { valid: false, blocked: true, reason: 'governanceStatus FAIL blocked', gates, warnings };
  }

  const blocks = [
    detectBlockedPattern(context, EXECUTION_BLOCKED_PATTERNS, 'Direct execution attempt blocked — planning only'),
    detectBlockedPattern(context, INSTALL_BLOCKED_PATTERNS, 'Direct install attempt blocked'),
    detectBlockedPattern(context, DOWNLOAD_BLOCKED_PATTERNS, 'Direct download attempt blocked'),
    detectBlockedPattern(context, CODE_GEN_BLOCKED_PATTERNS, 'Direct code generation attempt blocked'),
    detectBlockedPattern(context, FILE_MOD_BLOCKED_PATTERNS, 'Direct file modification attempt blocked'),
    detectBlockedPattern(context, DEPLOY_BLOCKED_PATTERNS, 'Direct deployment attempt blocked'),
    detectBlockedPattern(context, REGISTRY_MUTATION_BLOCKED_PATTERNS, 'Ownership registry mutation attempt blocked'),
  ].filter(Boolean) as string[];

  if (blocks.length > 0) {
    return { valid: false, blocked: true, reason: blocks[0]!, gates, warnings };
  }

  gates.push({
    gateId: 'gap-val-0001',
    gateType: 'CAPABILITY_GAP',
    status: 'OPEN',
    description: `Capability gap validated: ${input.capabilityGapId}`,
  });

  return { valid: true, blocked: false, reason: 'Capability gap validated', gates, warnings };
}

export interface ProjectContextResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
  effectiveProjectId: string;
  effectiveWorkspaceId: string;
}

export function evaluateAcquisitionProjectContext(input: AcquisitionInput): ProjectContextResult {
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
      gates.push({ gateId: 'ctx-cross-0002', gateType: 'CROSS_PROJECT', status: 'CLOSED', description: 'Cross-project acquisition blocked' });
      return { valid: false, reason: 'Cross-project acquisition blocked', gates, effectiveProjectId: '', effectiveWorkspaceId: '' };
    }
  }

  gates.push({
    gateId: 'ctx-eval-0001',
    gateType: 'CONTEXT_EVALUATED',
    status: 'OPEN',
    description: `Project context validated: ${normalizedProjectId}`,
  });

  return {
    valid: true,
    reason: 'Project context validated',
    gates,
    effectiveProjectId: normalizedProjectId,
    effectiveWorkspaceId: input.workspaceId,
  };
}

export function gapValidationKey(input: AcquisitionInput): string {
  return [input.capabilityGapId, input.analysisId, input.requestedAcquisitionMode, input.capabilityType].join('|');
}
