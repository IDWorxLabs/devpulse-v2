/**
 * Evidence Registry bridge — registry owns evidence; verification consumes read-only.
 */

import { getDevPulseV2EvidenceRegistryAuthority } from '../evidence-registry/evidence-registry-authority.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import type { EvidenceVerificationSummary } from './types.js';

let lastEvidenceSummary: EvidenceVerificationSummary | null = null;

export function verifyEvidenceRecord(evidenceId: string): EvidenceVerificationSummary {
  const record = getDevPulseV2EvidenceRegistryAuthority().getEvidence(evidenceId);
  if (!record) {
    const summary: EvidenceVerificationSummary = {
      evidenceId,
      valid: false,
      status: 'MISSING',
      summary: 'Evidence record not found in registry.',
    };
    lastEvidenceSummary = { ...summary };
    return { ...summary };
  }

  const summary: EvidenceVerificationSummary = {
    evidenceId: record.evidenceId,
    valid: true,
    status: record.status,
    summary: record.summary,
  };
  lastEvidenceSummary = { ...summary };
  return { ...summary };
}

export function getEvidenceVerificationSummary(): EvidenceVerificationSummary | null {
  return lastEvidenceSummary ? { ...lastEvidenceSummary } : null;
}

export function assertEvidenceRegistryOwnershipUnchanged(): boolean {
  const registry = getDevPulseV2EvidenceRegistryAuthority();
  return (
    registry.constructor.name === 'DevPulseV2EvidenceRegistryAuthority' &&
    typeof registry.getEvidence === 'function' &&
    typeof (registry as { verifyClaim?: unknown }).verifyClaim === 'undefined'
  );
}

export function getEvidenceRegistryOwnerForBridge(): string {
  return REGISTRY_OWNER_MODULE;
}

export function resetEvidenceVerificationBridgeForTests(): void {
  lastEvidenceSummary = null;
}
