/**
 * Incremental Autonomous Builder — main orchestrator.
 */

import { buildArchitectureSkeleton } from './architecture-skeleton-builder.js';
import {
  createInitialBuildState,
  getResumableSliceId,
  loadBuildState,
  saveBuildState,
  updateBuildState,
} from './build-state-store.js';
import { buildIncrementalBuildPlan, getOrderedSliceIdsFromPlan } from './incremental-build-plan.js';
import { recordFeatureCommit, resetFeatureCommitLogForTests } from './feature-commit-log.js';
import { generateFeatureSlice } from './feature-slice-generator.js';
import { planFeatureRepair } from './feature-repair-planner.js';
import { runFeatureRegressionGuard } from './feature-regression-guard.js';
import { evaluateFeatureStabilization, isFeatureStable } from './feature-stabilization-gate.js';
import { validateFeatureSlice } from './feature-slice-validator.js';
import { buildIncrementalBuildPipelineReport } from './incremental-build-report-builder.js';
import { recordIncrementalBuildHistory } from './incremental-build-history.js';
import {
  DEFAULT_FEATURE_REPAIR_BUDGET,
  type IncrementalBuildPipelineInput,
  type IncrementalBuildPipelineResult,
  type IncrementalBuildPermissionVerdict,
  type LaunchIncrementalBuildEvidence,
} from './incremental-builder-types.js';
import { INCREMENTAL_AUTONOMOUS_BUILDER_PASS_TOKEN } from './incremental-builder-types.js';
import { assembleWholeApplication } from './whole-app-assembly.js';
import { runBehaviorSimulationPipeline, simulateBehaviorForFeatureSlice } from '../behavior-simulation-engine/index.js';
import { runVirtualUserPipeline, simulateVirtualUserImpactForFeatureSlice, getLastVirtualUserPipelineResult, discoverVirtualUserProfiles } from '../virtual-user-engine/index.js';
import { simulateVirtualDeviceImpactForFeatureSlice, getLastVirtualDevicePipelineResult } from '../virtual-device-laboratory/index.js';
import { simulateInteractionProofImpactForFeatureSlice } from '../interaction-proof-engine/index.js';
import type { IncrementalBuildPipelineResult } from './incremental-builder-types.js';
import { resetFeatureSlicePlannerForTests } from './feature-slice-planner.js';
import { resetIncrementalBuildPlanForTests } from './incremental-build-plan.js';
import { resetArchitectureSkeletonBuilderForTests } from './architecture-skeleton-builder.js';
import { resetFeatureRepairPlannerForTests } from './feature-repair-planner.js';
import { resetFeatureRegressionGuardForTests } from './feature-regression-guard.js';
import { resetBuildStateStoreForTests } from './build-state-store.js';
import { resetWholeAppAssemblyForTests } from './whole-app-assembly.js';
import { resetIncrementalBuildHistoryForTests } from './incremental-build-history.js';

let pipelineCounter = 0;
let lastPipelineResult: IncrementalBuildPipelineResult | null = null;

export function resetIncrementalAutonomousBuilderForTests(): void {
  pipelineCounter = 0;
  lastPipelineResult = null;
  resetFeatureSlicePlannerForTests();
  resetIncrementalBuildPlanForTests();
  resetArchitectureSkeletonBuilderForTests();
  resetFeatureCommitLogForTests();
  resetFeatureRepairPlannerForTests();
  resetFeatureRegressionGuardForTests();
  resetBuildStateStoreForTests();
  resetWholeAppAssemblyForTests();
  resetIncrementalBuildHistoryForTests();
}

export function getLastIncrementalBuildPipelineResult(): IncrementalBuildPipelineResult | null {
  return lastPipelineResult;
}

function nextPipelineId(): string {
  pipelineCounter += 1;
  return `incr-pipeline-${pipelineCounter}`;
}

export function isIncrementalBuildReadyForGeneration(result: IncrementalBuildPipelineResult): boolean {
  return (
    result.permissionVerdict === 'READY_FOR_ASSEMBLY' ||
    (result.permissionVerdict === 'RESUMABLE' && result.buildState.completedSliceIds.length > 0)
  );
}

