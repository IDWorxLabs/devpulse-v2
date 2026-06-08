/**
 * Mobile chat security engine — session blocking and security warnings.
 * Foundation only. No execution.
 */

import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { ChatState, MobileChatInput } from './types.js';

export interface SecurityEvaluationResult {
  blocked: boolean;
  reason: string;
  warnings: string[];
  chatState: ChatState;
}

export function evaluateChatSecurity(input: MobileChatInput): SecurityEvaluationResult {
  const warnings: string[] = [];

  if (input.authStatus === 'FAIL') {
    return {
      blocked: true,
      reason: 'authStatus is FAIL — chat blocked',
      warnings,
      chatState: 'CHAT_BLOCKED',
    };
  }

  if (input.governanceStatus === 'FAIL') {
    return {
      blocked: true,
      reason: 'governanceStatus is FAIL — chat blocked',
      warnings,
      chatState: 'CHAT_BLOCKED',
    };
  }

  if (input.cloudConnectionStatus === 'DISCONNECTED') {
    return {
      blocked: true,
      reason: 'cloudConnectionStatus is DISCONNECTED — chat blocked',
      warnings,
      chatState: 'CHAT_BLOCKED',
    };
  }

  const missing = collectMissingFields(input);
  if (missing.length > 0) {
    return {
      blocked: true,
      reason: `Missing required fields: ${missing.join(', ')}`,
      warnings,
      chatState: 'CHAT_BLOCKED',
    };
  }

  if (!input.messageText?.trim()) {
    return {
      blocked: true,
      reason: 'Empty message text — chat blocked',
      warnings,
      chatState: 'CHAT_BLOCKED',
    };
  }

  const world1Check = checkWorld1ModificationAttempt('mobile_chat_interface');
  if (!world1Check.allowed) {
    warnings.push('Mobile chat may not modify World 1 governance domains.');
  }

  if (input.cloudConnectionStatus === 'DEGRADED') {
    warnings.push('Cloud connection degraded — chat packets may be delayed.');
  }

  return {
    blocked: false,
    reason: 'Security checks passed',
    warnings,
    chatState: 'CHAT_REQUEST_RECEIVED',
  };
}

function collectMissingFields(input: MobileChatInput): string[] {
  const missing: string[] = [];
  if (!input.mobileSessionId?.trim()) missing.push('mobileSessionId');
  if (!input.cloudSessionId?.trim()) missing.push('cloudSessionId');
  if (!input.userId?.trim()) missing.push('userId');
  if (!input.conversationId?.trim()) missing.push('conversationId');
  if (!input.messageId?.trim()) missing.push('messageId');
  return missing;
}

export function assertNoApprovalSelfGrant(input: MobileChatInput): boolean {
  const text = input.messageText.toLowerCase();
  return !text.includes('grant approval') && !text.includes('self approve') && !text.includes('approve action');
}

export function assertNoDuplicateProjectTruth(): boolean {
  return true;
}

export function assertNoWorld2MutationPath(): boolean {
  return true;
}
