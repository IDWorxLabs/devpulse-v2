/**
 * Missing Capability Evolution Engine Era 3 Phase 10 — types.
 */

import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';

export const MISSING_CAPABILITY_EVOLUTION_ENGINE_PASS_TOKEN =
  'MISSING_CAPABILITY_EVOLUTION_ENGINE_V1_PASS';
export const MISSING_CAPABILITY_EVOLUTION_ENGINE_OWNER_MODULE =
  'devpulse_v2_missing_capability_evolution_engine';
export const DEFAULT_MAX_EVOLUTION_HISTORY = 128;
export const DEFAULT_EVOLUTION_LOOP_MAX_ATTEMPTS = 3;
export const DEFAULT_EVOLUTION_MAX_GENERATED_FILES = 12;
export const DEFAULT_EVOLUTION_MAX_MODIFIED_FILES = 4;

export type EvolutionVerdict =
  | 'EVOLUTION_PASS'
  | 'EVOLUTION_BLOCKED'
  | 'NEEDS_HUMAN_REVIEW'
  | 'INSUFFICIENT_EVIDENCE'
  | 'IN_PROGRESS';

export type EvolutionSafetyVerdict =
  | 'SAFE_TO_EVOLVE'
  | 'SAFE_WITH_LIMITATIONS'
  | 'NEEDS_HUMAN_REVIEW'
  | 'BLOCKED_UNSAFE'
  | 'INSUFFICIENT_EVIDENCE';

export type CapabilityValidationStatus =
  | 'VALIDATED'
  | 'FAILED_VALIDATION'
  | 'PARTIALLY_VALIDATED'
  | 'UNTESTABLE'
  | 'REQUIRES_HUMAN_REVIEW';

export type EvolvedCapabilityStatus =
  | 'VALIDATED_EVOLVED'
  | 'EVOLVED_WITH_LIMITATIONS'
  | 'PROJECT_SPECIFIC'
  | 'REQUIRES_REVALIDATION'
  | 'DEPRECATED'
  | 'BLOCKED';

export type MissingCapabilitySourceGate =
  | 'CAPABILITY_PLANNING'
  | 'PROMPT_FAITHFULNESS'
  | 'INCREMENTAL_BUILD'
  | 'BEHAVIOR_SIMULATION'
  | 'VIRTUAL_USER'
  | 'VIRTUAL_DEVICE'
  | 'INTERACTION_PROOF'
  | 'AUTONOMOUS_DEBUGGING'
  | 'LAUNCH_AUTHORITY';

export interface MissingCapabilityIntakeItem {
  readOnly: true;
  missingCapabilityId: string;
  capabilityName: string;
  reasonRequired: string;
  sourceRequirementIds: readonly string[];
  sourcePromptEvidence: readonly string[];
  affectedFeatureSlices: readonly string[];
  affectedBehaviorScenarios: readonly string[];
  affectedVirtualUsers: readonly string[];
  affectedDeviceProfiles: readonly string[];
  affectedInteractions: readonly string[];
  expectedInterfaces: readonly string[];
  requiredValidation: readonly string[];
  riskHints: readonly string[];
  blockingGate: MissingCapabilitySourceGate;
}

export interface EvolutionSafetyAssessment {
  readOnly: true;
  assessmentId: string;
  missingCapabilityId: string;
  verdict: EvolutionSafetyVerdict;
  dimensions: Readonly<Record<string, 'LOW' | 'MEDIUM' | 'HIGH'>>;
  blockedReason: string | null;
  humanReviewReason: string | null;
  limitations: readonly string[];
}

export interface CapabilityDesign {
  readOnly: true;
  capabilityId: string;
  name: string;
  purpose: string;
  sourceRequirements: readonly string[];
  supportedProductDomains: readonly string[];
  supportedPlatforms: readonly string[];
  inputs: readonly string[];
  outputs: readonly string[];
  interfaces: readonly string[];
  stateRequirements: readonly string[];
  dataRequirements: readonly string[];
  serviceRequirements: readonly string[];
  uiRequirements: readonly string[];
  accessibilityRequirements: readonly string[];
  errorHandling: readonly string[];
  securityConstraints: readonly string[];
  performanceConstraints: readonly string[];
  validationRequirements: readonly string[];
  reuseRules: readonly string[];
  limitations: readonly string[];
}

