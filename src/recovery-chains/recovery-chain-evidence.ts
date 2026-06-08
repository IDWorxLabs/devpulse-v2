/**
 * Recovery chain evidence — attaches references from Phase 6 systems only.
 */

import type {
  RecoveryChainEvidenceLink,
  RecoveryChainGovernanceContext,
  RecoveryEvidenceSource,
} from './types.js';

const SYSTEM_IDS: Record<RecoveryEvidenceSource, string> = {
  verification: 'execution_verification_loop',
  recovery: 'recovery_execution_engine',
  approval: 'founder_approval_execution_gate',
  reality: 'execution_reality_validation',
  ledger: 'execution_evidence_ledger',
};

function createLinkId(): string {
  return `recovery-evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildLink(source: RecoveryEvidenceSource, referenceId: string): RecoveryChainEvidenceLink {
  return {
    linkId: createLinkId(),
    source,
    referenceId,
    systemId: SYSTEM_IDS[source],
  };
}

export function attachRecoveryChainEvidence(
  context: RecoveryChainGovernanceContext,
): RecoveryChainEvidenceLink[] {
  const links: RecoveryChainEvidenceLink[] = [];

  if (context.verificationResult?.verificationId) {
    links.push(buildLink('verification', context.verificationResult.verificationId));
  }
  if (context.recoveryRecord?.plan.recoveryPlanId) {
    links.push(buildLink('recovery', context.recoveryRecord.plan.recoveryPlanId));
  } else if (context.recoveryRecord?.recordId) {
    links.push(buildLink('recovery', context.recoveryRecord.recordId));
  }
  if (context.approvalRecord?.approvalRequestId) {
    links.push(buildLink('approval', context.approvalRecord.approvalRequestId));
  }
  if (context.realityResult?.realityValidationId) {
    links.push(buildLink('reality', context.realityResult.realityValidationId));
  }
  if (context.ledgerRecord?.ledgerRecordId) {
    links.push(buildLink('ledger', context.ledgerRecord.ledgerRecordId));
  }

  return links;
}

export function countEvidenceBySource(
  links: RecoveryChainEvidenceLink[],
  source: RecoveryEvidenceSource,
): number {
  return links.filter((l) => l.source === source).length;
}
