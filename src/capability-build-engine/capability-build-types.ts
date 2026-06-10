/**
 * Capability Build Engine — types and models.
 * Build plans and artifacts only — no execution, no file modification.
 */

export const CAPABILITY_BUILD_ENGINE_PASS_TOKEN = 'CAPABILITY_BUILD_ENGINE_V1_PASS';
export const CAPABILITY_BUILD_ENGINE_OWNER_MODULE = 'devpulse_v2_capability_build_engine';
export const DEFAULT_MAX_BUILD_HISTORY_SIZE = 128;

export type CapabilityBuildType =
  | 'NEW_MODULE'
  | 'MODULE_EXTENSION'
  | 'INTEGRATION'
  | 'OPTIMIZATION'
  | 'DIAGNOSTIC';

export type BuildExecutionStrategy =
  | 'SAFE_INCREMENTAL'
  | 'ISOLATED_MODULE'
  | 'WORLD2_SANDBOX'
  | 'FOUNDER_APPROVED';

export type RolloutStrategy = 'ISOLATED' | 'STAGED' | 'WORLD2' | 'FOUNDER_REVIEWED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CapabilityBuildPlan {
  buildPlanId: string;
  buildType: CapabilityBuildType;
  executionStrategy: BuildExecutionStrategy;
  capabilityDomain: string;
  confidence: number;
  createdAt: number;
}

export interface CapabilityBuildInput {
  projectId?: string;
  proposedCapability: string;
  capabilityDomain?: string;
  planType?: string;
  trustImpact?: boolean;
  world2Impact?: boolean;
  founderApprovalRequired?: boolean;
  signals?: string[];
}

export interface CapabilityModulePlan {
  modulesToCreate: string[];
  modulesToExtend: string[];
  ownershipBoundaries: string[];
  requiredExports: string[];
  monolithAvoidance: true;
}

export interface CapabilityIntegrationPlan {
  upstreamIntegrations: string[];
  downstreamIntegrations: string[];
  registryIntegrations: string[];
  uvlIntegrations: string[];
  findPanelIntegrations: string[];
}

export interface CapabilitySequencePlan {
  orderedSequence: string[];
}

export interface CapabilityRolloutPlan {
  strategy: RolloutStrategy;
  stages: string[];
}

export interface CapabilityRollbackPlan {
  checkpoints: string[];
  triggers: string[];
  dependencies: string[];
  recoveryPath: string[];
}

export interface CapabilityBuildRiskAnalysis {
  riskScore: number;
  riskLevel: RiskLevel;
  factors: string[];
}

export interface CapabilityBuildValidationPlan {
  requirements: string[];
  moduleValidation: boolean;
  integrationValidation: boolean;
  verificationValidation: boolean;
  trustValidation: boolean;
  uvlValidation: boolean;
}

export interface CapabilityBuildReport {
  reportId: string;
  buildPlanId: string;
  buildType: CapabilityBuildType;
  executionStrategy: BuildExecutionStrategy;
  capabilityDomain: string;
  modules: CapabilityModulePlan;
  integrations: CapabilityIntegrationPlan;
  sequence: CapabilitySequencePlan;
  rollout: CapabilityRolloutPlan;
  rollback: CapabilityRollbackPlan;
  risk: CapabilityBuildRiskAnalysis;
  validation: CapabilityBuildValidationPlan;
  planningOnly: true;
  recommendedAction: string;
  generatedAt: number;
}

export interface CapabilityBuildHistoryEntry {
  historyId: string;
  buildPlanId: string;
  buildType: CapabilityBuildType;
  executionStrategy: BuildExecutionStrategy;
  recordedAt: number;
}

export interface CapabilityBuildRuntimeReport {
  buildPlans: number;
  modulesPlanned: number;
  integrationsPlanned: number;
  rolloutPlans: number;
  rollbackPlans: number;
  validationPlans: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export interface CapabilityConstructionResult {
  buildPlan: CapabilityBuildPlan;
  report: CapabilityBuildReport;
}

export const BUILD_QUESTION_SIGNALS = [
  'capability build',
  'build plan',
  'module plan',
  'rollout plan',
  'rollback plan',
] as const;

export function isCapabilityBuildQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return BUILD_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
