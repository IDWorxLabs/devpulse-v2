/**
 * ASE — stage orchestrator.
 * Coordinates Era 3 phases through one evidence-driven pipeline.
 */

import { runAutonomousDebuggingPipeline } from '../autonomous-debugging-engine/index.js';
import { runBehaviorSimulationPipeline } from '../behavior-simulation-engine/index.js';
import { runCapabilityPlanningPipeline } from '../capability-planning-engine/index.js';
import { runIncrementalBuildPipeline, isIncrementalBuildReadyForGeneration } from '../incremental-autonomous-builder/index.js';
import { runIntentUnderstandingEngine } from '../intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../prompt-faithfulness-engine-v2/index.js';
import { runInteractionProofPipeline } from '../interaction-proof-engine/index.js';
import { runContinuousImprovementPipeline } from '../continuous-product-improvement-engine/index.js';
import { runVirtualUserPipeline } from '../virtual-user-engine/index.js';
import { runVirtualDevicePipeline } from '../virtual-device-laboratory/index.js';
import { runLaunchReadinessAuthorityPipeline } from '../launch-readiness-authority-v2/index.js';
import { evaluateLivePreviewGate } from '../live-preview-gate/index.js';
import { runMissingCapabilityEvolutionPipeline } from '../missing-capability-evolution-engine/index.js';
import { recordAseAuditDecision } from './ase-audit-log.js';
import { routeAseCapabilityEvolution } from './ase-capability-evolution-router.js';
import { publishAseEvidence } from './ase-evidence-bus.js';
import { routeAseFailure } from './ase-failure-router.js';
import { buildAseGateResults, canProceedToStage } from './ase-gate-controller.js';
import { routeAseLaunch } from './ase-launch-router.js';
import { routeAseLivePreview } from './ase-live-preview-router.js';
import {
  createAsePipelineState,
  deriveAseOverallStatus,
  markAseStageStatus,
  updateAsePipelineState,
} from './ase-pipeline-state.js';
import { routeAseQualityLoop } from './ase-quality-loop-router.js';
import { routeAseRepair } from './ase-repair-router.js';
import { planAseRoute } from './ase-route-planner.js';
import { shouldSkipStageForResume } from './ase-resume-controller.js';
import { getAseAuditLog } from './ase-audit-log.js';
import { getAseEvidenceBus } from './ase-evidence-bus.js';
import { buildAseReport } from './ase-report-builder.js';
import { buildAseStatusCard } from './ase-status-card.js';
import {
  appendAseTimelineEvent,
  ASE_TIMELINE_LABELS,
  getAseTimeline,
} from './ase-timeline-builder.js';
import type {
  AutonomousSoftwareEngineeringPipelineArtifacts,
  AutonomousSoftwareEngineeringPipelineInput,
  AutonomousSoftwareEngineeringPipelineResult,
  AseStageId,
  AseStageResult,
} from './ase-types.js';
import { ASE_STAGE_ORDER } from './ase-types.js';

function stagePassed(verdict: string | undefined, passValues: readonly string[]): boolean {
  return verdict ? passValues.includes(verdict) : false;
}

function publishStageEvidence(input: {
  stageId: AseStageId;
  evidenceType: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'UNAVAILABLE';
  confidence: number;
  blockers?: readonly string[];
  warnings?: readonly string[];
  artifacts?: readonly string[];
  recommendedNextStep?: string | null;
}): string {
  const record = publishAseEvidence({
    sourceStage: input.stageId,
    evidenceType: input.evidenceType,
    status: input.status,
    confidence: input.confidence,
    affectedRequirements: [],
    affectedFeatures: [],
    affectedCapabilities: [],
    affectedUsers: [],
    affectedDevices: [],
    affectedInteractions: [],
    artifacts: input.artifacts ?? [],
    timestamp: Date.now(),
    blockers: input.blockers ?? [],
    warnings: input.warnings ?? [],
    recommendedNextStep: input.recommendedNextStep ?? null,
  });
  return record.evidenceId;
}

function recordStageResult(
  map: Map<AseStageId, AseStageResult>,
  stageId: AseStageId,
  passed: boolean,
  evidenceId: string | null,
  blockedReason: string | null,
  recoveryRoute: AseStageResult['recoveryRoute'] = null,
): void {
  map.set(stageId, {
    readOnly: true,
    stageId,
    status: passed ? 'PASSED' : blockedReason ? 'FAILED' : 'BLOCKED',
    passed,
    blockedReason,
    evidenceId,
    recoveryRoute,
  });
}

