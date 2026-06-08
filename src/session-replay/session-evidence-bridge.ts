/**
 * Evidence Registry bridge — registry remains owner; Session Replay consumes evidence history.
 */

import { getDevPulseV2EvidenceRegistryAuthority } from '../evidence-registry/evidence-registry-authority.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import type { EvidenceRecord } from '../evidence-registry/types.js';
import { buildSessionReplayRecord, createSessionReplayEvent } from './session-replay-engine.js';
import type { SessionReplayRecord } from './types.js';

function evidenceToSessionEvent(record: EvidenceRecord) {
  return createSessionReplayEvent({
    timestamp: record.createdAt,
    sourceSystemId: 'evidence_registry',
    eventType: 'EVIDENCE',
    description: `${record.label}: ${record.summary} (${record.status})`,
    evidenceIds: [record.evidenceId],
    warnings: [...record.warnings],
    errors: [...record.errors],
  });
}

export function reconstructEvidenceSessions(): SessionReplayRecord[] {
  const records = getDevPulseV2EvidenceRegistryAuthority().listEvidence();
  if (records.length === 0) {
    return [];
  }

  const bySession = new Map<string, EvidenceRecord[]>();
  for (const record of records) {
    const key = record.relatedRecordId ?? record.relatedSystemId ?? 'evidence-session';
    const group = bySession.get(key) ?? [];
    group.push(record);
    bySession.set(key, group);
  }

  return [...bySession.entries()].map(([sessionId, group]) =>
    buildSessionReplayRecord(
      sessionId,
      group.sort((a, b) => a.createdAt - b.createdAt).map(evidenceToSessionEvent),
      [],
      [],
    ),
  );
}

export function getEvidenceSessionSummary(): string {
  const sessions = reconstructEvidenceSessions();
  const eventCount = sessions.reduce((n, r) => n + r.events.length, 0);
  if (eventCount === 0) {
    return 'No evidence sessions available for session reconstruction.';
  }
  return `Evidence sessions: ${sessions.length} session(s), ${eventCount} event(s).`;
}

export function assertEvidenceRegistryOwnershipUnchanged(): boolean {
  const registry = getDevPulseV2EvidenceRegistryAuthority();
  return (
    registry.constructor.name === 'DevPulseV2EvidenceRegistryAuthority' &&
    typeof registry.listEvidence === 'function' &&
    typeof (registry as { reconstructSession?: unknown }).reconstructSession === 'undefined'
  );
}

export function getEvidenceRegistryOwnerForBridge(): string {
  return REGISTRY_OWNER_MODULE;
}
