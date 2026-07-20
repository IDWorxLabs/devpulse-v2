/**
 * Universal Audit Trail Pack — workspace materializer.
 */

import type { GeneratedWorkspaceFile } from '../../code-generation-engine/code-generation-engine-types.js';
import { UNIVERSAL_AUDIT_TRAIL_PACK_DESCRIPTOR } from './audit-trail-pack-descriptor.js';

export function materializeAuditTrailPack(configuration: Readonly<Record<string, unknown>>): GeneratedWorkspaceFile[] {
  const redactedFields = (configuration.redactedFields as string[]) ?? ['password', 'secret', 'token'];
  const maxEntries = Number(configuration.maxEntries ?? 1000);

  return [
    {
      relativePath: 'src/universal-capability-packs/audit-trail/audit-trail-runtime.ts',
      content: generateSelfContainedAuditRuntime(redactedFields, maxEntries),
    },
    {
      relativePath: 'src/universal-capability-packs/audit-trail/audit-trail-pack.json',
      content: `${JSON.stringify({ packId: UNIVERSAL_AUDIT_TRAIL_PACK_DESCRIPTOR.packId, version: UNIVERSAL_AUDIT_TRAIL_PACK_DESCRIPTOR.packVersion, redactedFields, maxEntries }, null, 2)}\n`,
    },
  ];
}

function generateSelfContainedAuditRuntime(redactedFields: string[], maxEntries: number): string {
  return `/** Universal Audit Trail Pack runtime — self-contained generated artifact */
export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: string;
  targetType: string;
  targetId: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  actorRef: string | null;
  provenance: string[];
  summary: string;
}

const REDACTED_FIELDS: readonly string[] = ${JSON.stringify(redactedFields)};
const MAX_ENTRIES = ${maxEntries};
const entries: AuditEntry[] = [];
let counter = 0;

function redactPayload(payload: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (REDACTED_FIELDS.includes(key.toLowerCase()) || REDACTED_FIELDS.includes(key)) {
      out[key] = '[REDACTED]';
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    } else {
      out[key] = '[OMITTED]';
    }
  }
  return out;
}

export function recordAuditEvent(input: {
  eventType: string;
  targetType: string;
  targetId: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  actorRef?: string | null;
  provenance?: string[];
  payload?: Record<string, unknown>;
  timestamp?: string;
}): AuditEntry {
  const redacted = redactPayload(input.payload);
  const summary = [input.eventType, input.targetType, input.targetId, input.outcome, redacted ? JSON.stringify(redacted) : ''].filter(Boolean).join(' | ');
  const entry: AuditEntry = {
    id: 'audit-' + ++counter,
    timestamp: input.timestamp ?? new Date(0).toISOString(),
    eventType: input.eventType,
    targetType: input.targetType,
    targetId: input.targetId,
    outcome: input.outcome,
    actorRef: input.actorRef ?? null,
    provenance: input.provenance ?? ['universal-audit-trail-pack'],
    summary,
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  return entry;
}

export function queryAuditEvents(filter?: { targetType?: string; targetId?: string; eventType?: string }): AuditEntry[] {
  return entries.filter((e) => {
    if (filter?.targetType && e.targetType !== filter.targetType) return false;
    if (filter?.targetId && e.targetId !== filter.targetId) return false;
    if (filter?.eventType && e.eventType !== filter.eventType) return false;
    return true;
  });
}

export function auditEntryCount(): number {
  return entries.length;
}
`;
}
