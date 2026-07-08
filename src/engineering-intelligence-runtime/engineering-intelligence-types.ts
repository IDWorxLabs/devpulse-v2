/**
 * Engineering Intelligence Runtime V1 — types.
 * General product-faithfulness intelligence across all app domains.
 */

import type { PromptBoundedModulePlan } from '../prompt-bounded-materialization/prompt-bounded-materialization-types.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { AeeEvidenceResult, AeeStage } from '../autonomous-engineering-executive/aee-types.js';

export const ENGINEERING_INTELLIGENCE_RUNTIME_V1_PASS_TOKEN =
  'ENGINEERING_INTELLIGENCE_RUNTIME_V1_PASS' as const;

export const ENGINEERING_INTELLIGENCE_OWNER_MODULE =
  'devpulse_v2_engineering_intelligence_runtime' as const;

export const MAX_MISSING_CAPABILITY_REPAIR_ATTEMPTS = 2 as const;

export type ProductDomain =
  | 'e-commerce'
  | 'marketplace'
  | 'crm'
  | 'hr-admin'
  | 'ai-chat'
  | 'assistive-communication'
  | 'education-lms'
  | 'healthcare-portal'
  | 'finance-expense'
  | 'booking-scheduling'
  | 'social-community'
  | 'developer-tool'
  | 'internal-dashboard'
  | 'game'
  | 'custom-general';

export type EngineeringIntelligenceStage = 'PLANNING' | 'WORKSPACE_READY' | 'VERIFYING';

export type ModuleContractStatus = 'SATISFIED' | 'PARTIAL' | 'COLLAPSED_TO_GENERIC' | 'PROFILE_CONTAMINATED';

export type ProductFidelityVerdict = 'PASS' | 'REPAIR' | 'GAPS_REMAINING';

export interface RequiredCapability {
  readOnly: true;
  capabilityId: string;
  label: string;
  moduleIds: readonly string[];
  optional: boolean;
  promptEvidence: readonly string[];
}

export interface EngineeringFeatureContract {
  readOnly: true;
  productDomain: ProductDomain;
  requiredCapabilities: readonly RequiredCapability[];
  requiredModules: readonly string[];
  supportModules: readonly string[];
  rejectedModules: readonly string[];
  confidence: number;
  reasoning: string;
}

export interface ProfileDomainMismatch {
  readOnly: true;
  code: 'PROFILE_DOMAIN_MISMATCH';
  selectedProfile: string;
  detectedDomain: ProductDomain;
  severity: 'INFO' | 'WARNING';
  message: string;
}

export interface EngineeringIntelligencePlanningInput {
  rawPrompt: string;
  selectedProfile: string;
  extractionRequiredModules: readonly string[];
  approvedModuleIds: readonly string[];
}

export interface EngineeringIntelligencePlanningResult {
  readOnly: true;
  contract: EngineeringFeatureContract;
  profileMismatch: ProfileDomainMismatch | null;
  augmentedModulePlan: PromptBoundedModulePlan | null;
  augmentedDefinition: ProfileFeatureDefinition | null;
  planningPassed: boolean;
  productFidelityScore: number;
}

export interface PromptToFeatureFidelityResult {
  readOnly: true;
  passed: boolean;
  verdict: ProductFidelityVerdict;
  productFidelityScore: number;
  moduleContractStatus: ModuleContractStatus;
  mappedCapabilities: readonly string[];
  missingCapabilities: readonly RequiredCapability[];
  missingModules: readonly string[];
  genericCollapseDetected: boolean;
  profileContaminationDetected: boolean;
  appRoutesProductFeatures: boolean;
  reasoning: string;
}

export interface FeatureGapRepairPlan {
  readOnly: true;
  planId: string;
  missingModules: readonly string[];
  missingCapabilities: readonly RequiredCapability[];
  updateRegistry: boolean;
  updateRoutes: boolean;
  updateAppWiring: boolean;
  rerunNpmBuild: boolean;
  reasoning: string;
}

export interface MissingCapabilityRepairAttempt {
  readOnly: true;
  attemptNumber: number;
  repairPlan: FeatureGapRepairPlan;
  modulesGenerated: readonly string[];
  npmBuildOk: boolean;
  fidelityAfterRepair: PromptToFeatureFidelityResult;
  mcePipelineExecuted: boolean;
}

export interface MissingCapabilityRuntimeInput {
  rawPrompt: string;
  workspaceDir: string;
  projectRootDir: string;
  workspaceId: string;
  buildPlanDefinition: ProfileFeatureDefinition;
  approvedModuleIds: readonly string[];
  selectedProfile: string;
  contract: EngineeringFeatureContract;
  productIntelligenceModel: import('../intent-understanding-engine/intent-understanding-types.js').ProductIntelligenceModel;
  promptFaithfulness: import('../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js').PromptFaithfulnessV2Result;
  capabilityPlanning: import('../capability-planning-engine/capability-planning-types.js').CapabilityPlanningPipelineResult;
  rerunBuild?: () => { ok: boolean; output: string };
}

export interface MissingCapabilityRuntimeResult {
  readOnly: true;
  repairAttempts: readonly MissingCapabilityRepairAttempt[];
  repairsExhausted: boolean;
  finalFidelity: PromptToFeatureFidelityResult;
  missingCapabilityPipelineExecuted: boolean;
  finalNpmBuildOk: boolean;
}

export interface EngineeringIntelligenceReport {
  readOnly: true;
  reportId: string;
  detectedProductDomain: ProductDomain;
  selectedProfile: string;
  profileDomainMismatch: ProfileDomainMismatch | null;
  requiredCapabilities: readonly RequiredCapability[];
  generatedModules: readonly string[];
  missingCapabilities: readonly RequiredCapability[];
  rejectedFallbackModules: readonly string[];
  productFidelityScore: number;
  missingCapabilityRepairsAttempted: number;
  finalCapabilityCoverage: 'FULL' | 'PARTIAL' | 'FAILED';
  moduleContractStatus: ModuleContractStatus;
  paymentCapabilityClassification?: import('../safe-payment-placeholder-policy/safe-payment-placeholder-types.js').PaymentCapabilityClassification;
  remainingIntegrationGaps?: readonly string[];
  recordedAt: string;
}

export interface EngineeringIntelligenceAeeEvidenceInput {
  report: EngineeringIntelligenceReport;
  fidelity: PromptToFeatureFidelityResult;
  stage: AeeStage;
  npmBuildOk: boolean;
  previewOk: boolean;
}

export interface EngineeringIntelligenceValidationMatrixEntry {
  readOnly: true;
  label: string;
  prompt: string;
  expectedDomain: ProductDomain;
  expectedModuleHints: readonly string[];
  requiresAuth?: boolean;
}
