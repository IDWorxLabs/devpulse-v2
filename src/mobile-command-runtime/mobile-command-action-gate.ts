/**
 * Mobile Command Runtime Foundation — action gate (decision metadata only).
 */

import { getStoredMobileCommandSession, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileActionGateResult, MobileCommandActionGateEntry } from './mobile-command-types.js';

let gateCounter = 0;

export function resetMobileCommandActionGateCounterForTests(): void {
  gateCounter = 0;
}

export function nextMobileActionGateId(): string {
  gateCounter += 1;
  return `mgate-${gateCounter.toString().padStart(4, '0')}`;
}

export function evaluateMobileCommandAction(
  mobileCommandId: string,
  actionName: string,
): MobileActionGateResult {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return 'BLOCK';

  const perms = session.mobileCommandPermissions;
  if (perms.founderOnlyActions.includes(actionName)) return 'FOUNDER_ONLY';
  if (perms.desktopOnlyActions.includes(actionName)) return 'DESKTOP_RECOMMENDED';
  if (perms.requiresApprovalActions.includes(actionName)) return 'REQUIRES_APPROVAL';
  if (perms.blockedMobileActions.includes(actionName)) return 'BLOCK';
  if (perms.allowedMobileActions.includes(actionName) || perms.cloudAllowedActions.includes(actionName)) {
    return 'ALLOW';
  }
  return 'BLOCK';
}

export function registerMobileActionGateResult(input: {
  mobileCommandId: string;
  actionName: string;
  result?: MobileActionGateResult;
  reason?: string;
}): MobileCommandActionGateEntry | null {
  const session = getStoredMobileCommandSession(input.mobileCommandId);
  if (!session) return null;

  const result = input.result ?? evaluateMobileCommandAction(input.mobileCommandId, input.actionName);
  const entry: MobileCommandActionGateEntry = {
    gateId: nextMobileActionGateId(),
    mobileCommandId: input.mobileCommandId,
    actionName: input.actionName,
    result,
    reason: input.reason ?? `Gate evaluated: ${result}`,
    evaluatedAt: Date.now(),
  };

  storeMobileCommandSession({
    ...session,
    mobileCommandActionGateResults: [...session.mobileCommandActionGateResults, entry],
    updatedAt: Date.now(),
  });

  recordMobileCommandHistoryEntry({
    mobileCommandId: input.mobileCommandId,
    category: 'ACTION_GATE',
    summary: `Action gate: ${input.actionName} → ${result}`,
    scopeUsed: entry.gateId,
  });

  return entry;
}

export function listMobileActionGateResults(mobileCommandId: string): MobileCommandActionGateEntry[] {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandActionGateResults ?? [];
}