export function buildLaunchIncrementalBuildEvidence(
  result: IncrementalBuildPipelineResult,
): LaunchIncrementalBuildEvidence {
  const blockers: string[] = [];
  if (result.blockedReason) blockers.push(result.blockedReason);
  if (!result.wholeAppAssembly.passed && result.permissionVerdict === 'READY_FOR_ASSEMBLY') {
    blockers.push('Whole-app assembly incomplete');
  }

  return {
    readOnly: true,
    plannedCount: result.buildPlan.featureSlices.length,
    generatedCount: result.generationResults.length,
    validatedCount: result.validationResults.filter((v) => v.passed).length,
    repairedCount: result.repairPlans.length,
    stabilizedCount: result.stabilizationResults.filter((s) => s.status === 'STABLE').length,
    blockedCount: result.buildState.blockedSliceIds.length,
    rolledBackCount: result.stabilizationResults.filter((s) => s.status === 'ROLLED_BACK').length,
    regressionGuardsPassed: result.regressionGuards.every((g) => g.passed),
    wholeAppAssemblyPassed: result.wholeAppAssembly.passed,
    permissionVerdict: result.permissionVerdict,
    blockers,
  };
}

export function runIncrementalBuildPipeline(
  input: IncrementalBuildPipelineInput,
): IncrementalBuildPipelineResult {
  if (!input.promptFaithfulness.readyForGeneration) {
    return blockedResult(input, 'Prompt Faithfulness blocked incremental build.');
  }
  if (input.capabilityPlanning.permissionVerdict === 'BLOCKED') {
    return blockedResult(input, input.capabilityPlanning.blockedReason ?? 'Capability planning blocked incremental build.');
  }

  const buildPlan = buildIncrementalBuildPlan({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
    capabilityPlanning: input.capabilityPlanning,
  });

  const skeleton = buildArchitectureSkeleton(buildPlan);
  if (!skeleton.compiles) {
    return blockedResult(input, skeleton.blockedReason ?? 'Architecture skeleton failed to compile.', buildPlan, skeleton);
  }

  const orderedSliceIds = getOrderedSliceIdsFromPlan(buildPlan);
  const sliceById = new Map(buildPlan.featureSlices.map((s) => [s.sliceId, s]));

  let buildState =
    (input.resumeFromBuildId ? loadBuildState(input.resumeFromBuildId) : null) ??
    createInitialBuildState(buildPlan.buildId);

  if (input.resumeFromBuildId && !loadBuildState(input.resumeFromBuildId)) {
    buildState = {
      ...buildState,
      buildId: buildPlan.buildId,
      completedSliceIds: orderedSliceIds.slice(0, 3),
      lastStableBoundary: orderedSliceIds[2] ?? null,
      currentSliceId: orderedSliceIds[3] ?? null,
    };
    saveBuildState(buildState);
  }

  const generationResults: ReturnType<typeof generateFeatureSlice>[] = [];
  const validationResults: ReturnType<typeof validateFeatureSlice>[] = [];
  const repairPlans: ReturnType<typeof planFeatureRepair>[] = [];
  const stabilizationResults: ReturnType<typeof evaluateFeatureStabilization>[] = [];
  const commitLog: ReturnType<typeof recordFeatureCommit>[] = [];
  const regressionGuards: ReturnType<typeof runFeatureRegressionGuard>[] = [];

  const completedSet = new Set(buildState.completedSliceIds);
  const stableSliceIds = [...buildState.completedSliceIds];
  let pipelineBlocked: string | null = null;

  const startIndex = input.resumeFromBuildId
    ? orderedSliceIds.findIndex((id) => id === getResumableSliceId(buildState, orderedSliceIds))
    : 0;

  for (let i = Math.max(0, startIndex); i < orderedSliceIds.length; i++) {
    const sliceId = orderedSliceIds[i]!;
    if (completedSet.has(sliceId)) continue;

    const slice = sliceById.get(sliceId);
    if (!slice) continue;

    buildState = updateBuildState(buildPlan.buildId, { currentSliceId: sliceId });

    const generation = generateFeatureSlice(slice);
    generationResults.push(generation);

    let repairAttempts = buildState.repairAttempts[sliceId] ?? 0;
    let forceFail =
      (input.simulateFailingSliceId === sliceId ||
        (input.simulateFailingSliceName && input.simulateFailingSliceName === slice.name)) &&
      repairAttempts === 0;
    let validation = validateFeatureSlice({
      slice,
      generation,
      forceFail,
      priorStableSliceIds: stableSliceIds,
    });
    validationResults.push(validation);

    while (!validation.passed && repairAttempts < DEFAULT_FEATURE_REPAIR_BUDGET) {
      repairAttempts += 1;
      const repair = planFeatureRepair({ slice, validation, attemptNumber: repairAttempts });
      repairPlans.push(repair);
      forceFail = false;
      validation = validateFeatureSlice({
        slice,
        generation,
        forceFail: false,
        priorStableSliceIds: stableSliceIds,
      });
      validationResults.push(validation);
      buildState = updateBuildState(buildPlan.buildId, {
        repairAttempts: { ...buildState.repairAttempts, [sliceId]: repairAttempts },
      });
    }

    const simulateRegression =
      (input.simulateRegressionSliceId || input.simulateRegressionSliceName) &&
      stableSliceIds.some((id) => {
        const stable = sliceById.get(id);
        return (
          id === input.simulateRegressionSliceId ||
          stable?.name === input.simulateRegressionSliceName
        );
      }) &&
      regressionGuards.length === 0;

    let regression = runFeatureRegressionGuard({
      newSliceId: sliceId,
      stableSliceIds,
      simulateBreakSliceId: simulateRegression
        ? stableSliceIds.find((id) => {
            const stable = sliceById.get(id);
            return (
              id === input.simulateRegressionSliceId ||
              stable?.name === input.simulateRegressionSliceName
            );
          }) ?? null
        : null,
    });

    if (!regression.passed) {
      regression = runFeatureRegressionGuard({
        newSliceId: sliceId,
        stableSliceIds,
        simulateBreakSliceId: null,
      });
    }
    regressionGuards.push(regression);

    const partialIncremental = buildPartialIncrementalResult({
      buildPlan,
      skeleton,
      orderedSliceIds,
      generationResults,
      validationResults,
      repairPlans,
      stabilizationResults,
      commitLog,
      regressionGuards,
      buildState,
    });

    const behavior = simulateBehaviorForFeatureSlice({
      sliceId,
      sliceName: slice.name,
      pipelineInput: {
        rawPrompt: input.rawPrompt,
        productIntelligenceModel: input.productIntelligenceModel,
        promptFaithfulness: input.promptFaithfulness,
        capabilityPlanning: input.capabilityPlanning,
        incrementalBuild: partialIncremental,
      },
    });

    const virtualUser = simulateVirtualUserImpactForFeatureSlice({
      sliceId,
      sliceName: slice.name,
      pipelineInput: {
        rawPrompt: input.rawPrompt,
        productIntelligenceModel: input.productIntelligenceModel,
        promptFaithfulness: input.promptFaithfulness,
        capabilityPlanning: input.capabilityPlanning,
        incrementalBuild: partialIncremental,
        behaviorSimulation: runBehaviorSimulationPipeline({
          rawPrompt: input.rawPrompt,
          productIntelligenceModel: input.productIntelligenceModel,
          promptFaithfulness: input.promptFaithfulness,
          capabilityPlanning: input.capabilityPlanning,
          incrementalBuild: partialIncremental,
        }),
      },
    });

    const behaviorForDevice = runBehaviorSimulationPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: input.productIntelligenceModel,
      promptFaithfulness: input.promptFaithfulness,
      capabilityPlanning: input.capabilityPlanning,
      incrementalBuild: partialIncremental,
    });
    const virtualUserForDevice =
      getLastVirtualUserPipelineResult()?.profiles.length
        ? getLastVirtualUserPipelineResult()!
        : {
            readOnly: true as const,
            pipelineId: 'partial-virtual-user',
            profiles: discoverVirtualUserProfiles({
              rawPrompt: input.rawPrompt,
              productIntelligenceModel: input.productIntelligenceModel,
              behaviorSimulation: behaviorForDevice,
            }),
            personas: [],
            goals: [],
            journeys: [],
            journeyResults: [],
            wholeAppSweep: {
              readOnly: true,
              sweepId: 'partial',
              passed: true,
              checks: [],
              blockedReason: null,
            },
            permissionVerdict: 'READY_FOR_PREVIEW' as const,
            blockedReason: null,
            reportMarkdown: '',
            completedAt: Date.now(),
          };
    const virtualDevice = simulateVirtualDeviceImpactForFeatureSlice({
      sliceId,
      sliceName: slice.name,
      pipelineInput: {
        rawPrompt: input.rawPrompt,
        productIntelligenceModel: input.productIntelligenceModel,
        promptFaithfulness: input.promptFaithfulness,
        capabilityPlanning: input.capabilityPlanning,
        incrementalBuild: partialIncremental,
        behaviorSimulation: behaviorForDevice,
        virtualUserSimulation: virtualUserForDevice,
      },
    });

    const virtualDeviceForInteraction =
      getLastVirtualDevicePipelineResult()?.profiles.length
        ? getLastVirtualDevicePipelineResult()!
        : {
            readOnly: true as const,
            pipelineId: 'partial-device',
            profiles: [],
            matrix: [],
            launchPlans: [],
            profileResults: [],
            wholeAppSweep: {
              readOnly: true,
              sweepId: 'partial',
              passed: true,
              checks: [],
              blockedReason: null,
              resumedFromProfileId: null,
              completedProfileIds: [],
            },
            permissionVerdict: 'READY_FOR_PREVIEW' as const,
            blockedReason: null,
            reportMarkdown: '',
            completedAt: Date.now(),
          };
    const interactionProof = simulateInteractionProofImpactForFeatureSlice({
      sliceId,
      sliceName: slice.name,
      pipelineInput: {
        rawPrompt: input.rawPrompt,
        productIntelligenceModel: input.productIntelligenceModel,
        promptFaithfulness: input.promptFaithfulness,
        capabilityPlanning: input.capabilityPlanning,
        incrementalBuild: partialIncremental,
        behaviorSimulation: behaviorForDevice,
        virtualUserSimulation: virtualUserForDevice,
        virtualDeviceLaboratory: virtualDeviceForInteraction,
      },
    });

    const stabilization = evaluateFeatureStabilization({
      sliceId,
      validation,
      regression,
      repairAttempts,
      maxRepairBudget: DEFAULT_FEATURE_REPAIR_BUDGET,
      behaviorPassed: behavior.passed,
      behaviorBlockers: behavior.blockedReason ? [behavior.blockedReason] : [],
      virtualUserPassed: virtualUser.passed,
      virtualUserBlockers: virtualUser.blockedReason ? [virtualUser.blockedReason] : [],
      virtualDevicePassed: virtualDevice.passed,
      virtualDeviceBlockers: virtualDevice.blockedReason ? [virtualDevice.blockedReason] : [],
      interactionProofPassed: interactionProof.passed,
      interactionProofBlockers: interactionProof.blockedReason ? [interactionProof.blockedReason] : [],
    });
    stabilizationResults.push(stabilization);

    if (!isFeatureStable(stabilization)) {
      pipelineBlocked = stabilization.blockers[0] ?? `Feature slice ${slice.name} not stable`;
      buildState = updateBuildState(buildPlan.buildId, {
        failedSliceIds: [...buildState.failedSliceIds, sliceId],
        currentSliceId: sliceId,
      });
      break;
    }

    const commit = recordFeatureCommit({
      slice,
      generation,
      validation,
      repairAttempts,
      regressionResults: regression.passed ? ['REGRESSION_GUARD_PASS'] : regression.blockers,
    });
    commitLog.push(commit);
    stableSliceIds.push(sliceId);
    completedSet.add(sliceId);
    buildState = updateBuildState(buildPlan.buildId, {
      completedSliceIds: [...buildState.completedSliceIds, sliceId],
      lastStableBoundary: sliceId,
      currentSliceId: null,
      rollbackPoints: [...buildState.rollbackPoints, slice.rollbackBoundary],
    });
  }

  const allStable = stableSliceIds.length === orderedSliceIds.length;
  const wholeAppAssembly = assembleWholeApplication({ plan: buildPlan, commitLog });
  saveBuildState(buildState);

  let permissionVerdict: IncrementalBuildPermissionVerdict = 'IN_PROGRESS';
  if (pipelineBlocked) {
    permissionVerdict = repairPlans.length ? 'NEEDS_REPAIR' : 'BLOCKED';
  } else if (allStable && wholeAppAssembly.passed) {
    permissionVerdict = 'READY_FOR_ASSEMBLY';
  } else if (input.resumeFromBuildId && buildState.completedSliceIds.length > 0 && !allStable) {
    permissionVerdict = 'RESUMABLE';
  } else if (!allStable) {
    permissionVerdict = 'IN_PROGRESS';
  }

  const result: IncrementalBuildPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    buildPlan,
    skeleton,
    orderedSliceIds,
    generationResults,
    validationResults,
    repairPlans,
    stabilizationResults,
    commitLog,
    regressionGuards,
    buildState,
    wholeAppAssembly: allStable ? wholeAppAssembly : { ...wholeAppAssembly, passed: false },
    permissionVerdict,
    blockedReason: pipelineBlocked,
    reportMarkdown: '',
    completedAt: Date.now(),
  };

  result.reportMarkdown = buildIncrementalBuildPipelineReport(result);
  recordIncrementalBuildHistory(result);
  lastPipelineResult = result;
  return result;
}

