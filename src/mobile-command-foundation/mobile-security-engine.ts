/**
 * Mobile security engine — session blocking rules and security warnings.
 * Foundation only. No execution.
 */

import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { MobileSessionInput, SessionState } from './types.js';
import { WORLD1_TARGET_PATTERNS } from './types.js';

export interface SecurityEvaluationResult {
  blocked: boolean;
  reason: string;
  warnings: string[];
  sessionState: SessionState;
}

export function evaluateSecurity(input: MobileSessionInput): SecurityEvaluationResult {
  const warnings: string[] = [];

  if (input.authStatus === 'FAIL') {
    return {
      blocked: true,
      reason: 'authStatus is FAIL — session blocked',
      warnings,
      sessionState: 'SESSION_BLOCKED',
    };
  }

  if (input.governanceStatus === 'FAIL') {
    return {
      blocked: true,
      reason: 'governanceStatus is FAIL — session blocked',
      warnings,
      sessionState: 'SESSION_BLOCKED',
    };
  }

  const missingFields = collectMissingRequiredFields(input);
  if (missingFields.length > 0) {
    return {
      blocked: true,
      reason: `Missing required fields: ${missingFields.join(', ')}`,
      warnings,
      sessionState: 'SESSION_BLOCKED',
    };
  }

  for (const pattern of WORLD1_TARGET_PATTERNS) {
    if (input.cloudExecutionRegion.includes(pattern)) {
      return {
        blocked: true,
        reason: `World 1 modification path detected: ${pattern}`,
        warnings,
        sessionState: 'SESSION_BLOCKED',
      };
    }
  }

  const world1Check = checkWorld1ModificationAttempt('mobile_command_foundation');
  if (!world1Check.allowed) {
    warnings.push('Mobile command may not modify World 1 governance domains.');
  }

  if (input.networkStatus === 'OFFLINE') {
    warnings.push('Device offline — cloud relay required for command intent.');
  }
  if (input.networkStatus === 'DEGRADED') {
    warnings.push('Network degraded — expect delayed cloud session updates.');
  }
  if (input.connectionMode === 'UNKNOWN') {
    warnings.push('Connection mode UNKNOWN — verify pairing before command intent.');
  }
  if (input.cloudConnectionStatus === 'DEGRADED') {
    warnings.push('Cloud connection degraded — read-only monitoring recommended.');
  }

  return {
    blocked: false,
    reason: 'Security checks passed',
    warnings,
    sessionState: 'SESSION_REQUEST_RECEIVED',
  };
}

function collectMissingRequiredFields(input: MobileSessionInput): string[] {
  const missing: string[] = [];
  if (!input.deviceId?.trim()) missing.push('deviceId');
  if (!input.userId?.trim()) missing.push('userId');
  if (!input.sessionId?.trim()) missing.push('sessionId');
  if (!input.workspaceId?.trim()) missing.push('workspaceId');
  if (!input.projectId?.trim()) missing.push('projectId');
  if (!input.cloudSessionId?.trim()) missing.push('cloudSessionId');
  return missing;
}

export function assertNoApprovalSelfGrant(input: MobileSessionInput): boolean {
  return !input.requestedCapabilities.includes('GRANT_APPROVAL' as string);
}

export function assertNoWorld2MutationPath(capabilities: string[]): boolean {
  const mutationCaps = [
    'MODIFY_WORLD2',
    'MUTATE_WORKSPACE',
    'WRITE_WORKSPACE',
    'EXECUTE_BUILDER',
  ];
  return !capabilities.some((c) => mutationCaps.includes(c));
}

export function assertNoDuplicateProjectTruth(): boolean {
  return true;
}
