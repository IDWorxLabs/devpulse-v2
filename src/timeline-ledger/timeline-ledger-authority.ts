/**
 * DevPulse V2 Timeline Ledger Authority — chronological event history only.
 * Does NOT calculate trust, make decisions, or execute work.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { formatTimelineLedgerReport } from './timeline-ledger-report.js';
import type {
  LedgerSnapshot,
  LedgerState,
  TimelineEvent,
  TimelineEventCategory,
  TimelineEventInput,
  TimelineEventSource,
} from './types.js';
import { LEDGER_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2TimelineLedgerAuthority | null = null;

function createLedgerId(): string {
  return `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEventId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSnapshotId(): string {
  return `ledger-snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneEvent(event: TimelineEvent): TimelineEvent {
  return {
    ...event,
    relatedEvidenceIds: [...event.relatedEvidenceIds],
    warnings: [...event.warnings],
    errors: [...event.errors],
  };
}

export class DevPulseV2TimelineLedgerAuthority {
  private readonly ledgerId: string = createLedgerId();
  private readonly events = new Map<string, TimelineEvent>();
  private readonly snapshots: LedgerSnapshot[] = [];
  private ledgerWarnings: string[] = [];
  private ledgerErrors: string[] = [];

  static readonly ownerModule = LEDGER_OWNER_MODULE;
  static readonly ownerDomain = 'timeline_event_ledger' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('timeline_event_ledger');
    return owner.ownerModule === LEDGER_OWNER_MODULE;
  }

  static assertDoesNotReplaceEvidenceRegistry(): boolean {
    return getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE;
  }

  static assertDoesNotReplaceProjectVault(): boolean {
    return getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE;
  }

  addEvent(input: TimelineEventInput): TimelineEvent {
    const event: TimelineEvent = {
      eventId: input.eventId ?? createEventId(),
      createdAt: input.createdAt ?? Date.now(),
      source: input.source,
      category: input.category,
      title: input.title.trim(),
      summary: input.summary.trim(),
      relatedEvidenceIds: [...input.relatedEvidenceIds],
      relatedProjectId: input.relatedProjectId,
      relatedRecordId: input.relatedRecordId,
      status: input.status,
      warnings: [...input.warnings],
      errors: [...input.errors],
    };

    if (!event.title) {
      event.errors.push('Timeline event title is required');
      this.ledgerErrors.push('addEvent rejected empty title');
    } else {
      this.events.set(event.eventId, event);
    }

    return cloneEvent(event);
  }

  getEvent(eventId: string): TimelineEvent | null {
    const event = this.events.get(eventId);
    return event ? cloneEvent(event) : null;
  }

  listEvents(): TimelineEvent[] {
    return [...this.events.values()]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(cloneEvent);
  }

  listEventsBySource(source: TimelineEventSource): TimelineEvent[] {
    return this.listEvents().filter((e) => e.source === source);
  }

  listEventsByCategory(category: TimelineEventCategory): TimelineEvent[] {
    return this.listEvents().filter((e) => e.category === category);
  }

  listEventsForProject(projectId: string): TimelineEvent[] {
    return this.listEvents().filter((e) => e.relatedProjectId === projectId);
  }

  createLedgerSnapshot(): LedgerSnapshot {
    const events = this.listEvents();
    const snapshot: LedgerSnapshot = {
      snapshotId: createSnapshotId(),
      capturedAt: Date.now(),
      eventCount: events.length,
      events,
    };
    this.snapshots.push(snapshot);
    return {
      ...snapshot,
      events: snapshot.events.map(cloneEvent),
    };
  }

  getLedgerState(): LedgerState {
    return {
      ledgerId: this.ledgerId,
      eventCount: this.events.size,
      snapshotCount: this.snapshots.length,
      warnings: [...this.ledgerWarnings],
      errors: [...this.ledgerErrors],
    };
  }

  formatReport(): string {
    return formatTimelineLedgerReport(this.getLedgerState(), this.listEvents());
  }
}

export function createDevPulseV2TimelineLedgerAuthority(): DevPulseV2TimelineLedgerAuthority {
  singleton = new DevPulseV2TimelineLedgerAuthority();
  return singleton;
}

export function getDevPulseV2TimelineLedgerAuthority(): DevPulseV2TimelineLedgerAuthority {
  if (!singleton) {
    singleton = new DevPulseV2TimelineLedgerAuthority();
  }
  return singleton;
}

export function resetDevPulseV2TimelineLedgerAuthorityForTests(): DevPulseV2TimelineLedgerAuthority {
  singleton = new DevPulseV2TimelineLedgerAuthority();
  return singleton;
}
