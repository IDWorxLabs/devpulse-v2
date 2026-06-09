/**
 * Mobile Chat Runtime Foundation — response state (metadata only).
 */

import { getStoredMobileChatSession, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import { setMobileChatState } from './mobile-chat-state-manager.js';
import { recordMobileChatLifecycleEvent } from './mobile-chat-lifecycle.js';
import type { MobileChatResponseState, MobileChatVisibility } from './mobile-chat-types.js';

let responseCounter = 0;

export function resetMobileChatResponseCounterForTests(): void {
  responseCounter = 0;
}

export function nextMobileChatResponseId(): string {
  responseCounter += 1;
  return `mresp-${responseCounter.toString().padStart(4, '0')}`;
}

export function setMobileChatResponsePending(
  mobileChatId: string,
  reason = 'Awaiting authority metadata assembly',
): MobileChatResponseState | null {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return null;

  const response: MobileChatResponseState = {
    responseId: nextMobileChatResponseId(),
    mobileChatId,
    responseStatus: 'PENDING',
    responseSummary: 'Response pending — metadata only, no LLM generation',
    responseVisibility: session.mobileChatVisibility,
    responseReferences: [],
    responsePendingReason: reason,
    responseReadyTimestamp: null,
  };

  storeMobileChatSession({ ...session, mobileChatResponseState: response, updatedAt: Date.now() });
  recordMobileChatLifecycleEvent(mobileChatId, 'MOBILE_CHAT_RESPONSE_PENDING', reason);
  setMobileChatState(mobileChatId, 'RESPONSE_PENDING', true);
  recordMobileChatHistoryEntry({
    mobileChatId,
    category: 'RESPONSE',
    summary: `Response pending: ${response.responseId}`,
    scopeUsed: response.responseId,
  });
  return response;
}

export function setMobileChatResponseReady(
  mobileChatId: string,
  summary: string,
  references: string[] = [],
): MobileChatResponseState | null {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return null;

  const response: MobileChatResponseState = session.mobileChatResponseState ?? {
    responseId: nextMobileChatResponseId(),
    mobileChatId,
    responseStatus: 'PENDING',
    responseSummary: '',
    responseVisibility: session.mobileChatVisibility,
    responseReferences: [],
    responsePendingReason: null,
    responseReadyTimestamp: null,
  };

  const updated: MobileChatResponseState = {
    ...response,
    responseStatus: 'READY',
    responseSummary: summary,
    responseReferences: references,
    responsePendingReason: null,
    responseReadyTimestamp: Date.now(),
  };

  storeMobileChatSession({ ...session, mobileChatResponseState: updated, updatedAt: Date.now() });
  recordMobileChatLifecycleEvent(mobileChatId, 'MOBILE_CHAT_RESPONSE_READY', summary.slice(0, 80));
  setMobileChatState(mobileChatId, 'RESPONSE_READY', true);
  recordMobileChatHistoryEntry({
    mobileChatId,
    category: 'RESPONSE',
    summary: `Response ready: ${updated.responseId}`,
    scopeUsed: updated.responseId,
  });
  return updated;
}

export function getMobileChatResponseState(mobileChatId: string): MobileChatResponseState | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatResponseState ?? null;
}

export function validateMobileChatResponseState(state: MobileChatResponseState | null): string[] {
  const issues: string[] = [];
  if (!state) {
    issues.push('Missing response state');
    return issues;
  }
  if (state.responseStatus === 'PENDING' && !state.responsePendingReason?.trim()) {
    issues.push('Response pending without reason');
  }
  if (state.responseStatus === 'READY' && !state.responseSummary?.trim()) {
    issues.push('Response ready without summary');
  }
  return issues;
}

export function updateResponseVisibility(
  mobileChatId: string,
  visibility: MobileChatVisibility,
): MobileChatResponseState | null {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session?.mobileChatResponseState) return null;
  const updated = { ...session.mobileChatResponseState, responseVisibility: visibility };
  storeMobileChatSession({ ...session, mobileChatResponseState: updated, updatedAt: Date.now() });
  return updated;
}
