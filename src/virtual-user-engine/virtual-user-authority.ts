/**
 * Virtual User Engine — main authority and orchestrator.
 */

import { analyzeVirtualUserAccessibility } from './virtual-user-accessibility-analyzer.js';
import { executeVirtualUserJourney } from './virtual-user-executor.js';
import { classifyVirtualUserFailure, resetVirtualUserFailureClassifierForTests } from './virtual-user-failure-classifier.js';
import { analyzeVirtualUserFriction, resetVirtualUserFrictionAnalyzerForTests } from './virtual-user-friction-analyzer.js';
import { extractVirtualUserGoals } from './virtual-user-goal-extractor.js';
import { verifyVirtualUserGoal } from './virtual-user-goal-verifier.js';
import { planVirtualUserJourneys } from './virtual-user-journey-planner.js';
import { buildVirtualUserPersonas } from './virtual-user-persona-builder.js';
import { discoverVirtualUserProfiles, resetVirtualUserProfileDiscoveryForTests } from './virtual-user-profile-discovery.js';
import { recommendVirtualUserRepair, resetVirtualUserRepairRecommenderForTests } from './virtual-user-repair-recommender.js';
import { buildVirtualUserPipelineReport } from './virtual-user-report-builder.js';
import { recordVirtualUserHistory, resetVirtualUserHistoryForTests } from './virtual-user-history.js';
import type {
  LaunchVirtualUserEvidence,
  VirtualUserJourneyResult,
  VirtualUserPipelineInput,
  VirtualUserPipelineResult,
  VirtualUserProfile,
  VirtualUserVerdict,
  WholeAppVirtualUserSweepResult,
} from './virtual-user-types.js';
import { VIRTUAL_USER_ENGINE_PASS_TOKEN } from './virtual-user-types.js';

let pipelineCounter = 0;
let lastPipelineResult: VirtualUserPipelineResult | null = null;

export function resetVirtualUserAuthorityForTests(): void {
  pipelineCounter = 0;
  lastPipelineResult = null;
  resetVirtualUserProfileDiscoveryForTests();
  resetVirtualUserFrictionAnalyzerForTests();
  resetVirtualUserFailureClassifierForTests();
  resetVirtualUserRepairRecommenderForTests();
  resetVirtualUserHistoryForTests();
}

export function getLastVirtualUserPipelineResult(): VirtualUserPipelineResult | null {
  return lastPipelineResult;
}

function nextPipelineId(): string {
  pipelineCounter += 1;
  return `vu-pipeline-${pipelineCounter}`;
}

function runWholeAppVirtualUserSweep(input: {
  profiles: readonly VirtualUserProfile[];
  journeyResults: readonly VirtualUserJourneyResult[];
}): WholeAppVirtualUserSweepResult {
  const checks: { check: string; passed: boolean; detail: string }[] = [];

  for (const profile of input.profiles) {
    const userResults = input.journeyResults.filter((j) => j.userId === profile.userId);
    const completed = userResults.some(
      (j) => j.completionStatus === 'COMPLETED' || j.completionStatus === 'COMPLETED_WITH_FRICTION',
    );
    checks.push({
      check: `USER_HAS_COMPLETED_JOURNEY:${profile.role}`,
      passed: completed,
      detail: completed ? 'ok' : 'no completed journey',
    });
  }

  const criticalGoals = input.journeyResults.filter((j) =>
    j.completionStatus !== 'SKIPPED_WITH_JUSTIFICATION',
  );
  const allPrimaryComplete = criticalGoals.every(
    (j) => j.completionStatus === 'COMPLETED' || j.completionStatus === 'COMPLETED_WITH_FRICTION',
  );
  checks.push({
    check: 'PRIMARY_GOALS_COMPLETE',
    passed: allPrimaryComplete,
    detail: allPrimaryComplete ? 'ok' : 'primary goal incomplete',
  });

  const blockingFriction = input.journeyResults.some((j) =>
    j.frictionEvents.some((f) => f.severity === 'BLOCKING' || f.severity === 'HIGH'),
  );
  checks.push({
    check: 'NO_BLOCKING_FRICTION',
    passed: !blockingFriction,
    detail: blockingFriction ? 'blocking friction detected' : 'ok',
  });

  const silentSkip = input.journeyResults.some(
    (j) => j.completionStatus === 'FAILED' && !j.failure && !j.skipJustification,
  );
  checks.push({
    check: 'NO_SILENT_SKIP',
    passed: !silentSkip,
    detail: silentSkip ? 'silent skip detected' : 'ok',
  });

  const passed = checks.every((c) => c.passed);
  return {
    readOnly: true,
    sweepId: `vu-sweep-${pipelineCounter}`,
    passed,
    checks,
    blockedReason: passed ? null : checks.find((c) => !c.passed)?.detail ?? 'Whole-app virtual user sweep failed',
  };
}

