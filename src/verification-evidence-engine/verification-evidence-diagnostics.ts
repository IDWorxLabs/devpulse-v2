/**
 * Verification evidence engine diagnostics tracker.
 */

import type {
  EvidenceAuthorityState,
  VerificationEvidenceDiagnostics,
} from './verification-evidence-types.js';

const diagnostics: VerificationEvidenceDiagnostics = {
  evidenceAuthorityActive: false,
  authorityId: null,
  evidenceCount: 0,
  lineageLinkCount: 0,
  traceabilityKeyCount: 0,
  validationIssueCount: 0,
  lastQuery: null,
  lastState: null,
};

export function verificationEvidenceEngineKey(): string {
  return 'verification_evidence_engine';
}

export function getVerificationEvidenceDiagnostics(): VerificationEvidenceDiagnostics {
  return { ...diagnostics };
}

export function updateVerificationEvidenceDiagnostics(
  query: string,
  state: EvidenceAuthorityState,
  authorityId: string,
  evidenceCount: number,
  lineageLinkCount: number,
  traceabilityKeyCount: number,
  validationIssueCount: number,
): void {
  diagnostics.evidenceAuthorityActive = true;
  diagnostics.lastQuery = query;
  diagnostics.lastState = state;
  diagnostics.authorityId = authorityId;
  diagnostics.evidenceCount = evidenceCount;
  diagnostics.lineageLinkCount = lineageLinkCount;
  diagnostics.traceabilityKeyCount = traceabilityKeyCount;
  diagnostics.validationIssueCount = validationIssueCount;
}

export function resetVerificationEvidenceDiagnostics(): void {
  diagnostics.evidenceAuthorityActive = false;
  diagnostics.authorityId = null;
  diagnostics.evidenceCount = 0;
  diagnostics.lineageLinkCount = 0;
  diagnostics.traceabilityKeyCount = 0;
  diagnostics.validationIssueCount = 0;
  diagnostics.lastQuery = null;
  diagnostics.lastState = null;
}
