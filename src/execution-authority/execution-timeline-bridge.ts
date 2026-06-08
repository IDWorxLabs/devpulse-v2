/**
 * Timeline Ledger bridge — ledger remains owner; Execution Authority records decision events only.
 * Decision events do NOT imply execution occurred.
 */

import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import type { TimelineEvent } from '../timeline-ledger/types.js';
import type { ExecutionDecision } from './types.js';

let lastDecisionEventId: string | null = null;

export function recordExecutionDecisionEvent(decision: ExecutionDecision): TimelineEvent {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  const event = ledger.addEvent({
    source: 'FOUNDATION',
    category: 'SYSTEM',
    title: `Execution decision: ${decision.classification}`,
    summary: `${decision.allowed ? 'ALLOWED (read-only)' : 'BLOCKED (no action taken)'} — ${decision.reason}`,
    relatedEvidenceIds: [],
    relatedRecordId: decision.decisionId,
    status: decision.allowed ? 'INFO' : 'WARN',
    warnings: [
      ...decision.warnings,
      'Governance decision only — no execution occurred.',
    ],
    errors: [...decision.errors],
  });
  lastDecisionEventId = event.eventId;
  return event;
}

export function getLastExecutionDecisionEventId(): string | null {
  return lastDecisionEventId;
}

export function assertTimelineLedgerOwnershipUnchanged(): boolean {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  return (
    ledger.constructor.name === 'DevPulseV2TimelineLedgerAuthority' &&
    typeof ledger.addEvent === 'function' &&
    typeof (ledger as { executeCommand?: unknown }).executeCommand === 'undefined'
  );
}

export function getTimelineLedgerOwnerForBridge(): string {
  return LEDGER_OWNER_MODULE;
}

export function resetExecutionTimelineBridgeForTests(): void {
  lastDecisionEventId = null;
}