function resolvePermissionVerdict(input: {
  journeyResults: readonly VirtualUserJourneyResult[];
  wholeAppSweep: WholeAppVirtualUserSweepResult;
}): { verdict: VirtualUserVerdict; blockedReason: string | null } {
  const failed = input.journeyResults.filter(
    (j) => j.completionStatus === 'FAILED' || j.completionStatus === 'BLOCKED',
  );
  const highFriction = input.journeyResults.some(
    (j) =>
      j.completionStatus === 'COMPLETED_WITH_FRICTION' ||
      j.frictionEvents.some((f) => f.severity === 'HIGH' || f.severity === 'BLOCKING'),
  );

  if (failed.length) {
    return {
      verdict: 'BLOCKED',
      blockedReason: failed[0]?.failure?.likelyCause ?? 'Virtual user journey failed',
    };
  }
  if (!input.wholeAppSweep.passed || highFriction) {
    return {
      verdict: 'NEEDS_REPAIR',
      blockedReason: input.wholeAppSweep.blockedReason ?? 'Usability friction blocks launch readiness',
    };
  }
  return { verdict: 'READY_FOR_PREVIEW', blockedReason: null };
}

export function runVirtualUserPipeline(input: VirtualUserPipelineInput): VirtualUserPipelineResult {
  if (
    input.incrementalBuild.permissionVerdict !== 'READY_FOR_ASSEMBLY' &&
    input.incrementalBuild.permissionVerdict !== 'RESUMABLE'
  ) {
    return blockedPipeline(input, input.incrementalBuild.blockedReason ?? 'Incremental build not ready.');
  }

  if (!input.behaviorSimulation.scenarios.length) {
    return blockedPipeline(input, input.behaviorSimulation.blockedReason ?? 'No behavior scenarios for virtual user execution.');
  }

  const profiles = discoverVirtualUserProfiles({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
    behaviorSimulation: input.behaviorSimulation,
  });
  const personas = buildVirtualUserPersonas(profiles);
  const goals = extractVirtualUserGoals({
    profiles,
    incrementalBuild: input.incrementalBuild,
    behaviorSimulation: input.behaviorSimulation,
  });
  let journeys = planVirtualUserJourneys({ goals, personas });

  if (input.sliceIdFilter) {
    const sliceGoals = goals.filter((g) => g.requiredFeatureSliceIds.includes(input.sliceIdFilter!));
    journeys = journeys.filter((j) => sliceGoals.some((g) => g.goalId === j.goalId));
  }

  const context = {
    simulateAccessibilityBlocker: input.simulateAccessibilityBlocker,
    simulateTooManySteps: input.simulateTooManySteps,
    simulateMissingConfirmation: input.simulateMissingConfirmation,
  };

  const journeyResults: VirtualUserJourneyResult[] = journeys.map((journey) => {
    const persona = personas.find((p) => p.userId === journey.userId)!;
    const goal = goals.find((g) => g.goalId === journey.goalId)!;
    const started = Date.now();
    const stepResults = executeVirtualUserJourney({
      journey,
      persona,
      behaviorSimulation: input.behaviorSimulation,
      context,
    });
    const frictionEvents = analyzeVirtualUserFriction({
      journey,
      persona,
      stepResults,
      simulateTooManySteps: input.simulateTooManySteps,
      simulateMissingConfirmation: input.simulateMissingConfirmation,
    });
    const accessibility = analyzeVirtualUserAccessibility({
      persona,
      journey,
      stepResults,
      simulateAccessibilityBlocker: input.simulateAccessibilityBlocker,
    });
    const hasBlockingFriction = frictionEvents.some((f) => f.severity === 'BLOCKING');
    const hasHighFriction = frictionEvents.some((f) => f.severity === 'HIGH' || f.severity === 'BLOCKING');
    const completionStatus = verifyVirtualUserGoal({
      goal,
      journey,
      stepResults,
      hasBlockingFriction: hasBlockingFriction || !accessibility.passed,
      hasHighFriction,
    });
    const failure = classifyVirtualUserFailure({
      goal,
      journey,
      stepResults,
      frictionEvents,
      accessibilityBlockers: accessibility.blockers,
      completionStatus,
    });
    const repairRecommendation = failure ? recommendVirtualUserRepair(failure) : null;

    return {
      readOnly: true,
      journeyId: journey.journeyId,
      userId: journey.userId,
      goalId: journey.goalId,
      stepResults,
      frictionEvents,
      accessibilityEvents: accessibility.events,
      completionStatus,
      durationMs: Date.now() - started,
      stepCount: stepResults.length,
      failure,
      repairRecommendation,
      skipJustification: null,
    };
  });

  const wholeAppSweep = input.sliceIdFilter
    ? {
        readOnly: true as const,
        sweepId: 'vu-sweep-slice',
        passed: journeyResults.every((j) => j.completionStatus === 'COMPLETED'),
        checks: [],
        blockedReason: null,
      }
    : runWholeAppVirtualUserSweep({ profiles, journeyResults });

  const { verdict, blockedReason } = resolvePermissionVerdict({ journeyResults, wholeAppSweep });

  const result: VirtualUserPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    profiles,
    personas,
    goals,
    journeys,
    journeyResults,
    wholeAppSweep,
    permissionVerdict: verdict,
    blockedReason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
  result.reportMarkdown = buildVirtualUserPipelineReport(result);
  recordVirtualUserHistory(result);
  lastPipelineResult = result;
  return result;
}