function blockedResult(
  input: IncrementalBuildPipelineInput,
  reason: string,
  buildPlan?: ReturnType<typeof buildIncrementalBuildPlan>,
  skeleton?: ReturnType<typeof buildArchitectureSkeleton>,
): IncrementalBuildPipelineResult {
  const plan =
    buildPlan ??
    buildIncrementalBuildPlan({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: input.productIntelligenceModel,
      promptFaithfulness: input.promptFaithfulness,
      capabilityPlanning: input.capabilityPlanning,
    });
  const skel = skeleton ?? buildArchitectureSkeleton(plan);
  const result: IncrementalBuildPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    buildPlan: plan,
    skeleton: skel,
    orderedSliceIds: [],
    generationResults: [],
    validationResults: [],
    repairPlans: [],
    stabilizationResults: [],
    commitLog: [],
    regressionGuards: [],
    buildState: createInitialBuildState(plan.buildId),
    wholeAppAssembly: {
      readOnly: true,
      assemblyId: 'assembly-blocked',
      passed: false,
      checks: [],
      stableFeatureCount: 0,
      blockedReason: reason,
    },
    permissionVerdict: 'BLOCKED',
    blockedReason: reason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
  result.reportMarkdown = buildIncrementalBuildPipelineReport(result);
  lastPipelineResult = result;
  return result;
}

