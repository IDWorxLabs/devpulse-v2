/**
 * Incremental Autonomous Builder Era 3 Phase 4 — types.
 */

import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';

export const INCREMENTAL_AUTONOMOUS_BUILDER_PASS_TOKEN = 'INCREMENTAL_AUTONOMOUS_BUILDER_V1_PASS';
export const INCREMENTAL_AUTONOMOUS_BUILDER_OWNER_MODULE = 'devpulse_v2_incremental_autonomous_builder';
export const DEFAULT_MAX_INCREMENTAL_BUILD_HISTORY = 128;
export const DEFAULT_FEATURE_REPAIR_BUDGET = 3;
export const DEFAULT_MAX_REGRESSION_GUARD_DEPTH = 16;

export type FeatureSliceStatus =
  | 'PLANNED'
  | 'GENERATING'
  | 'GENERATED'
  | 'VALIDATING'
  | 'REPAIRING'
  | 'STABLE'
  | 'FAILED'
  | 'BLOCKED'
  | 'ROLLED_BACK';

export type IncrementalBuildPermissionVerdict =
  | 'READY_FOR_ASSEMBLY'
  | 'IN_PROGRESS'
  | 'NEEDS_REPAIR'
  | 'BLOCKED'
  | 'RESUMABLE';

export interface FeatureSlicePlan {
  readOnly: true;
  sliceId: string;
  name: string;
  description: string;
  orderIndex: number;
  dependencySliceIds: readonly string[];
  requirementIds: readonly string[];
  capabilityIds: readonly string[];
  acceptanceCriteria: readonly string[];
  validationPlan: readonly string[];
  repairPolicy: string;
  commitBoundary: string;
  rollbackBoundary: string;
}

export interface IncrementalBuildPlan {
  readOnly: true;
  buildId: string;
  productId: string;
  promptContractId: string;
  architectureSummary: string;
  featureSlices: readonly FeatureSlicePlan[];
  featureDependencies: Readonly<Record<string, readonly string[]>>;
  requiredCapabilitiesPerFeature: Readonly<Record<string, readonly string[]>>;
  validationPlanPerFeature: Readonly<Record<string, readonly string[]>>;
  repairPolicyPerFeature: Readonly<Record<string, string>>;
  commitBoundaries: readonly string[];
  rollbackBoundaries: readonly string[];
  wholeAppValidationPlan: readonly string[];
}

export interface ArchitectureSkeletonResult {
  readOnly: true;
  skeletonId: string;
  projectStructure: readonly string[];
  routingShell: readonly string[];
  sharedLayout: readonly string[];
  stateContainer: readonly string[];
  serviceBoundaries: readonly string[];
  dataModelPlaceholders: readonly string[];
  validationHarness: readonly string[];
  testHarness: readonly string[];
  accessibilityBaseline: readonly string[];
  buildScripts: readonly string[];
  manifestAnchors: readonly string[];
  compiles: boolean;
  blockedReason: string | null;
}

export interface FeatureSliceArtifact {
  readOnly: true;
  relativePath: string;
  artifactKind: 'COMPONENT' | 'SERVICE' | 'ROUTE' | 'TYPE' | 'TEST' | 'VALIDATOR' | 'MANIFEST';
  requirementIds: readonly string[];
  capabilityIds: readonly string[];
  sliceId: string;
  acceptanceCriteria: readonly string[];
}

export interface FeatureSliceGenerationResult {
  readOnly: true;
  sliceId: string;
  status: FeatureSliceStatus;
  artifacts: readonly FeatureSliceArtifact[];
  traceabilityComplete: boolean;
}

export interface FeatureSliceValidationResult {
  readOnly: true;
  sliceId: string;
  passed: boolean;
  checks: readonly { check: string; passed: boolean; detail: string }[];
  blockedReason: string | null;
}

export interface FeatureRepairPlan {
  readOnly: true;
  repairId: string;
  sliceId: string;
  failureClass: string;
  responsibleArtifacts: readonly string[];
  targetedPatches: readonly string[];
  preserveFaithfulness: boolean;
  preserveValidatedBehavior: boolean;
  attemptNumber: number;
}

export interface FeatureStabilizationResult {
  readOnly: true;
  sliceId: string;
  stable: boolean;
  status: FeatureSliceStatus;
  blockers: readonly string[];
}

export interface FeatureCommitRecord {
  readOnly: true;
  commitId: string;
  sliceId: string;
  requirementIds: readonly string[];
  capabilityIds: readonly string[];
  filesCreated: readonly string[];
  filesModified: readonly string[];
  validationResults: readonly string[];
  repairAttempts: number;
  promptFaithfulnessDelta: number;
  regressionResults: readonly string[];
  timestamp: number;
  rollbackSnapshotId: string;
}

export interface FeatureRegressionGuardResult {
  readOnly: true;
  guardId: string;
  newSliceId: string;
  passed: boolean;
  stableSliceIds: readonly string[];
  brokenSliceIds: readonly string[];
  responsibleSliceId: string | null;
  blockers: readonly string[];
}

export interface BuildStateSnapshot {
  readOnly: true;
  buildId: string;
  currentSliceId: string | null;
  completedSliceIds: readonly string[];
  blockedSliceIds: readonly string[];
  failedSliceIds: readonly string[];
  repairAttempts: Readonly<Record<string, number>>;
  rollbackPoints: readonly string[];
  wholeAppAssemblyStatus: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED';
  lastStableBoundary: string | null;
  updatedAt: number;
}

export interface WholeAppAssemblyResult {
  readOnly: true;
  assemblyId: string;
  passed: boolean;
  checks: readonly { check: string; passed: boolean; detail: string }[];
  stableFeatureCount: number;
  blockedReason: string | null;
}

export interface IncrementalBuildPipelineInput {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  simulateFailingSliceId?: string | null;
  simulateFailingSliceName?: string | null;
  simulateRegressionSliceId?: string | null;
  simulateRegressionSliceName?: string | null;
  resumeFromBuildId?: string | null;
}

export interface IncrementalBuildPipelineResult {
  readOnly: true;
  pipelineId: string;
  buildPlan: IncrementalBuildPlan;
  skeleton: ArchitectureSkeletonResult;
  orderedSliceIds: readonly string[];
  generationResults: readonly FeatureSliceGenerationResult[];
  validationResults: readonly FeatureSliceValidationResult[];
  repairPlans: readonly FeatureRepairPlan[];
  stabilizationResults: readonly FeatureStabilizationResult[];
  commitLog: readonly FeatureCommitRecord[];
  regressionGuards: readonly FeatureRegressionGuardResult[];
  buildState: BuildStateSnapshot;
  wholeAppAssembly: WholeAppAssemblyResult;
  permissionVerdict: IncrementalBuildPermissionVerdict;
  blockedReason: string | null;
  reportMarkdown: string;
  completedAt: number;
}

export interface LaunchIncrementalBuildEvidence {
  readOnly: true;
  plannedCount: number;
  generatedCount: number;
  validatedCount: number;
  repairedCount: number;
  stabilizedCount: number;
  blockedCount: number;
  rolledBackCount: number;
  regressionGuardsPassed: boolean;
  wholeAppAssemblyPassed: boolean;
  permissionVerdict: IncrementalBuildPermissionVerdict;
  blockers: readonly string[];
}