export function runAseStageOrchestrator(
  input: AutonomousSoftwareEngineeringPipelineInput,
): AutonomousSoftwareEngineeringPipelineResult {
  const stageResults = new Map<AseStageId, AseStageResult>();
  let pipelineState = createAsePipelineState({
    rawPrompt: input.rawPrompt,
    projectId: input.projectId ?? null,
    resumeState: input.resumeState ?? null,
    resumeFromBoundary: input.resumeFromBoundary ?? null,
  });

  appendAseTimelineEvent({ label: ASE_TIMELINE_LABELS.PROMPT_RECEIVED, stageId: null });

  const resumeBoundary = input.resumeFromBoundary ?? input.resumeState?.resumePoint ?? null;
  const blockers: string[] = [];
  const warnings: string[] = [];
  let repairLoops = pipelineState.repairLoops;
  let capabilityEvolutionLoops = pipelineState.capabilityEvolutionLoops;
  let improvementLoops = pipelineState.improvementLoops;

  const skip = (stageId: AseStageId) => shouldSkipStageForResume(stageId, resumeBoundary);

  // Stage 1 — Intent Understanding
  let productIntelligenceModel = input.productIntelligenceModel;
  if (!skip('INTENT_UNDERSTANDING') && !productIntelligenceModel) {
    pipelineState = updateAsePipelineState(pipelineState, {
      currentStage: 'INTENT_UNDERSTANDING',
      currentGate: 'INTENT_UNDERSTANDING',
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'INTENT_UNDERSTANDING', 'RUNNING'),
    });
    const intent = runIntentUnderstandingEngine({ rawPrompt: input.rawPrompt });
    productIntelligenceModel = intent.productIntelligenceModel;
    const evidenceId = publishStageEvidence({
      stageId: 'INTENT_UNDERSTANDING',
      evidenceType: 'INTENT_MODEL',
      status: 'PASS',
      confidence: 0.85,
      artifacts: intent.productIntelligenceModel.architecture.moduleIds,
    });
    recordStageResult(stageResults, 'INTENT_UNDERSTANDING', true, evidenceId, null);
    appendAseTimelineEvent({
      label: ASE_TIMELINE_LABELS.INTENT_UNDERSTOOD,
      stageId: 'INTENT_UNDERSTANDING',
      evidenceId,
    });
    pipelineState = updateAsePipelineState(pipelineState, {
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'INTENT_UNDERSTANDING', 'PASSED'),
      evidenceReferences: [...pipelineState.evidenceReferences, evidenceId],
    });
    recordAseAuditDecision({
      stage: 'INTENT_UNDERSTANDING',
      inputEvidence: [evidenceId],
      decision: 'INTENT_UNDERSTOOD',
      reason: 'Intent understanding produced product intelligence model.',
      confidence: 0.85,
    });
  } else if (productIntelligenceModel) {
    recordStageResult(stageResults, 'INTENT_UNDERSTANDING', true, null, null);
    pipelineState = updateAsePipelineState(pipelineState, {
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'INTENT_UNDERSTANDING', 'SKIPPED'),
    });
  } else {
    recordStageResult(stageResults, 'INTENT_UNDERSTANDING', true, null, null);
    pipelineState = updateAsePipelineState(pipelineState, {
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'INTENT_UNDERSTANDING', 'SKIPPED'),
    });
    productIntelligenceModel = runIntentUnderstandingEngine({ rawPrompt: input.rawPrompt }).productIntelligenceModel;
  }

  if (input.stopAfterStage === 'INTENT_UNDERSTANDING') {
    return buildPartialResult(input, pipelineState, stageResults, blockers, warnings, {} as AutonomousSoftwareEngineeringPipelineArtifacts);
  }

  // Stage 2 — Prompt Faithfulness
  let promptFaithfulness = input.promptFaithfulness;
  if (!skip('PROMPT_FAITHFULNESS') && !promptFaithfulness) {
    promptFaithfulness = runPromptFaithfulnessEngineV2(input.rawPrompt, {
      generatedModules: productIntelligenceModel.architecture.moduleIds,
    });
    const passed = promptFaithfulness.readyForGeneration;
    const evidenceId = publishStageEvidence({
      stageId: 'PROMPT_FAITHFULNESS',
      evidenceType: 'PROMPT_EVIDENCE_CONTRACT',
      status: passed ? 'PASS' : 'FAIL',
      confidence: passed ? 0.9 : 0.4,
      blockers: passed ? [] : [promptFaithfulness.blockedReason ?? 'Prompt faithfulness blocked'],
    });
    recordStageResult(stageResults, 'PROMPT_FAITHFULNESS', passed, evidenceId, passed ? null : promptFaithfulness.blockedReason);
    appendAseTimelineEvent({
      label: ASE_TIMELINE_LABELS.PROMPT_CONTRACT_CREATED,
      stageId: 'PROMPT_FAITHFULNESS',
      evidenceId,
    });
    pipelineState = updateAsePipelineState(pipelineState, {
      currentStage: 'PROMPT_FAITHFULNESS',
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'PROMPT_FAITHFULNESS', passed ? 'PASSED' : 'FAILED'),
    });
    if (!passed) {
      blockers.push(promptFaithfulness.blockedReason ?? 'Prompt faithfulness blocked');
    }
  } else {
    promptFaithfulness =
      promptFaithfulness ??
      runPromptFaithfulnessEngineV2(input.rawPrompt, {
        generatedModules: productIntelligenceModel.architecture.moduleIds,
      });
    recordStageResult(stageResults, 'PROMPT_FAITHFULNESS', promptFaithfulness.readyForGeneration, null, null);
  }

  // Stage 3 — Capability Planning
  let capabilityPlanning = input.capabilityPlanning;
  if (!skip('CAPABILITY_PLANNING') && !capabilityPlanning) {
    capabilityPlanning = runCapabilityPlanningPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel,
      promptFaithfulness,
      promptFaithfulnessBlocked: !promptFaithfulness.readyForGeneration,
    });
    const needsEvolution = capabilityPlanning.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION';
    const passed = !needsEvolution && capabilityPlanning.permissionVerdict !== 'BLOCKED';
    const evidenceId = publishStageEvidence({
      stageId: 'CAPABILITY_PLANNING',
      evidenceType: 'CAPABILITY_PLAN',
      status: passed ? 'PASS' : needsEvolution ? 'WARNING' : 'FAIL',
      confidence: passed ? 0.88 : 0.5,
      blockers: passed ? [] : [capabilityPlanning.blockedReason ?? 'Capability planning blocked'],
      recommendedNextStep: needsEvolution ? 'Route to Missing Capability Evolution' : null,
    });
    recordStageResult(
      stageResults,
      'CAPABILITY_PLANNING',
      passed,
      evidenceId,
      passed ? null : capabilityPlanning.blockedReason ?? 'Capability gap detected',
      needsEvolution ? 'MISSING_CAPABILITY_EVOLUTION' : null,
    );
    appendAseTimelineEvent({
      label: ASE_TIMELINE_LABELS.CAPABILITY_PLANNING_COMPLETED,
      stageId: 'CAPABILITY_PLANNING',
      evidenceId,
    });
    pipelineState = updateAsePipelineState(pipelineState, {
      currentStage: 'CAPABILITY_PLANNING',
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'CAPABILITY_PLANNING', passed ? 'PASSED' : 'FAILED'),
    });
  } else {
    capabilityPlanning =
      capabilityPlanning ??
      runCapabilityPlanningPipeline({
        rawPrompt: input.rawPrompt,
        productIntelligenceModel,
        promptFaithfulness,
        promptFaithfulnessBlocked: !promptFaithfulness.readyForGeneration,
      });
    recordStageResult(stageResults, 'CAPABILITY_PLANNING', true, null, null);
  }

  // Stage 4 — Missing Capability Evolution
  let missingCapabilityEvolution = runMissingCapabilityEvolutionPipeline({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning,
    promptFaithfulnessBlocked: !promptFaithfulness.readyForGeneration,
  });

  const needsEvolution = capabilityPlanning.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION';

  if (needsEvolution && !skip('MISSING_CAPABILITY_EVOLUTION')) {
    capabilityEvolutionLoops += 1;
    pipelineState = updateAsePipelineState(pipelineState, {
      overallStatus: 'EVOLVING_CAPABILITY',
      capabilityEvolutionLoops,
    });
    const evolutionRoute = routeAseCapabilityEvolution({ capabilityPlanning, missingCapabilityEvolution });
    if (evolutionRoute.unsafeEscalation || input.simulateHumanReviewPayment) {
      const route = routeAseFailure({
        stageId: 'MISSING_CAPABILITY_EVOLUTION',
        failure: 'Payment capability requires unsafe evolution — human review required',
        evidenceId: null,
      });
      blockers.push(route.reason);
      pipelineState = updateAsePipelineState(pipelineState, { overallStatus: 'HUMAN_REVIEW_REQUIRED' });
      recordStageResult(
        stageResults,
        'MISSING_CAPABILITY_EVOLUTION',
        false,
        null,
        missingCapabilityEvolution.blockedReason ?? 'Unsafe capability evolution',
        'HUMAN_REVIEW',
      );
    } else if (evolutionRoute.evolutionComplete) {
      capabilityPlanning = runCapabilityPlanningPipeline({
        rawPrompt: input.rawPrompt,
        productIntelligenceModel,
        promptFaithfulness,
        promptFaithfulnessBlocked: !promptFaithfulness.readyForGeneration,
      });
      const evidenceId = publishStageEvidence({
        stageId: 'MISSING_CAPABILITY_EVOLUTION',
        evidenceType: 'CAPABILITY_EVOLUTION',
        status: 'PASS',
        confidence: 0.86,
        artifacts: missingCapabilityEvolution.registryRecords.map((c) => c.capabilityId),
      });
      recordStageResult(stageResults, 'MISSING_CAPABILITY_EVOLUTION', true, evidenceId, null);
      appendAseTimelineEvent({
        label: ASE_TIMELINE_LABELS.CAPABILITY_EVOLVED,
        stageId: 'MISSING_CAPABILITY_EVOLUTION',
        evidenceId,
      });
      recordAseAuditDecision({
        stage: 'MISSING_CAPABILITY_EVOLUTION',
        inputEvidence: [evidenceId],
        decision: 'CAPABILITY_EVOLVED',
        reason: 'Missing capability evolved and capability planning re-ran.',
        confidence: 0.86,
        nextRoute: 'RESUME',
      });
      pipelineState = updateAsePipelineState(pipelineState, {
        stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'MISSING_CAPABILITY_EVOLUTION', 'PASSED'),
        resumePoint: 'CAPABILITIES_RESOLVED',
      });
    }
  } else {
    recordStageResult(stageResults, 'MISSING_CAPABILITY_EVOLUTION', true, null, null);
    pipelineState = updateAsePipelineState(pipelineState, {
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'MISSING_CAPABILITY_EVOLUTION', 'SKIPPED'),
    });
  }

  // Stage 5 — Incremental Build
  let incrementalBuild = runIncrementalBuildPipeline({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning,
  });
  if (!skip('INCREMENTAL_BUILD')) {
    const passed = isIncrementalBuildReadyForGeneration(incrementalBuild);
    const evidenceId = publishStageEvidence({
      stageId: 'INCREMENTAL_BUILD',
      evidenceType: 'INCREMENTAL_BUILD',
      status: passed ? 'PASS' : 'FAIL',
      confidence: passed ? 0.9 : 0.45,
      blockers: passed ? [] : [incrementalBuild.blockedReason ?? 'Incremental build blocked'],
      artifacts: incrementalBuild.buildState.completedSliceIds,
    });
    recordStageResult(stageResults, 'INCREMENTAL_BUILD', passed, evidenceId, passed ? null : incrementalBuild.blockedReason);
    appendAseTimelineEvent({
      label: ASE_TIMELINE_LABELS.FEATURE_SLICE_STABILIZED,
      stageId: 'INCREMENTAL_BUILD',
      evidenceId,
    });
    pipelineState = updateAsePipelineState(pipelineState, {
      currentStage: 'INCREMENTAL_BUILD',
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'INCREMENTAL_BUILD', passed ? 'PASSED' : 'FAILED'),
      resumePoint: 'FEATURE_SLICE_STABILIZED',
    });
    if (!passed) blockers.push(incrementalBuild.blockedReason ?? 'Incremental build blocked');
  } else {
    recordStageResult(stageResults, 'INCREMENTAL_BUILD', true, null, null);
    pipelineState = updateAsePipelineState(pipelineState, {
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'INCREMENTAL_BUILD', 'SKIPPED'),
    });
  }

  if (input.stopAfterStage === 'INCREMENTAL_BUILD') {
    return buildPartialResult(input, pipelineState, stageResults, blockers, warnings, {
      productIntelligenceModel,
      promptFaithfulness,
      capabilityPlanning,
      missingCapabilityEvolution,
      incrementalBuild,
    } as Partial<AutonomousSoftwareEngineeringPipelineArtifacts> as AutonomousSoftwareEngineeringPipelineArtifacts);
  }

  const eraBase = {
    rawPrompt: input.rawPrompt,
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning,
    incrementalBuild,
  };

  // Stage 6 — Behavior Simulation
  let behaviorSimulation = runBehaviorSimulationPipeline(eraBase);
  if (!skip('BEHAVIOR_SIMULATION')) {
    const passed = stagePassed(behaviorSimulation.permissionVerdict, ['READY_FOR_PREVIEW', 'PASS']);
    const evidenceId = publishStageEvidence({
      stageId: 'BEHAVIOR_SIMULATION',
      evidenceType: 'BEHAVIOR_SCENARIOS',
      status: passed ? 'PASS' : 'FAIL',
      confidence: passed ? 0.87 : 0.4,
    });
    recordStageResult(stageResults, 'BEHAVIOR_SIMULATION', passed, evidenceId, passed ? null : behaviorSimulation.blockedReason);
    if (passed) {
      appendAseTimelineEvent({
        label: ASE_TIMELINE_LABELS.BEHAVIOR_SCENARIO_PASSED,
        stageId: 'BEHAVIOR_SIMULATION',
        evidenceId,
      });
    }
    pipelineState = updateAsePipelineState(pipelineState, {
      currentStage: 'BEHAVIOR_SIMULATION',
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'BEHAVIOR_SIMULATION', passed ? 'PASSED' : 'FAILED'),
    });
  } else {
    recordStageResult(stageResults, 'BEHAVIOR_SIMULATION', true, null, null);
  }

  // Stage 7 — Virtual User
  let virtualUserSimulation = runVirtualUserPipeline({ ...eraBase, behaviorSimulation });
  if (!skip('VIRTUAL_USER')) {
    const passed = stagePassed(virtualUserSimulation.permissionVerdict, ['READY_FOR_PREVIEW', 'PASS']);
    const evidenceId = publishStageEvidence({
      stageId: 'VIRTUAL_USER',
      evidenceType: 'VIRTUAL_USER_JOURNEYS',
      status: passed ? 'PASS' : input.simulateHighFrictionEmergency ? 'WARNING' : 'FAIL',
      confidence: passed ? 0.86 : 0.55,
      warnings: input.simulateHighFrictionEmergency ? ['HIGH friction detected on emergency workflow'] : [],
    });
    recordStageResult(stageResults, 'VIRTUAL_USER', passed || !!input.simulateHighFrictionEmergency, evidenceId, null);
    if (passed) {
      appendAseTimelineEvent({
        label: ASE_TIMELINE_LABELS.VIRTUAL_USER_JOURNEY_PASSED,
        stageId: 'VIRTUAL_USER',
        evidenceId,
      });
    }
    pipelineState = updateAsePipelineState(pipelineState, {
      currentStage: 'VIRTUAL_USER',
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'VIRTUAL_USER', 'PASSED'),
    });
  } else {
    recordStageResult(stageResults, 'VIRTUAL_USER', true, null, null);
  }

  // Stage 8 — Virtual Device
  let virtualDeviceLaboratory = runVirtualDevicePipeline({
    ...eraBase,
    behaviorSimulation,
    virtualUserSimulation,
  });
  if (!skip('VIRTUAL_DEVICE')) {
    const passed = stagePassed(virtualDeviceLaboratory.permissionVerdict, ['READY_FOR_PREVIEW', 'PASS']);
    const evidenceId = publishStageEvidence({
      stageId: 'VIRTUAL_DEVICE',
      evidenceType: 'DEVICE_PROFILES',
      status: passed ? 'PASS' : 'FAIL',
      confidence: passed ? 0.85 : 0.4,
    });
    recordStageResult(stageResults, 'VIRTUAL_DEVICE', passed, evidenceId, passed ? null : virtualDeviceLaboratory.blockedReason);
    if (passed) {
      appendAseTimelineEvent({
        label: ASE_TIMELINE_LABELS.DEVICE_PROFILE_PASSED,
        stageId: 'VIRTUAL_DEVICE',
        evidenceId,
      });
    }
    pipelineState = updateAsePipelineState(pipelineState, {
      currentStage: 'VIRTUAL_DEVICE',
      stageStatuses: markAseStageStatus(pipelineState.stageStatuses, 'VIRTUAL_DEVICE', passed ? 'PASSED' : 'FAILED'),
    });
  } else {
    recordStageResult(stageResults, 'VIRTUAL_DEVICE', true, null, null);
  }

  // Stage 9 — Interaction Proof (with repair loop for dead button)
  let interactionProof = runInteractionProofPipeline({
    ...eraBase,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    simulateDeadButton: input.simulateDeadButton,
  });
  let interactionPassed = stagePassed(interactionProof.permissionVerdict, ['READY_FOR_PREVIEW', 'PASS']);
  if (!interactionPassed && input.simulateDeadButton) {
    const route = planAseRoute({
      failedStage: 'INTERACTION_PROOF',
      stageResult: {
        readOnly: true,
        stageId: 'INTERACTION_PROOF',
        status: 'FAILED',
        passed: false,
        blockedReason: 'Save button has no handler',
        evidenceId: null,
        recoveryRoute: 'AUTONOMOUS_DEBUGGING',
      },
    });
    repairLoops += 1;
    pipelineState = updateAsePipelineState(pipelineState, { overallStatus: 'REPAIRING', repairLoops });
    appendAseTimelineEvent({ label: ASE_TIMELINE_LABELS.REPAIR_ATTEMPTED, stageId: 'AUTONOMOUS_DEBUGGING' });
    recordAseAuditDecision({
      stage: 'INTERACTION_PROOF',
      inputEvidence: [],
      decision: 'ROUTE_TO_DEBUGGING',
      reason: route.reason,
      confidence: 0.8,
      nextRoute: route.destination,
    });

    const debuggingWithFailure = runAutonomousDebuggingPipeline({
      ...eraBase,
      behaviorSimulation,
      virtualUserSimulation,
      virtualDeviceLaboratory,
      interactionProof,
    });
    const repairRoute = routeAseRepair({
      autonomousDebugging: debuggingWithFailure,
      failedStage: 'INTERACTION_PROOF',
    });
    if (repairRoute.repairResolved) {
      interactionProof = runInteractionProofPipeline({
        ...eraBase,
        behaviorSimulation,
        virtualUserSimulation,
        virtualDeviceLaboratory,
      });
      interactionPassed = stagePassed(interactionProof.permissionVerdict, ['READY_FOR_PREVIEW', 'PASS']);
      appendAseTimelineEvent({ label: ASE_TIMELINE_LABELS.REPAIR_RESOLVED, stageId: 'AUTONOMOUS_DEBUGGING' });
    }
  }

  if (!skip('INTERACTION_PROOF')) {
    const evidenceId = publishStageEvidence({
      stageId: 'INTERACTION_PROOF',
      evidenceType: 'INTERACTION_SWEEP',
      status: interactionPassed ? 'PASS' : 'FAIL',
      confidence: interactionPassed ? 0.9 : 0.35,
      blockers: interactionPassed ? [] : [interactionProof.blockedReason ?? 'Interaction proof failed'],
    });
    recordStageResult(
      stageResults,
      'INTERACTION_PROOF',
      interactionPassed,
      evidenceId,
      interactionPassed ? null : interactionProof.blockedReason,
    );
    if (interactionPassed) {
      appendAseTimelineEvent({
        label: ASE_TIMELINE_LABELS.INTERACTION_PROOF_PASSED,
        stageId: 'INTERACTION_PROOF',
        evidenceId,
      });
    }
    pipelineState = updateAsePipelineState(pipelineState, {
      currentStage: 'INTERACTION_PROOF',
      stageStatuses: markAseStageStatus(
        pipelineState.stageStatuses,
        'INTERACTION_PROOF',
        interactionPassed ? 'PASSED' : 'FAILED',
      ),
    });
  } else {
    recordStageResult(stageResults, 'INTERACTION_PROOF', true, null, null);
  }

  // Stage 10 — Autonomous Debugging
  let autonomousDebugging = runAutonomousDebuggingPipeline({
    ...eraBase,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
  });
  const debuggingPassed = stagePassed(autonomousDebugging.permissionVerdict, ['READY_FOR_PREVIEW']);
  recordStageResult(stageResults, 'AUTONOMOUS_DEBUGGING', debuggingPassed, null, autonomousDebugging.blockedReason);
  pipelineState = updateAsePipelineState(pipelineState, {
    currentStage: 'AUTONOMOUS_DEBUGGING',
    stageStatuses: markAseStageStatus(
      pipelineState.stageStatuses,
      'AUTONOMOUS_DEBUGGING',
      debuggingPassed ? 'PASSED' : 'FAILED',
    ),
  });

  // Stage 11 — Continuous Improvement
  let continuousImprovement = runContinuousImprovementPipeline({
    ...eraBase,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
    simulateHighFrictionEmergency: input.simulateHighFrictionEmergency,
  });
  if (input.simulateHighFrictionEmergency) {
    improvementLoops += 1;
    pipelineState = updateAsePipelineState(pipelineState, { overallStatus: 'IMPROVING', improvementLoops });
    appendAseTimelineEvent({ label: ASE_TIMELINE_LABELS.IMPROVEMENT_APPLIED, stageId: 'CONTINUOUS_IMPROVEMENT' });
    recordAseAuditDecision({
      stage: 'VIRTUAL_USER',
      inputEvidence: [],
      decision: 'ROUTE_TO_IMPROVEMENT',
      reason: 'High friction detected — routing to Continuous Product Improvement.',
      confidence: 0.75,
      nextRoute: 'CONTINUOUS_IMPROVEMENT',
    });
  }
  const qualityRoute = routeAseQualityLoop({ continuousImprovement });
  const improvementPassed = stagePassed(continuousImprovement.permissionVerdict, [
    'READY_FOR_PREVIEW',
    'DEFERRED_ACCEPTABLE',
  ]);
  recordStageResult(stageResults, 'CONTINUOUS_IMPROVEMENT', improvementPassed, null, null);
  pipelineState = updateAsePipelineState(pipelineState, {
    currentStage: 'CONTINUOUS_IMPROVEMENT',
    stageStatuses: markAseStageStatus(
      pipelineState.stageStatuses,
      'CONTINUOUS_IMPROVEMENT',
      improvementPassed ? 'PASSED' : 'FAILED',
    ),
  });

  // Stage 12 — Launch Readiness Authority
  const launchReadiness = runLaunchReadinessAuthorityPipeline({
    ...eraBase,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
    continuousImprovement,
    projectRootDir: input.projectRootDir ?? null,
    workspaceDir: input.workspaceDir ?? null,
    simulateUnresolvedCapability: input.simulateUnresolvedCapability,
    simulateMissingExecutionTraceEvidence: input.simulateMissingExecutionTrace,
  });
  const launchRoute = routeAseLaunch({ launchReadiness });
  recordStageResult(
    stageResults,
    'LAUNCH_READINESS_AUTHORITY',
    launchRoute.launchReady,
    null,
    launchRoute.blocked ? launchReadiness.verdict.primaryReason : null,
  );
  appendAseTimelineEvent({
    label: ASE_TIMELINE_LABELS.LAUNCH_DECISION_ISSUED,
    stageId: 'LAUNCH_READINESS_AUTHORITY',
  });
  pipelineState = updateAsePipelineState(pipelineState, {
    currentStage: 'LAUNCH_READINESS_AUTHORITY',
    launchVerdict: launchRoute.verdict,
    stageStatuses: markAseStageStatus(
      pipelineState.stageStatuses,
      'LAUNCH_READINESS_AUTHORITY',
      launchRoute.launchReady ? 'PASSED' : 'FAILED',
    ),
    resumePoint: 'LAUNCH_DECISION_CREATED',
  });
  if (launchRoute.blocked) {
    blockers.push(launchReadiness.verdict.primaryReason);
  }

  // Stage 13 — Live Preview Gate
  const livePreviewGate = evaluateLivePreviewGate({
    rawPrompt: input.rawPrompt,
    previewUrl: input.previewUrl ?? null,
    generationComplete: true,
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
    continuousImprovement,
    launchReadiness,
    projectRootDir: input.projectRootDir ?? null,
    workspaceDir: input.workspaceDir ?? null,
    simulateUnresolvedCapability: input.simulateUnresolvedCapability,
  });
  const previewRoute = routeAseLivePreview({ launchReadiness, livePreviewGate });
  recordStageResult(stageResults, 'LIVE_PREVIEW_GATE', previewRoute.previewUnlocked, null, null);
  if (previewRoute.previewUnlocked) {
    appendAseTimelineEvent({
      label: ASE_TIMELINE_LABELS.PREVIEW_UNLOCKED,
      stageId: 'LIVE_PREVIEW_GATE',
    });
  }
  pipelineState = updateAsePipelineState(pipelineState, {
    currentStage: 'LIVE_PREVIEW_GATE',
    livePreviewState: previewRoute.previewState,
    stageStatuses: markAseStageStatus(
      pipelineState.stageStatuses,
      'LIVE_PREVIEW_GATE',
      previewRoute.previewUnlocked ? 'PASSED' : 'FAILED',
    ),
    resumePoint: previewRoute.previewUnlocked ? 'PREVIEW_UNLOCKED' : pipelineState.resumePoint,
  });

  const gateResults = buildAseGateResults(stageResults);
  pipelineState = updateAsePipelineState(pipelineState, {
    gateResults,
    repairLoops,
    capabilityEvolutionLoops,
    improvementLoops,
  });

  const overallStatus = deriveAseOverallStatus({
    launchReady: launchRoute.launchReady,
    previewUnlocked: previewRoute.previewUnlocked,
    humanReview:
      pipelineState.overallStatus === 'HUMAN_REVIEW_REQUIRED' ||
      launchRoute.verdict === 'NEEDS_HUMAN_REVIEW',
    blocked: blockers.length > 0 && !previewRoute.previewUnlocked,
    repairing: repairLoops > 0 && !interactionPassed,
    evolving: capabilityEvolutionLoops > 0 && needsEvolution,
    improving: improvementLoops > 0,
  });

  const artifacts: AutonomousSoftwareEngineeringPipelineArtifacts = {
    productIntelligenceModel,
    promptFaithfulness,
    capabilityPlanning,
    missingCapabilityEvolution,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
    continuousImprovement,
    launchReadiness,
    livePreviewGate,
  };

  const readyForPreview = previewRoute.previewUnlocked;
  const readyForMaterialization = isIncrementalBuildReadyForGeneration(incrementalBuild) && debuggingPassed;
  const nextAction = readyForPreview
    ? 'Human verification may begin — preview unlocked.'
    : launchRoute.nextAction ?? livePreviewGate.blockerExplanation.recommendedNextStep ?? 'Resolve blockers and resume pipeline.';

  return buildFinalResult(
    input,
    pipelineState,
    stageResults,
    gateResults,
    blockers,
    warnings,
    artifacts,
    overallStatus,
    readyForPreview,
    readyForMaterialization,
    nextAction,
    repairLoops,
    capabilityEvolutionLoops,
    improvementLoops,
    qualityRoute,
    launchRoute,
    previewRoute,
  );
}

