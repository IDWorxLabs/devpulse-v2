/**
 * Auto-fix evidence — attaches references from upstream Phase 6 systems only.
 */

import type { AutoFixEvaluationInput, AutoFixEvidenceLink, AutoFixEvidenceSource } from './types.js';

const SYSTEM_IDS: Record<AutoFixEvidenceSource, string> = {
  recovery_chains: 'recovery_chains',
  approval: 'founder_approval_execution_gate',
  reality: 'execution_reality_validation',
  ledger: 'execution_evidence_ledger',
};

function createLinkId(): string {
  return `auto-fix-evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildLink(source: AutoFixEvidenceSource, referenceId: string): AutoFixEvidenceLink {
  return {
    linkId: createLinkId(),
    source,
    referenceId,
    systemId: SYSTEM_IDS[source],
  };
}

export function attachAutoFixEvidence(input: AutoFixEvaluationInput): AutoFixEvidenceLink[] {
  const links: AutoFixEvidenceLink[] = [];

  if (input.recoveryChain?.chainId) {
    links.push(buildLink('recovery_chains', input.recoveryChain.chainId));
  }
  if (input.approvalRecord?.approvalRequestId) {
    links.push(buildLink('approval', input.approvalRecord.approvalRequestId));
  }
  if (input.realityResult?.realityValidationId) {
    links.push(buildLink('reality', input.realityResult.realityValidationId));
  }
  if (input.ledgerRecord?.ledgerRecordId) {
    links.push(buildLink('ledger', input.ledgerRecord.ledgerRecordId));
  }

  return links;
}

export function countAutoFixEvidenceBySource(
  links: AutoFixEvidenceLink[],
  source: AutoFixEvidenceSource,
): number {
  return links.filter((l) => l.source === source).length;
}
