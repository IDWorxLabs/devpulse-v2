/**
 * AEE Preview Recovery Loop V1 — bounded preview debugging, capability evolution, and retry.
 * Applies to any generated app after npm build passes but live preview remains locked/degraded.
 */

import { runAutonomousDebuggingPipeline } from '../autonomous-debugging-engine/index.js';
import { runCapabilityPlanningPipeline } from '../capability-planning-engine/index.js';
import { runContinuousImprovementPipeline } from '../continuous-product-improvement-engine/index.js';
import { runInteractionProofPipeline } from '../interaction-proof-engine/index.js';
import { evaluateLivePreviewGateForOrchestrator } from '../live-preview-gate/live-preview-orchestrator-bridge.js';
import { runMissingCapabilityEvolutionPipeline } from '../missing-capability-evolution-engine/index.js';
import { routeAseRepair } from '../autonomous-software-engineering-engine/ase-repair-router.js';
import type {
  AeePreviewRecoveryAttemptRecord,
  AeePreviewRecoveryLoopInput,
  AeePreviewRecoveryLoopResult,
  AeePreviewRecoveryPipelines,
  AeePreviewRecoveryPhase,
} from './aee-preview-recovery-loop-types.js';
import {
  AEE_PREVIEW_RECOVERY_LOOP_EVENT,
  AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
} from './aee-preview-recovery-loop-types.js';

export {
  AEE_PREVIEW_RECOVERY_LOOP_V1_PASS_TOKEN,
  AEE_PREVIEW_RECOVERY_LOOP_EVENT,
  AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
} from './aee-preview-recovery-loop-types.js';

export type {
  AeePreviewRecoveryLoopInput,
  AeePreviewRecoveryLoopResult,
  AeePreviewRecoveryAttemptRecord,
  AeePreviewRecoveryPipelines,
  AeePreviewRecoveryPhase,
} from './aee-preview-recovery-loop-types.js';

export function isPreviewRecoveryEligible(input: {
  npmBuildOk: boolean;
  livePreviewAvailable: boolean;
  devServerRunning?: boolean;
}): boolean {
  return input.npmBuildOk && !input.livePreviewAvailable;
}

export function detectMissingCapabilityRecoveryRequired(input: {
  gateBlockedBy: string | null;
  capabilityPlanningVerdict: string | null;
  failureReason: string | null;
}): boolean {
  if (
    input.gateBlockedBy === 'MISSING_CAPABILITY_EVOLUTION' ||
    input.gateBlockedBy === 'CAPABILITY_PLANNING'
  ) {
    return true;
  }
  if (input.capabilityPlanningVerdict === 'NEEDS_CAPABILITY_EVOLUTION') {
    return true;
  }
  return /missing capability|capability evolution|capability gap|needs_capability_evolution/i.test(
    input.failureReason ?? '',
  );
}

function buildEraBase(pipelines: AeePreviewRecoveryPipelines, rawPrompt: string) {
  return {
    rawPrompt,
    productIntelligenceModel: pipelines.productIntelligenceModel,
    promptFaithfulness: pipelines.promptFaithfulness,
    capabilityPlanning: pipelines.capabilityPlanning,
    incrementalBuild: pipelines.incrementalBuild,
    behaviorSimulation: pipelines.behaviorSimulation,
    virtualUserSimulation: pipelines.virtualUserSimulation,
    virtualDeviceLaboratory: pipelines.virtualDeviceLaboratory,
  };
}

