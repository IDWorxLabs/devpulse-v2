/**
 * Live Preview Gate — unlock authority and main evaluation pipeline.
 */

import { runBehaviorSimulationPipeline } from '../behavior-simulation-engine/index.js';
import { runIntentUnderstandingEngine } from '../intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../prompt-faithfulness-engine-v2/index.js';
import { runCapabilityPlanningPipeline } from '../capability-planning-engine/index.js';
import { runIncrementalBuildPipeline } from '../incremental-autonomous-builder/index.js';
import { runInteractionProofPipeline } from '../interaction-proof-engine/index.js';
import { runAutonomousDebuggingPipeline } from '../autonomous-debugging-engine/index.js';
import { runContinuousImprovementPipeline } from '../continuous-product-improvement-engine/index.js';
import { runVirtualUserPipeline } from '../virtual-user-engine/index.js';
import { runVirtualDevicePipeline } from '../virtual-device-laboratory/index.js';
import { explainLivePreviewBlocker } from './live-preview-blocker-explainer.js';
import {
  collectLivePreviewEvidence,
  resolveLaunchReadinessForGate,
} from './live-preview-evidence-collector.js';
import { evaluateLivePreviewGates } from './live-preview-gate-evaluator.js';
import type {
  LivePreviewGateInput,
  LivePreviewGateResult,
  LivePreviewLockState,
  LivePreviewUnlockDecision,
} from './live-preview-gate-types.js';
import { recordLivePreviewGateEvaluation, resetLivePreviewGateHistoryForTests } from './live-preview-history.js';
import { gateLabel, mapUnlockVerdict, resolveLivePreviewLockState } from './live-preview-lock-state.js';
import { buildLivePreviewGateReport } from './live-preview-report-builder.js';
import { buildLivePreviewStatusCard } from './live-preview-status-card.js';
import { buildTransitionLogForEvaluation, resetLivePreviewTransitionLogForTests } from './live-preview-transition-log.js';

let gateCounter = 0;

export function resetLivePreviewUnlockAuthorityForTests(): void {
  gateCounter = 0;
  resetLivePreviewGateHistoryForTests();
  resetLivePreviewTransitionLogForTests();
}

function nextGateId(): string {
  gateCounter += 1;
  return `live-preview-gate-${gateCounter}`;
}

function nextDecisionId(): string {
  return `preview-unlock-decision-${gateCounter}`;
}

function hydratePipelines(input: LivePreviewGateInput): LivePreviewGateInput {
  if (input.behaviorSimulation && input.launchReadiness) return input;

  const intent = input.productIntelligenceModel
    ? { productIntelligenceModel: input.productIntelligenceModel }
    : runIntentUnderstandingEngine({ rawPrompt: input.rawPrompt });
  const faithfulness =
    input.promptFaithfulness ??
    runPromptFaithfulnessEngineV2(input.rawPrompt, {
      generatedModules: intent.productIntelligenceModel.architecture.moduleIds,
    });
  const capabilityPlanning =
    input.capabilityPlanning ??
    runCapabilityPlanningPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
    });
  const incrementalBuild =
    input.incrementalBuild ??
    runIncrementalBuildPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
    });
  const behaviorSimulation =
    input.behaviorSimulation ??
    runBehaviorSimulationPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      simulateBrokenHandler: input.simulateBehaviorFailure,
    });
  const virtualUserSimulation =
    input.virtualUserSimulation ??
    runVirtualUserPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
    });
  const virtualDeviceLaboratory =
    input.virtualDeviceLaboratory ??
    runVirtualDevicePipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
    });
  const interactionProof =
    input.interactionProof ??
    runInteractionProofPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
      virtualDeviceLaboratory,
      simulateDeviceSpecificFailure: input.simulateInteractionProofRegression,
    });
  const autonomousDebugging =
    input.autonomousDebugging ??
    runAutonomousDebuggingPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
      virtualDeviceLaboratory,
      interactionProof,
    });
  const continuousImprovement =
    input.continuousImprovement ??
    runContinuousImprovementPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
      virtualDeviceLaboratory,
      interactionProof,
      autonomousDebugging,
    });

  return {
    ...input,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
    continuousImprovement,
  };
}

function buildUnlockDecision(input: {
  unlockVerdict: LivePreviewGateResult['unlockVerdict'];
  lockState: LivePreviewLockState;
  evaluation: ReturnType<typeof evaluateLivePreviewGates>;
  launchReadiness: ReturnType<typeof resolveLaunchReadinessForGate>;
}): LivePreviewUnlockDecision {
  return {
    readOnly: true,
    decisionId: nextDecisionId(),
    verdict: input.unlockVerdict,
    lockState: input.lockState,
    primaryBlockingGate: input.evaluation.primaryBlockingGate,
    blockingEvidence: input.evaluation.blockingEvidence,
    confidence: input.launchReadiness.confidence.overallConfidence,
    recommendedNextStep: input.launchReadiness.verdict.requiredNextStep,
    traceability: input.launchReadiness.audit.decisionTrace,
    launchVerdict: input.launchReadiness.verdict.verdict,
  };
}