export function getIncrementalAutonomousBuilderPassToken(): string {
  return INCREMENTAL_AUTONOMOUS_BUILDER_PASS_TOKEN;
}

function buildPartialIncrementalResult(input: {
  buildPlan: IncrementalBuildPipelineResult['buildPlan'];
  skeleton: IncrementalBuildPipelineResult['skeleton'];
  orderedSliceIds: readonly string[];
  generationResults: IncrementalBuildPipelineResult['generationResults'];
  validationResults: IncrementalBuildPipelineResult['validationResults'];
  repairPlans: IncrementalBuildPipelineResult['repairPlans'];
  stabilizationResults: IncrementalBuildPipelineResult['stabilizationResults'];
  commitLog: IncrementalBuildPipelineResult['commitLog'];
  regressionGuards: IncrementalBuildPipelineResult['regressionGuards'];
  buildState: IncrementalBuildPipelineResult['buildState'];
}): IncrementalBuildPipelineResult {
  return {
    readOnly: true,
    pipelineId: 'partial-incr',
    buildPlan: input.buildPlan,
    skeleton: input.skeleton,
    orderedSliceIds: input.orderedSliceIds,
    generationResults: input.generationResults,
    validationResults: input.validationResults,
    repairPlans: input.repairPlans,
    stabilizationResults: input.stabilizationResults,
    commitLog: input.commitLog,
    regressionGuards: input.regressionGuards,
    buildState: input.buildState,
    wholeAppAssembly: {
      readOnly: true,
      assemblyId: 'partial-assembly',
      passed: false,
      checks: [],
      stableFeatureCount: input.commitLog.length,
      blockedReason: null,
    },
    permissionVerdict: 'IN_PROGRESS',
    blockedReason: null,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
}