function reevaluatePreviewGate(input: {
  rawPrompt: string;
  devServerUrl: string | null;
  pipelines: AeePreviewRecoveryPipelines;
  projectRootDir?: string | null;
  workspaceDir: string;
}) {
  return evaluateLivePreviewGateForOrchestrator({
    rawPrompt: input.rawPrompt,
    previewUrl: input.devServerUrl,
    generationComplete: true,
    productIntelligenceModel: input.pipelines.productIntelligenceModel,
    promptFaithfulness: input.pipelines.promptFaithfulness,
    capabilityPlanning: input.pipelines.capabilityPlanning,
    incrementalBuild: input.pipelines.incrementalBuild,
    behaviorSimulation: input.pipelines.behaviorSimulation,
    virtualUserSimulation: input.pipelines.virtualUserSimulation,
    virtualDeviceLaboratory: input.pipelines.virtualDeviceLaboratory,
    interactionProof: input.pipelines.interactionProof,
    autonomousDebugging: input.pipelines.autonomousDebugging,
    continuousImprovement: input.pipelines.continuousImprovement,
    launchReadiness: input.pipelines.launchReadiness,
    projectRootDir: input.projectRootDir ?? null,
    workspaceDir: input.workspaceDir,
  });
}

function rerunPostDebugPipelines(
  pipelines: AeePreviewRecoveryPipelines,
  rawPrompt: string,
): AeePreviewRecoveryPipelines {
  const eraBase = buildEraBase(pipelines, rawPrompt);
  const repairRoute = routeAseRepair({
    autonomousDebugging: pipelines.autonomousDebugging,
    failedStage: 'INTERACTION_PROOF',
  });

  if (
    pipelines.autonomousDebugging.permissionVerdict !== 'READY_FOR_PREVIEW' &&
    !repairRoute.repairResolved
  ) {
    return pipelines;
  }

  const interactionProof = runInteractionProofPipeline(eraBase);
  const continuousImprovement = runContinuousImprovementPipeline({
    ...eraBase,
    interactionProof,
    autonomousDebugging: pipelines.autonomousDebugging,
  });

  return {
    ...pipelines,
    interactionProof,
    continuousImprovement,
  };
}

function runCapabilityEvolutionPhase(
  pipelines: AeePreviewRecoveryPipelines,
  rawPrompt: string,
  gateBlockedBy: string | null,
  failureReason: string | null,
): AeePreviewRecoveryPipelines {
  if (
    !detectMissingCapabilityRecoveryRequired({
      gateBlockedBy,
      capabilityPlanningVerdict: pipelines.capabilityPlanning.permissionVerdict,
      failureReason,
    })
  ) {
    return pipelines;
  }

  const missingCapabilityEvolution = runMissingCapabilityEvolutionPipeline({
    rawPrompt,
    productIntelligenceModel: pipelines.productIntelligenceModel,
    promptFaithfulness: pipelines.promptFaithfulness,
    capabilityPlanning: pipelines.capabilityPlanning,
    promptFaithfulnessBlocked: !pipelines.promptFaithfulness.readyForGeneration,
  });

  let capabilityPlanning = pipelines.capabilityPlanning;
  if (
    missingCapabilityEvolution.permissionVerdict === 'EVOLUTION_PASS' &&
    pipelines.capabilityPlanning.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION'
  ) {
    capabilityPlanning = runCapabilityPlanningPipeline({
      rawPrompt,
      productIntelligenceModel: pipelines.productIntelligenceModel,
      promptFaithfulness: pipelines.promptFaithfulness,
      promptFaithfulnessBlocked: !pipelines.promptFaithfulness.readyForGeneration,
    });
  }

  return {
    ...pipelines,
    missingCapabilityEvolution,
    capabilityPlanning,
  };
}

