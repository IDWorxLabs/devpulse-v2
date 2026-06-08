/**
 * System context engine — validates complexity analysis inputs and project context.
 * Measurement only. No modification.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { ComplexityAnalysisInput, GateRecord } from './types.js';
import {
  ARCHITECTURE_MOD_BLOCKED_PATTERNS,
  AUTO_FIX_BLOCKED_PATTERNS,
  CODE_GEN_BLOCKED_PATTERNS,
  DEPLOY_BLOCKED_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  GOVERNANCE_MUTATION_BLOCKED_PATTERNS,
  REGISTRY_MUTATION_BLOCKED_PATTERNS,
} from './types.js';

export interface SystemContextResult {
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

export function systemContextKey(input: ComplexityAnalysisInput): string {
  return [input.workspaceId, input.projectId, input.analysisSource, input.systemArea, input.systemSnapshotSummary.slice(0, 32)].join('|');
}

export function validateComplexityAnalysisInput(input: ComplexityAnalysisInput): SystemContextResult {
  const gates: GateRecord[] = [];
  const warnings: string[] = [];
  const context = `${input.systemSnapshotSummary} ${input.complexitySignals.join(' ')}`;

  if (!input.complexityAnalysisId?.trim()) {
    gates.push({ gateId: 'ctx-id-0001', gateType: 'COMPLEXITY_ANALYSIS_ID', status: 'CLOSED', description: 'complexityAnalysisId is required' });
    return { valid: false, blocked: true, reason: 'complexityAnalysisId is required', gates, warnings };
  }

  if (!input.workspaceId?.trim()) {
    gates.push({ gateId: 'ctx-ws-0001', gateType: 'WORKSPACE_ID', status: 'CLOSED', description: 'workspaceId is required' });
    return { valid: false, blocked: true, reason: 'workspaceId is required', gates, warnings };
  }

  if (!input.projectId?.trim()) {
    gates.push({ gateId: 'ctx-proj-0001', gateType: 'PROJECT_ID', status: 'CLOSED', description: 'projectId is required' });
    return { valid: false, blocked: true, reason: 'projectId is required', gates, warnings };
  }

  if (input.analysisSource === 'UNKNOWN') {
    gates.push({ gateId: 'ctx-src-0001', gateType: 'ANALYSIS_SOURCE', status: 'CLOSED', description: 'analysisSource UNKNOWN blocked' });
    return { valid: false, blocked: true, reason: 'analysisSource UNKNOWN blocked', gates, warnings };
  }

  if (input.systemArea === 'UNKNOWN') {
    gates.push({ gateId: 'ctx-area-0001', gateType: 'SYSTEM_AREA', status: 'CLOSED', description: 'systemArea UNKNOWN blocked' });
    return { valid: false, blocked: true, reason: 'systemArea UNKNOWN blocked', gates, warnings };
  }

  if (!input.systemSnapshotSummary?.trim()) {
    gates.push({ gateId: 'ctx-snap-0001', gateType: 'SYSTEM_SNAPSHOT', status: 'CLOSED', description: 'systemSnapshotSummary is required' });
    return { valid: false, blocked: true, reason: 'systemSnapshotSummary is required', gates, warnings };
  }

  if (!input.complexitySignals?.length) {
    gates.push({ gateId: 'ctx-signals-0001', gateType: 'COMPLEXITY_SIGNALS', status: 'CLOSED', description: 'complexitySignals are required' });
    return { valid: false, blocked: true, reason: 'complexitySignals are required', gates, warnings };
  }

  if (input.governanceStatus === 'FAIL') {
    gates.push({ gateId: 'ctx-gov-0001', gateType: 'GOVERNANCE_STATUS', status: 'CLOSED', description: 'governanceStatus FAIL blocked' });
    return { valid: false, blocked: true, reason: 'governanceStatus FAIL blocked', gates, warnings };
  }

  const blockedChecks: Array<[readonly string[], string]> = [
    [EXECUTION_BLOCKED_PATTERNS, 'Direct execution request blocked — complexity scoring only'],
    [FILE_MOD_BLOCKED_PATTERNS, 'Direct file modification request blocked'],
    [CODE_GEN_BLOCKED_PATTERNS, 'Direct code generation request blocked'],
    [DEPLOY_BLOCKED_PATTERNS, 'Direct deployment request blocked'],
    [AUTO_FIX_BLOCKED_PATTERNS, 'Auto-fix request blocked — complexity measurement only'],
    [ARCHITECTURE_MOD_BLOCKED_PATTERNS, 'Architecture modification request blocked'],
    [REGISTRY_MUTATION_BLOCKED_PATTERNS, 'Ownership registry mutation request blocked'],
    [GOVERNANCE_MUTATION_BLOCKED_PATTERNS, 'Governance mutation request blocked'],
  ];

  for (const [patterns, reason] of blockedChecks) {
    const hit = detectBlockedPattern(context, patterns, reason);
    if (hit) {
      gates.push({ gateId: `ctx-sec-${patterns[0]}`, gateType: 'SECURITY_BLOCK', status: 'CLOSED', description: hit });
      warnings.push(hit);
      return { valid: false, blocked: true, reason: hit, gates, warnings };
    }
  }

  gates.push({ gateId: 'ctx-valid-0001', gateType: 'COMPLEXITY_ANALYSIS_VALID', status: 'OPEN', description: 'Complexity analysis input validated' });
  return { valid: true, blocked: false, reason: 'Complexity analysis validated', gates, warnings };
}

export function evaluateComplexityProjectContext(input: ComplexityAnalysisInput): SystemContextResult {
  const gates: GateRecord[] = [];
  const warnings: string[] = [];

  if (!input.workspaceId?.trim() || !input.projectId?.trim()) {
    return { valid: false, blocked: true, reason: 'Missing workspace or project context', gates, warnings };
  }

  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);
  const normalizedProject = normalizeProjectId(input.projectId);

  if (!workspace) {
    gates.push({ gateId: 'ctx-ws-miss-0001', gateType: 'WORKSPACE_NOT_FOUND', status: 'CLOSED', description: `Workspace not found: ${input.workspaceId}` });
    return { valid: false, blocked: true, reason: `Workspace not found: ${input.workspaceId}`, gates, warnings };
  }

  if (workspace.projectId !== normalizedProject) {
    gates.push({ gateId: 'ctx-ws-mismatch-0001', gateType: 'WORKSPACE_MISMATCH', status: 'CLOSED', description: 'projectId does not match workspace ownership' });
    return { valid: false, blocked: true, reason: 'projectId does not match workspace ownership', gates, warnings };
  }

  if (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) {
    const target = foundation.getManager().getWorkspace(input.targetWorkspaceId);
    const cross = checkCrossWorkspaceAccess(input.workspaceId, target);
    if (!cross.allowed) {
      gates.push({ gateId: 'ctx-cross-ws-0001', gateType: 'CROSS_WORKSPACE', status: 'CLOSED', description: cross.reason });
      return { valid: false, blocked: true, reason: cross.reason, gates, warnings };
    }
  }

  if (input.targetProjectId) {
    const normalizedTarget = normalizeProjectId(input.targetProjectId);
    if (normalizedTarget !== normalizedProject) {
      gates.push({ gateId: 'ctx-cross-proj-0001', gateType: 'CROSS_PROJECT', status: 'CLOSED', description: 'Cross-project complexity analysis blocked' });
      return { valid: false, blocked: true, reason: 'Cross-project complexity analysis blocked', gates, warnings };
    }
  }

  gates.push({ gateId: 'ctx-sys-0001', gateType: 'SYSTEM_CONTEXT_VALIDATED', status: 'OPEN', description: `System context validated for ${normalizedProject}` });
  return { valid: true, blocked: false, reason: 'System context validated', gates, warnings };
}