export interface CapabilityInterfaceDesign {
  readOnly: true;
  capabilityId: string;
  version: string;
  publicTypes: readonly string[];
  publicFunctions: readonly string[];
  events: readonly string[];
  stateContracts: readonly string[];
  serviceContracts: readonly string[];
  dataContracts: readonly string[];
  validationHooks: readonly string[];
  errorTypes: readonly string[];
  configurationOptions: readonly string[];
  integrationPoints: readonly string[];
  projectSpecific: boolean;
}

export interface CapabilityImplementationPlan {
  readOnly: true;
  capabilityId: string;
  filesToCreate: readonly string[];
  filesToModify: readonly string[];
  exports: readonly string[];
  imports: readonly string[];
  internalHelpers: readonly string[];
  integrationPoints: readonly string[];
  dependencyRequirements: readonly string[];
  isolationBoundary: string;
  rollbackStrategy: string;
  postInstallChecks: readonly string[];
}

export interface CapabilityValidatorDesign {
  readOnly: true;
  capabilityId: string;
  unitChecks: readonly string[];
  integrationChecks: readonly string[];
  promptFaithfulnessChecks: readonly string[];
  capabilityContractChecks: readonly string[];
  safetyChecks: readonly string[];
  regressionChecks: readonly string[];
  performanceChecks: readonly string[];
  accessibilityChecks: readonly string[];
}

export interface CapabilityTestFixturePlan {
  readOnly: true;
  capabilityId: string;
  happyPath: readonly string[];
  edgeCases: readonly string[];
  invalidInputs: readonly string[];
  missingData: readonly string[];
  failureStates: readonly string[];
  rollbackConditions: readonly string[];
  accessibilityCases: readonly string[];
  performanceBoundaries: readonly string[];
  securityConstraints: readonly string[];
}

export interface CapabilityWorkspaceArtifact {
  readOnly: true;
  capabilityId: string;
  modulePath: string;
  typesPath: string;
  implementationPath: string;
  validatorsPath: string;
  fixturesPath: string;
  registryMetadataPath: string;
  documentationPath: string;
  adapterPath: string | null;
}

export interface CapabilityValidationEvidence {
  readOnly: true;
  capabilityId: string;
  status: CapabilityValidationStatus;
  validatorNames: readonly string[];
  checksPassed: readonly string[];
  checksFailed: readonly string[];
  coverageSummary: string;
  safetyResults: readonly string[];
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  promptFaithfulnessResult: 'PASS' | 'FAIL' | 'PARTIAL';
  capabilityContractResult: 'PASS' | 'FAIL' | 'PARTIAL';
}

export interface CapabilityInstallationResult {
  readOnly: true;
  capabilityId: string;
  installed: boolean;
  rolledBack: boolean;
  targetRegistry: string;
  targetModule: string;
  rollbackSnapshotId: string | null;
  postInstallValidationPassed: boolean;
  failureReason: string | null;
}

export interface EvolvedCapabilityRecord {
  readOnly: true;
  capabilityId: string;
  name: string;
  version: string;
  status: EvolvedCapabilityStatus;
  source: string;
  ownerModule: string;
  supportedRequirementCategories: readonly string[];
  supportedProductDomains: readonly string[];
  supportedPlatforms: readonly string[];
  interfaces: readonly string[];
  dependencies: readonly string[];
  validationEvidence: CapabilityValidationEvidence;
  safetyVerdict: EvolutionSafetyVerdict;
  reuseScore: number;
  limitations: readonly string[];
  createdAt: number;
  updatedAt: number;
  lastVerifiedAt: number;
}

export interface CapabilityReuseIndexEntry {
  readOnly: true;
  capabilityId: string;
  capabilityKeywords: readonly string[];
  requirementPatterns: readonly string[];
  promptPatterns: readonly string[];
  domainPatterns: readonly string[];
  platformPatterns: readonly string[];
  supportedWorkflows: readonly string[];
  unsupportedWorkflows: readonly string[];
  knownLimitations: readonly string[];
  validationEvidence: CapabilityValidationEvidence;
}

