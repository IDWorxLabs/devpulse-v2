/**
 * Mobile Chat Runtime Foundation — lifecycle tracking (no execution).
 */

import {
  nextMobileChatLifecycleEventId,
  storeMobileChatLifecycleEvent,
  getStoredMobileChatSession,
  listStoredMobileChatLifecycleEvents,
} from './mobile-chat-store.js';
import { setMobileChatState } from './mobile-chat-state-manager.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatLifecycleEvent, MobileChatLifecycleEventType, MobileChatState } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

const EVENT_STATE_MAP: Record<MobileChatLifecycleEventType, MobileChatState> = {
  MOBILE_CHAT_CREATED: 'CREATED',
  MOBILE_CHAT_INITIALIZED: 'INITIALIZING',
  MOBILE_CHAT_PROMPT_RECEIVED: 'PROMPT_RECEIVED',
  MOBILE_CHAT_CONTEXT_READY: 'CONTEXT_READY',
  MOBILE_CHAT_ROUTED_TO_COMMAND: 'ROUTED_TO_COMMAND',
  MOBILE_CHAT_WAITING_FOR_APPROVAL: 'WAITING_FOR_APPROVAL',
  MOBILE_CHAT_ACTION_BLOCKED: 'ACTION_BLOCKED',
  MOBILE_CHAT_ACTION_ALLOWED: 'ACTION_ALLOWED',
  MOBILE_CHAT_RESPONSE_PENDING: 'RESPONSE_PENDING',
  MOBILE_CHAT_RESPONSE_READY: 'RESPONSE_READY',
  MOBILE_CHAT_COMPLETED: 'COMPLETED',
  MOBILE_CHAT_ARCHIVED: 'ARCHIVED',
  MOBILE_CHAT_FAILED: 'FAILED',
};

export function recordMobileChatLifecycleEvent(
  mobileChatId: string,
  eventType: MobileChatLifecycleEventType,
  notes = '',
): MobileChatLifecycleEvent | null {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = session.mobileChatState;

  const event: MobileChatLifecycleEvent = {
    eventId: nextMobileChatLifecycleEventId(),
    mobileChatId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeMobileChatLifecycleEvent(event);

  if (previousState !== targetState) {
    setMobileChatState(mobileChatId, targetState, eventType === 'MOBILE_CHAT_INITIALIZED');
  }

  recordMobileChatHistoryEntry({
    mobileChatId,
    category: 'LIFECYCLE',
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: mobileChatId,
  });

  return event;
}

export function initializeMobileChat(mobileChatId: string): MobileChatLifecycleEvent | null {
  return recordMobileChatLifecycleEvent(mobileChatId, 'MOBILE_CHAT_INITIALIZED', 'Authority initialization');
}

export function completeMobileChat(mobileChatId: string): MobileChatLifecycleEvent | null {
  return recordMobileChatLifecycleEvent(mobileChatId, 'MOBILE_CHAT_COMPLETED', 'Mobile chat authority complete');
}

export function archiveMobileChat(mobileChatId: string): MobileChatLifecycleEvent | null {
  return recordMobileChatLifecycleEvent(mobileChatId, 'MOBILE_CHAT_ARCHIVED', 'Mobile chat archived');
}

export function failMobileChat(mobileChatId: string, reason: string): MobileChatLifecycleEvent | null {
  return recordMobileChatLifecycleEvent(mobileChatId, 'MOBILE_CHAT_FAILED', reason);
}

export function listLifecycleEventsForMobileChat(mobileChatId: string): MobileChatLifecycleEvent[] {
  return listStoredMobileChatLifecycleEvents().filter((e) => e.mobileChatId === mobileChatId);
}