function assessLimitedPreviewSafety(input: {
  launchReadiness: ReturnType<typeof resolveLaunchReadinessForGate>;
  generationComplete: boolean;
}): boolean {
  if (!input.generationComplete) return false;
  const security = input.launchReadiness.evidence.sources.find((s) => s.sourceId === 'SECURITY_VALIDATION');
  const hasCriticalSecurity = security?.blockers.some((b) => /payment|security/i.test(b));
  return (
    input.launchReadiness.verdict.verdict === 'NEEDS_HUMAN_REVIEW' &&
    !hasCriticalSecurity &&
    input.launchReadiness.evidence.sources.find((s) => s.sourceId === 'INCREMENTAL_BUILD')?.status === 'PASS'
  );
}

export function evaluateLivePreviewGate(input: LivePreviewGateInput): LivePreviewGateResult {
  const gateId = nextGateId();
  const hydrated = hydratePipelines(input);
  const launchReadiness = resolveLaunchReadinessForGate(hydrated);
  const evidence = collectLivePreviewEvidence({ gateInput: hydrated, launchReadiness });
  const evaluation = evaluateLivePreviewGates(evidence);
  const evidenceIncomplete = !launchReadiness.evidenceValidation.valid || evidence.missingSources.length > 0;
  const unlockVerdict = mapUnlockVerdict({ evaluation, launchReadiness, evidenceIncomplete });
  const isRegressionRelock =
    input.previousLockState === 'UNLOCKED_PREVIEW_READY' &&
    (input.simulateInteractionProofRegression || unlockVerdict !== 'PREVIEW_UNLOCKED');
  const lockState = resolveLivePreviewLockState({
    generationComplete: input.generationComplete ?? true,
    evaluation,
    launchReadiness,
    unlockVerdict,
    previousLockState: input.previousLockState ?? null,
    isRegressionRelock,
  });

  const limitedPreviewSafe =
    input.allowLimitedPreviewWhenSafe === true && assessLimitedPreviewSafety({
      launchReadiness,
      generationComplete: input.generationComplete ?? true,
    });
  const effectiveLockState: LivePreviewLockState = limitedPreviewSafe
    ? 'LIMITED_PREVIEW_REVIEW_ONLY'
    : lockState;
  const effectiveVerdict =
    unlockVerdict === 'PREVIEW_UNLOCKED'
      ? 'PREVIEW_UNLOCKED'
      : limitedPreviewSafe
        ? 'PREVIEW_LOCKED'
        : unlockVerdict;

  const isUnlocked = effectiveVerdict === 'PREVIEW_UNLOCKED';
  const isLimitedPreview = effectiveLockState === 'LIMITED_PREVIEW_REVIEW_ONLY';
  const previewUrl = isUnlocked || isLimitedPreview ? (input.previewUrl ?? null) : null;
  const isPreviewAvailable = isUnlocked;

  const unlockDecision = buildUnlockDecision({
    unlockVerdict: effectiveVerdict,
    lockState: effectiveLockState,
    evaluation,
    launchReadiness,
  });
  const blockerExplanation = explainLivePreviewBlocker({
    lockState: effectiveLockState,
    unlockVerdict: effectiveVerdict,
    evaluation,
    evidence,
    launchReadiness,
  });
  const statusCard = buildLivePreviewStatusCard({
    lockState: effectiveLockState,
    unlockVerdict: effectiveVerdict,
    evaluation,
    launchReadiness,
    recommendedNextStep: launchReadiness.verdict.requiredNextStep,
  });
  const transitionLog = buildTransitionLogForEvaluation({
    previousState: input.previousLockState ?? null,
    nextState: effectiveLockState,
    unlockVerdict: effectiveVerdict,
    primaryBlockingGate: evaluation.primaryBlockingGate,
    reason: blockerExplanation.summary,
    trigger: isRegressionRelock ? 'regression_relock' : 'gate_evaluation',
  });

  const result: LivePreviewGateResult = {
    readOnly: true,
    gateId,
    evaluatedAt: Date.now(),
    state: effectiveLockState,
    unlockVerdict: effectiveVerdict,
    previewUrl,
    isPreviewAvailable,
    isLimitedPreview,
    currentGate: gateLabel(evaluation.primaryBlockingGate),
    blockedBy: evaluation.primaryBlockingGate,
    blockers: evaluation.blockingEvidence,
    warnings: evaluation.warnings,
    statusCard,
    transitionLog,
    recommendedNextStep: launchReadiness.verdict.requiredNextStep,
    launchVerdict: launchReadiness.verdict.verdict,
    evidenceSummary: evidence,
    unlockDecision,
    blockerExplanation,
    reportMarkdown: '',
  };

  result.reportMarkdown = buildLivePreviewGateReport(result);
  recordLivePreviewGateEvaluation(result);
  return result;
}

export function isLivePreviewGateUnlocked(result: LivePreviewGateResult): boolean {
  return result.unlockVerdict === 'PREVIEW_UNLOCKED' && result.isPreviewAvailable;
}

export function getLivePreviewGatePassToken(): string {
  return 'LIVE_PREVIEW_GATE_V1_PASS';
}
