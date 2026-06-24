/**
 * AiDevEngine Capability Audit V3 — types.
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
  | 'OPERATOR_SYSTEMS'
  | 'PRODUCTION_READINESS';

export interface CapabilityEntryV3 {
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

export interface CategoryAssessment {
  categoryId: AuditCategoryId;
  capabilityCount: number;
  maturityScore: number;
  status: CapabilityMaturityStatus;
  matureCount: number;
  partialCount: number;
  experimentalCount: number;
  missingCount: number;
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
  newOverlapsSinceV2: readonly string[];
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
  highestPriorityGap: string;
}

export interface RoadmapPriority {
  rank: number;
  phase: string;
  action: 'BUILD' | 'EXTEND' | 'MERGE' | 'REGISTER' | 'DEFER' | 'COMPLETE';
  rationale: string;
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dependencies: readonly string[];
}

export interface PipelineStageAssessment {
  stage: string;
  provenInSuite: boolean;
  successRatePercent: number;
  status: CapabilityMaturityStatus;
  evidence: string;
}

export interface OperationalMaturityReport {
  generatedAt: string;
  operationalMaturityScore: number;
  provenCategoryCount: number;
  supportedCategoryCount: number;
  executionGeneralizationScore: number;
  proofCoveragePercent: number;
  pipelineStages: readonly PipelineStageAssessment[];
  fullPipelineProvenAcrossSuite: boolean;
  verificationIsBlockingGap: boolean;
}

export interface ProductionReadinessDimension {
  dimension: string;
  maturity: number;
  status: CapabilityMaturityStatus;
  detail: string;
}

export interface ProductionReadinessAssessment {
  productionReadinessScore: number;
  status: CapabilityMaturityStatus;
  dimensions: readonly ProductionReadinessDimension[];
}

export interface CodeGenerationAssessment {
  codeGenerationMaturityScore: number;
  status: CapabilityMaturityStatus;
  crudProfileCount: number;
  supportsComplexWorkflows: boolean;
  supportsMultiRoleSystems: boolean;
  supportsAdvancedBusinessLogic: boolean;
  supportsDomainSpecificApps: boolean;
  detail: string;
}

export interface World2Assessment {
  pipelineName: string;
  currentMaturity: number;
  status: CapabilityMaturityStatus;
  moduleCount: number;
  gaps: readonly string[];
  shouldBeNextPhase: boolean;
  nextPhaseRationale: string;
  operationalReadiness: 'NOT_READY' | 'PARTIAL' | 'READY';
}

export interface CapabilityAuditV3Assessment {
  version: 'V3';
  generatedAt: string;
  passToken: string;
  readOnly: true;
  priorAuditVersion: 'V2';
  categoryCount: number;
  capabilityCount: number;
  matureCount: number;
  partialCount: number;
  experimentalCount: number;
  missingCount: number;
  highDuplicateRiskCount: number;
  categories: readonly AuditCategoryId[];
  categoryAssessments: readonly CategoryAssessment[];
  capabilities: readonly CapabilityEntryV3[];
  world2Assessment: World2Assessment;
  productionReadiness: ProductionReadinessAssessment;
  codeGeneration: CodeGenerationAssessment;
  operationalMaturity: OperationalMaturityReport;
  priorPassTokensValidated: readonly string[];
  closedGapsSinceV2: readonly string[];
  highestPriorityGap: string;
}
