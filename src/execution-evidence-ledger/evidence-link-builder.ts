/**
 * Evidence link builder — reference links only, no full record duplication.
 */

import type { EvidenceChainInput, EvidenceLink, EvidenceLinkType } from './types.js';

const SYSTEM_IDS: Record<EvidenceLinkType, string> = {
  authority: 'execution_authority',
  runtime: 'execution_package_runtime',
  verification: 'execution_verification_loop',
  recovery: 'recovery_execution_engine',
  approval: 'founder_approval_execution_gate',
  reality: 'execution_reality_validation',
};

function createLinkId(): string {
  return `evidence-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildLink(
  linkType: EvidenceLinkType,
  referenceId: string,
  createdAt: number,
): EvidenceLink {
  return {
    linkId: createLinkId(),
    linkType,
    referenceId,
    systemId: SYSTEM_IDS[linkType],
    createdAt,
  };
}

export function buildEvidenceLinks(chain: EvidenceChainInput, createdAt: number): EvidenceLink[] {
  const links: EvidenceLink[] = [];

  if (chain.authorityDecisionId) {
    links.push(buildLink('authority', chain.authorityDecisionId, createdAt));
  } else if (chain.authorityId) {
    links.push(buildLink('authority', chain.authorityId, createdAt));
  }

  if (chain.runtimeRecordId) {
    links.push(buildLink('runtime', chain.runtimeRecordId, createdAt));
  }
  if (chain.verificationId) {
    links.push(buildLink('verification', chain.verificationId, createdAt));
  }
  if (chain.recoveryPlanId) {
    links.push(buildLink('recovery', chain.recoveryPlanId, createdAt));
  } else if (chain.recoveryRecordId) {
    links.push(buildLink('recovery', chain.recoveryRecordId, createdAt));
  }
  if (chain.approvalRequestId) {
    links.push(buildLink('approval', chain.approvalRequestId, createdAt));
  }
  if (chain.realityValidationId) {
    links.push(buildLink('reality', chain.realityValidationId, createdAt));
  }

  return links;
}

export function countLinksByType(links: EvidenceLink[], linkType: EvidenceLinkType): number {
  return links.filter((l) => l.linkType === linkType).length;
}
