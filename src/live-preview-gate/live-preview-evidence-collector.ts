/**
 * Live Preview Gate — evidence collection from Era 3 gates and reality systems.
 */

import { runLaunchReadinessAuthorityPipeline } from '../launch-readiness-authority-v2/index.js';
import type {
  LaunchReadinessPipelineInput,
  LaunchReadinessPipelineResult,
} from '../launch-readiness-authority-v2/launch-readiness-types.js';
import type {
  LivePreviewEvidenceCollectionResult,
  LivePreviewEvidenceItem,
  LivePreviewEvidenceSourceId,
  LivePreviewGateInput,
  LivePreviewGatePassStatus,
} from './live-preview-gate-types.js';

const SOURCE_NAMES: Record<LivePreviewEvidenceSourceId, string> = {
  INTENT_UNDERSTANDING: 'Intent Understanding Engine',
  PROMPT_FAITHFULNESS: 'Prompt Faithfulness Engine V2',
  CAPABILITY_PLANNING: 'Capability Planning Engine',
  MISSING_CAPABILITY_EVOLUTION: 'Missing Capability Evolution Engine',
  INCREMENTAL_BUILD: 'Incremental Autonomous Builder',
  BEHAVIOR_SIMULATION: 'Behavior Simulation Engine',
  VIRTUAL_USER: 'Virtual User Engine',
  VIRTUAL_DEVICE: 'Virtual Device Laboratory',
  INTERACTION_PROOF: 'Interaction Proof Engine',
  AUTONOMOUS_DEBUGGING: 'Autonomous Debugging Engine',
  CONTINUOUS_IMPROVEMENT: 'Continuous Product Improvement Engine',
  LAUNCH_READINESS_AUTHORITY_V2: 'Launch Readiness Authority V2',
  FOUNDER_TEST: 'Founder Test',
  UVL: 'Universal Validation Layer',
  EXECUTION_TRACE: 'Execution Trace',
  WORKSPACE_REALITY: 'Workspace Reality',
  BUILD_REALITY: 'Build Reality',
  MATERIALIZATION_REALITY: 'Materialization Reality',
};

const REQUIRED_SOURCES: readonly LivePreviewEvidenceSourceId[] = [
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
  'LAUNCH_READINESS_AUTHORITY_V2',
  'FOUNDER_TEST',
  'UVL',
  'EXECUTION_TRACE',
  'WORKSPACE_REALITY',
  'BUILD_REALITY',
  'MATERIALIZATION_REALITY',
];

function mapLaunchStatus(status: string): LivePreviewGatePassStatus {
  if (status === 'PASS') return 'PASS';
  if (status === 'WARNING') return 'WARNING';
  if (status === 'UNAVAILABLE') return 'UNAVAILABLE';
  if (status === 'INCOMPLETE') return 'INCOMPLETE';
  return 'FAIL';
}

