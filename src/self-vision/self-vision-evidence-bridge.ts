/**
 * Evidence Registry bridge — registry remains owner; Self Vision contributes observation evidence.
 */

import { getDevPulseV2EvidenceRegistryAuthority } from '../evidence-registry/evidence-registry-authority.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import type { EvidenceRecord, EvidenceRecordInput } from '../evidence-registry/types.js';
import type { ObservationRecord, ObservationSession } from './types.js';

let lastPublishedEvidenceId: string | null = null;

export function createObservationEvidence(record: ObservationRecord): EvidenceRecordInput {
  const status =
    record.errors.length > 0 ? 'FAIL' : record.warnings.length > 0 ? 'WARN' : 'INFO';
  return {
    source: 'BROWSER_VERIFICATION',
    label: `Self Vision observation: ${record.elementId}`,
    summary: `${record.status} at ${record.selector}`,
    status,
    relatedSystemId: 'self_vision',
    relatedRecordId: record.observationId,
    tags: ['self_vision', 'observation', record.status.toLowerCase()],
    warnings: [...record.warnings],
    errors: [...record.errors],
  };
}

export function createSessionObservationEvidence(session: ObservationSession): EvidenceRecordInput {
  return {
    source: 'BROWSER_VERIFICATION',
    label: `Self Vision session: ${session.sessionId}`,
    summary: `Observed ${session.observations.length} element(s) — read-only session evidence.`,
    status: session.errors.length > 0 ? 'FAIL' : session.warnings.length > 0 ? 'WARN' : 'PASS',
    relatedSystemId: 'self_vision',
    relatedRecordId: session.sessionId,
    tags: ['self_vision', 'observation_session'],
    warnings: [...session.warnings],
    errors: [...session.errors],
  };
}

export function publishObservationEvidence(record: ObservationRecord): EvidenceRecord {
  const input = createObservationEvidence(record);
  const evidence = getDevPulseV2EvidenceRegistryAuthority().addEvidence(input);
  lastPublishedEvidenceId = evidence.evidenceId;
  return evidence;
}

export function getLastPublishedObservationEvidenceId(): string | null {
  return lastPublishedEvidenceId;
}

export function assertEvidenceRegistryOwnershipUnchanged(): boolean {
  const registry = getDevPulseV2EvidenceRegistryAuthority();
  return (
    registry.constructor.name === 'DevPulseV2EvidenceRegistryAuthority' &&
    typeof registry.addEvidence === 'function' &&
    typeof (registry as { observeUi?: unknown }).observeUi === 'undefined'
  );
}

export function getEvidenceRegistryOwnerForBridge(): string {
  return REGISTRY_OWNER_MODULE;
}

export function resetSelfVisionEvidenceBridgeForTests(): void {
  lastPublishedEvidenceId = null;
}