function buildPartialResult(
  input: AutonomousSoftwareEngineeringPipelineInput,
  pipelineState: import('./ase-types.js').AsePipelineState,
  stageResults: Map<AseStageId, AseStageResult>,
  blockers: string[],
  warnings: string[],
  artifacts: AutonomousSoftwareEngineeringPipelineArtifacts,
): AutonomousSoftwareEngineeringPipelineResult {
  const gateResults = buildAseGateResults(stageResults);
  return buildFinalResult(
    input,
    updateAsePipelineState(pipelineState, { gateResults }),
    stageResults,
    gateResults,
    blockers,
    warnings,
    artifacts,
    'RUNNING',
    false,
    false,
    'Pipeline paused at stable boundary.',
    pipelineState.repairLoops,
    pipelineState.capabilityEvolutionLoops,
    pipelineState.improvementLoops,
    routeAseQualityLoop({
      continuousImprovement: artifacts.continuousImprovement ?? {
        permissionVerdict: 'DEFERRED_ACCEPTABLE',
        rankedOpportunities: [],
        deferredOpportunities: [],
        blockedOpportunities: [],
        improvementLoops: [],
        improvementAttempts: [],
      } as import('../continuous-product-improvement-engine/continuous-improvement-types.js').ContinuousImprovementPipelineResult,
    }),
    routeAseLaunch({
      launchReadiness: artifacts.launchReadiness ?? {
        verdict: { verdict: 'NOT_LAUNCH_READY', primaryReason: 'Paused', requiredNextStep: 'Resume pipeline' },
      } as import('../launch-readiness-authority-v2/launch-readiness-types.js').LaunchReadinessPipelineResult,
    }),
    routeAseLivePreview({
      launchReadiness: artifacts.launchReadiness ?? {
        verdict: { verdict: 'NOT_LAUNCH_READY' },
      } as import('../launch-readiness-authority-v2/launch-readiness-types.js').LaunchReadinessPipelineResult,
      livePreviewGate: artifacts.livePreviewGate ?? { state: 'LOCKED', isPreviewAvailable: false } as import('../live-preview-gate/live-preview-gate-types.js').LivePreviewGateResult,
    }),
  );
}

