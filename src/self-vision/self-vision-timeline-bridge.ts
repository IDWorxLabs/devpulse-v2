/**
 * Timeline Ledger bridge — ledger remains owner; Self Vision records observation events.
 */

import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import type { TimelineEvent } from '../timeline-ledger/types.js';
import type { ObservationRecord, ObservationSession } from './types.js';

let lastObservationEventId: string | null = null;
let lastSessionEventId: string | null = null;

export function recordObservationEvent(record: ObservationRecord): TimelineEvent {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  const event = ledger.addEvent({
    source: 'BROWSER_VERIFICATION',
    category: 'VERIFICATION',
    title: `Self Vision observation: ${record.elementId}`,
    summary: `${record.status} — ${record.selector}`,
    relatedEvidenceIds: [],
    relatedRecordId: record.observationId,
    status: record.errors.length > 0 ? 'FAIL' : record.warnings.length > 0 ? 'WARN' : 'INFO',
    warnings: [...record.warnings],
    errors: [...record.errors],
  });
  lastObservationEventId = event.eventId;
  return event;
}

export function recordObservationSession(session: ObservationSession): TimelineEvent {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  const event = ledger.addEvent({
    source: 'BROWSER_VERIFICATION',
    category: 'VERIFICATION',
    title: `Self Vision session: ${session.sessionId}`,
    summary: `Observed ${session.observations.length} element(s) — read-only observation session.`,
    relatedEvidenceIds: [],
    relatedRecordId: session.sessionId,
    status: session.errors.length > 0 ? 'FAIL' : session.warnings.length > 0 ? 'WARN' : 'PASS',
    warnings: [...session.warnings],
    errors: [...session.errors],
  });
  lastSessionEventId = event.eventId;
  return event;
}

export function getLastObservationTimelineEventIds(): { observation?: string; session?: string } {
  return {
    observation: lastObservationEventId ?? undefined,
    session: lastSessionEventId ?? undefined,
  };
}

export function assertTimelineLedgerOwnershipUnchanged(): boolean {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  return (
    ledger.constructor.name === 'DevPulseV2TimelineLedgerAuthority' &&
    typeof ledger.addEvent === 'function' &&
    typeof (ledger as { observeUi?: unknown }).observeUi === 'undefined'
  );
}

export function getTimelineLedgerOwnerForBridge(): string {
  return LEDGER_OWNER_MODULE;
}

export function resetSelfVisionTimelineBridgeForTests(): void {
  lastObservationEventId = null;
  lastSessionEventId = null;
}
