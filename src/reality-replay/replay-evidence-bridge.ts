/**
 * Evidence Registry bridge — registry remains owner; Reality Replay consumes evidence history.
 */

import { getDevPulseV2EvidenceRegistryAuthority } from '../evidence-registry/evidence-registry-authority.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import type { EvidenceRecord } from '../evidence-registry/types.js';
import { createReplayEvent } from './reality-replay-engine.js';
import type { ReplayEvent } from './types.js';

function evidenceToReplayEvent(record: EvidenceRecord): ReplayEvent {
  return createReplayEvent({
    timestamp: record.createdAt,
    sourceSystemId: 'evidence_registry',
    eventType: 'EVIDENCE',
    description: `${record.label}: ${record.summary} (${record.status})`,
    evidenceIds: [record.evidenceId],
    warnings: [...record.warnings],
    errors: [...record.errors],
  });
}

export function reconstructEvidenceHistory(): ReplayEvent[] {
  const records = getDevPulseV2EvidenceRegistryAuthority().listEvidence();
  return [...records]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(evidenceToReplayEvent);
}

export function getEvidenceReplaySummary(): string {
  const events = reconstructEvidenceHistory();
  if (events.length === 0) {
    return 'No evidence records available for replay reconstruction.';
  }
  return `Evidence replay: ${events.length} record(s) reconstructed chronologically.`;
}

export function assertEvidenceRegistryOwnershipUnchanged(): boolean {
  const registry = getDevPulseV2EvidenceRegistryAuthority();
  return (
    registry.constructor.name === 'DevPulseV2EvidenceRegistryAuthority' &&
    typeof registry.listEvidence === 'function' &&
    typeof (registry as { reconstructHistory?: unknown }).reconstructHistory === 'undefined'
  );
}

export function getEvidenceRegistryOwnerForBridge(): string {
  return REGISTRY_OWNER_MODULE;
}