function buildFinalResult(
  input: AutonomousSoftwareEngineeringPipelineInput,
  pipelineState: import('./ase-types.js').AsePipelineState,
  stageResults: Map<AseStageId, AseStageResult>,
  gateResults: readonly import('./ase-types.js').AseGateResult[],
  blockers: string[],
  warnings: string[],
  artifacts: AutonomousSoftwareEngineeringPipelineArtifacts,
  overallStatus: import('./ase-types.js').AseOverallStatus,
  readyForPreview: boolean,
  readyForMaterialization: boolean,
  nextAction: string,
  repairLoops: number,
  capabilityEvolutionLoops: number,
  improvementLoops: number,
  qualityRoute: ReturnType<typeof routeAseQualityLoop>,
  launchRoute: ReturnType<typeof routeAseLaunch>,
  previewRoute: ReturnType<typeof routeAseLivePreview>,
): AutonomousSoftwareEngineeringPipelineResult {
  const statusCard = buildAseStatusCard({
    pipelineState,
    overallStatus,
    gateResults,
    launchVerdict: launchRoute.verdict,
    previewState: previewRoute.previewState,
    nextAction,
    blockedGate: blockers.length ? pipelineState.currentGate : null,
    repairStatus: repairLoops > 0 ? `${repairLoops} repair loop(s)` : null,
    capabilityEvolutionStatus:
      capabilityEvolutionLoops > 0 ? `${capabilityEvolutionLoops} evolution loop(s)` : null,
    improvementStatus: qualityRoute.improvementRequired ? `${improvementLoops} improvement loop(s)` : null,
    risk: blockers.length ? 'HIGH' : warnings.length ? 'MEDIUM' : 'LOW',
  });

  return {
    readOnly: true,
    runId: pipelineState.runId,
    projectId: pipelineState.projectId,
    overallStatus,
    currentStage: pipelineState.currentStage,
    readyForPreview,
    readyForMaterialization,
    previewUrl: readyForPreview ? input.previewUrl ?? null : null,
    launchReadiness: artifacts.launchReadiness,
    livePreviewGate: artifacts.livePreviewGate,
    statusCard,
    timeline: getAseTimeline(),
    auditLog: getAseAuditLog(),
    evidenceSummary: getAseEvidenceBus(),
    pipelineState,
    artifacts,
    gates: gateResults,
    blockers,
    warnings,
    blockedReason: blockers[0] ?? null,
    nextAction,
    reportMarkdown:
      artifacts.launchReadiness && artifacts.livePreviewGate
        ? buildAseReport({
            readOnly: true,
            runId: pipelineState.runId,
            projectId: pipelineState.projectId,
            overallStatus,
            currentStage: pipelineState.currentStage,
            readyForPreview,
            readyForMaterialization,
            previewUrl: readyForPreview ? input.previewUrl ?? null : null,
            launchReadiness: artifacts.launchReadiness,
            livePreviewGate: artifacts.livePreviewGate,
            statusCard,
            timeline: getAseTimeline(),
            auditLog: getAseAuditLog(),
            evidenceSummary: getAseEvidenceBus(),
            pipelineState,
            artifacts,
            gates: gateResults,
            blockers,
            warnings,
            blockedReason: blockers[0] ?? null,
            nextAction,
            reportMarkdown: '',
          })
        : `# Autonomous Software Engineering Engine Report\n\n**Status:** ${overallStatus}\n**Stage:** ${pipelineState.currentStage}\n`,
  };
}
