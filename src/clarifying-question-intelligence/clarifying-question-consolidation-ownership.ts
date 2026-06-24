/**
 * Clarifying Question Intelligence consolidation ownership — Phase Next V1.
 * Canonical owner of missing requirement detection, completeness, gaps, and question generation.
 */

export const CQI_CANONICAL_OWNERSHIP_STATUS = 'CANONICAL' as const;

export const CQI_CANONICAL_RESPONSIBILITIES = [
  'Missing Requirement Detection',
  'Requirement Completeness',
  'Requirement Gaps',
  'Question Generation',
  'Requirement Confidence',
] as const;

export const CQI_CONSOLIDATED_CAPABILITIES = ['Requirement Completeness Intelligence'] as const;

export interface ClarifyingQuestionConsolidationOwnership {
  readOnly: true;
  capability: 'Clarifying Question Intelligence';
  status: typeof CQI_CANONICAL_OWNERSHIP_STATUS;
  responsibilities: typeof CQI_CANONICAL_RESPONSIBILITIES;
  consolidatedCapabilities: typeof CQI_CONSOLIDATED_CAPABILITIES;
  consumers: readonly string[];
}

export function getClarifyingQuestionConsolidationOwnership(): ClarifyingQuestionConsolidationOwnership {
  return {
    readOnly: true,
    capability: 'Clarifying Question Intelligence',
    status: CQI_CANONICAL_OWNERSHIP_STATUS,
    responsibilities: CQI_CANONICAL_RESPONSIBILITIES,
    consolidatedCapabilities: CQI_CONSOLIDATED_CAPABILITIES,
    consumers: [
      'Requirement Completeness Intelligence (delegated)',
      'Launch Council',
      'AiDev Engine Intake',
      'World2 Planning Gate',
    ],
  };
}
