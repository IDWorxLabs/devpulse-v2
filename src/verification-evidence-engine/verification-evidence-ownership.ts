/**
 * Evidence ownership — tracks who produced and owns each evidence record.
 */

import type { EvidenceOwnership, EvidenceRecord } from './verification-evidence-types.js';

export function buildEvidenceOwnership(
  partial: Partial<EvidenceOwnership> & Pick<EvidenceOwnership, 'projectId' | 'workspaceId'>,
): EvidenceOwnership {
  return {
    ownerModule: partial.ownerModule ?? 'devpulse_v2_verification_evidence_engine',
    ownerDomain: partial.ownerDomain ?? 'verification_evidence_engine',
    producedBy: partial.producedBy ?? 'verification_evidence_engine',
    verificationProvider: partial.verificationProvider,
    verificationSession: partial.verificationSession,
    orchestrationId: partial.orchestrationId,
    projectId: partial.projectId,
    workspaceId: partial.workspaceId,
  };
}

export function assignEvidenceOwnership(
  record: EvidenceRecord,
  ownership: Partial<EvidenceOwnership>,
): EvidenceRecord {
  return {
    ...record,
    evidenceOwner: {
      ...record.evidenceOwner,
      ...ownership,
    },
  };
}

export function extractOwnershipReportEntries(
  records: EvidenceRecord[],
): Array<{ evidenceId: string; ownerModule: string; producedBy: string }> {
  return records.map((r) => ({
    evidenceId: r.evidenceId,
    ownerModule: r.evidenceOwner.ownerModule,
    producedBy: r.evidenceOwner.producedBy,
  }));
}

export function validateOwnershipPresent(record: EvidenceRecord): string | null {
  if (!record.evidenceOwner.ownerModule) return 'Missing ownerModule';
  if (!record.evidenceOwner.producedBy) return 'Missing producedBy';
  if (!record.evidenceOwner.projectId) return 'Missing projectId';
  if (!record.evidenceOwner.workspaceId) return 'Missing workspaceId';
  return null;
}
