/**
 * Mobile Chat Runtime Foundation — action gate (decision metadata only).
 */

import { getStoredMobileChatSession, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatActionGateEntry, MobileChatActionGateResult } from './mobile-chat-types.js';

let gateCounter = 0;

export function resetMobileChatActionGateCounterForTests(): void {
  gateCounter = 0;
}

export function nextMobileChatActionGateId(): string {
  gateCounter += 1;
  return `mchgate-${gateCounter.toString().padStart(4, '0')}`;
}

export function buildDefaultMobileChatPermissions(mobileChatType = 'GENERAL_MOBILE_CHAT') {
  return {
    allowedChatActions: ['view_status', 'view_context', 'send_prompt_metadata'],
    blockedChatActions: ['execute_build', 'apply_changes', 'llm_generate'],
    requiresApprovalActions: ['approve_recovery_plan', 'approve_verification'],
    desktopOnlyActions: ['large_refactor', 'full_system_evolution'],
    founderOnlyActions: ['archive_project', 'override_governance'],
    mobilePreviewAllowed: mobileChatType !== 'FOUNDER_MOBILE_CHAT',
    mobilePreviewBlockedReason: mobileChatType === 'FOUNDER_MOBILE_CHAT' ? 'Founder-only chat surface' : null,
    largeSystemDesktopRecommended: true,
  };
}

export function evaluateMobileChatAction(
  mobileChatId: string,
  actionName: string,
): MobileChatActionGateResult {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return 'BLOCK';
  if (session.mobileChatState === 'CREATED' || session.mobileChatState === 'INITIALIZING') {
    return 'CONTEXT_REQUIRED';
  }

  const perms = session.mobileChatPermissions;
  if (perms.founderOnlyActions.includes(actionName)) return 'FOUNDER_ONLY';
  if (perms.desktopOnlyActions.includes(actionName)) return 'DESKTOP_RECOMMENDED';
  if (perms.requiresApprovalActions.includes(actionName)) return 'REQUIRES_APPROVAL';
  if (perms.blockedChatActions.includes(actionName)) return 'BLOCK';
  if (perms.allowedChatActions.includes(actionName)) return 'ALLOW';
  return 'BLOCK';
}

export function registerMobileChatActionGateResult(input: {
  mobileChatId: string;
  actionName: string;
  result?: MobileChatActionGateResult;
  reason?: string;
}): MobileChatActionGateEntry | null {
  const session = getStoredMobileChatSession(input.mobileChatId);
  if (!session) return null;

  const result = input.result ?? evaluateMobileChatAction(input.mobileChatId, input.actionName);
  const entry: MobileChatActionGateEntry = {
    gateId: nextMobileChatActionGateId(),
    mobileChatId: input.mobileChatId,
    actionName: input.actionName,
    result,
    reason: input.reason ?? `Gate evaluated: ${result}`,
    evaluatedAt: Date.now(),
  };

  storeMobileChatSession({
    ...session,
    mobileChatActionGateResults: [...session.mobileChatActionGateResults, entry],
    updatedAt: Date.now(),
  });

  recordMobileChatHistoryEntry({
    mobileChatId: input.mobileChatId,
    category: 'ACTION_GATE',
    summary: `Action gate: ${input.actionName} → ${result}`,
    scopeUsed: entry.gateId,
  });

  return entry;
}

export function listMobileChatActionGateResults(mobileChatId: string): MobileChatActionGateEntry[] {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatActionGateResults ?? [];
}

export function validateMobileChatPermissions(permissions: ReturnType<typeof buildDefaultMobileChatPermissions>): string[] {
  const issues: string[] = [];
  if (!permissions.mobilePreviewAllowed && !permissions.mobilePreviewBlockedReason?.trim()) {
    issues.push('Mobile preview blocked without reason');
  }
  if (permissions.largeSystemDesktopRecommended && permissions.desktopOnlyActions.length === 0) {
    issues.push('Desktop recommendation missing desktop-only actions');
  }
  return issues;
}
