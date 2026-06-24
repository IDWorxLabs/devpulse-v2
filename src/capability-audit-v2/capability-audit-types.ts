/**
 * AiDevEngine Capability Audit V2 — types.
 */

export type CapabilityMaturityStatus = 'MATURE' | 'PARTIAL' | 'EXPERIMENTAL' | 'MISSING';

export type DuplicateRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type CapabilityRecommendation = 'KEEP' | 'EXTEND' | 'MERGE' | 'REPLACE' | 'REMOVE';

export type AuditCategoryId =
  | 'IDEA_INTAKE'
  | 'REQUIREMENT_INTELLIGENCE'
  | 'PLANNING_INTELLIGENCE'
  | 'PRODUCT_ARCHITECT_INTELLIGENCE'
  | 'CODE_GENERATION'
  | 'BLUEPRINT_SYSTEMS'
  | 'FEATURE_VALIDATION'
  | 'ENGINEERING_REVIEW'
  | 'VERIFICATION_SYSTEMS'
  | 'FOUNDER_REVIEW'
  | 'LAUNCH_READINESS'
  | 'SELF_EVOLUTION'
  | 'MULTI_PROJECT_EXECUTION'
  | 'WORLD2'
  | 'OPERATOR_SYSTEMS';

export interface CapabilityEntryV2 {
  name: string;
  category: AuditCategoryId;
  status: CapabilityMaturityStatus;
  maturity: number;
  duplicateRisk: DuplicateRisk;
  recommendation: CapabilityRecommendation;
  ownerPath: string;
  validateScript?: string;
  summary: string;
  overlapWith?: readonly string[];
  canonicalOwner?: string;
}

export interface MaturityMatrixEntry {
  capabilityName: string;
  category: AuditCategoryId;
  maturityScore: number;
  status: CapabilityMaturityStatus;
}

export interface DuplicateRiskEntry {
  capabilityName: string;
  duplicateRisk: DuplicateRisk;
  recommendation: CapabilityRecommendation;
  overlapWith: readonly string[];
  canonicalOwner?: string;
  remediationDecision?: string;
  remediationTarget?: string;
}

export interface DuplicateRiskAnalysis {
  duplicateRiskCount: number;
  highDuplicateRiskCount: number;
  mediumDuplicateRiskCount: number;
  lowDuplicateRiskCount: number;
  oneCapabilityOneOwnerValid: boolean;
  authorityOwnershipChecks: readonly {
    domain: string;
    expectedOwner: string;
    valid: boolean;
    detail: string;
  }[];
  entries: readonly DuplicateRiskEntry[];
  newOverlapsSinceV1: readonly string[];
}

export interface MissingCapabilityEntry {
  capability: string;
  severity: 'BLOCKING' | 'HIGH' | 'MEDIUM' | 'LOW';
  focusArea: string;
  detail: string;
}

export interface MissingCapabilitiesReport {
  generatedAt: string;
  blockingVision: readonly string[];
  stillWeak: readonly string[];
  entries: readonly MissingCapabilityEntry[];
}

export interface RoadmapPriority {
  rank: number;
  phase: string;
  action: 'BUILD' | 'EXTEND' | 'MERGE' | 'REGISTER' | 'DEFER';
  rationale: string;
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dependencies: readonly string[];
}

export interface World2Assessment {
  pipelineName: string;
  currentMaturity: number;
  status: CapabilityMaturityStatus;
  moduleCount: number;
  gaps: readonly string[];
  shouldBeNextPhase: boolean;
  nextPhaseRationale: string;
}

export interface CapabilityAuditV2Assessment {
  version: 'V2';
  generatedAt: string;
  passToken: string;
  readOnly: true;
  priorAuditVersion: 'V1';
  categoryCount: number;
  capabilityCount: number;
  matureCount: number;
  partialCount: number;
  experimentalCount: number;
  missingCount: number;
  highDuplicateRiskCount: number;
  categories: readonly AuditCategoryId[];
  capabilities: readonly CapabilityEntryV2[];
  world2Assessment: World2Assessment;
  priorPassTokensValidated: readonly string[];
}
