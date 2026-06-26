/**
 * Autonomous Software Engineering Engine — Era 3 Phase 14 types.
 */

import type { LaunchReadinessPipelineResult } from '../launch-readiness-authority-v2/launch-readiness-types.js';
import type { LivePreviewGateResult } from '../live-preview-gate/live-preview-gate-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { MissingCapabilityEvolutionPipelineResult } from '../missing-capability-evolution-engine/missing-capability-evolution-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { InteractionProofPipelineResult } from '../interaction-proof-engine/interaction-proof-types.js';
import type { AutonomousDebuggingPipelineResult } from '../autonomous-debugging-engine/autonomous-debugging-types.js';
import type { ContinuousImprovementPipelineResult } from '../continuous-product-improvement-engine/continuous-improvement-types.js';

export const AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN =
  'AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS';
export const AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_OWNER_MODULE =
  'devpulse_v2_autonomous_software_engineering_engine';

export type AseStageId =
  | 'INTENT_UNDERSTANDING'
  | 'PROMPT_FAITHFULNESS'
  | 'CAPABILITY_PLANNING'
  | 'MISSING_CAPABILITY_EVOLUTION'
  | 'INCREMENTAL_BUILD'
  | 'BEHAVIOR_SIMULATION'
  | 'VIRTUAL_USER'
  | 'VIRTUAL_DEVICE'
  | 'INTERACTION_PROOF'
  | 'AUTONOMOUS_DEBUGGING'
  | 'CONTINUOUS_IMPROVEMENT'
  | 'LAUNCH_READINESS_AUTHORITY'
  | 'LIVE_PREVIEW_GATE';

export type AseOverallStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'BLOCKED'
  | 'REPAIRING'
  | 'EVOLVING_CAPABILITY'
  | 'IMPROVING'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'LAUNCH_READY'
  | 'PREVIEW_UNLOCKED';

export type AseStageStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED';

export type AseResumeBoundary =
  | 'PROMPT_EVIDENCE_CONTRACT_CREATED'
  | 'CAPABILITIES_RESOLVED'
  | 'FEATURE_SLICE_STABILIZED'
  | 'BEHAVIOR_SCENARIO_PASSED'
  | 'VIRTUAL_USER_JOURNEY_PASSED'
  | 'DEVICE_PROFILE_PASSED'
  | 'INTERACTION_SWEEP_PASSED'
  | 'REPAIR_LOOP_COMPLETED'
  | 'IMPROVEMENT_LOOP_COMPLETED'
  | 'LAUNCH_DECISION_CREATED'
  | 'PREVIEW_UNLOCKED';

export type AseRouteTarget =
  | 'MISSING_CAPABILITY_EVOLUTION'
  | 'AUTONOMOUS_DEBUGGING'
  | 'CONTINUOUS_IMPROVEMENT'
  | 'HUMAN_REVIEW'
  | 'EVIDENCE_REGENERATION'
  | 'LAUNCH_READINESS_AUTHORITY'
  | 'LIVE_PREVIEW_GATE'
  | 'RESUME';

export interface AseEvidenceRecord {
  readOnly: true;
  evidenceId: string;
  sourceStage: AseStageId;
  evidenceType: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'UNAVAILABLE';
  confidence: number;
  affectedRequirements: readonly string[];
  affectedFeatures: readonly string[];
  affectedCapabilities: readonly string[];
  affectedUsers: readonly string[];
  affectedDevices: readonly string[];
  affectedInteractions: readonly string[];
  artifacts: readonly string[];
  timestamp: number;
  freshness: 'FRESH' | 'STALE';
  blockers: readonly string[];
  warnings: readonly string[];
  recommendedNextStep: string | null;
}

export interface AseStageDefinition {
  readOnly: true;
  stageId: AseStageId;
  name: string;
  requiredPriorStages: readonly AseStageId[];
  passCondition: string;
  failureCondition: string;
  recoveryRoute: AseRouteTarget;
  resumeBoundary: AseResumeBoundary;
}

export interface AseStageResult {
  readOnly: true;
  stageId: AseStageId;
  status: AseStageStatus;
  passed: boolean;
  blockedReason: string | null;
  evidenceId: string | null;
  recoveryRoute: AseRouteTarget | null;
}

export interface AseGateResult {
  readOnly: true;
  gateId: AseStageId;
  passed: boolean;
  blockedReason: string | null;
}

export interface AseRouteDecision {
  readOnly: true;
  failure: string;
  destination: AseRouteTarget;
  reason: string;
  evidenceId: string | null;
  expectedReturnCondition: string;
}

export interface AseTimelineEvent {
  readOnly: true;
  eventId: string;
  label: string;
  stageId: AseStageId | null;
  evidenceId: string | null;
  timestamp: number;
}

export interface AseAuditEntry {
  readOnly: true;
  decisionId: string;
  stage: AseStageId;
  inputEvidence: readonly string[];
  decision: string;
  reason: string;
  confidence: number;
  blockers: readonly string[];
  nextRoute: AseRouteTarget | null;
  timestamp: number;
}

