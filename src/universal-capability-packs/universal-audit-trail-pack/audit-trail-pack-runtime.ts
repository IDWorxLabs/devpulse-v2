/**
 * Universal Audit Trail Pack — testable runtime (domain-neutral).
 */

export interface AuditEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly eventType: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  readonly actorRef: string | null;
  readonly provenance: readonly string[];
  readonly summary: string;
}

export interface AuditRecordInput {
  readonly eventType: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly outcome: AuditEntry['outcome'];
  readonly actorRef?: string | null;
  readonly provenance?: readonly string[];
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly timestamp?: string;
}

let entryCounter = 0;

export function redactPayload(
  payload: Readonly<Record<string, unknown>> | undefined,
  redactedFields: readonly string[],
): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (redactedFields.includes(key.toLowerCase()) || redactedFields.includes(key)) {
      out[key] = '[REDACTED]';
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    } else {
      out[key] = '[OMITTED]';
    }
  }
  return out;
}

export class AuditTrailStore {
  private readonly entries: AuditEntry[] = [];

  constructor(
    private readonly redactedFields: readonly string[],
    private readonly maxEntries: number,
  ) {}

  record(input: AuditRecordInput): AuditEntry {
    const redacted = redactPayload(input.payload, this.redactedFields);
    const summaryParts = [input.eventType, input.targetType, input.targetId, input.outcome];
    if (redacted) summaryParts.push(JSON.stringify(redacted));
    const entry: AuditEntry = {
      id: `audit-${++entryCounter}`,
      timestamp: input.timestamp ?? new Date(0).toISOString(),
      eventType: input.eventType,
      targetType: input.targetType,
      targetId: input.targetId,
      outcome: input.outcome,
      actorRef: input.actorRef ?? null,
      provenance: input.provenance ?? ['universal-audit-trail-pack'],
      summary: summaryParts.join(' | '),
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) this.entries.shift();
    return entry;
  }

  query(filter?: { targetType?: string; targetId?: string; eventType?: string }): AuditEntry[] {
    return this.entries.filter((e) => {
      if (filter?.targetType && e.targetType !== filter.targetType) return false;
      if (filter?.targetId && e.targetId !== filter.targetId) return false;
      if (filter?.eventType && e.eventType !== filter.eventType) return false;
      return true;
    });
  }

  count(): number {
    return this.entries.length;
  }
}

/** Reset counter for deterministic tests. */
export function resetAuditEntryCounter(): void {
  entryCounter = 0;
}
