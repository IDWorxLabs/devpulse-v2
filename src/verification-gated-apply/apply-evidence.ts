/**
 * Apply evidence — references from upstream Phase 6 systems only.
 */

import type { ApplyEvidenceLink, ApplyEvidenceSource, ApplyGateInput } from './types.js';

const SYSTEM_IDS: Record<ApplyEvidenceSource, string> = {
  reality: 'execution_reality_validation',
  ledger: 'execution_evidence_ledger',
  recovery_chains: 'recovery_chains',
  auto_fix_control: 'auto_fix_control_panel',
  rollback_retry_engine: 'rollback_retry_engine',
};

function createLinkId(): string {
  return `apply-evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildLink(source: ApplyEvidenceSource, referenceId: string): ApplyEvidenceLink {
  return {
    linkId: createLinkId(),
    source,
    referenceId,
    systemId: SYSTEM_IDS[source],
  };
}

export function attachApplyEvidence(input: ApplyGateInput): ApplyEvidenceLink[] {
  const links: ApplyEvidenceLink[] = [];

  if (input.realityResult?.realityValidationId) {
    links.push(buildLink('reality', input.realityResult.realityValidationId));
  }
  if (input.ledgerRecord?.ledgerRecordId) {
    links.push(buildLink('ledger', input.ledgerRecord.ledgerRecordId));
  }
  if (input.recoveryChain?.chainId) {
    links.push(buildLink('recovery_chains', input.recoveryChain.chainId));
  }
  if (input.autoFixRecord?.fixId) {
    links.push(buildLink('auto_fix_control', input.autoFixRecord.fixId));
  }
  if (input.rollbackRetryPlan?.planId) {
    links.push(buildLink('rollback_retry_engine', input.rollbackRetryPlan.planId));
  }

  return links;
}

export function countApplyEvidenceBySource(
  links: ApplyEvidenceLink[],
  source: ApplyEvidenceSource,
): number {
  return links.filter((l) => l.source === source).length;
}
