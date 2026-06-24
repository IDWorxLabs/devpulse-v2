/**
 * Requirement Completeness Intelligence consolidation bridge — Phase Next V1.
 * CQI is the canonical owner of requirement completeness, gaps, and question generation.
 */

import { assessCqiMaturity } from '../clarifying-question-intelligence/index.js';
import type { CqiMaturityAssessment } from '../clarifying-question-intelligence/cqi-maturity-types.js';

export const REQUIREMENT_COMPLETENESS_AUTHORITATIVE_OWNER = 'Clarifying Question Intelligence';
export const REQUIREMENT_COMPLETENESS_CONSOLIDATION_STATUS = 'MERGED' as const;

export interface RequirementCompletenessConsolidationSnapshot {
  readOnly: true;
  authoritativeOwner: typeof REQUIREMENT_COMPLETENESS_AUTHORITATIVE_OWNER;
  consolidationStatus: typeof REQUIREMENT_COMPLETENESS_CONSOLIDATION_STATUS;
  noDuplicateRequirementIntelligence: true;
  singleRequirementIntelligencePath: true;
  delegatedFrom: 'Requirement Completeness Intelligence';
}

export function resolveAuthoritativeRequirementIntelligence(): RequirementCompletenessConsolidationSnapshot {
  return {
    readOnly: true,
    authoritativeOwner: REQUIREMENT_COMPLETENESS_AUTHORITATIVE_OWNER,
    consolidationStatus: REQUIREMENT_COMPLETENESS_CONSOLIDATION_STATUS,
    noDuplicateRequirementIntelligence: true,
    singleRequirementIntelligencePath: true,
    delegatedFrom: 'Requirement Completeness Intelligence',
  };
}

export function delegateRequirementCompletenessToCqi(userPrompt: string): CqiMaturityAssessment {
  return assessCqiMaturity({ userPrompt });
}

export function applyCqiRequirementDelegation(
  localReadiness: string,
  cqiAssessment: CqiMaturityAssessment | null,
): string {
  if (!cqiAssessment) return localReadiness;
  if (!cqiAssessment.canProceedToPlanning) return 'INSUFFICIENT';
  return localReadiness;
}
