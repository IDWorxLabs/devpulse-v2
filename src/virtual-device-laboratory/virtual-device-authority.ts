/**
 * Virtual Device Laboratory — main authority and orchestrator.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import { validateDeviceAccessibilityScaling, validateDeviceTheme } from './device-accessibility-scaling.js';
import { resetDeviceFailureClassifierForTests, classifyDeviceFailure } from './device-failure-classifier.js';
import { validateInteractionReachability } from './device-interaction-reachability.js';
import { resetDeviceMatrixBuilderForTests, buildDeviceMatrix } from './device-matrix-builder.js';
import { validateDeviceNavigation } from './device-navigation-validator.js';
import { sampleDevicePerformance } from './device-performance-sampler.js';
import { resetDeviceProfileDiscoveryForTests, discoverDeviceProfiles } from './device-profile-discovery.js';
import { resetDeviceRepairRecommenderForTests, recommendDeviceRepair } from './device-repair-recommender.js';
import { validateDeviceRender } from './device-render-validator.js';
import { planEnvironmentLaunches } from './environment-launch-planner.js';
import { validateResponsiveLayout } from './responsive-layout-validator.js';
import { buildVirtualDevicePipelineReport } from './virtual-device-report-builder.js';
import {
  recordVirtualDeviceHistory,
  resetVirtualDeviceHistoryForTests,
} from './virtual-device-history.js';
import type {
  DeviceProfileResult,
  DeviceVerdict,
  LaunchVirtualDeviceEvidence,
  VirtualDevicePipelineInput,
  VirtualDevicePipelineResult,
  WholeAppDeviceSweepResult,
} from './virtual-device-types.js';
import { VIRTUAL_DEVICE_LABORATORY_PASS_TOKEN } from './virtual-device-types.js';

let pipelineCounter = 0;
let lastPipelineResult: VirtualDevicePipelineResult | null = null;

export function resetVirtualDeviceAuthorityForTests(): void {
  pipelineCounter = 0;
  lastPipelineResult = null;
  resetDeviceProfileDiscoveryForTests();
  resetDeviceMatrixBuilderForTests();
  resetDeviceFailureClassifierForTests();
  resetDeviceRepairRecommenderForTests();
  resetVirtualDeviceHistoryForTests();
}

export function getLastVirtualDevicePipelineResult(): VirtualDevicePipelineResult | null {
  return lastPipelineResult;
}

function nextPipelineId(): string {
  pipelineCounter += 1;
  return `vdev-pipeline-${pipelineCounter}`;
}

function runWholeAppDeviceSweep(input: {
  matrix: VirtualDevicePipelineResult['matrix'];
  profileResults: readonly DeviceProfileResult[];
  resumedFromProfileId: string | null;
}): WholeAppDeviceSweepResult {
  const checks: { check: string; passed: boolean; detail: string }[] = [];

  for (const entry of input.matrix) {
    const result = input.profileResults.find((r) => r.profileId === entry.profileId);
    const passed = result?.passed === true || Boolean(result?.skipJustification);
    checks.push({
      check: `PROFILE_PASSED:${entry.profileId}`,
      passed,
      detail: passed ? 'ok' : result?.failure?.category ?? 'failed',
    });
  }

  const blockingPerf = input.profileResults.some((r) => r.performance.status === 'FAIL');
  checks.push({
    check: 'NO_BLOCKING_PERFORMANCE_FAILURE',
    passed: !blockingPerf,
    detail: blockingPerf ? 'low-end performance fail' : 'ok',
  });

  const silentSkip = input.profileResults.some((r) => !r.passed && !r.failure && !r.skipJustification);
  checks.push({
    check: 'NO_SILENT_SKIP',
    passed: !silentSkip,
    detail: silentSkip ? 'silent skip' : 'ok',
  });

  const passed = checks.every((c) => c.passed);
  return {
    readOnly: true,
    sweepId: `vdev-sweep-${pipelineCounter}`,
    passed,
    checks,
    blockedReason: passed ? null : checks.find((c) => !c.passed)?.detail ?? 'Whole-app device sweep failed',
    resumedFromProfileId: input.resumedFromProfileId,
    completedProfileIds: input.profileResults.filter((r) => r.passed).map((r) => r.profileId),
  };
}

function resolvePermissionVerdict(input: {
  profileResults: readonly DeviceProfileResult[];
  wholeAppSweep: WholeAppDeviceSweepResult;
}): { verdict: DeviceVerdict; blockedReason: string | null } {
  const failed = input.profileResults.filter((r) => !r.passed && !r.skipJustification);
  const perfFail = input.profileResults.some((r) => r.performance.status === 'FAIL');
  const perfWarn = input.profileResults.some((r) => r.performance.status === 'WARN');
  void perfWarn;

  if (failed.length || perfFail) {
    return {
      verdict: 'BLOCKED',
      blockedReason: failed[0]?.failure?.likelyCause ?? 'Device profile validation failed',
    };
  }
  if (!input.wholeAppSweep.passed) {
    return {
      verdict: 'NEEDS_REPAIR',
      blockedReason: input.wholeAppSweep.blockedReason ?? 'Device sweep incomplete',
    };
  }
  return { verdict: 'READY_FOR_PREVIEW', blockedReason: null };
}

function validateDeviceProfile(input: {
  profile: ReturnType<typeof discoverDeviceProfiles>[number];
  launchPlan: ReturnType<typeof planEnvironmentLaunches>[number];
  matrixEntry: ReturnType<typeof buildDeviceMatrix>[number];
  pipelineInput: VirtualDevicePipelineInput;
  isLisa: boolean;
  isExpense: boolean;
}): DeviceProfileResult {
  const started = Date.now();
  const context = {
    simulateClippedButton: input.pipelineInput.simulateClippedButton,
    simulateSlowLowEndRender: input.pipelineInput.simulateSlowLowEndRender,
    simulateThemeContrastFailure: input.pipelineInput.simulateThemeContrastFailure,
  };

  const renderChecks = validateDeviceRender({
    profile: input.profile,
    launchPlan: input.launchPlan,
    simulateClippedButton: context.simulateClippedButton,
  });
  const responsiveChecks = validateResponsiveLayout({
    profile: input.profile,
    simulateClippedButton: context.simulateClippedButton,
  });
  const navigationChecks = validateDeviceNavigation({ profile: input.profile });
  const reachabilityChecks = validateInteractionReachability({
    profile: input.profile,
    behaviorSimulation: input.pipelineInput.behaviorSimulation,
    simulateClippedButton: context.simulateClippedButton,
    isLisa: input.isLisa,
    isExpense: input.isExpense,
  });
  const accessibilityChecks = validateDeviceAccessibilityScaling({
    profile: input.profile,
    isLisa: input.isLisa,
  });
  const themeChecks = validateDeviceTheme({
    profile: input.profile,
    simulateThemeContrastFailure: context.simulateThemeContrastFailure,
  });
  const performance = sampleDevicePerformance({
    profile: input.profile,
    simulateSlowLowEndRender: context.simulateSlowLowEndRender,
  });

  const allChecks = [
    ...renderChecks,
    ...responsiveChecks,
    ...navigationChecks,
    ...reachabilityChecks,
    ...accessibilityChecks,
    ...themeChecks,
  ];
  const checksPassed = allChecks.every((c) => c.passed);
  const perfOk = performance.status !== 'FAIL';
  const passed = checksPassed && perfOk;

  const failure = classifyDeviceFailure({
    profileId: input.matrixEntry.profileId,
    checks: allChecks,
    performance,
    passed,
  });
  const repairRecommendation = failure ? recommendDeviceRepair(failure) : null;

  return {
    readOnly: true,
    profileId: input.matrixEntry.profileId,
    deviceId: input.profile.deviceId,
    launchPlan: input.launchPlan,
    renderChecks,
    responsiveChecks,
    navigationChecks,
    reachabilityChecks,
    accessibilityChecks,
    themeChecks,
    performance,
    passed,
    failure,
    repairRecommendation,
    skipJustification: null,
    durationMs: Date.now() - started,
  };
}

export function runVirtualDevicePipeline(
  input: VirtualDevicePipelineInput,
): VirtualDevicePipelineResult {
  if (
    input.incrementalBuild.permissionVerdict !== 'READY_FOR_ASSEMBLY' &&
    input.incrementalBuild.permissionVerdict !== 'RESUMABLE'
  ) {
    return blockedPipeline(input, input.incrementalBuild.blockedReason ?? 'Incremental build not ready.');
  }

  const virtualUserProfiles =
    input.virtualUserSimulation.profiles.length > 0
      ? input.virtualUserSimulation
      : {
          ...input.virtualUserSimulation,
          profiles: discoverVirtualUserProfiles({
            rawPrompt: input.rawPrompt,
            productIntelligenceModel: input.productIntelligenceModel,
            behaviorSimulation: input.behaviorSimulation,
          }),
        };

  if (!virtualUserProfiles.profiles.length) {
    return blockedPipeline(
      input,
      input.virtualUserSimulation.blockedReason ?? 'Virtual user profiles required before device laboratory.',
    );
  }

  const isLisa =
    promptMentionsLisaOrAccessibility(input.rawPrompt) ||
    input.productIntelligenceModel.product.productType === 'ASSISTIVE_COMMUNICATION';
  const isExpense =
    /expense|finance|tracker/i.test(input.rawPrompt) ||
    input.productIntelligenceModel.product.productType === 'EXPENSE_TRACKER';

  const profiles = discoverDeviceProfiles({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    virtualUserSimulation: virtualUserProfiles,
  });
  let matrix = buildDeviceMatrix({
    profiles,
    virtualUserSimulation: virtualUserProfiles,
    behaviorSimulation: input.behaviorSimulation,
  });
  const launchPlans = planEnvironmentLaunches({ profiles, matrix });

  const resumeIndex = input.resumeFromProfileId
    ? matrix.findIndex(
        (m) =>
          m.profileId === input.resumeFromProfileId || m.deviceId === input.resumeFromProfileId,
      )
    : -1;
  const resumedFromProfileId = resumeIndex > 0 ? input.resumeFromProfileId ?? null : null;

  if (input.sliceIdFilter) {
    matrix = matrix.slice(0, 2);
  }

  const profileResults: DeviceProfileResult[] = [];
  for (let i = 0; i < matrix.length; i++) {
    const entry = matrix[i]!;
    if (resumeIndex > 0 && i < resumeIndex) {
      profileResults.push({
        readOnly: true,
        profileId: entry.profileId,
        deviceId: entry.deviceId,
        launchPlan: launchPlans.find((p) => p.profileId === entry.profileId)!,
        renderChecks: [{ readOnly: true, check: 'RESUMED', passed: true, detail: 'resumed from prior sweep' }],
        responsiveChecks: [],
        navigationChecks: [],
        reachabilityChecks: [],
        accessibilityChecks: [],
        themeChecks: [],
        performance: {
          readOnly: true,
          initialRenderMs: 0,
          interactionResponseMs: 0,
          routeTransitionMs: 0,
          memoryRisk: 'LOW',
          longTaskRisk: 'LOW',
          status: 'PASS',
        },
        passed: true,
        failure: null,
        repairRecommendation: null,
        skipJustification: null,
        durationMs: 0,
      });
      continue;
    }

    const profile = profiles.find((p) => p.deviceId === entry.deviceId)!;
    const launchPlan = launchPlans.find((p) => p.profileId === entry.profileId)!;
    profileResults.push(
      validateDeviceProfile({
        profile,
        launchPlan,
        matrixEntry: entry,
        pipelineInput: input,
        isLisa,
        isExpense,
      }),
    );
  }

  const wholeAppSweep = input.sliceIdFilter
    ? {
        readOnly: true as const,
        sweepId: 'vdev-sweep-slice',
        passed: profileResults.every((r) => r.passed),
        checks: [],
        blockedReason: null,
        resumedFromProfileId,
        completedProfileIds: profileResults.filter((r) => r.passed).map((r) => r.profileId),
      }
    : runWholeAppDeviceSweep({ matrix, profileResults, resumedFromProfileId });

  const { verdict, blockedReason } = resolvePermissionVerdict({ profileResults, wholeAppSweep });

  const result: VirtualDevicePipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    profiles,
    matrix,
    launchPlans,
    profileResults,
    wholeAppSweep,
    permissionVerdict: verdict,
    blockedReason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
  result.reportMarkdown = buildVirtualDevicePipelineReport(result);
  recordVirtualDeviceHistory(result);
  lastPipelineResult = result;
  return result;
}

function blockedPipeline(input: VirtualDevicePipelineInput, reason: string): VirtualDevicePipelineResult {
  const result: VirtualDevicePipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    profiles: [],
    matrix: [],
    launchPlans: [],
    profileResults: [],
    wholeAppSweep: {
      readOnly: true,
      sweepId: 'vdev-sweep-blocked',
      passed: false,
      checks: [],
      blockedReason: reason,
      resumedFromProfileId: null,
      completedProfileIds: [],
    },
    permissionVerdict: 'BLOCKED',
    blockedReason: reason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
  result.reportMarkdown = buildVirtualDevicePipelineReport(result);
  lastPipelineResult = result;
  return result;
}

export function simulateVirtualDeviceImpactForFeatureSlice(input: {
  sliceId: string;
  sliceName: string;
  pipelineInput: Omit<
    VirtualDevicePipelineInput,
    'sliceIdFilter' | 'simulateClippedButton' | 'simulateSlowLowEndRender' | 'simulateThemeContrastFailure' | 'resumeFromProfileId'
  >;
}): { passed: boolean; results: DeviceProfileResult[]; blockedReason: string | null; skipJustification: string | null } {
  const layoutAffecting = /layout|navigation|shell|responsive|theme|accessibility|ui|router/i.test(input.sliceName);
  if (!layoutAffecting) {
    return {
      passed: true,
      results: [],
      blockedReason: null,
      skipJustification: `Slice ${input.sliceName} does not affect device layout — explicit skip with traceability`,
    };
  }

  if (input.pipelineInput.incrementalBuild.permissionVerdict === 'IN_PROGRESS') {
    return {
      passed: true,
      results: [],
      blockedReason: null,
      skipJustification: `Device validation deferred to whole-app sweep during slice ${input.sliceName} stabilization`,
    };
  }

  const result = runVirtualDevicePipeline({ ...input.pipelineInput, sliceIdFilter: input.sliceId });
  const failed = result.profileResults.filter((r) => !r.passed && !r.skipJustification);
  return {
    passed: failed.length === 0 && result.permissionVerdict !== 'BLOCKED',
    results: result.profileResults,
    blockedReason: result.blockedReason,
    skipJustification: null,
  };
}

export function isVirtualDeviceLaboratoryReadyForPreview(result: VirtualDevicePipelineResult): boolean {
  return result.permissionVerdict === 'READY_FOR_PREVIEW' && result.wholeAppSweep.passed;
}

export function buildLaunchVirtualDeviceEvidence(result: VirtualDevicePipelineResult): LaunchVirtualDeviceEvidence {
  const blockers: string[] = [];
  if (result.blockedReason) blockers.push(result.blockedReason);
  const failed = result.profileResults.filter((r) => !r.passed && !r.skipJustification).length;
  if (failed) blockers.push(`${failed} device profile(s) failed`);
  const warned = result.profileResults.filter((r) => r.performance.status === 'WARN').length;
  if (warned) blockers.push(`${warned} device profile(s) warned on performance`);

  return {
    readOnly: true,
    requiredProfileCount: result.matrix.length,
    executedProfileCount: result.profileResults.length,
    passedCount: result.profileResults.filter((r) => r.passed).length,
    failedCount: failed,
    warnedCount: warned,
    skippedWithJustificationCount: result.profileResults.filter((r) => r.skipJustification).length,
    wholeAppSweepPassed: result.wholeAppSweep.passed,
    permissionVerdict: result.permissionVerdict,
    blockers,
  };
}

export function getVirtualDevicePassToken(): string {
  return VIRTUAL_DEVICE_LABORATORY_PASS_TOKEN;
}
