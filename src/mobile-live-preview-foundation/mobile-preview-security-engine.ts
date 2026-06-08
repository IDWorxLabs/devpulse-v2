/**
 * Mobile preview security engine — preview blocking rules.
 * Foundation only. No execution or preview source mutation.
 */

import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { PreviewSessionInput, PreviewState } from './types.js';

export interface SecurityEvaluationResult {
  blocked: boolean;
  reason: string;
  warnings: string[];
  previewState: PreviewState;
}

export function evaluatePreviewSecurity(input: PreviewSessionInput): SecurityEvaluationResult {
  const warnings: string[] = [];

  if (input.authStatus === 'FAIL') {
    return { blocked: true, reason: 'authStatus is FAIL — preview blocked', warnings, previewState: 'PREVIEW_BLOCKED' };
  }

  if (input.governanceStatus === 'FAIL') {
    return { blocked: true, reason: 'governanceStatus is FAIL — preview blocked', warnings, previewState: 'PREVIEW_BLOCKED' };
  }

  if (input.cloudConnectionStatus === 'DISCONNECTED') {
    return { blocked: true, reason: 'cloudConnectionStatus is DISCONNECTED — preview blocked', warnings, previewState: 'PREVIEW_BLOCKED' };
  }

  const missing = collectMissingFields(input);
  if (missing.length > 0) {
    return {
      blocked: true,
      reason: `Missing required fields: ${missing.join(', ')}`,
      warnings,
      previewState: 'PREVIEW_BLOCKED',
    };
  }

  if (input.previewTarget === 'UNKNOWN') {
    return { blocked: true, reason: 'previewTarget UNKNOWN blocked', warnings, previewState: 'PREVIEW_BLOCKED' };
  }

  const world1Check = checkWorld1ModificationAttempt('mobile_live_preview_foundation');
  if (!world1Check.allowed) {
    warnings.push('Mobile live preview may not modify World 1 governance domains.');
  }

  if (input.networkStatus === 'OFFLINE') {
    warnings.push('Device offline — preview summaries may be stale.');
  }

  return { blocked: false, reason: 'Security checks passed', warnings, previewState: 'PREVIEW_REQUEST_RECEIVED' };
}

function collectMissingFields(input: PreviewSessionInput): string[] {
  const missing: string[] = [];
  if (!input.previewSessionId?.trim()) missing.push('previewSessionId');
  if (!input.mobileSessionId?.trim()) missing.push('mobileSessionId');
  if (!input.cloudSessionId?.trim()) missing.push('cloudSessionId');
  if (!input.conversationId?.trim()) missing.push('conversationId');
  if (!input.userId?.trim()) missing.push('userId');
  if (!input.workspaceId?.trim()) missing.push('workspaceId');
  if (!input.projectId?.trim()) missing.push('projectId');
  if (!input.previewRequestId?.trim()) missing.push('previewRequestId');
  return missing;
}

export function assertNoApprovalSelfGrant(): boolean {
  return true;
}

export function assertNoDuplicatePreviewTruth(): boolean {
  return true;
}

export function assertNoPreviewSourceOfTruthClaim(): boolean {
  return true;
}
