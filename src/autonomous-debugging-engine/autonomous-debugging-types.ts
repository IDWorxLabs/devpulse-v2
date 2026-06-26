/**
 * Autonomous Debugging Engine Era 3 Phase 9 — types.
 */

import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { InteractionProofPipelineResult } from '../interaction-proof-engine/interaction-proof-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';

export const AUTONOMOUS_DEBUGGING_ENGINE_PASS_TOKEN = 'AUTONOMOUS_DEBUGGING_ENGINE_V1_PASS';
export const AUTONOMOUS_DEBUGGING_ENGINE_OWNER_MODULE = 'devpulse_v2_autonomous_debugging_engine';
export const DEFAULT_MAX_DEBUGGING_HISTORY = 128;
export const DEFAULT_REPAIR_LOOP_MAX_ATTEMPTS = 3;
export const DEFAULT_REPAIR_MAX_TOUCHED_FILES = 8;

export type DebuggingVerdict = 'READY_FOR_PREVIEW' | 'NEEDS_REPAIR' | 'BLOCKED' | 'IN_PROGRESS' | 'HUMAN_REVIEW';

export type FailureSourceGate =
  | 'PROMPT_FAITHFULNESS'
  | 'CAPABILITY_PLANNING'
  | 'INCREMENTAL_BUILD'
  | 'BEHAVIOR_SIMULATION'
  | 'VIRTUAL_USER'
  | 'VIRTUAL_DEVICE'
  | 'INTERACTION_PROOF'
  | 'LAUNCH_AUTHORITY'
  | 'LIVE_PREVIEW'
  | 'BUILD'
  | 'TYPECHECK'
  | 'RUNTIME'
  | 'WORKSPACE_REALITY';

export type DebuggingFailureCategory =
  | 'BUILD_FAILURE'
  | 'TYPECHECK_FAILURE'
  | 'PROMPT_FAITHFULNESS_FAILURE'
  | 'CAPABILITY_GAP'
  | 'FEATURE_VALIDATION_FAILURE'
  | 'BEHAVIOR_FAILURE'
  | 'VIRTUAL_USER_FAILURE'
  | 'DEVICE_FAILURE'
  | 'INTERACTION_FAILURE'
  | 'ACCESSIBILITY_FAILURE'
  | 'PERFORMANCE_FAILURE'
  | 'SECURITY_FAILURE'
  | 'ROUTE_FAILURE'
  | 'STATE_FAILURE'
  | 'DATA_FAILURE'
  | 'SERVICE_FAILURE'
  | 'UI_FAILURE'
  | 'REGRESSION_FAILURE'
  | 'RUNTIME_ERROR'
  | 'LAUNCH_BLOCKER'
  | 'UNKNOWN_FAILURE';

export type RepairStrategy =
  | 'ADD_MISSING_HANDLER'
  | 'CONNECT_EXISTING_HANDLER'
  | 'ADD_STATE_UPDATE'
  | 'FIX_DATA_MUTATION'
  | 'FIX_SERVICE_CALL'
  | 'FIX_ROUTE_LINK'
  | 'FIX_ACCESSIBLE_LABEL'
  | 'FIX_LAYOUT_OVERFLOW'
  | 'FIX_DEVICE_SPECIFIC_STYLE'
  | 'REMOVE_UNSUPPORTED_FEATURE'
  | 'RESTORE_PROMPT_REQUIREMENT'
  | 'ADD_CAPABILITY_PLAN'
  | 'REORDER_FEATURE_DEPENDENCY'
  | 'FIX_TYPE_ERROR'
  | 'FIX_BUILD_CONFIG'
  | 'ESCALATE_TO_HUMAN';

export type ResponsibleSubsystem =
  | 'Prompt Faithfulness'
  | 'Capability Planning'
  | 'Incremental Builder'
  | 'Behavior Simulation'
  | 'Virtual User'
  | 'Virtual Device'
  | 'Interaction Proof'
  | 'Generated UI'
  | 'Generated State'
  | 'Generated Service'
  | 'Generated Data Layer'
  | 'Generated Routing'
  | 'Generated Styling'
  | 'Generated Accessibility'
  | 'Build System'
  | 'Validation Runtime'
  | 'Launch Authority Integration';

export type RepairOutcome = 'RESOLVED' | 'FAILED' | 'ROLLED_BACK' | 'ESCALATED' | 'IN_PROGRESS';

export interface FailureIntakeRecord {
  readOnly: true;
  failureId: string;
  sourceGate: FailureSourceGate;
  failureType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  requirementIds: readonly string[];
  capabilityIds: readonly string[];
  featureSliceIds: readonly string[];
  behaviorScenarioIds: readonly string[];
  virtualUserIds: readonly string[];
  deviceProfileIds: readonly string[];
  interactionIds: readonly string[];
  affectedFiles: readonly string[];
  observedResult: string;
  expectedResult: string;
  rawEvidence: string;
  timestamp: number;
}

export interface NormalizedFailure {
  readOnly: true;
  id: string;
  source: FailureSourceGate;
  category: DebuggingFailureCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  blockedGate: string;
  affectedScope: readonly string[];
  traceability: readonly string[];
  expected: string;
  observed: string;
  evidence: string;
  repairHints: readonly string[];
  safetyFlags: readonly string[];
}

