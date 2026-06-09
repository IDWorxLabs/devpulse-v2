/**
 * Mobile Preview Runtime Foundation — lifecycle tracking (no execution).
 */

import {
  nextMobilePreviewLifecycleEventId,
  storeMobilePreviewLifecycleEvent,
  getStoredMobilePreviewSession,
  listStoredMobilePreviewLifecycleEvents,
} from './mobile-preview-store.js';
import { setMobilePreviewState } from './mobile-preview-state-manager.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type {
  MobilePreviewLifecycleEvent,
  MobilePreviewLifecycleEventType,
  MobilePreviewState,
} from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

const EVENT_STATE_MAP: Record<MobilePreviewLifecycleEventType, MobilePreviewState> = {
  MOBILE_PREVIEW_CREATED: 'CREATED',
  MOBILE_PREVIEW_INITIALIZED: 'INITIALIZING',
  MOBILE_PREVIEW_ELIGIBILITY_CHECKED: 'ELIGIBILITY_CHECKED',
  MOBILE_PREVIEW_SAFETY_CHECKED: 'SAFETY_CHECKED',
  MOBILE_PREVIEW_ALLOWED: 'MOBILE_PREVIEW_ALLOWED',
  MOBILE_PREVIEW_BLOCKED: 'MOBILE_PREVIEW_BLOCKED',
  MOBILE_PREVIEW_DESKTOP_RECOMMENDED: 'DESKTOP_RECOMMENDED',
  MOBILE_PREVIEW_LINK_REGISTERED: 'PREVIEW_LINK_REGISTERED',
  MOBILE_PREVIEW_PENDING: 'PREVIEW_PENDING',
  MOBILE_PREVIEW_READY: 'PREVIEW_READY',
  MOBILE_PREVIEW_COMPLETED: 'COMPLETED',
  MOBILE_PREVIEW_ARCHIVED: 'ARCHIVED',
  MOBILE_PREVIEW_FAILED: 'FAILED',
};

export function recordMobilePreviewLifecycleEvent(
  mobilePreviewId: string,
  eventType: MobilePreviewLifecycleEventType,
  notes = '',
): MobilePreviewLifecycleEvent | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = session.mobilePreviewState;

  const event: MobilePreviewLifecycleEvent = {
    eventId: nextMobilePreviewLifecycleEventId(),
    mobilePreviewId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeMobilePreviewLifecycleEvent(event);

  if (previousState !== targetState) {
    setMobilePreviewState(
      mobilePreviewId,
      targetState,
      eventType === 'MOBILE_PREVIEW_INITIALIZED',
    );
  }

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'LIFECYCLE',
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: mobilePreviewId,
  });

  return event;
}

export function initializeMobilePreview(mobilePreviewId: string): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(
    mobilePreviewId,
    'MOBILE_PREVIEW_INITIALIZED',
    'Authority initialization',
  );
}

export function checkMobilePreviewEligibility(
  mobilePreviewId: string,
  notes = 'Eligibility evaluated',
): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(
    mobilePreviewId,
    'MOBILE_PREVIEW_ELIGIBILITY_CHECKED',
    notes,
  );
}

export function checkMobilePreviewSafety(
  mobilePreviewId: string,
  notes = 'Safety evaluated',
): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(mobilePreviewId, 'MOBILE_PREVIEW_SAFETY_CHECKED', notes);
}

export function allowMobilePreview(mobilePreviewId: string): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(
    mobilePreviewId,
    'MOBILE_PREVIEW_ALLOWED',
    'Mobile preview allowed by authority',
  );
}

export function blockMobilePreview(mobilePreviewId: string, reason: string): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(mobilePreviewId, 'MOBILE_PREVIEW_BLOCKED', reason);
}

export function recommendDesktopForMobilePreview(
  mobilePreviewId: string,
  reason: string,
): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(mobilePreviewId, 'MOBILE_PREVIEW_DESKTOP_RECOMMENDED', reason);
}

export function registerMobilePreviewLinkLifecycle(
  mobilePreviewId: string,
  notes = 'Preview link registered',
): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(mobilePreviewId, 'MOBILE_PREVIEW_LINK_REGISTERED', notes);
}

export function markMobilePreviewPending(mobilePreviewId: string): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(mobilePreviewId, 'MOBILE_PREVIEW_PENDING', 'Preview pending');
}

export function markMobilePreviewReady(mobilePreviewId: string): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(mobilePreviewId, 'MOBILE_PREVIEW_READY', 'Preview ready');
}

export function completeMobilePreview(mobilePreviewId: string): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(
    mobilePreviewId,
    'MOBILE_PREVIEW_COMPLETED',
    'Mobile preview authority complete',
  );
}

export function archiveMobilePreview(mobilePreviewId: string): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(mobilePreviewId, 'MOBILE_PREVIEW_ARCHIVED', 'Mobile preview archived');
}

export function failMobilePreview(mobilePreviewId: string, reason: string): MobilePreviewLifecycleEvent | null {
  return recordMobilePreviewLifecycleEvent(mobilePreviewId, 'MOBILE_PREVIEW_FAILED', reason);
}

export function listLifecycleEventsForMobilePreview(mobilePreviewId: string): MobilePreviewLifecycleEvent[] {
  return listStoredMobilePreviewLifecycleEvents().filter((e) => e.mobilePreviewId === mobilePreviewId);
}
