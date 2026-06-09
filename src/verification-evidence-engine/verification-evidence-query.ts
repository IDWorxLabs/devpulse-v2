/**
 * Evidence query — filter and search evidence records.
 */

import {
  listEvidence,
  listEvidenceByOwner,
  listEvidenceByProject,
  listEvidenceByVerification,
  listEvidenceByWorkspace,
} from './verification-evidence-store.js';
import {
  buildTraceabilityIndex,
  locateByCompletionChain,
  locateByModule,
  locateByOrchestration,
  locateByOwner,
  locateByReport,
  locateByVerificationSession,
  locateByWorld2Chain,
  type TraceabilityIndex,
} from './verification-evidence-traceability.js';
import type { EvidenceCategory, EvidenceRecord } from './verification-evidence-types.js';

export interface EvidenceQueryCriteria {
  evidenceType?: EvidenceCategory;
  ownerModule?: string;
  producedBy?: string;
  verificationTargetId?: string;
  verificationSessionId?: string;
  projectId?: string;
  workspaceId?: string;
  reportId?: string;
  orchestrationId?: string;
  completionChainId?: string;
  world2ChainId?: string;
  evidenceStatus?: string;
}

export function queryEvidence(criteria: EvidenceQueryCriteria): EvidenceRecord[] {
  let records = listEvidence();

  if (criteria.projectId) {
    records = listEvidenceByProject(criteria.projectId);
  } else if (criteria.workspaceId) {
    records = listEvidenceByWorkspace(criteria.workspaceId);
  } else if (criteria.verificationTargetId) {
    records = listEvidenceByVerification(criteria.verificationTargetId);
  } else if (criteria.ownerModule) {
    records = listEvidenceByOwner(criteria.ownerModule);
  }

  const index = buildTraceabilityIndex(listEvidence());

  if (criteria.verificationSessionId) {
    const ids = new Set(locateByVerificationSession(index, criteria.verificationSessionId));
    records = records.filter((r) => ids.has(r.evidenceId));
  }
  if (criteria.reportId) {
    const ids = new Set(locateByReport(index, criteria.reportId));
    records = records.filter((r) => ids.has(r.evidenceId));
  }
  if (criteria.orchestrationId) {
    const ids = new Set(locateByOrchestration(index, criteria.orchestrationId));
    records = records.filter((r) => ids.has(r.evidenceId));
  }
  if (criteria.completionChainId) {
    const ids = new Set(locateByCompletionChain(index, criteria.completionChainId));
    records = records.filter((r) => ids.has(r.evidenceId));
  }
  if (criteria.world2ChainId) {
    const ids = new Set(locateByWorld2Chain(index, criteria.world2ChainId));
    records = records.filter((r) => ids.has(r.evidenceId));
  }
  if (criteria.producedBy) {
    const ids = new Set(locateByOwner(index, criteria.producedBy));
    records = records.filter((r) => ids.has(r.evidenceId));
  }
  if (criteria.ownerModule) {
    const ids = new Set(locateByModule(index, criteria.ownerModule));
    records = records.filter((r) => ids.has(r.evidenceId));
  }

  if (criteria.evidenceType) {
    records = records.filter((r) => r.evidenceType === criteria.evidenceType);
  }
  if (criteria.evidenceStatus) {
    records = records.filter((r) => r.evidenceStatus === criteria.evidenceStatus);
  }

  return records;
}

export function getTraceabilityIndex(): TraceabilityIndex {
  return buildTraceabilityIndex(listEvidence());
}

export function countEvidenceByCategory(records: EvidenceRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of records) {
    counts[r.evidenceType] = (counts[r.evidenceType] ?? 0) + 1;
  }
  return counts;
}