export interface RootCauseResult {
  readOnly: true;
  rootCauseId: string;
  failureId: string;
  causeSummary: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  responsibleArtifact: string;
  responsibleSubsystem: ResponsibleSubsystem;
  evidenceLinks: readonly string[];
  alternativeCauses: readonly string[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RepairPlan {
  readOnly: true;
  repairId: string;
  failureIds: readonly string[];
  rootCauseId: string;
  rootCauseSummary: string;
  responsibleSubsystem: ResponsibleSubsystem;
  repairStrategy: RepairStrategy;
  affectedFiles: readonly string[];
  allowedFiles: readonly string[];
  forbiddenFiles: readonly string[];
  patchScope: string;
  validationPlan: readonly string[];
  regressionPlan: readonly string[];
  rollbackPlan: string;
  safetyConstraints: readonly string[];
  expectedOutcome: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PatchScopePlan {
  readOnly: true;
  repairId: string;
  targetFiles: readonly string[];
  targetComponents: readonly string[];
  targetFunctions: readonly string[];
  targetServices: readonly string[];
  targetRoutes: readonly string[];
  targetStyles: readonly string[];
  doNotTouchFiles: readonly string[];
  regressionSensitiveAreas: readonly string[];
}

export interface PatchSafetyAnalysis {
  readOnly: true;
  repairId: string;
  safe: boolean;
  promptFaithfulnessRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  capabilityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  securityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  dataLossRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  accessibilityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  architectureDriftRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  launchReadinessRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  userSafetyRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  blockedReason: string | null;
}

export interface PatchApplicationPlan {
  readOnly: true;
  patchId: string;
  repairPlanId: string;
  filesToModify: readonly string[];
  changesToApply: readonly string[];
  expectedDiffSummary: string;
  atomicityRequirements: readonly string[];
  rollbackSnapshot: string;
  postPatchValidators: readonly string[];
}

export interface TargetedValidationPlan {
  readOnly: true;
  repairId: string;
  validators: readonly string[];
}

export interface RegressionValidationPlan {
  readOnly: true;
  repairId: string;
  checks: readonly string[];
}

export interface RepairAttemptRecord {
  readOnly: true;
  repairId: string;
  failureId: string;
  rootCause: string;
  patchScope: string;
  filesModified: readonly string[];
  targetedValidationPassed: boolean;
  regressionValidationPassed: boolean;
  faithfulnessDelta: string;
  capabilityDelta: string;
  attemptNumber: number;
  outcome: RepairOutcome;
  rollbackSnapshot: string;
  timestamp: number;
}

export interface HumanReviewEscalation {
  readOnly: true;
  escalationId: string;
  problemSummary: string;
  evidence: readonly string[];
  autonomousAttempts: readonly string[];
  blockedReason: string;
  recommendedHumanDecision: string;
  safeNextOptions: readonly string[];
}

export interface RepairLoopResult {
  readOnly: true;
  loopId: string;
  failureIds: readonly string[];
  attempts: readonly RepairAttemptRecord[];
  resolved: boolean;
  escalated: boolean;
  humanReview: HumanReviewEscalation | null;
  blockedReason: string | null;
}

export interface AutonomousDebuggingPipelineInput {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuild: IncrementalBuildPipelineResult;
  behaviorSimulation: BehaviorSimulationPipelineResult;
  virtualUserSimulation: VirtualUserPipelineResult;
  virtualDeviceLaboratory: VirtualDevicePipelineResult;
  interactionProof: InteractionProofPipelineResult;
  simulateDeadButton?: boolean;
  simulateDataNotSaved?: boolean;
  simulateClippedButton?: boolean;
  simulatePromptDriftRepair?: boolean;
  simulateRepairExhaustion?: boolean;
  simulateRegressionAfterRepair?: boolean;
}

export interface AutonomousDebuggingPipelineResult {
  readOnly: true;
  pipelineId: string;
  intakeRecords: readonly FailureIntakeRecord[];
  normalizedFailures: readonly NormalizedFailure[];
  rootCauses: readonly RootCauseResult[];
  repairPlans: readonly RepairPlan[];
  repairLoops: readonly RepairLoopResult[];
  repairAttempts: readonly RepairAttemptRecord[];
  permissionVerdict: DebuggingVerdict;
  blockedReason: string | null;
  humanReview: HumanReviewEscalation | null;
  reportMarkdown: string;
  completedAt: number;
}

export interface LaunchAutonomousDebuggingEvidence {
  readOnly: true;
  failureCount: number;
  repairedCount: number;
  unresolvedCount: number;
  repairAttemptCount: number;
  patchesApplied: number;
  validationsPassedAfterRepair: number;
  regressionsChecked: number;
  promptDriftDetected: boolean;
  capabilityRiskDetected: boolean;
  unsafeRepairDetected: boolean;
  humanReviewRequired: boolean;
  permissionVerdict: DebuggingVerdict;
  blockers: readonly string[];
}

export interface AutonomousDebuggingReadinessResult {
  readOnly: true;
  ready: boolean;
  pendingFailureCount: number;
  blockedReason: string | null;
}

export interface LivePreviewAutonomousDebuggingGateResult {
  readOnly: true;
  unlocked: boolean;
  blockedReason: string | null;
  failureSummary: string | null;
  rootCause: string | null;
  repairAttempts: string | null;
  whyAutonomousRepairStopped: string | null;
  humanReviewRequest: string | null;
  gateStatus: string;
}