export interface EvolutionLoopBudget {
  readOnly: true;
  maxEvolutionAttempts: number;
  maxGeneratedFiles: number;
  maxModifiedFiles: number;
  maxValidationFailures: number;
  maxInstallAttempts: number;
  maxRiskIncrease: number;
  maxTimeBudgetMs: number;
}

export interface EvolutionAttemptRecord {
  readOnly: true;
  attemptId: string;
  capabilityId: string;
  attemptNumber: number;
  outcome: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK' | 'REUSED' | 'BLOCKED';
  reason: string;
  timestamp: number;
}

export interface HumanReviewEscalation {
  readOnly: true;
  escalationId: string;
  problemSummary: string;
  missingCapabilityName: string;
  safetyVerdict: EvolutionSafetyVerdict;
  evolutionAttempts: readonly EvolutionAttemptRecord[];
  remainingGap: string;
  recommendedSafeNextAction: string;
}

export interface MissingCapabilityEvolutionPipelineInput {
  rawPrompt: string;
  productIntelligenceModel?: ProductIntelligenceModel;
  promptFaithfulness?: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  promptFaithfulnessBlocked?: boolean;
  /** Autonomous debugging classified root cause as CAPABILITY_GAP */
  debuggingCapabilityGap?: {
    capabilityName: string;
    evidence: string;
  };
  /** Force validation failure to test rollback */
  simulateValidationFailure?: boolean;
  /** Skip evolution and reuse existing indexed capability */
  simulateExistingEvolvedCapability?: boolean;
}

export interface MissingCapabilityEvolutionPipelineResult {
  readOnly: true;
  pipelineId: string;
  rawPrompt: string;
  intakeItems: readonly MissingCapabilityIntakeItem[];
  safetyAssessments: readonly EvolutionSafetyAssessment[];
  designs: readonly CapabilityDesign[];
  interfaceDesigns: readonly CapabilityInterfaceDesign[];
  implementationPlans: readonly CapabilityImplementationPlan[];
  validatorDesigns: readonly CapabilityValidatorDesign[];
  fixturePlans: readonly CapabilityTestFixturePlan[];
  workspaceArtifacts: readonly CapabilityWorkspaceArtifact[];
  validationEvidence: readonly CapabilityValidationEvidence[];
  installationResults: readonly CapabilityInstallationResult[];
  registryRecords: readonly EvolvedCapabilityRecord[];
  reuseIndexEntries: readonly CapabilityReuseIndexEntry[];
  evolutionAttempts: readonly EvolutionAttemptRecord[];
  reusedCapabilityIds: readonly string[];
  humanReview: HumanReviewEscalation | null;
  permissionVerdict: EvolutionVerdict;
  blockedReason: string | null;
  capabilityPlanningRerunPass: boolean;
  buildResumeGate: string | null;
  reportMarkdown: string;
  completedAt: number;
}

export interface LaunchMissingCapabilityEvolutionEvidence {
  readOnly: true;
  missingCount: number;
  safeToEvolveCount: number;
  blockedCount: number;
  generatedCount: number;
  validatedCount: number;
  installedCount: number;
  registeredCount: number;
  reusedCount: number;
  humanReviewCount: number;
  limitedCount: number;
  permissionVerdict: EvolutionVerdict;
  blockers: readonly string[];
}

export interface LivePreviewMissingCapabilityEvolutionGateResult {
  readOnly: true;
  unlocked: boolean;
  blockedReason: string | null;
  missingCapability: string | null;
  safetyVerdict: EvolutionSafetyVerdict | null;
  evolutionAttempts: string | null;
  validationResult: string | null;
  humanReviewReason: string | null;
  gateStatus: 'MISSING_CAPABILITY_EVOLUTION_PASS' | 'MISSING_CAPABILITY_EVOLUTION_BLOCKED';
}

export interface MissingCapabilityEvolutionReadinessResult {
  readOnly: true;
  ready: boolean;
  blockedReason: string | null;
  pipelineResult: MissingCapabilityEvolutionPipelineResult | null;
}