export interface AseStatusCard {
  readOnly: true;
  currentStage: AseStageId;
  currentGate: AseStageId;
  overallProgress: number;
  passedGates: readonly string[];
  activeGate: string | null;
  blockedGate: string | null;
  repairStatus: string | null;
  capabilityEvolutionStatus: string | null;
  improvementStatus: string | null;
  launchVerdict: string;
  previewState: string;
  nextAction: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AsePipelineState {
  readOnly: true;
  runId: string;
  projectId: string | null;
  promptHash: string;
  currentStage: AseStageId;
  currentGate: AseStageId;
  overallStatus: AseOverallStatus;
  stageStatuses: Readonly<Record<AseStageId, AseStageStatus>>;
  gateResults: readonly AseGateResult[];
  evidenceReferences: readonly string[];
  repairLoops: number;
  capabilityEvolutionLoops: number;
  improvementLoops: number;
  launchVerdict: string | null;
  livePreviewState: string | null;
  resumePoint: AseResumeBoundary | null;
}

export interface AutonomousSoftwareEngineeringPipelineInput {
  rawPrompt: string;
  projectId?: string | null;
  previewUrl?: string | null;
  projectRootDir?: string | null;
  workspaceDir?: string | null;
  productIntelligenceModel?: ProductIntelligenceModel;
  promptFaithfulness?: PromptFaithfulnessV2Result;
  capabilityPlanning?: CapabilityPlanningPipelineResult;
  resumeState?: AsePipelineState | null;
  resumeFromBoundary?: AseResumeBoundary | null;
  stopAfterStage?: AseStageId | null;
  simulateUnresolvedCapability?: boolean;
  simulateDeadButton?: boolean;
  simulateHighFrictionEmergency?: boolean;
  simulateMissingExecutionTrace?: boolean;
  simulateHumanReviewPayment?: boolean;
  simulateResumeAfterSliceCount?: number;
}

export interface AutonomousSoftwareEngineeringPipelineArtifacts {
  readOnly: true;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  missingCapabilityEvolution: MissingCapabilityEvolutionPipelineResult;
  incrementalBuild: IncrementalBuildPipelineResult;
  behaviorSimulation: BehaviorSimulationPipelineResult;
  virtualUserSimulation: VirtualUserPipelineResult;
  virtualDeviceLaboratory: VirtualDevicePipelineResult;
  interactionProof: InteractionProofPipelineResult;
  autonomousDebugging: AutonomousDebuggingPipelineResult;
  continuousImprovement: ContinuousImprovementPipelineResult;
  launchReadiness: LaunchReadinessPipelineResult;
  livePreviewGate: LivePreviewGateResult;
}

export interface AutonomousSoftwareEngineeringPipelineResult {
  readOnly: true;
  runId: string;
  projectId: string | null;
  overallStatus: AseOverallStatus;
  currentStage: AseStageId;
  readyForPreview: boolean;
  readyForMaterialization: boolean;
  previewUrl: string | null;
  launchReadiness: LaunchReadinessPipelineResult;
  livePreviewGate: LivePreviewGateResult;
  statusCard: AseStatusCard;
  timeline: readonly AseTimelineEvent[];
  auditLog: readonly AseAuditEntry[];
  evidenceSummary: readonly AseEvidenceRecord[];
  pipelineState: AsePipelineState;
  artifacts: AutonomousSoftwareEngineeringPipelineArtifacts;
  gates: readonly AseGateResult[];
  blockers: readonly string[];
  warnings: readonly string[];
  blockedReason: string | null;
  nextAction: string;
  reportMarkdown: string;
}

export interface AutonomousSoftwareEngineeringResult {
  readOnly: true;
  runId: string;
  projectId: string | null;
  overallStatus: AseOverallStatus;
  currentStage: AseStageId;
  readyForPreview: boolean;
  previewUrl: string | null;
  launchVerdict: string;
  livePreviewState: string;
  statusCard: AseStatusCard;
  timeline: readonly AseTimelineEvent[];
  gates: readonly AseGateResult[];
  blockers: readonly string[];
  warnings: readonly string[];
  nextAction: string;
  evidenceSummary: readonly AseEvidenceRecord[];
}

export const ASE_STAGE_ORDER: readonly AseStageId[] = [
  'INTENT_UNDERSTANDING',
  'PROMPT_FAITHFULNESS',
  'CAPABILITY_PLANNING',
  'MISSING_CAPABILITY_EVOLUTION',
  'INCREMENTAL_BUILD',
  'BEHAVIOR_SIMULATION',
  'VIRTUAL_USER',
  'VIRTUAL_DEVICE',
  'INTERACTION_PROOF',
  'AUTONOMOUS_DEBUGGING',
  'CONTINUOUS_IMPROVEMENT',
  'LAUNCH_READINESS_AUTHORITY',
  'LIVE_PREVIEW_GATE',
];
