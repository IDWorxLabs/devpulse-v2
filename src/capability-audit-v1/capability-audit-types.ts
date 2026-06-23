/**
 * AiDevEngine Capability Audit V1 — types.
 */

export type CapabilityStatus = 'NOT_PRESENT' | 'PARTIAL' | 'IMPLEMENTED' | 'MATURE';

export type DuplicateRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type CapabilityRecommendation = 'KEEP' | 'EXTEND' | 'MERGE' | 'REPLACE' | 'REMOVE';

export type AuditCategoryId =
  | 'IDEA_INTAKE'
  | 'REQUIREMENT_INTELLIGENCE'
  | 'PLANNING_INTELLIGENCE'
  | 'CODE_GENERATION'
  | 'BLUEPRINT_SYSTEMS'
  | 'FEATURE_VALIDATION'
  | 'ENGINEERING_REVIEW'
  | 'FOUNDER_REVIEW'
  | 'PRODUCT_INTELLIGENCE'
  | 'UI_UX_INTELLIGENCE'
  | 'SELF_EVOLUTION'
  | 'MULTI_PROJECT_EXECUTION';

export interface CapabilityEntry {
  name: string;
  category: AuditCategoryId;
  status: CapabilityStatus;
  maturity: number;
  duplicateRisk: DuplicateRisk;
  recommendation: CapabilityRecommendation;
  ownerPath: string;
  validateScript?: string;
  summary: string;
  overlapWith?: readonly string[];
}

export interface ProposedAuthorityOverlap {
  proposedAuthority: string;
  overlaps: readonly { capability: string; percentage: number }[];
  netNewCapability: number;
  recommendation: 'Extend Existing' | 'Create New Authority' | 'Merge Into Existing';
  rationale: string;
}

export interface HighDuplicateRiskRemediation {
  capabilityName: string;
  decision: CapabilityRecommendation;
  target?: string;
  rationale: string;
}

export interface CapabilityAuditAssessment {
  version: 'V1';
  generatedAt: string;
  passToken: string;
  readOnly: true;
  categoryCount: number;
  capabilityCount: number;
  matureCount: number;
  partialCount: number;
  highDuplicateRiskCount: number;
  highDuplicateRiskRemediationsComplete: boolean;
  categories: readonly AuditCategoryId[];
  capabilities: readonly CapabilityEntry[];
  highDuplicateRiskRemediations: readonly HighDuplicateRiskRemediation[];
  proposedAuthorityOverlaps: readonly ProposedAuthorityOverlap[];
  missingCapabilities: readonly string[];
  roadmapPriorities: readonly string[];
}
