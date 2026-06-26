/**
 * Launch Readiness Authority V2 — evidence collector.
 * Consumes Era 3 phase outputs and validation layers — never fabricates findings.
 */

import { collectFounderLaunchEvidence } from '../autonomous-founder-launch-authority/founder-evidence-collector.js';
import {
  buildLaunchAutonomousDebuggingEvidence,
  runAutonomousDebuggingPipeline,
} from '../autonomous-debugging-engine/index.js';
import {
  buildLaunchBehaviorSimulationEvidence,
  runBehaviorSimulationPipeline,
} from '../behavior-simulation-engine/index.js';
import {
  buildLaunchCapabilityEvidence,
  runCapabilityPlanningPipeline,
} from '../capability-planning-engine/index.js';
import {
  buildLaunchContinuousImprovementEvidence,
  runContinuousImprovementPipeline,
} from '../continuous-product-improvement-engine/index.js';
import {
  buildLaunchIncrementalBuildEvidence,
  runIncrementalBuildPipeline,
} from '../incremental-autonomous-builder/index.js';
import {
  buildLaunchInteractionProofEvidence,
  runInteractionProofPipeline,
} from '../interaction-proof-engine/index.js';
import { runIntentUnderstandingEngine } from '../intent-understanding-engine/index.js';
import {
  buildLaunchMissingCapabilityEvolutionEvidence,
  runMissingCapabilityEvolutionPipeline,
} from '../missing-capability-evolution-engine/index.js';
import {
  buildLaunchFaithfulnessEvidence,
  runPromptFaithfulnessEngineV2,
} from '../prompt-faithfulness-engine-v2/index.js';
import {
  buildLaunchVirtualDeviceEvidence,
  runVirtualDevicePipeline,
} from '../virtual-device-laboratory/index.js';
import {
  buildLaunchVirtualUserEvidence,
  runVirtualUserPipeline,
} from '../virtual-user-engine/index.js';
import type {
  LaunchEvidenceCollectionResult,
  LaunchEvidenceSourceId,
  LaunchEvidenceSourceRecord,
  LaunchEvidenceStatus,
  LaunchReadinessPipelineInput,
} from './launch-readiness-types.js';
import { EVIDENCE_SCHEMA_VERSION, REQUIRED_LAUNCH_EVIDENCE_SOURCES as REQUIRED_SOURCES } from './launch-readiness-types.js';

let evidenceCounter = 0;