function blockedPipeline(input: VirtualUserPipelineInput, reason: string): VirtualUserPipelineResult {
  const result: VirtualUserPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    profiles: [],
    personas: [],
    goals: [],
    journeys: [],
    journeyResults: [],
    wholeAppSweep: {
      readOnly: true,
      sweepId: 'vu-sweep-blocked',
      passed: false,
      checks: [],
      blockedReason: reason,
    },
    permissionVerdict: 'BLOCKED',
    blockedReason: reason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
  result.reportMarkdown = buildVirtualUserPipelineReport(result);
  lastPipelineResult = result;
  return result;
}

export function simulateVirtualUserImpactForFeatureSlice(input: {
  sliceId: string;
  sliceName: string;
  pipelineInput: Omit<
    VirtualUserPipelineInput,
    'sliceIdFilter' | 'simulateAccessibilityBlocker' | 'simulateTooManySteps' | 'simulateMissingConfirmation'
  >;
}): { passed: boolean; results: VirtualUserJourneyResult[]; blockedReason: string | null; skipJustification: string | null } {
  const profiles = discoverVirtualUserProfiles({
    rawPrompt: input.pipelineInput.rawPrompt,
    productIntelligenceModel: input.pipelineInput.productIntelligenceModel,
    promptFaithfulness: input.pipelineInput.promptFaithfulness,
    behaviorSimulation: input.pipelineInput.behaviorSimulation,
  });
  const goals = extractVirtualUserGoals({
    profiles,
    incrementalBuild: input.pipelineInput.incrementalBuild,
    behaviorSimulation: input.pipelineInput.behaviorSimulation,
  });
  const relatedGoals = goals.filter((g) => g.requiredFeatureSliceIds.includes(input.sliceId));

  if (!relatedGoals.length) {
    return {
      passed: true,
      results: [],
      blockedReason: null,
      skipJustification: `No virtual user goals mapped to slice ${input.sliceName} — explicit skip with traceability`,
    };
  }

  const behaviorForSlice = input.pipelineInput.behaviorSimulation.scenarios.some((s) =>
    s.featureSliceIds.includes(input.sliceId),
  )
    ? {
        ...input.pipelineInput.behaviorSimulation,
        scenarios: input.pipelineInput.behaviorSimulation.scenarios.filter((s) =>
          s.featureSliceIds.includes(input.sliceId),
        ),
        scenarioResults: input.pipelineInput.behaviorSimulation.scenarioResults.filter((r) =>
          input.pipelineInput.behaviorSimulation.scenarios
            .filter((s) => s.featureSliceIds.includes(input.sliceId))
            .some((s) => s.scenarioId === r.scenarioId),
        ),
      }
    : input.pipelineInput.behaviorSimulation;

  if (!behaviorForSlice.scenarios.length) {
    return {
      passed: true,
      results: [],
      blockedReason: null,
      skipJustification: `No behavior scenarios for slice ${input.sliceName} — virtual user deferred to whole-app sweep`,
    };
  }

  const result = runVirtualUserPipeline({
    ...input.pipelineInput,
    behaviorSimulation: behaviorForSlice,
    sliceIdFilter: input.sliceId,
  });
  const failed = result.journeyResults.filter(
    (j) => j.completionStatus === 'FAILED' || j.completionStatus === 'BLOCKED',
  );
  return {
    passed: failed.length === 0 && result.permissionVerdict !== 'BLOCKED',
    results: result.journeyResults,
    blockedReason: result.blockedReason,
    skipJustification: null,
  };
}

export function isVirtualUserSimulationReadyForPreview(result: VirtualUserPipelineResult): boolean {
  return result.permissionVerdict === 'READY_FOR_PREVIEW' && result.wholeAppSweep.passed;
}

export function buildLaunchVirtualUserEvidence(result: VirtualUserPipelineResult): LaunchVirtualUserEvidence {
  const blockers: string[] = [];
  if (result.blockedReason) blockers.push(result.blockedReason);
  const failed = result.journeyResults.filter(
    (j) => j.completionStatus === 'FAILED' || j.completionStatus === 'BLOCKED',
  ).length;
  if (failed) blockers.push(`${failed} virtual user journey(s) failed`);
  const frictionCount = result.journeyResults.reduce((n, j) => n + j.frictionEvents.length, 0);
  if (frictionCount) blockers.push(`${frictionCount} friction event(s) detected`);

  return {
    readOnly: true,
    userCount: result.profiles.length,
    goalCount: result.goals.length,
    journeyCount: result.journeys.length,
    completedCount: result.journeyResults.filter((j) => j.completionStatus === 'COMPLETED').length,
    failedCount: failed,
    frictionCount,
    skippedWithJustificationCount: result.journeyResults.filter((j) => j.skipJustification).length,
    wholeAppSweepPassed: result.wholeAppSweep.passed,
    permissionVerdict: result.permissionVerdict,
    blockers,
  };
}

export function getVirtualUserPassToken(): string {
  return VIRTUAL_USER_ENGINE_PASS_TOKEN;
}
