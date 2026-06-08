/**
 * Trust context engine — validates trust assessment inputs and project context.
 * Aggregation only. No modification.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { TrustAssessmentInput, GateRecord } from './types.js';
import {
  AUTO_FIX_BLOCKED_PATTERNS,
  CODE_GEN_BLOCKED_PATTERNS,
  DEPLOY_BLOCKED_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  GOVERNANCE_MUTATION_BLOCKED_PATTERNS,
  REGISTRY_MUTATION_BLOCKED_PATTERNS,
  REPLACEMENT_BLOCKED_PATTERNS,
} from './types.js';

export interface TrustContextResult {
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

function collectAllSignals(input: TrustAssessmentInput): string[] {
  return [
    ...(input.evidenceSignals ?? []),
    ...(input.verificationSignals ?? []),
    ...(input.completionSignals ?? []),
    ...(input.realitySignals ?? []),
    ...(input.governanceSignals ?? []),
    ...(input.predictionSignals ?? []),
    ...(input.complexitySignals ?? []),
    ...(input.driftSignals ?? []),
    ...(input.learningSignals ?? []),
  ];
}

export function trustContextKey(input: TrustAssessmentInput): string {
  return [
    input.workspaceId,
    input.projectId,
    input.assessmentSource,
    input.assessmentTarget,
    input.targetId,
  ].join('|');
}

export function validateTrustAssessmentInput(input: TrustAssessmentInput): TrustContextResult {
  const gates: GateRecord[] = [];
  const warnings: string[] = [];
  const context = collectAllSignals(input).join(' ');

  if (!input.trustAssessmentId?.trim()) {
    gates.push({ gateId: 'ctx-id-0001', gateType: 'TRUST_ASSESSMENT_ID', status: 'CLOSED', description: 'trustAssessmentId is required' });
    return { valid: false, blocked: true, reason: 'trustAssessmentId is required', gates, warnings };
  }

  if (!input.workspaceId?.trim()) {
    gates.push({ gateId: 'ctx-ws-0001', gateType: 'WORKSPACE_ID', status: 'CLOSED', description: 'workspaceId is required' });
    return { valid: false, blocked: true, reason: 'workspaceId is required', gates, warnings };
  }

  if (!input.projectId?.trim()) {
    gates.push({ gateId: 'ctx-proj-0001', gateType: 'PROJECT_ID', status: 'CLOSED', description: 'projectId is required' });
    return { valid: false, blocked: true, reason: 'projectId is required', gates, warnings };
  }

  if (input.assessmentSource === 'UNKNOWN') {
    gates.push({ gateId: 'ctx-src-0001', gateType: 'ASSESSMENT_SOURCE', status: 'CLOSED', description: 'assessmentSource UNKNOWN blocked' });
    return { valid: false, blocked: true, reason: 'assessmentSource UNKNOWN blocked', gates, warnings };
  }

  if (input.assessmentTarget === 'UNKNOWN') {
    gates.push({ gateId: 'ctx-tgt-0001', gateType: 'ASSESSMENT_TARGET', status: 'CLOSED', description: 'assessmentTarget UNKNOWN blocked' });
    return { valid: false, blocked: true, reason: 'assessmentTarget UNKNOWN blocked', gates, warnings };
  }

  if (!input.targetId?.trim()) {
    gates.push({ gateId: 'ctx-target-0001', gateType: 'TARGET_ID', status: 'CLOSED', description: 'targetId is required' });
    return { valid: false, blocked: true, reason: 'targetId is required', gates, warnings };
  }

  if (input.governanceStatus === 'FAIL') {
    gates.push({ gateId: 'ctx-gov-0001', gateType: 'GOVERNANCE_STATUS', status: 'CLOSED', description: 'governanceStatus FAIL blocked' });
    return { valid: false, blocked: true, reason: 'governanceStatus FAIL blocked', gates, warnings };
  }

  const signalCount = collectAllSignals(input).filter((s) => s?.trim()).length;
  if (signalCount === 0) {
    gates.push({ gateId: 'ctx-signals-0001', gateType: 'TRUST_SIGNALS', status: 'CLOSED', description: 'At least one trust signal is required' });
    return { valid: false, blocked: true, reason: 'At least one trust signal is required', gates, warnings };
  }

  const blockedChecks: Array<[readonly string[], string]> = [
    [EXECUTION_BLOCKED_PATTERNS, 'Direct execution request blocked — trust aggregation only'],
    [FILE_MOD_BLOCKED_PATTERNS, 'Direct file modification request blocked'],
    [CODE_GEN_BLOCKED_PATTERNS, 'Direct code generation request blocked'],
    [DEPLOY_BLOCKED_PATTERNS, 'Direct deployment request blocked'],
    [AUTO_FIX_BLOCKED_PATTERNS, 'Auto-fix request blocked — trust aggregation only'],
    [REGISTRY_MUTATION_BLOCKED_PATTERNS, 'Ownership registry mutation request blocked'],
    [GOVERNANCE_MUTATION_BLOCKED_PATTERNS, 'Governance mutation request blocked'],
    [REPLACEMENT_BLOCKED_PATTERNS, 'System replacement request blocked — trust aggregation only'],
  ];

  for (const [patterns, reason] of blockedChecks) {
    const hit = detectBlockedPattern(context, patterns, reason);
    if (hit) {
      gates.push({ gateId: `ctx-sec-${patterns[0]}`, gateType: 'SECURITY_BLOCK', status: 'CLOSED', description: hit });
      warnings.push(hit);
      return { valid: false, blocked: true, reason: hit, gates, warnings };
    }
  }

  gates.push({ gateId: 'ctx-valid-0001', gateType: 'TRUST_ASSESSMENT_VALID', status: 'OPEN', description: 'Trust assessment input validated' });
  return { valid: true, blocked: false, reason: 'Trust assessment validated', gates, warnings };
}

export function evaluateTrustProjectContext(input: TrustAssessmentInput): TrustContextResult {
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
      gates.push({ gateId: 'ctx-cross-proj-0001', gateType: 'CROSS_PROJECT', status: 'CLOSED', description: 'Cross-project trust assessment blocked' });
      return { valid: false, blocked: true, reason: 'Cross-project trust assessment blocked', gates, warnings };
    }
  }

  gates.push({ gateId: 'ctx-trust-0001', gateType: 'TRUST_CONTEXT_VALIDATED', status: 'OPEN', description: `Trust context validated for ${normalizedProject}` });
  return { valid: true, blocked: false, reason: 'Trust context validated', gates, warnings };
}
