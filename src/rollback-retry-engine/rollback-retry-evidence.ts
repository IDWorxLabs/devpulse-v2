/**
 * Rollback/retry evidence — references from upstream Phase 6 systems only.
 */

import type {
  RollbackRetryEvidenceLink,
  RollbackRetryEvidenceSource,
  RollbackRetryPlanInput,
} from './types.js';

const SYSTEM_IDS: Record<RollbackRetryEvidenceSource, string> = {
  recovery_chains: 'recovery_chains',
  auto_fix_control: 'auto_fix_control_panel',
  approval: 'founder_approval_execution_gate',
  reality: 'execution_reality_validation',
  ledger: 'execution_evidence_ledger',
};

function createLinkId(): string {
  return `rollback-retry-evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildLink(source: RollbackRetryEvidenceSource, referenceId: string): RollbackRetryEvidenceLink {
  return {
    linkId: createLinkId(),
    source,
    referenceId,
    systemId: SYSTEM_IDS[source],
  };
}

export function attachRollbackRetryEvidence(input: RollbackRetryPlanInput): RollbackRetryEvidenceLink[] {
  const links: RollbackRetryEvidenceLink[] = [];

  if (input.recoveryChain?.chainId) {
    links.push(buildLink('recovery_chains', input.recoveryChain.chainId));
  }
  if (input.autoFixRecord?.fixId) {
    links.push(buildLink('auto_fix_control', input.autoFixRecord.fixId));
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

export function countEvidenceBySource(
  links: RollbackRetryEvidenceLink[],
  source: RollbackRetryEvidenceSource,
): number {
  return links.filter((l) => l.source === source).length;
}
