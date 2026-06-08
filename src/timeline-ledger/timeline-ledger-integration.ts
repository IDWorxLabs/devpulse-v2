/**
 * Timeline Ledger integration helpers — create events from Evidence Registry and Project Vault.
 * Does not mutate source systems or calculate trust.
 */

import type { EvidenceRecord } from '../evidence-registry/types.js';
import type { ProjectRecord, ProjectSnapshot } from '../project-vault/types.js';
import type { TimelineEventInput, TimelineEventStatus } from './types.js';

function mapEvidenceStatus(status: EvidenceRecord['status']): TimelineEventStatus {
  if (status === 'PASS' || status === 'WARN' || status === 'FAIL') return status;
  return 'INFO';
}

/** Create a timeline event reference from an Evidence Registry record. */
export function recordEvidenceEvent(evidence: EvidenceRecord): TimelineEventInput {
  return {
    source: 'EVIDENCE_REGISTRY',
    category: 'EVIDENCE',
    title: `Evidence recorded: ${evidence.label}`,
    summary: evidence.summary,
    relatedEvidenceIds: [evidence.evidenceId],
    relatedRecordId: evidence.relatedRecordId,
    status: mapEvidenceStatus(evidence.status),
    warnings: [...evidence.warnings],
    errors: [...evidence.errors],
  };
}

/** Create a timeline event reference from a Project Vault record change. */
export function recordProjectEvent(
  kind: 'project_created' | 'project_updated',
  project: ProjectRecord,
): TimelineEventInput {
  const title =
    kind === 'project_created'
      ? `Project created: ${project.name}`
      : `Project updated: ${project.name}`;

  return {
    source: 'PROJECT_VAULT',
    category: 'PROJECT',
    title,
    summary: project.summary,
    relatedEvidenceIds: [],
    relatedProjectId: project.projectId,
    relatedRecordId: project.projectId,
    status: project.errors.length > 0 ? 'FAIL' : project.warnings.length > 0 ? 'WARN' : 'INFO',
    warnings: [...project.warnings],
    errors: [...project.errors],
  };
}

/** Create a timeline event reference from a Project Vault snapshot. */
export function recordProjectSnapshotEvent(snapshot: ProjectSnapshot): TimelineEventInput {
  return {
    source: 'PROJECT_VAULT',
    category: 'PROJECT',
    title: `Project snapshot: ${snapshot.name}`,
    summary: `Snapshot captured with ${snapshot.factCount} fact(s) at phase ${snapshot.phase}`,
    relatedEvidenceIds: [],
    relatedProjectId: snapshot.projectId,
    relatedRecordId: snapshot.snapshotId,
    status: 'INFO',
    warnings: [],
    errors: [],
  };
}
