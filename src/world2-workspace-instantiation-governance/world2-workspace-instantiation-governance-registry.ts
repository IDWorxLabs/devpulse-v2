/**
 * World 2 Workspace Instantiation Governance — constants and safety registry.
 */

import type { World2InstantiationApprovalState } from './world2-workspace-instantiation-governance-types.js';

export const WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PASS_TOKEN =
  'WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PASS';
export const WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_OWNER_MODULE =
  'devpulse_world2_workspace_instantiation_governance';
export const WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PHASE =
  'Phase 24Q — World 2 Workspace Instantiation Governance';
export const WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_REPORT_TITLE =
  'WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_REPORT';
export const WORLD2_INSTANTIATION_CACHE_KEY_PREFIX = 'world2-workspace-instantiation-governance-v1';
export const MAX_INSTANTIATION_GOVERNANCE_HISTORY = 16;
export const MAX_INSTANTIATION_GOVERNANCE_REASONS = 12;

export const MAX_APPROVAL_DURATION_MS = 300_000;
export const MAX_INSTANTIATION_ATTEMPTS = 3;

export const WORLD2_INSTANTIATION_CORE_QUESTION =
  'May this disposable World 2 workspace be instantiated?';

export const WORLD2_INSTANTIATION_APPROVAL_STATES: readonly World2InstantiationApprovalState[] = [
  'APPROVED',
  'APPROVED_WITH_RESTRICTIONS',
  'BLOCKED',
  'INSUFFICIENT_EVIDENCE',
  'NOT_READY',
] as const;

export const WORLD2_INSTANTIATION_SAFETY_GUARANTEES: readonly string[] = [
  'No live workspace mutation',
  'Disposable workspace only',
  'Rollback required before completion',
  'Validation required before completion',
  'Disposal required after session',
  'No production mutation',
  'World 1 live project remains protected',
  'Instantiation approval is not execution permission',
] as const;

export const REQUIRED_INSTANTIATION_GOVERNANCE_AUTHORITIES = [
  'world2-workspace-materialization',
  'world2-disposable-workspace',
  'world2-change-set-authority',
  'world2-controlled-execution-runtime',
] as const;

export function isWorld2InstantiationApprovalState(
  value: string,
): value is World2InstantiationApprovalState {
  return (WORLD2_INSTANTIATION_APPROVAL_STATES as readonly string[]).includes(value);
}

export function buildInstantiationExpirationPolicy(): {
  maxApprovalDurationMs: number;
  maxInstantiationAttempts: number;
  expiresAfterAttempts: boolean;
  expiresAfterDuration: boolean;
} {
  return {
    maxApprovalDurationMs: MAX_APPROVAL_DURATION_MS,
    maxInstantiationAttempts: MAX_INSTANTIATION_ATTEMPTS,
    expiresAfterAttempts: true,
    expiresAfterDuration: true,
  };
}