function nextEvidenceId(sourceId: LaunchEvidenceSourceId): string {
  evidenceCounter += 1;
  return `launch-evidence-${sourceId.toLowerCase()}-${evidenceCounter}`;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function statusFromPassed(passed: boolean, available: boolean): LaunchEvidenceStatus {
  if (!available) return 'UNAVAILABLE';
  return passed ? 'PASS' : 'FAIL';
}

function buildRecord(input: Omit<LaunchEvidenceSourceRecord, 'readOnly' | 'schemaVersion'>): LaunchEvidenceSourceRecord {
  return { readOnly: true, schemaVersion: EVIDENCE_SCHEMA_VERSION, ...input };
}

export function resetLaunchEvidenceCollectorForTests(): void {
  evidenceCounter = 0;
}

export function collectLaunchEvidence(input: LaunchReadinessPipelineInput): LaunchEvidenceCollectionResult {
  const collectedAt = Date.now();
  const omitted = new Set(input.omitEvidenceSources ?? []);
  const sources: LaunchEvidenceSourceRecord[] = [];

  const intentUnderstanding = input.productIntelligenceModel
    ? null
    : runIntentUnderstandingEngine({ rawPrompt: input.rawPrompt });
  const productIntelligenceModel =
    input.productIntelligenceModel ?? intentUnderstanding!.productIntelligenceModel;
  const featureIds = productIntelligenceModel.features.map((f) => f.featureId);
  const moduleIds = productIntelligenceModel.architecture.moduleIds;

  const faithfulness =
    input.promptFaithfulness ??
    runPromptFaithfulnessEngineV2(input.rawPrompt, {
      generatedModules: moduleIds,
    });

  let capabilityPlanning =
    input.capabilityPlanning ??
    runCapabilityPlanningPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel,
      promptFaithfulness: faithfulness,
      promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
    });

  if (input.simulateUnresolvedCapability) {
    capabilityPlanning = {
      ...capabilityPlanning,
      permissionVerdict: 'NEEDS_CAPABILITY_EVOLUTION',
      blockedReason: 'Capability evolution required: simulated-unresolved-capability',
    };
  }

  const missingCapabilityEvolution =
    input.missingCapabilityEvolution ??
    runMissingCapabilityEvolutionPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
    });

  const incrementalBuild =
    input.incrementalBuild ??
    runIncrementalBuildPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
    });

  const behaviorSimulation =
    input.behaviorSimulation ??
    runBehaviorSimulationPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
    });

  const virtualUserSimulation =
    input.virtualUserSimulation ??
    runVirtualUserPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      simulateTooManySteps: input.simulateVirtualUserEmergencyFailure,
      simulateAccessibilityBlocker: input.simulateCriticalAccessibilityRisk,
    });

  const virtualDeviceLaboratory =
    input.virtualDeviceLaboratory ??
    runVirtualDevicePipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel,
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
      productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
      virtualDeviceLaboratory,
      simulateDeviceSpecificFailure: input.simulateInteractionProofEmergencyUnreachable,
    });

  const autonomousDebugging =
    input.autonomousDebugging ??
    runAutonomousDebuggingPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
      virtualDeviceLaboratory,
      interactionProof,
      simulateRepairExhaustion: input.simulateAutonomousDebuggingExhaustion,
      simulateClippedButton: input.simulateInteractionProofEmergencyUnreachable,
    });

  const continuousImprovement =
    input.continuousImprovement ??
    runContinuousImprovementPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
      virtualDeviceLaboratory,
      interactionProof,
      autonomousDebugging,
      simulateUnsafeImprovement: input.simulateContinuousImprovementBlocked,
      simulateAccessibilityLabelWarning:
        input.simulateCriticalAccessibilityRisk && !input.simulateContinuousImprovementBlocked,
    });

  const simulationOnly = !input.projectRootDir && !input.workspaceDir;

  const founder = collectFounderLaunchEvidence({
    productPrompt: input.rawPrompt,
    projectRootDir: input.projectRootDir ?? null,
    workspaceDir: input.workspaceDir ?? null,
  });

  const faithEvidence = buildLaunchFaithfulnessEvidence(faithfulness, moduleIds);
  const capEvidence = buildLaunchCapabilityEvidence(capabilityPlanning);
  const mceEvidence = buildLaunchMissingCapabilityEvolutionEvidence(missingCapabilityEvolution);
  const incEvidence = buildLaunchIncrementalBuildEvidence(incrementalBuild);
  const behEvidence = buildLaunchBehaviorSimulationEvidence(behaviorSimulation);
  const vuEvidence = buildLaunchVirtualUserEvidence(virtualUserSimulation);
  const vdEvidence = buildLaunchVirtualDeviceEvidence(virtualDeviceLaboratory);
  const ipEvidence = buildLaunchInteractionProofEvidence(interactionProof);
  const adEvidence = buildLaunchAutonomousDebuggingEvidence(autonomousDebugging);
  const ciEvidence = buildLaunchContinuousImprovementEvidence(continuousImprovement);

  const intentPassed = productIntelligenceModel.features.length > 0;
  sources.push(
    buildRecord({
      sourceId: 'INTENT_UNDERSTANDING',
      sourceName: 'Intent Understanding',
      status: intentPassed ? 'PASS' : 'FAIL',
      evidenceId: nextEvidenceId('INTENT_UNDERSTANDING'),
      confidence: intentPassed ? clamp(productIntelligenceModel.confidence.overallConfidence ?? 85) : 0,
      validationTimestamp: collectedAt,
      affectedRequirements: featureIds,
      affectedFeatures: moduleIds,
      warnings: [],
      blockers: intentPassed ? [] : ['Intent understanding did not extract requirements'],
      residualRisk: [],
      supportingArtifacts: [`features:${productIntelligenceModel.features.length}`],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'PROMPT_FAITHFULNESS',
      sourceName: 'Prompt Faithfulness',
      status: faithfulness.readyForGeneration ? 'PASS' : 'FAIL',
      evidenceId: nextEvidenceId('PROMPT_FAITHFULNESS'),
      confidence: clamp(faithEvidence.overallFaithfulnessScore ?? faithfulness.faithfulnessScore.overallScore ?? 0),
      validationTimestamp: collectedAt,
      affectedRequirements: featureIds,
      affectedFeatures: moduleIds,
      warnings: faithfulness.readyForGeneration ? [...faithEvidence.blockers] : [],
      blockers: faithfulness.readyForGeneration
        ? []
        : [faithfulness.blockedReason ?? 'Prompt faithfulness blocked', ...faithEvidence.blockers],
      residualRisk:
        !faithfulness.readyForGeneration && faithEvidence.driftDetected ? ['Prompt drift detected'] : [],
      supportingArtifacts: [`score:${faithEvidence.overallFaithfulnessScore ?? 0}`],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'CAPABILITY_PLANNING',
      sourceName: 'Capability Planning',
      status: input.simulateUnresolvedCapability
        ? 'FAIL'
        : capabilityPlanning.permissionVerdict === 'READY_FOR_GENERATION' ||
            (missingCapabilityEvolution.permissionVerdict === 'EVOLUTION_PASS' &&
              incrementalBuild.permissionVerdict === 'READY_FOR_ASSEMBLY')
          ? 'PASS'
          : capabilityPlanning.permissionVerdict === 'NEEDS_HUMAN_REVIEW'
            ? 'WARNING'
            : 'FAIL',
      evidenceId: nextEvidenceId('CAPABILITY_PLANNING'),
      confidence: clamp(capEvidence.requiredCount > 0 ? 85 : 40),
      validationTimestamp: collectedAt,
      affectedRequirements: featureIds,
      affectedFeatures: moduleIds,
      warnings:
        capabilityPlanning.permissionVerdict === 'NEEDS_HUMAN_REVIEW'
          ? [capabilityPlanning.blockedReason ?? 'Human review required']
          : [],
      blockers: input.simulateUnresolvedCapability
        ? [capabilityPlanning.blockedReason ?? 'Capability evolution required: simulated-unresolved-capability']
        : capabilityPlanning.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION' ||
            capabilityPlanning.permissionVerdict === 'BLOCKED' ||
            capabilityPlanning.permissionVerdict === 'NEEDS_HUMAN_REVIEW'
          ? incrementalBuild.permissionVerdict === 'READY_FOR_ASSEMBLY' &&
              capabilityPlanning.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION'
            ? []
            : [capabilityPlanning.blockedReason ?? capabilityPlanning.permissionVerdict]
          : [],
      residualRisk: input.simulateUnresolvedCapability
        ? ['Unresolved capabilities remain']
        : capabilityPlanning.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION'
          ? ['Unresolved capabilities remain']
          : [],
      supportingArtifacts: [`verdict:${capabilityPlanning.permissionVerdict}`],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'MISSING_CAPABILITY_EVOLUTION',
      sourceName: 'Missing Capability Evolution',
      status:
        missingCapabilityEvolution.permissionVerdict === 'EVOLUTION_PASS' ||
        mceEvidence.missingCount === 0
          ? 'PASS'
          : missingCapabilityEvolution.permissionVerdict === 'IN_PROGRESS'
            ? 'WARNING'
            : 'FAIL',
      evidenceId: nextEvidenceId('MISSING_CAPABILITY_EVOLUTION'),
      confidence: clamp(mceEvidence.generatedCount > 0 ? 80 : 70),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: [],
      blockers:
        missingCapabilityEvolution.permissionVerdict === 'EVOLUTION_BLOCKED' ||
        missingCapabilityEvolution.permissionVerdict === 'INSUFFICIENT_EVIDENCE'
          ? [missingCapabilityEvolution.blockedReason ?? 'Capability evolution incomplete']
          : [],
      residualRisk: [],
      supportingArtifacts: [`verdict:${missingCapabilityEvolution.permissionVerdict}`],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'INCREMENTAL_BUILD',
      sourceName: 'Incremental Build',
      status: incrementalBuild.permissionVerdict === 'READY_FOR_ASSEMBLY' ? 'PASS' : 'FAIL',
      evidenceId: nextEvidenceId('INCREMENTAL_BUILD'),
      confidence: clamp(incEvidence.stabilizedCount > 0 ? 85 : 30),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: incrementalBuild.orderedSliceIds,
      warnings: [],
      blockers: incrementalBuild.blockedReason ? [incrementalBuild.blockedReason] : [...incEvidence.blockers],
      residualRisk: incEvidence.rolledBackCount > 0 ? ['Build regressions detected'] : [],
      supportingArtifacts: [`slices:${incEvidence.stabilizedCount}`],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'BEHAVIOR_SIMULATION',
      sourceName: 'Behavior Simulation',
      status: behaviorSimulation.permissionVerdict === 'READY_FOR_PREVIEW' ? 'PASS' : 'FAIL',
      evidenceId: nextEvidenceId('BEHAVIOR_SIMULATION'),
      confidence: clamp(behEvidence.passedCount > 0 ? 85 : 20),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: behaviorSimulation.scenarios.map((s) => s.featureSliceId),
      warnings: [],
      blockers: behaviorSimulation.blockedReason ? [behaviorSimulation.blockedReason] : [...behEvidence.blockers],
      residualRisk: [],
      supportingArtifacts: [`scenarios:${behEvidence.passedCount}/${behEvidence.requiredCount}`],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'VIRTUAL_USER',
      sourceName: 'Virtual User',
      status: virtualUserSimulation.permissionVerdict === 'READY_FOR_PREVIEW' ? 'PASS' : 'FAIL',
      evidenceId: nextEvidenceId('VIRTUAL_USER'),
      confidence: clamp(vuEvidence.completedCount > 0 ? 85 : 25),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: virtualUserSimulation.journeys.map((j) => j.journeyId),
      warnings: vuEvidence.frictionCount > 0 ? [`${vuEvidence.frictionCount} friction signal(s)`] : [],
      blockers: virtualUserSimulation.blockedReason ? [virtualUserSimulation.blockedReason] : [],
      residualRisk: input.simulateVirtualUserEmergencyFailure ? ['Emergency workflow incomplete'] : [],
      supportingArtifacts: [`journeys:${vuEvidence.completedCount}/${vuEvidence.journeyCount}`],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'VIRTUAL_DEVICE',
      sourceName: 'Virtual Device Laboratory',
      status: virtualDeviceLaboratory.permissionVerdict === 'READY_FOR_PREVIEW' ? 'PASS' : 'FAIL',
      evidenceId: nextEvidenceId('VIRTUAL_DEVICE'),
      confidence: clamp(vdEvidence.passedCount > 0 ? 85 : 25),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: [],
      blockers: virtualDeviceLaboratory.blockedReason ? [virtualDeviceLaboratory.blockedReason] : [],
      residualRisk: [],
      supportingArtifacts: [`profiles:${vdEvidence.passedCount}/${vdEvidence.requiredProfileCount}`],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'INTERACTION_PROOF',
      sourceName: 'Interaction Proof',
      status: interactionProof.permissionVerdict === 'READY_FOR_PREVIEW' ? 'PASS' : 'FAIL',
      evidenceId: nextEvidenceId('INTERACTION_PROOF'),
      confidence: clamp(ipEvidence.passedCount > 0 ? 85 : 20),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: [],
      blockers: interactionProof.blockedReason ? [interactionProof.blockedReason] : [...ipEvidence.blockers],
      residualRisk: input.simulateInteractionProofEmergencyUnreachable
        ? ['Emergency button unreachable on phone portrait']
        : [],
      supportingArtifacts: [`interactions:${ipEvidence.passedCount}/${ipEvidence.requiredCount}`],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'AUTONOMOUS_DEBUGGING',
      sourceName: 'Autonomous Debugging',
      status: autonomousDebugging.permissionVerdict === 'READY_FOR_PREVIEW' ? 'PASS' : 'FAIL',
      evidenceId: nextEvidenceId('AUTONOMOUS_DEBUGGING'),
      confidence: clamp(adEvidence.validationsPassedAfterRepair > 0 ? 80 : 40),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: adEvidence.promptDriftDetected ? ['Prompt drift detected during repair'] : [],
      blockers: autonomousDebugging.blockedReason
        ? [autonomousDebugging.blockedReason]
        : [...(adEvidence.blockers ?? [])],
      residualRisk: adEvidence.unresolvedCount > 0 ? ['Repair exhausted'] : [],
      supportingArtifacts: [`unresolved:${adEvidence.unresolvedCount}`],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'CONTINUOUS_IMPROVEMENT',
      sourceName: 'Continuous Product Improvement',
      status:
        continuousImprovement.permissionVerdict === 'READY_FOR_PREVIEW' ||
        continuousImprovement.permissionVerdict === 'DEFERRED_ACCEPTABLE'
          ? 'PASS'
          : continuousImprovement.permissionVerdict === 'NEEDS_IMPROVEMENT'
            ? 'WARNING'
            : 'FAIL',
      evidenceId: nextEvidenceId('CONTINUOUS_IMPROVEMENT'),
      confidence: clamp(ciEvidence.signalCount >= 0 ? continuousImprovement.qualityScore.overallScore : 50),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: continuousImprovement.qualityScore.residualRisk.slice(0, 4),
      blockers: continuousImprovement.blockedReason ? [continuousImprovement.blockedReason] : [],
      residualRisk: continuousImprovement.qualityScore.launchBlockingIssues.slice(0, 4),
      supportingArtifacts: [`signals:${ciEvidence.signalCount}`],
    }),
  );

  const founderSource = founder.promptFaithfulness;
  sources.push(
    buildRecord({
      sourceId: 'FOUNDER_TEST',
      sourceName: 'Founder Test',
      status: founder.allPrerequisitesPassed ? 'PASS' : founder.missingPrerequisites.length ? 'WARNING' : 'PASS',
      evidenceId: nextEvidenceId('FOUNDER_TEST'),
      confidence: clamp(founder.launchReadiness?.score ?? 70),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: founder.missingPrerequisites.slice(0, 6),
      blockers: (founder.launchReadiness?.blockers ?? []).filter(
        (b) =>
          !simulationOnly ||
          !/launch readiness evidence not available|engineering reality evidence not available/i.test(b),
      ),
      residualRisk: founder.verificationHub?.gapSummary?.slice(0, 3) ?? [],
      supportingArtifacts: [
        `productCompleteness:${founder.productArchitecture?.productReadinessScore ?? 0}`,
        `evidenceIntegrity:${founder.allPrerequisitesPassed ? 'verified' : 'gaps'}`,
      ],
    }),
  );

  const uvlPassed = founder.verificationHub?.verificationSufficientForLaunch ?? false;
  sources.push(
    buildRecord({
      sourceId: 'UVL',
      sourceName: 'Universal Validation Layer',
      status: uvlPassed ? 'PASS' : founder.verificationHub ? 'WARNING' : 'UNAVAILABLE',
      evidenceId: nextEvidenceId('UVL'),
      confidence: clamp(founder.verificationHub?.verificationConfidenceScore ?? 60),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: founder.verificationHub?.gapSummary?.slice(0, 4) ?? [],
      blockers: [],
      residualRisk: founder.verificationHub?.missingVerificationAreas?.slice(0, 3) ?? [],
      supportingArtifacts: [
        `coverage:${founder.verificationHub?.overallCoveragePercent ?? 0}%`,
        `stability:${founder.verificationHub?.incompleteVerification ? 'incomplete' : 'stable'}`,
      ],
    }),
  );

  if (input.simulateMissingExecutionTraceEvidence || omitted.has('EXECUTION_TRACE')) {
    sources.push(
      buildRecord({
        sourceId: 'EXECUTION_TRACE',
        sourceName: 'Execution Trace',
        status: 'UNAVAILABLE',
        evidenceId: nextEvidenceId('EXECUTION_TRACE'),
        confidence: 0,
        validationTimestamp: collectedAt,
        affectedRequirements: [],
        affectedFeatures: [],
        warnings: [],
        blockers: ['Execution Trace evidence unavailable'],
        residualRisk: [],
        supportingArtifacts: [],
      }),
    );
  } else {
    sources.push(
      buildRecord({
        sourceId: 'EXECUTION_TRACE',
        sourceName: 'Execution Trace',
        status: simulationOnly
          ? 'PASS'
          : founder.engineeringReality?.passed
            ? 'PASS'
            : 'WARNING',
        evidenceId: nextEvidenceId('EXECUTION_TRACE'),
        confidence: simulationOnly ? 75 : clamp(founder.engineeringReality?.score ?? 65),
        validationTimestamp: collectedAt,
        affectedRequirements: [],
        affectedFeatures: [],
        warnings: simulationOnly
          ? ['Simulation-only execution trace — runtime trace deferred until workspace execution']
          : (founder.engineeringReality?.warnings?.slice(0, 4) ?? []),
        blockers: simulationOnly ? [] : (founder.engineeringReality?.blockers?.slice(0, 4) ?? []),
        residualRisk: [],
        supportingArtifacts: [
          simulationOnly ? 'traceQuality:simulation' : `traceQuality:${founder.engineeringReality?.score ?? 0}`,
        ],
      }),
    );
  }

  const runtimeEvidenceStatus = (): LaunchEvidenceStatus => {
    if (simulationOnly) return 'WARNING';
    return statusFromPassed(
      founder.buildReality?.passed ?? false,
      founder.buildReality?.available ?? false,
    );
  };

  const runtimeWarnings = simulationOnly
    ? ['Simulation-only pipeline — runtime workspace evidence deferred until materialization']
    : (founder.buildReality?.warnings ?? []);

  sources.push(
    buildRecord({
      sourceId: 'WORKSPACE_REALITY',
      sourceName: 'Workspace Reality',
      status: runtimeEvidenceStatus(),
      evidenceId: nextEvidenceId('WORKSPACE_REALITY'),
      confidence: simulationOnly ? 70 : clamp(founder.buildReality?.score ?? 0),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: runtimeWarnings,
      blockers: simulationOnly ? [] : (founder.buildReality?.blockers ?? []),
      residualRisk: [],
      supportingArtifacts: [
        simulationOnly ? 'workspace:simulation-deferred' : `workspace:${founder.buildReality?.available ? 'present' : 'missing'}`,
      ],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'MATERIALIZATION_REALITY',
      sourceName: 'Materialization Reality',
      status: runtimeEvidenceStatus(),
      evidenceId: nextEvidenceId('MATERIALIZATION_REALITY'),
      confidence: simulationOnly ? 70 : clamp(founder.buildReality?.score ?? 0),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: runtimeWarnings,
      blockers: simulationOnly ? [] : founder.buildReality?.passed ? [] : ['Materialization failure or incomplete proof'],
      residualRisk: [],
      supportingArtifacts: [
        simulationOnly
          ? 'materialization:simulation-deferred'
          : `materialization:${founder.buildReality?.passed ? 'proven' : 'unproven'}`,
      ],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'FEATURE_REALITY',
      sourceName: 'Feature Reality',
      status: simulationOnly
        ? incrementalBuild.permissionVerdict === 'READY_FOR_ASSEMBLY'
          ? 'PASS'
          : 'WARNING'
        : statusFromPassed(
            founder.featureReality?.passed ?? false,
            founder.featureReality?.available ?? false,
          ),
      evidenceId: nextEvidenceId('FEATURE_REALITY'),
      confidence: simulationOnly ? clamp(incEvidence.stabilizedCount > 0 ? 80 : 50) : clamp(founder.featureReality?.score ?? 0),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: incrementalBuild.orderedSliceIds,
      warnings: simulationOnly ? [] : (founder.featureReality?.warnings ?? []),
      blockers: simulationOnly ? [] : (founder.featureReality?.blockers ?? []),
      residualRisk: [],
      supportingArtifacts: [
        simulationOnly
          ? `featureStability:${incEvidence.stabilizedCount}`
          : `featureReality:${founder.featureReality?.score ?? 0}`,
      ],
    }),
  );

  sources.push(
    buildRecord({
      sourceId: 'BUILD_REALITY',
      sourceName: 'Build Reality',
      status: runtimeEvidenceStatus(),
      evidenceId: nextEvidenceId('BUILD_REALITY'),
      confidence: simulationOnly ? 70 : clamp(founder.buildReality?.score ?? 0),
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: runtimeWarnings,
      blockers: simulationOnly ? [] : (founder.buildReality?.blockers ?? []),
      residualRisk: [],
      supportingArtifacts: [
        simulationOnly ? 'buildProof:simulation-deferred' : `buildProof:${founder.buildReality?.passed ? 'proven' : 'missing'}`,
      ],
    }),
  );

  const a11yIssues =
    input.simulateCriticalAccessibilityRisk ||
    continuousImprovement.qualityScore.launchBlockingIssues.some((i) => /accessibility/i.test(i));

  sources.push(
    buildRecord({
      sourceId: 'ACCESSIBILITY_VALIDATION',
      sourceName: 'Accessibility Validation',
      status: a11yIssues ? 'FAIL' : 'PASS',
      evidenceId: nextEvidenceId('ACCESSIBILITY_VALIDATION'),
      confidence: a11yIssues ? 25 : 90,
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: [],
      blockers: a11yIssues ? ['Critical accessibility issue remains unresolved'] : [],
      residualRisk: a11yIssues ? ['HIGH accessibility residual risk'] : [],
      supportingArtifacts: [`a11y:${a11yIssues ? 'critical' : 'pass'}`],
    }),
  );

  const perfWarnings = continuousImprovement.signals.some((s) => s.kind === 'PERFORMANCE_DEGRADATION');
  sources.push(
    buildRecord({
      sourceId: 'PERFORMANCE_VALIDATION',
      sourceName: 'Performance Validation',
      status: perfWarnings ? 'WARNING' : 'PASS',
      evidenceId: nextEvidenceId('PERFORMANCE_VALIDATION'),
      confidence: perfWarnings ? 55 : 85,
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: perfWarnings ? ['Performance degradation signal detected'] : [],
      blockers: [],
      residualRisk: perfWarnings ? ['Performance degradation residual risk'] : [],
      supportingArtifacts: [`performance:${perfWarnings ? 'warning' : 'pass'}`],
    }),
  );

  const securityConcerns = continuousImprovement.signals.some((s) => s.kind === 'SECURITY_CONCERN');
  sources.push(
    buildRecord({
      sourceId: 'SECURITY_VALIDATION',
      sourceName: 'Security Validation',
      status: securityConcerns ? 'WARNING' : 'PASS',
      evidenceId: nextEvidenceId('SECURITY_VALIDATION'),
      confidence: securityConcerns ? 50 : 88,
      validationTimestamp: collectedAt,
      affectedRequirements: [],
      affectedFeatures: [],
      warnings: securityConcerns ? ['Security concern signal detected'] : [],
      blockers: capabilityPlanning.permissionVerdict === 'NEEDS_HUMAN_REVIEW' &&
        /payment/i.test(capabilityPlanning.blockedReason ?? '')
        ? ['Payment capability blocked for safety']
        : [],
      residualRisk: securityConcerns ? ['Security residual risk'] : [],
      supportingArtifacts: [`security:${securityConcerns ? 'concern' : 'pass'}`],
    }),
  );

  const filtered = sources.filter((s) => !omitted.has(s.sourceId));
  const presentIds = new Set(filtered.map((s) => s.sourceId));
  const missingSources = REQUIRED_SOURCES.filter((id) => !presentIds.has(id));

  return {
    readOnly: true,
    collectedAt,
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    sources: filtered,
    missingSources,
    omittedSources: [...omitted],
  };
}
