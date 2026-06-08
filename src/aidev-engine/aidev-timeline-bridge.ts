/**
 * Timeline Ledger bridge — ledger remains owner; AiDev records events via Timeline APIs.
 */

import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import type { TimelineEvent } from '../timeline-ledger/types.js';
import type { AiDevRequest, AiDevRequestStatus } from './types.js';

let lastCreatedEventId: string | null = null;
let lastStatusEventId: string | null = null;

export function recordAiDevRequestCreated(request: AiDevRequest): TimelineEvent {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  const event = ledger.addEvent({
    source: 'FOUNDATION',
    category: 'SYSTEM',
    title: `AiDev request created: ${request.requestId}`,
    summary: request.normalizedInput,
    relatedEvidenceIds: [],
    relatedRecordId: request.requestId,
    status: request.status === 'REJECTED' ? 'FAIL' : 'INFO',
    warnings: [...request.warnings],
    errors: [...request.errors],
  });
  lastCreatedEventId = event.eventId;
  return event;
}

export function recordAiDevRequestStatusChanged(
  request: AiDevRequest,
  previousStatus: AiDevRequestStatus,
): TimelineEvent {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  const event = ledger.addEvent({
    source: 'FOUNDATION',
    category: 'SYSTEM',
    title: `AiDev request status: ${previousStatus} → ${request.status}`,
    summary: `Request ${request.requestId} status changed`,
    relatedEvidenceIds: [],
    relatedRecordId: request.requestId,
    status: request.status === 'REJECTED' ? 'FAIL' : request.status === 'READY_FOR_PLANNING' ? 'PASS' : 'INFO',
    warnings: [],
    errors: [],
  });
  lastStatusEventId = event.eventId;
  return event;
}

export function getLastAiDevTimelineEventIds(): { created?: string; status?: string } {
  return {
    created: lastCreatedEventId ?? undefined,
    status: lastStatusEventId ?? undefined,
  };
}

export function assertTimelineLedgerOwnershipUnchanged(): boolean {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  return (
    ledger.constructor.name === 'DevPulseV2TimelineLedgerAuthority' &&
    typeof ledger.addEvent === 'function' &&
    typeof (ledger as { createBuildRequest?: unknown }).createBuildRequest === 'undefined'
  );
}

export function getTimelineLedgerOwnerForBridge(): string {
  return LEDGER_OWNER_MODULE;
}

export function resetAiDevTimelineBridgeForTests(): void {
  lastCreatedEventId = null;
  lastStatusEventId = null;
}
