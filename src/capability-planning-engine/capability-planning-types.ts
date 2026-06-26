/**
 * Capability Planning Engine — types and models.
 * Planning only — no capability creation.
 */

import type { DuplicateRisk } from '../capability-research-engine/capability-research-types.js';

export const CAPABILITY_PLANNING_ENGINE_PASS_TOKEN = 'CAPABILITY_PLANNING_ENGINE_V1_PASS';
export const CAPABILITY_PLANNING_ENGINE_OWNER_MODULE = 'devpulse_v2_capability_planning_engine';
export const DEFAULT_MAX_PLANNING_HISTORY_SIZE = 128;

export type CapabilityPlanType =
  | 'NEW_CAPABILITY'
  | 'CAPABILITY_EXPANSION'
  | 'OPTIMIZATION'
  | 'DIAGNOSTIC'
  | 'REFACTOR'
  | 'RESEARCH_EXTENSION';

export type CapabilityApprovalRequirement =
  | 'NONE'
  | 'FOUNDER_REVIEW'
  | 'HIGH_RISK_REVIEW';

export type VerificationDepth =
  | 'QUICK'
  | 'STANDARD'
  | 'DEEP'
  | 'TRUST_RECOVERY';

export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CapabilityPlan {
  planId: string;
  planType: CapabilityPlanType;
  capabilityDomain: string;
  approvalRequirement: CapabilityApprovalRequirement;
  confidence: number;
  createdAt: number;
}

export interface CapabilityPlanningInput {
  projectId?: string;
  proposedCapability: string;
  capabilityDomain?: string;
  researchDecision?: string;
  subsystem?: string;
  signals?: string[];
  trustImpact?: boolean;
  world2Impact?: boolean;
}

export interface CapabilityScopePlan {
  moduleType: 'new_module' | 'extension_module';
  integrationPoints: string[];
  ownershipBoundaries: string[];
  monolithAvoidance: true;
}

export interface CapabilityImpactAnalysis {
  impactScore: number;
  impactLevel: ImpactLevel;
  affectedSystems: string[];
}

export interface CapabilityRiskAnalysis {
  riskScore: number;
  riskLevel: RiskLevel;
  factors: string[];
}

export interface CapabilityVerificationPlan {
  depth: VerificationDepth;
  requirements: string[];
}

export interface CapabilityDependencyPlan {
  requiredSystems: string[];
  requiredIntegrations: string[];
  missingDependencies: string[];
  dependencyOrder: string[];
  cycleDetected: boolean;
  unsafeDependency: boolean;
}

export interface CapabilityApprovalPlan {
  requirement: CapabilityApprovalRequirement;
  reasons: string[];
}

export interface CapabilityPlanningReport {
  reportId: string;
  planId: string;
  planType: CapabilityPlanType;
  capabilityDomain: string;
  scope: CapabilityScopePlan;
  impact: CapabilityImpactAnalysis;
  risk: CapabilityRiskAnalysis;
  dependencies: CapabilityDependencyPlan;
  approval: CapabilityApprovalPlan;
  verification: CapabilityVerificationPlan;
  duplicateRisk: DuplicateRisk;
  blocked: boolean;
  blockReason?: string;
  recommendedAction: string;
  generatedAt: number;
}

export interface CapabilityPlanHistoryEntry {
  historyId: string;
  planId: string;
  planType: CapabilityPlanType;
  approvalRequirement: CapabilityApprovalRequirement;
  recordedAt: number;
}