export async function runAeePreviewRecoveryLoop(
  input: AeePreviewRecoveryLoopInput,
): Promise<AeePreviewRecoveryLoopResult> {
  const maxAttempts = input.maxAttempts ?? AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS;
  let pipelines = { ...input.pipelines };
  let gateBridge = input.gateBridge;
  let devServerUrl = input.devServerUrl;
  const attempts: AeePreviewRecoveryAttemptRecord[] = [];

  if (gateBridge.livePreviewAvailable) {
    return {
      readOnly: true,
      previewUnlocked: true,
      exhausted: false,
      skipped: true,
      skipReason: 'Preview already unlocked.',
      attempts,
      gateBridge,
      pipelines,
      devServerUrl,
      summary: 'Preview already unlocked — recovery loop not required.',
    };
  }

  if (!isPreviewRecoveryEligible({ npmBuildOk: input.npmBuildOk, livePreviewAvailable: false })) {
    return {
      readOnly: true,
      previewUnlocked: false,
      exhausted: false,
      skipped: true,
      skipReason: 'Build must pass before preview recovery.',
      attempts,
      gateBridge,
      pipelines,
      devServerUrl,
      summary: 'Preview recovery skipped — npm build did not pass.',
    };
  }

  const eraBase = buildEraBase(pipelines, input.rawPrompt);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const phases: AeePreviewRecoveryPhase[] = [];

    phases.push('AUTONOMOUS_DEBUGGING');
    pipelines = {
      ...pipelines,
      autonomousDebugging: runAutonomousDebuggingPipeline({
        ...eraBase,
        interactionProof: pipelines.interactionProof,
        simulateDataNotSaved:
          input.simulatePreviewRecoveryRepair === true && attempt === 1 ? true : undefined,
      }),
    };
    pipelines = rerunPostDebugPipelines(pipelines, input.rawPrompt);

    const gateBlockedBy = gateBridge.gate.blockedBy ?? null;
    const failureReason = gateBridge.failureReason ?? gateBridge.gateSummary;

    if (
      detectMissingCapabilityRecoveryRequired({
        gateBlockedBy,
        capabilityPlanningVerdict: pipelines.capabilityPlanning.permissionVerdict,
        failureReason,
      })
    ) {
      phases.push('MISSING_CAPABILITY_DETECTION', 'MISSING_CAPABILITY_EVOLUTION');
      pipelines = runCapabilityEvolutionPhase(pipelines, input.rawPrompt, gateBlockedBy, failureReason);
    }

    phases.push('GATE_REEVALUATION');
    gateBridge = reevaluatePreviewGate({
      rawPrompt: input.rawPrompt,
      devServerUrl,
      pipelines,
      projectRootDir: input.projectRootDir,
      workspaceDir: input.workspaceDir,
    });

    if (!gateBridge.livePreviewAvailable && input.restartDevServer) {
      phases.push('PREVIEW_RETRY');
      const restarted = await input.restartDevServer();
      if (restarted.ok && restarted.url) {
        devServerUrl = restarted.url;
        gateBridge = reevaluatePreviewGate({
          rawPrompt: input.rawPrompt,
          devServerUrl,
          pipelines,
          projectRootDir: input.projectRootDir,
          workspaceDir: input.workspaceDir,
        });
      }
    }

    const attemptRecord: AeePreviewRecoveryAttemptRecord = {
      readOnly: true,
      attempt,
      phases,
      previewUnlocked: gateBridge.livePreviewAvailable,
      gateBlockedBy: gateBridge.gate.blockedBy ?? null,
      debuggingVerdict: pipelines.autonomousDebugging.permissionVerdict,
      capabilityEvolutionVerdict:
        pipelines.missingCapabilityEvolution?.permissionVerdict ??
        pipelines.capabilityPlanning.permissionVerdict,
      detail: gateBridge.failureReason ?? gateBridge.gateSummary,
    };
    attempts.push(attemptRecord);
    input.onAttempt?.(attemptRecord);

    if (gateBridge.livePreviewAvailable) {
      break;
    }
  }

  const previewUnlocked = gateBridge.livePreviewAvailable;
  const exhausted = !previewUnlocked && attempts.length >= maxAttempts;
  const summary = previewUnlocked
    ? `${AEE_PREVIEW_RECOVERY_LOOP_EVENT}: preview unlocked after ${attempts.length} bounded attempt(s).`
    : exhausted
      ? `${AEE_PREVIEW_RECOVERY_LOOP_EVENT}: preview recovery exhausted after ${attempts.length} attempt(s) — build completed with degraded preview.`
      : `${AEE_PREVIEW_RECOVERY_LOOP_EVENT}: preview recovery incomplete.`;

  return {
    readOnly: true,
    previewUnlocked,
    exhausted,
    skipped: false,
    skipReason: null,
    attempts,
    gateBridge,
    pipelines,
    devServerUrl,
    summary,
  };
}
