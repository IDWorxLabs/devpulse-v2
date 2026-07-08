/**
 * AEE Preview Recovery Loop V1 — types.
 */

import type { AutonomousDebuggingPipelineResult } from '../autonomous-debugging-engine/autonomous-debugging-types.js';
import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { ContinuousImprovementPipelineResult } from '../continuous-product-improvement-engine/continuous-improvement-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { InteractionProofPipelineResult } from '../interaction-proof-engine/interaction-proof-types.js';
import type { LaunchReadinessPipelineResult } from '../launch-readiness-authority-v2/launch-readiness-types.js';
import type { LivePreviewOrchestratorBridgeResult } from '../live-preview-gate/live-preview-orchestrator-bridge.js';
import type { MissingCapabilityEvolutionPipelineResult } from '../missing-capability-evolution-engine/missing-capability-evolution-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';

export const AEE_PREVIEW_RECOVERY_LOOP_V1_PASS_TOKEN =
  'AEE_PREVIEW_RECOVERY_LOOP_V1_PASS' as const;

export const AEE_PREVIEW_RECOVERY_LOOP_EVENT = 'AEE_PREVIEW_RECOVERY_LOOP_V1' as const;

export const AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS = 3 as const;

export type AeePreviewRecoveryPhase =
  | 'AUTONOMOUS_DEBUGGING'
  | 'MISSING_CAPABILITY_DETECTION'
  | 'MISSING_CAPABILITY_EVOLUTION'
  | 'GATE_REEVALUATION'
  | 'PREVIEW_RETRY';

export interface AeePreviewRecoveryPipelines {
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuild: IncrementalBuildPipelineResult;
  behaviorSimulation: BehaviorSimulationPipelineResult;
  virtualUserSimulation: VirtualUserPipelineResult;
  virtualDeviceLaboratory: VirtualDevicePipelineResult;
  interactionProof: InteractionProofPipelineResult;
  autonomousDebugging: AutonomousDebuggingPipelineResult;
  continuousImprovement: ContinuousImprovementPipelineResult;
  launchReadiness: LaunchReadinessPipelineResult;
  missingCapabilityEvolution?: MissingCapabilityEvolutionPipelineResult | null;
}

export interface AeePreviewRecoveryAttemptRecord {
  readOnly: true;
  attempt: number;
  phases: readonly AeePreviewRecoveryPhase[];
  previewUnlocked: boolean;
  gateBlockedBy: string | null;
  debuggingVerdict: string | null;
  capabilityEvolutionVerdict: string | null;
  detail: string;
}

export interface AeePreviewRecoveryLoopInput {
  rawPrompt: string;
  projectId: string;
  workspaceDir: string;
  projectRootDir?: string | null;
  npmBuildOk: boolean;
  devServerUrl: string | null;
  gateBridge: LivePreviewOrchestratorBridgeResult;
  pipelines: AeePreviewRecoveryPipelines;
  maxAttempts?: number;
  restartDevServer?: () => Promise<{ ok: boolean; url: string | null; error?: string | null }>;
  /** Validator-only: exercise repair resolution on first loop */
  simulatePreviewRecoveryRepair?: boolean;
  onAttempt?: (record: AeePreviewRecoveryAttemptRecord) => void;
}

export interface AeePreviewRecoveryLoopResult {
  readOnly: true;
  previewUnlocked: boolean;
  exhausted: boolean;
  skipped: boolean;
  skipReason: string | null;
  attempts: readonly AeePreviewRecoveryAttemptRecord[];
  gateBridge: LivePreviewOrchestratorBridgeResult;
  pipelines: AeePreviewRecoveryPipelines;
  devServerUrl: string | null;
  summary: string;
}