export interface CapabilityPlanningRuntimeReport {
  plansCreated: number;
  impactAnalyses: number;
  riskAnalyses: number;
  dependencyAnalyses: number;
  approvalDecisions: number;
  duplicateDetections: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export interface CapabilityPlanResult {
  plan: CapabilityPlan | null;
  report: CapabilityPlanningReport;
  blocked: boolean;
  duplicateRisk: DuplicateRisk;
}

export const PLANNING_QUESTION_SIGNALS = [
  'capability planning',
  'capability plan',
  'plan new capability',
  'founder approval',
  'duplicate capability plan',
] as const;

export function isCapabilityPlanningQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return PLANNING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

// ─── Era 3 — Build-path capability planning ─────────────────────────────────

export type CapabilityStatus =
  | 'AVAILABLE'
  | 'AVAILABLE_WITH_LIMITATIONS'
  | 'COMPOSED'
  | 'GENERATED_PENDING_VALIDATION'
  | 'VALIDATED'
  | 'DEPRECATED'
  | 'BLOCKED'
  | 'REQUIRES_HUMAN_REVIEW';

export type CapabilityGapDecision =
  | 'REUSE_EXISTING'
  | 'COMPOSE_FROM_EXISTING'
  | 'GENERATE_MISSING'
  | 'NEEDS_HUMAN_REVIEW'
  | 'BLOCK_BUILD';

export type GenerationPermissionVerdict =
  | 'READY_FOR_GENERATION'
  | 'NEEDS_CAPABILITY_EVOLUTION'
  | 'NEEDS_HUMAN_REVIEW'
  | 'BLOCKED';

export type ExistingCapabilityMatchType =
  | 'VALIDATED'
  | 'INCOMPLETE'
  | 'UNVALIDATED'
  | 'INCOMPATIBLE'
  | 'MISSING';

export interface CapabilityRecord {
  readOnly: true;
  capabilityId: string;
  name: string;
  version: string;
  status: CapabilityStatus;
  source: string;
  ownerModule: string;
  supportedRequirementCategories: readonly string[];
  supportedProductDomains: readonly string[];
  supportedPlatforms: readonly string[];
  dependencies: readonly string[];
  interfaces: readonly string[];
  validationCoverage: readonly string[];
  riskLevel: RiskLevel;
  reuseConfidence: number;
  lastValidationStatus: string;
  description: string;
  sourceModule: string;
}

export interface RequiredCapability {
  readOnly: true;
  requiredId: string;
  name: string;
  description: string;
  sourceRequirementIds: readonly string[];
  sourceEvidenceIds: readonly string[];
  category: string;
  mandatory: boolean;
}

export interface ExistingCapabilitySearchResult {
  readOnly: true;
  requiredCapability: RequiredCapability;
  matchedCapability: CapabilityRecord | null;
  matchType: ExistingCapabilityMatchType;
  matchConfidence: number;
  coveragePercentage: number;
}

export interface CapabilityGap {
  readOnly: true;
  gapId: string;
  requiredCapability: RequiredCapability;
  matchedCapabilityId: string | null;
  matchConfidence: number;
  coveragePercentage: number;
  missingSubCapabilities: readonly string[];
  risk: RiskLevel;
  decision: CapabilityGapDecision;
}

export interface ComposedCapabilityPlan {
  readOnly: true;
  composedId: string;
  name: string;
  sourceCapabilityIds: readonly string[];
  integrationPlan: readonly string[];
  dependencies: readonly string[];
  validationPlan: readonly string[];
  risk: RiskLevel;
  expectedCoverage: number;
}

export interface CapabilityGenerationPlanEra3 {
  readOnly: true;
  planId: string;
  capabilityName: string;
  reasonRequired: string;
  sourceRequirementIds: readonly string[];
  expectedInterfaces: readonly string[];
  requiredFiles: readonly string[];
  requiredTests: readonly string[];
  requiredValidators: readonly string[];
  integrationPoints: readonly string[];
  dependencies: readonly string[];
  rollbackPlan: readonly string[];
  riskLevel: RiskLevel;
  safetyConstraints: readonly string[];
}

export interface CapabilityValidationPlanEra3 {
  readOnly: true;
  planId: string;
  capabilityId: string;
  staticValidation: boolean;
  typecheckValidation: boolean;
  unitValidation: boolean;
  integrationValidation: boolean;
  behaviorValidation: boolean;
  accessibilityValidation: boolean;
  securityValidation: boolean;
  performanceValidation: boolean;
  promptFaithfulnessValidation: boolean;
  regressionValidation: boolean;
}

export interface CapabilityInstallationPlanEra3 {
  readOnly: true;
  planId: string;
  capabilityId: string;
  targetModule: string;
  exports: readonly string[];
  imports: readonly string[];
  registryUpdates: readonly string[];
  ownershipRegistration: string;
  validatorRegistration: readonly string[];
  documentationUpdate: boolean;
  rollbackPath: readonly string[];
  postInstallValidation: readonly string[];
}

export interface CapabilityDependencyNode {
  readOnly: true;
  nodeId: string;
  capabilityId: string;
  label: string;
  children: readonly string[];
  parentId: string | null;
}

export interface CapabilityDependencyGraphResult {
  readOnly: true;
  graphId: string;
  rootNodeIds: readonly string[];
  nodes: readonly CapabilityDependencyNode[];
  missingDependencies: readonly string[];
  circularDependencies: readonly string[];
  deprecatedDependencies: readonly string[];
  unsafeDependencies: readonly string[];
  unvalidatedDependencies: readonly string[];
  duplicateCapabilities: readonly string[];
}

export interface CapabilityPlanningPipelineResult {
  readOnly: true;
  pipelineId: string;
  rawPrompt: string;
  requiredCapabilities: readonly RequiredCapability[];
  searchResults: readonly ExistingCapabilitySearchResult[];
  gaps: readonly CapabilityGap[];
  compositions: readonly ComposedCapabilityPlan[];
  generationPlans: readonly CapabilityGenerationPlanEra3[];
  validationPlans: readonly CapabilityValidationPlanEra3[];
  installationPlans: readonly CapabilityInstallationPlanEra3[];
  dependencyGraph: CapabilityDependencyGraphResult;
  permissionVerdict: GenerationPermissionVerdict;
  blockedReason: string | null;
  reportMarkdown: string;
  completedAt: number;
}

export interface CapabilityPlanningPipelineInput {
  rawPrompt: string;
  productIntelligenceModel?: import('../intent-understanding-engine/intent-understanding-types.js').ProductIntelligenceModel;
  promptFaithfulness?: import('../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js').PromptFaithfulnessV2Result;
  promptFaithfulnessBlocked?: boolean;
}

export interface LaunchCapabilityEvidence {
  readOnly: true;
  requiredCount: number;
  reusedCount: number;
  composedCount: number;
  generatedCount: number;
  validatedCount: number;
  humanReviewCount: number;
  blockedCount: number;
  permissionVerdict: GenerationPermissionVerdict;
  blockers: readonly string[];
}
