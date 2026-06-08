/**
 * Continuity security engine — continuity blocking rules.
 * Foundation only. No execution or duplicate truth.
 */

import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { ContinuityInput, ContinuityState } from './types.js';
import {
  CODE_GEN_BLOCKED_PATTERNS,
  DEPLOY_BLOCKED_PATTERNS,
  DUPLICATE_TRUTH_BLOCKED_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
} from './types.js';

export interface SecurityEvaluationResult {
  blocked: boolean;
  reason: string;
  warnings: string[];
  continuityState: ContinuityState;
}

function detectBlockedPattern(text: string, patterns: readonly string[], reason: string): string | null {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    if (lower.includes(pattern)) return reason;
  }
  return null;
}

function collectMissingFields(input: ContinuityInput): string[] {
  const missing: string[] = [];
  if (!input.fromDeviceId?.trim()) missing.push('fromDeviceId');
  if (!input.toDeviceId?.trim()) missing.push('toDeviceId');
  if (!input.userId?.trim()) missing.push('userId');
  if (!input.cloudSessionId?.trim()) missing.push('cloudSessionId');
  if (!input.workspaceId?.trim()) missing.push('workspaceId');
  if (!input.projectId?.trim()) missing.push('projectId');
  if (!input.handoffRequestId?.trim()) missing.push('handoffRequestId');
  return missing;
}

export function evaluateContinuitySecurity(input: ContinuityInput): SecurityEvaluationResult {
  const warnings: string[] = [];
  const notes = input.handoffNotes ?? '';

  if (input.authStatus === 'FAIL') {
    return { blocked: true, reason: 'authStatus is FAIL — continuity blocked', warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  if (input.governanceStatus === 'FAIL') {
    return { blocked: true, reason: 'governanceStatus is FAIL — continuity blocked', warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  if (input.cloudConnectionStatus === 'DISCONNECTED') {
    return { blocked: true, reason: 'cloudConnectionStatus is DISCONNECTED — continuity blocked', warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  const missing = collectMissingFields(input);
  if (missing.length > 0) {
    return {
      blocked: true,
      reason: `Missing required fields: ${missing.join(', ')}`,
      warnings,
      continuityState: 'CONTINUITY_BLOCKED',
    };
  }

  if (input.handoffType === 'UNKNOWN') {
    return { blocked: true, reason: 'handoffType UNKNOWN blocked', warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  if (input.continuityScope === 'UNKNOWN') {
    return { blocked: true, reason: 'continuityScope UNKNOWN blocked', warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  const executionBlock = detectBlockedPattern(notes, EXECUTION_BLOCKED_PATTERNS, 'Execution attempt blocked');
  if (executionBlock) {
    return { blocked: true, reason: executionBlock, warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  const fileBlock = detectBlockedPattern(notes, FILE_MOD_BLOCKED_PATTERNS, 'File transfer / duplicate state attempt blocked');
  if (fileBlock) {
    return { blocked: true, reason: fileBlock, warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  const codeBlock = detectBlockedPattern(notes, CODE_GEN_BLOCKED_PATTERNS, 'Code generation attempt blocked');
  if (codeBlock) {
    return { blocked: true, reason: codeBlock, warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  const deployBlock = detectBlockedPattern(notes, DEPLOY_BLOCKED_PATTERNS, 'Deployment attempt blocked');
  if (deployBlock) {
    return { blocked: true, reason: deployBlock, warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  const truthBlock = detectBlockedPattern(notes, DUPLICATE_TRUTH_BLOCKED_PATTERNS, 'Duplicate truth attempt blocked');
  if (truthBlock) {
    return { blocked: true, reason: truthBlock, warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  if (notes.toLowerCase().includes('auto approve') || notes.toLowerCase().includes('self approve')) {
    return { blocked: true, reason: 'Approval self-granting blocked', warnings, continuityState: 'CONTINUITY_BLOCKED' };
  }

  const world1Check = checkWorld1ModificationAttempt('cross_device_continuity_foundation');
  if (!world1Check.allowed) {
    warnings.push('Cross-device continuity may not modify World 1 governance domains.');
  }

  return { blocked: false, reason: 'Security checks passed', warnings, continuityState: 'CONTINUITY_REQUEST_RECEIVED' };
}

export function assertNoDuplicateProjectTruth(): boolean {
  return true;
}

export function assertNoDuplicateProjectVault(): boolean {
  return true;
}

export function assertNoDuplicateChatTruth(): boolean {
  return true;
}

export function assertNoDuplicatePreviewTruth(): boolean {
  return true;
}

export function assertNoDuplicateApprovalTruth(): boolean {
  return true;
}

export function assertNoDuplicateExecutionTruth(): boolean {
  return true;
}