function itemFromLaunchSource(
  launch: LaunchReadinessPipelineResult,
  sourceId: LivePreviewEvidenceSourceId,
  collectedAt: number,
): LivePreviewEvidenceItem | null {
  const launchMap: Partial<Record<LivePreviewEvidenceSourceId, LaunchReadinessPipelineResult['evidence']['sources'][number]['sourceId']>> =
    {
      INTENT_UNDERSTANDING: 'INTENT_UNDERSTANDING',
      PROMPT_FAITHFULNESS: 'PROMPT_FAITHFULNESS',
      CAPABILITY_PLANNING: 'CAPABILITY_PLANNING',
      MISSING_CAPABILITY_EVOLUTION: 'MISSING_CAPABILITY_EVOLUTION',
      INCREMENTAL_BUILD: 'INCREMENTAL_BUILD',
      BEHAVIOR_SIMULATION: 'BEHAVIOR_SIMULATION',
      VIRTUAL_USER: 'VIRTUAL_USER',
      VIRTUAL_DEVICE: 'VIRTUAL_DEVICE',
      INTERACTION_PROOF: 'INTERACTION_PROOF',
      AUTONOMOUS_DEBUGGING: 'AUTONOMOUS_DEBUGGING',
      CONTINUOUS_IMPROVEMENT: 'CONTINUOUS_IMPROVEMENT',
      FOUNDER_TEST: 'FOUNDER_TEST',
      UVL: 'UVL',
      EXECUTION_TRACE: 'EXECUTION_TRACE',
      WORKSPACE_REALITY: 'WORKSPACE_REALITY',
      BUILD_REALITY: 'BUILD_REALITY',
      MATERIALIZATION_REALITY: 'MATERIALIZATION_REALITY',
    };

  if (sourceId === 'LAUNCH_READINESS_AUTHORITY_V2') {
    return {
      readOnly: true,
      source: sourceId,
      sourceName: SOURCE_NAMES[sourceId],
      status: launch.verdict.verdict === 'LAUNCH_READY' ? 'PASS' : 'FAIL',
      verdict: launch.verdict.verdict,
      confidence: launch.confidence.overallConfidence,
      blockers: launch.blockers.map((b) => b.summary),
      warnings: launch.evidenceValidation.issues.filter((i) => i.severity === 'WARNING').map((i) => i.detail),
      evidenceTimestamp: collectedAt,
      traceabilityLinks: launch.audit.decisionTrace,
      recommendedNextStep: launch.verdict.requiredNextStep,
    };
  }

  const mapped = launchMap[sourceId];
  if (!mapped) return null;
  const source = launch.evidence.sources.find((s) => s.sourceId === mapped);
  if (!source) return null;

  let status = mapLaunchStatus(source.status);
  if (
    sourceId === 'MISSING_CAPABILITY_EVOLUTION' &&
    source.status === 'PASS' &&
    source.supportingArtifacts.some((a) => /EVOLUTION_PASS|missingCount:0/i.test(a))
  ) {
    status = source.blockers.length ? status : 'PASS';
  }
  if (sourceId === 'AUTONOMOUS_DEBUGGING' && source.status === 'PASS' && source.blockers.length === 0) {
    status = 'PASS';
  }

  return {
    readOnly: true,
    source: sourceId,
    sourceName: SOURCE_NAMES[sourceId],
    status,
    verdict: source.supportingArtifacts[0] ?? source.status,
    confidence: source.confidence,
    blockers: source.blockers,
    warnings: source.warnings,
    evidenceTimestamp: source.validationTimestamp,
    traceabilityLinks: source.supportingArtifacts,
    recommendedNextStep: source.blockers[0] ?? null,
  };
}

export function collectLivePreviewEvidence(input: {
  gateInput: LivePreviewGateInput;
  launchReadiness: LaunchReadinessPipelineResult;
}): LivePreviewEvidenceCollectionResult {
  const collectedAt = Date.now();
  const items: LivePreviewEvidenceItem[] = [];

  for (const sourceId of REQUIRED_SOURCES) {
    const item = itemFromLaunchSource(input.launchReadiness, sourceId, collectedAt);
    if (item) items.push(item);
  }

  const present = new Set(items.map((i) => i.source));
  const missingSources = REQUIRED_SOURCES.filter((s) => !present.has(s));

  return {
    readOnly: true,
    collectedAt,
    items,
    missingSources,
  };
}

export function buildLaunchReadinessInputFromGateInput(input: LivePreviewGateInput): LaunchReadinessPipelineInput {
  return {
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
    capabilityPlanning: input.capabilityPlanning,
    missingCapabilityEvolution: input.missingCapabilityEvolution,
    incrementalBuild: input.incrementalBuild,
    behaviorSimulation: input.behaviorSimulation,
    virtualUserSimulation: input.virtualUserSimulation,
    virtualDeviceLaboratory: input.virtualDeviceLaboratory,
    interactionProof: input.interactionProof,
    autonomousDebugging: input.autonomousDebugging,
    continuousImprovement: input.continuousImprovement,
    projectRootDir: input.projectRootDir ?? null,
    workspaceDir: input.workspaceDir ?? null,
    simulateMissingExecutionTraceEvidence: input.simulateMissingExecutionTraceEvidence,
    simulateUnresolvedCapability: input.simulateUnresolvedCapability,
    simulateInteractionProofEmergencyUnreachable: input.simulateInteractionProofRegression,
  };
}

export function resolveLaunchReadinessForGate(input: LivePreviewGateInput): LaunchReadinessPipelineResult {
  if (input.launchReadiness) return input.launchReadiness;
  const launchInput = buildLaunchReadinessInputFromGateInput(input);
  if (input.simulateBehaviorFailure && !input.behaviorSimulation) {
    launchInput.simulateVirtualUserEmergencyFailure = false;
  }
  return runLaunchReadinessAuthorityPipeline(launchInput);
}
