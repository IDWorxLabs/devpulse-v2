/**
 * Live Preview Gate — one-prompt orchestrator bridge.
 */

import type { LaunchReadinessPipelineResult } from '../launch-readiness-authority-v2/launch-readiness-types.js';
import type { AutonomousDebuggingPipelineResult } from '../autonomous-debugging-engine/autonomous-debugging-types.js';
import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { ContinuousImprovementPipelineResult } from '../continuous-product-improvement-engine/continuous-improvement-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { InteractionProofPipelineResult } from '../interaction-proof-engine/interaction-proof-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { LivePreviewGateResult, LivePreviewLockState } from './live-preview-gate-types.js';
import { isAuthoritativePreviewUnlocked } from '../aep-preview-gate-authority/index.js';
import { evaluateLivePreviewGate } from './live-preview-unlock-authority.js';

export interface LivePreviewOrchestratorBridgeInput {
  rawPrompt: string;
  previewUrl: string | null;
  generationComplete: boolean;
  previousLockState?: LivePreviewLockState | null;
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
  projectRootDir?: string | null;
  workspaceDir?: string | null;
}

export interface LivePreviewOrchestratorBridgeResult {
  readOnly: true;
  gate: LivePreviewGateResult;
  previewUrl: string | null;
  livePreviewAvailable: boolean;
  failureReason: string | null;
  gateSummary: string;
}

export function evaluateLivePreviewGateForOrchestrator(
  input: LivePreviewOrchestratorBridgeInput,
): LivePreviewOrchestratorBridgeResult {
  const gate = evaluateLivePreviewGate({
    rawPrompt: input.rawPrompt,
    previewUrl: input.previewUrl,
    generationComplete: input.generationComplete,
    previousLockState: input.previousLockState ?? null,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
    capabilityPlanning: input.capabilityPlanning,
    incrementalBuild: input.incrementalBuild,
    behaviorSimulation: input.behaviorSimulation,
    virtualUserSimulation: input.virtualUserSimulation,
    virtualDeviceLaboratory: input.virtualDeviceLaboratory,
    interactionProof: input.interactionProof,
    autonomousDebugging: input.autonomousDebugging,
    continuousImprovement: input.continuousImprovement,
    launchReadiness: input.launchReadiness,
    projectRootDir: input.projectRootDir ?? null,
    workspaceDir: input.workspaceDir ?? null,
  });

  const unlocked = isAuthoritativePreviewUnlocked(gate);
  const previewUrl = unlocked ? input.previewUrl : null;

  return {
    readOnly: true,
    gate,
    previewUrl,
    livePreviewAvailable: unlocked,
    failureReason: unlocked ? null : gate.blockerExplanation.summary,
    gateSummary: gate.blockerExplanation.summary,
  };
}

export function shouldExposePreviewUrl(gate: LivePreviewGateResult): boolean {
  return gate.isPreviewAvailable || gate.isLimitedPreview;
}
