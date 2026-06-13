/**
 * Architecture Brief Generator — foundation types (V1).
 * Read-only architecture preparation — no implementation or code generation.
 */

import type { PlanningGateAnalysis } from '../planning-gate-authority/planning-gate-types.js';
import type { PlanningBrief } from '../planning-brief-generator/planning-brief-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type {
  FounderContextSnapshot,
  ProjectVaultIntakeSnapshot,
  UnifiedIntakeAnalysis,
} from '../unified-intake-intelligence/unified-intake-types.js';

export type ArchitectureBriefQuality = 'INSUFFICIENT' | 'PARTIAL' | 'COMPLETE' | 'HIGH_CONFIDENCE';

export type ArchitectureBriefReadiness = 'NOT_READY' | 'ARCHITECTURE_DRAFT_READY' | 'ARCHITECTURE_READY';

export type ArchitectureRiskType =
  | 'UNCLEAR_OWNERSHIP'
  | 'UNCLEAR_PERMISSIONS'
  | 'UNCLEAR_WORKFLOWS'
  | 'UNCLEAR_INTEGRATIONS'
  | 'SCALING_AMBIGUITY';

export type ArchitectureRiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ArchitectureBriefSystemOverview {
  readOnly: true;
  productType: string;
  objective: string;
  platforms: readonly string[];
  scaleExpectations: string;
}

export interface ArchitectureFrontendSummary {
  readOnly: true;
  webUi: boolean;
  mobileUi: boolean;
  tabletUi: boolean;
  desktopUi: boolean;
  detectedNeeds: readonly string[];
  evidence: readonly string[];
}

export interface ArchitectureBackendSummary {
  readOnly: true;
  apis: boolean;
  businessServices: boolean;
  backgroundJobs: boolean;
  workflowOrchestration: boolean;
  detectedNeeds: readonly string[];
  evidence: readonly string[];
}

export interface ArchitectureDataEntity {
  readOnly: true;
  entityId: string;
  name: string;
  evidence: readonly string[];
}

export interface ArchitectureDataModelSummary {
  readOnly: true;
  entities: readonly ArchitectureDataEntity[];
  relationships: readonly string[];
  ownershipModels: readonly string[];
  permissions: readonly string[];
}

export interface ArchitectureIntegrationItem {
  readOnly: true;
  integrationId: string;
  name: string;
  category: 'PAYMENT' | 'AI' | 'COMMUNICATION' | 'AUTH' | 'THIRD_PARTY';
  evidence: readonly string[];
}

export interface ArchitectureIntegrationSummary {
  readOnly: true;
  integrations: readonly ArchitectureIntegrationItem[];
  thirdPartyApis: readonly string[];
}

export interface ArchitectureSecuritySummary {
  readOnly: true;
  authentication: readonly string[];
  authorization: readonly string[];
  permissions: readonly string[];
  userRoles: readonly string[];
}

export interface ArchitectureRiskItem {
  readOnly: true;
  riskId: string;
  riskType: ArchitectureRiskType;
  severity: ArchitectureRiskSeverity;
  description: string;
  evidence: readonly string[];
}

export interface ArchitectureRiskAnalysis {
  readOnly: true;
  risks: readonly ArchitectureRiskItem[];
  overallRiskLevel: ArchitectureRiskSeverity;
  riskCount: number;
}

export interface ArchitectureBrief {
  readOnly: true;
  briefId: string;
  generatedAt: string;
  planningBriefId: string;
  systemOverview: ArchitectureBriefSystemOverview;
  frontendSummary: ArchitectureFrontendSummary;
  backendSummary: ArchitectureBackendSummary;
  dataModelSummary: ArchitectureDataModelSummary;
  integrationSummary: ArchitectureIntegrationSummary;
  securitySummary: ArchitectureSecuritySummary;
  architectureRiskAnalysis: ArchitectureRiskAnalysis;
  architectureBriefConfidence: number;
  architectureBriefQuality: ArchitectureBriefQuality;
  architectureBriefReadiness: ArchitectureBriefReadiness;
  evidenceSources: readonly string[];
}

export interface ArchitectureBriefHistoryEntry {
  briefId: string;
  timestamp: string;
  architectureBriefConfidence: number;
  architectureBriefQuality: ArchitectureBriefQuality;
  architectureBriefReadiness: ArchitectureBriefReadiness;
  riskCount: number;
}

export interface ArchitectureBriefGeneratorReport {
  readOnly: true;
  generatedAt: string;
  totalBriefs: number;
  latestBrief: ArchitectureBrief | null;
  historySummary: {
    totalBriefs: number;
    averageConfidence: number;
    architectureReadyCount: number;
    highConfidenceCount: number;
  };
}

export interface GenerateArchitectureBriefInput {
  planningBrief: PlanningBrief | null;
  planningGateAnalysis: PlanningGateAnalysis | null;
  unifiedIntakeAnalysis?: UnifiedIntakeAnalysis | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  founderContext?: FounderContextSnapshot | null;
  projectVaultContext?: ProjectVaultIntakeSnapshot | null;
  skipHistoryRecording?: boolean;
}

export interface ArchitectureBriefGeneration {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'ARCHITECTURE_BRIEF_GENERATOR_COMPLETE' | 'ARCHITECTURE_BRIEF_GENERATOR_FAILED';
  architectureBrief: ArchitectureBrief | null;
  failureReason: string | null;
}

export interface ArchitectureEvidenceBundle {
  readOnly: true;
  sources: readonly string[];
  productType: string;
  objective: string;
  platforms: readonly string[];
  targetUsers: readonly string[];
  screens: readonly string[];
  workflows: readonly string[];
  userRoles: readonly string[];
  businessRules: readonly string[];
  integrations: readonly string[];
  dataEntities: readonly string[];
  authentication: readonly string[];
  notifications: readonly string[];
  scaleExpectations: string;
}
