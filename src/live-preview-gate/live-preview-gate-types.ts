/**
 * Live Preview Gate — Era 3 Phase 13 types.
 * Controlled release boundary for Live Preview unlock.
 */

import type { AutonomousDebuggingPipelineResult } from '../autonomous-debugging-engine/autonomous-debugging-types.js';
import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { ContinuousImprovementPipelineResult } from '../continuous-product-improvement-engine/continuous-improvement-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { InteractionProofPipelineResult } from '../interaction-proof-engine/interaction-proof-types.js';
import type { LaunchReadinessPipelineResult } from '../launch-readiness-authority-v2/launch-readiness-types.js';
import type { MissingCapabilityEvolutionPipelineResult } from '../missing-capability-evolution-engine/missing-capability-evolution-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';

export const LIVE_PREVIEW_GATE_V1_PASS_TOKEN = 'LIVE_PREVIEW_GATE_V1_PASS';
export const LIVE_PREVIEW_GATE_OWNER_MODULE = 'devpulse_v2_live_preview_gate';
export const DEFAULT_MAX_LIVE_PREVIEW_GATE_HISTORY = 128;

export type LivePreviewLockState =
  | 'LOCKED_PENDING_GENERATION'
  | 'LOCKED_VALIDATING'
  | 'LOCKED_AUTONOMOUS_REPAIR'
  | 'LOCKED_CAPABILITY_EVOLUTION'
  | 'LOCKED_CONTINUOUS_IMPROVEMENT'
  | 'LOCKED_LAUNCH_REVIEW'
  | 'LOCKED_HUMAN_REVIEW_REQUIRED'
  | 'LIMITED_PREVIEW_REVIEW_ONLY'
  | 'UNLOCKED_PREVIEW_READY';

export type LivePreviewUnlockVerdict =
  | 'PREVIEW_UNLOCKED'
  | 'PREVIEW_LOCKED'
  | 'PREVIEW_LOCKED_AUTONOMOUS_REPAIR'
  | 'PREVIEW_LOCKED_CAPABILITY_EVOLUTION'
  | 'PREVIEW_LOCKED_HUMAN_REVIEW'
  | 'PREVIEW_LOCKED_EVIDENCE_INCOMPLETE';

export type LivePreviewEvidenceSourceId =
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
  | 'LAUNCH_READINESS_AUTHORITY_V2'
  | 'FOUNDER_TEST'
  | 'UVL'
  | 'EXECUTION_TRACE'
  | 'WORKSPACE_REALITY'
  | 'BUILD_REALITY'
  | 'MATERIALIZATION_REALITY';

export type LivePreviewGatePassStatus = 'PASS' | 'FAIL' | 'WARNING' | 'NOT_REQUIRED' | 'UNAVAILABLE' | 'INCOMPLETE';

export interface LivePreviewEvidenceItem {
  readOnly: true;
  source: LivePreviewEvidenceSourceId;
  sourceName: string;
  status: LivePreviewGatePassStatus;
  verdict: string;
  confidence: number;
  blockers: readonly string[];
  warnings: readonly string[];
  evidenceTimestamp: number;
  traceabilityLinks: readonly string[];
  recommendedNextStep: string | null;
}

export interface LivePreviewEvidenceCollectionResult {
  readOnly: true;
  collectedAt: number;
  items: readonly LivePreviewEvidenceItem[];
  missingSources: readonly LivePreviewEvidenceSourceId[];
}

export interface LivePreviewUnlockDecision {
  readOnly: true;
  decisionId: string;
  verdict: LivePreviewUnlockVerdict;
  lockState: LivePreviewLockState;
  primaryBlockingGate: LivePreviewEvidenceSourceId | null;
  blockingEvidence: readonly string[];
  confidence: number;
  recommendedNextStep: string;
  traceability: readonly string[];
  launchVerdict: LaunchReadinessPipelineResult['verdict']['verdict'];
}

export interface LivePreviewBlockerExplanation {
  readOnly: true;
  currentStage: string;
  blockingGate: string;
  reason: string;
  affectedFeature: string | null;
  affectedWorkflow: string | null;
  affectedUser: string | null;
  affectedDevice: string | null;
  affectedInteraction: string | null;
  repairStatus: string | null;
  nextSystemAction: string;
  humanActionRequired: string | null;
  summary: string;
}

export interface LivePreviewStatusCard {
  readOnly: true;
  previewState: LivePreviewLockState;
  currentGate: string;
  overallProgress: number;
  passedGates: readonly string[];
  activeGate: string | null;
  blockedGate: string | null;
  repairAttempts: string | null;
  capabilityEvolutionStatus: string | null;
  launchReadinessVerdict: string;
  nextAction: string;
  estimatedRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface LivePreviewTransitionRecord {
  readOnly: true;
  transitionId: string;
  previousState: LivePreviewLockState;
  nextState: LivePreviewLockState;
  trigger: string;
  evidenceSource: LivePreviewEvidenceSourceId | null;
  decision: LivePreviewUnlockVerdict;
  timestamp: number;
  reason: string;
}

export interface LivePreviewGateInput {
  rawPrompt: string;
  previewUrl?: string | null;
  previousLockState?: LivePreviewLockState | null;
  productIntelligenceModel?: ProductIntelligenceModel;
  promptFaithfulness?: PromptFaithfulnessV2Result;
  capabilityPlanning?: CapabilityPlanningPipelineResult;
  missingCapabilityEvolution?: MissingCapabilityEvolutionPipelineResult;
  incrementalBuild?: IncrementalBuildPipelineResult;
  behaviorSimulation?: BehaviorSimulationPipelineResult;
  virtualUserSimulation?: VirtualUserPipelineResult;
  virtualDeviceLaboratory?: VirtualDevicePipelineResult;
  interactionProof?: InteractionProofPipelineResult;
  autonomousDebugging?: AutonomousDebuggingPipelineResult;
  continuousImprovement?: ContinuousImprovementPipelineResult;
  launchReadiness?: LaunchReadinessPipelineResult;
  projectRootDir?: string | null;
  workspaceDir?: string | null;
  generationComplete?: boolean;
  simulateBehaviorFailure?: boolean;
  simulateUnresolvedCapability?: boolean;
  simulateMissingExecutionTraceEvidence?: boolean;
  simulateInteractionProofRegression?: boolean;
  simulateHumanReviewRequired?: boolean;
  allowLimitedPreviewWhenSafe?: boolean;
}

export interface LivePreviewGateResult {
  readOnly: true;
  gateId: string;
  evaluatedAt: number;
  state: LivePreviewLockState;
  unlockVerdict: LivePreviewUnlockVerdict;
  previewUrl: string | null;
  isPreviewAvailable: boolean;
  isLimitedPreview: boolean;
  currentGate: string;
  blockedBy: LivePreviewEvidenceSourceId | null;
  blockers: readonly string[];
  warnings: readonly string[];
  statusCard: LivePreviewStatusCard;
  transitionLog: readonly LivePreviewTransitionRecord[];
  recommendedNextStep: string;
  launchVerdict: LaunchReadinessPipelineResult['verdict']['verdict'];
  evidenceSummary: LivePreviewEvidenceCollectionResult;
  unlockDecision: LivePreviewUnlockDecision;
  blockerExplanation: LivePreviewBlockerExplanation;
  reportMarkdown: string;
}
