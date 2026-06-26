/**
 * Autonomous Debugging Engine — main authority and orchestrator.
 */

import { buildAutonomousDebuggingPipelineReport } from './autonomous-debugging-report-builder.js';
import { recordAutonomousDebuggingHistory } from './autonomous-debugging-history.js';
import { intakeFailures, resetFailureIntakeForTests } from './failure-intake.js';
import { normalizeFailures } from './failure-normalizer.js';
import { canAutoPatch, classifyDebuggingFailure } from './failure-classifier.js';
import { analyzeRootCause, resetRootCauseAnalyzerForTests } from './root-cause-analyzer.js';
import {
  resolveResponsibleSubsystem,
  subsystemAllowsAutonomousPatch,
} from './responsible-subsystem-resolver.js';
import { generateRepairPlan, resetRepairPlanGeneratorForTests } from './repair-plan-generator.js';
import { analyzePatchSafety } from './patch-safety-analyzer.js';
import { resetPatchApplicationPlannerForTests } from './patch-application-planner.js';
import { resetRepairLoopControllerForTests, runRepairLoop } from './repair-loop-controller.js';
import { resetHumanReviewEscalatorForTests } from './human-review-escalator.js';
import type {
  AutonomousDebuggingPipelineInput,
  AutonomousDebuggingPipelineResult,
  DebuggingVerdict,
  LaunchAutonomousDebuggingEvidence,
  NormalizedFailure,
} from './autonomous-debugging-types.js';
import { AUTONOMOUS_DEBUGGING_ENGINE_PASS_TOKEN } from './autonomous-debugging-types.js';

let pipelineCounter = 0;
let lastPipelineResult: AutonomousDebuggingPipelineResult | null = null;

export function resetAutonomousDebuggingAuthorityForTests(): void {
  pipelineCounter = 0;
  lastPipelineResult = null;
  resetFailureIntakeForTests();
  resetRootCauseAnalyzerForTests();
  resetRepairPlanGeneratorForTests();
  resetPatchApplicationPlannerForTests();
  resetRepairLoopControllerForTests();
  resetHumanReviewEscalatorForTests();
}

export function getLastAutonomousDebuggingPipelineResult(): AutonomousDebuggingPipelineResult | null {
  return lastPipelineResult;
}

function nextPipelineId(): string {
  pipelineCounter += 1;
  return `debug-pipeline-${pipelineCounter}`;
}

function resolvePermissionVerdict(input: {
  normalizedFailures: readonly NormalizedFailure[];
  repairLoops: AutonomousDebuggingPipelineResult['repairLoops'];
  humanReview: AutonomousDebuggingPipelineResult['humanReview'];
  blockedReason: string | null;
}): { verdict: DebuggingVerdict; blockedReason: string | null } {
  if (input.normalizedFailures.length === 0) {
    return { verdict: 'READY_FOR_PREVIEW', blockedReason: null };
  }

  const allResolved = input.repairLoops.length > 0 && input.repairLoops.every((l) => l.resolved);
  if (allResolved) {
    return { verdict: 'READY_FOR_PREVIEW', blockedReason: null };
  }

  if (input.humanReview) {
    return {
      verdict: 'HUMAN_REVIEW',
      blockedReason: input.blockedReason ?? input.humanReview.blockedReason,
    };
  }

  const anyInProgress = input.repairLoops.some((l) => !l.resolved && !l.escalated);
  if (anyInProgress) {
    return { verdict: 'NEEDS_REPAIR', blockedReason: input.blockedReason ?? 'Repair incomplete' };
  }

  return { verdict: 'BLOCKED', blockedReason: input.blockedReason ?? 'Unresolved failures remain' };
}

export function runAutonomousDebuggingPipeline(
  input: AutonomousDebuggingPipelineInput,
): AutonomousDebuggingPipelineResult {
  const intakeRecords = intakeFailures({
    interactionProof: input.interactionProof,
    virtualDeviceLaboratory: input.virtualDeviceLaboratory,
    virtualUserSimulation: input.virtualUserSimulation,
    behaviorSimulation: input.behaviorSimulation,
    incrementalBuild: input.incrementalBuild,
    simulateDataNotSaved: input.simulateDataNotSaved,
    simulateClippedButton: input.simulateClippedButton,
    simulatePromptDriftRepair: input.simulatePromptDriftRepair,
  });

  const normalizedFailures = normalizeFailures(intakeRecords).map((failure) => ({
    ...failure,
    category: classifyDebuggingFailure(failure),
  }));

  const rootCauses = normalizedFailures.map(analyzeRootCause);
  const repairPlans = normalizedFailures.map((failure, index) =>
    generateRepairPlan({ failure, rootCause: rootCauses[index]! }),
  );

  const repairLoops: AutonomousDebuggingPipelineResult['repairLoops'] = [];
  const repairAttempts: AutonomousDebuggingPipelineResult['repairAttempts'] = [];
  let humanReview: AutonomousDebuggingPipelineResult['humanReview'] = null;
  let blockedReason: string | null = null;

  for (let i = 0; i < normalizedFailures.length; i++) {
    const failure = normalizedFailures[i]!;
    const repairPlan = repairPlans[i]!;

    if (!canAutoPatch(failure)) {
      humanReview = {
        readOnly: true,
        escalationId: `escalation-unknown-${i + 1}`,
        problemSummary: `Unknown failure with insufficient evidence: ${failure.observed}`,
        evidence: [failure.evidence],
        autonomousAttempts: [],
        blockedReason: 'Unknown failure — auto-patch blocked without sufficient evidence',
        recommendedHumanDecision: 'Provide additional evidence or manual fix guidance',
        safeNextOptions: ['Inspect execution trace', 'Re-run upstream gate with logging'],
      };
      blockedReason = humanReview.blockedReason;
      continue;
    }

    const subsystem = resolveResponsibleSubsystem(rootCauses[i]!);
    if (!subsystemAllowsAutonomousPatch(subsystem)) {
      humanReview = {
        readOnly: true,
        escalationId: `escalation-subsystem-${i + 1}`,
        problemSummary: `${subsystem} failure requires governed review`,
        evidence: [failure.evidence],
        autonomousAttempts: [],
        blockedReason: `${subsystem} does not allow autonomous patch`,
        recommendedHumanDecision: 'Review subsystem change with human approval',
        safeNextOptions: ['Approve governed repair', 'Adjust prompt or capability plan'],
      };
      blockedReason = humanReview.blockedReason;
      continue;
    }

    const safety = analyzePatchSafety({
      failure,
      repairPlan,
      simulatePromptDriftRepair: input.simulatePromptDriftRepair,
    });

    if (!safety.safe) {
      humanReview = {
        readOnly: true,
        escalationId: `escalation-safety-${i + 1}`,
        problemSummary: failure.observed,
        evidence: [failure.evidence, safety.blockedReason ?? 'Unsafe patch blocked'],
        autonomousAttempts: [],
        blockedReason: safety.blockedReason ?? 'Patch safety analysis blocked repair',
        recommendedHumanDecision: 'Review prompt faithfulness conflict before approving repair',
        safeNextOptions: [
          'Restore required prompt feature without removal',
          'Explicitly defer non-critical scope with user consent',
        ],
      };
      blockedReason = humanReview.blockedReason;
      continue;
    }

    const loop = runRepairLoop({
      failure,
      repairPlan,
      simulateRepairExhaustion: input.simulateRepairExhaustion,
      simulateRegressionAfterRepair: input.simulateRegressionAfterRepair,
    });
    repairLoops.push(loop);
    repairAttempts.push(...loop.attempts);

    if (loop.humanReview && !loop.resolved) {
      humanReview = loop.humanReview;
      blockedReason = loop.blockedReason;
    }
  }

  const { verdict, blockedReason: verdictBlockedReason } = resolvePermissionVerdict({
    normalizedFailures,
    repairLoops,
    humanReview,
    blockedReason,
  });

  const result: AutonomousDebuggingPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    intakeRecords,
    normalizedFailures,
    rootCauses,
    repairPlans,
    repairLoops,
    repairAttempts,
    permissionVerdict: verdict,
    blockedReason: verdictBlockedReason,
    humanReview,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
  result.reportMarkdown = buildAutonomousDebuggingPipelineReport(result);
  recordAutonomousDebuggingHistory(result);
  lastPipelineResult = result;
  return result;
}

export function isAutonomousDebuggingReadyForPreview(
  result: AutonomousDebuggingPipelineResult,
): boolean {
  return result.permissionVerdict === 'READY_FOR_PREVIEW';
}

export function buildLaunchAutonomousDebuggingEvidence(
  result: AutonomousDebuggingPipelineResult,
): LaunchAutonomousDebuggingEvidence {
  const blockers: string[] = [];
  if (result.blockedReason) blockers.push(result.blockedReason);
  const unresolved = result.repairLoops.filter((l) => !l.resolved).length;
  if (unresolved) blockers.push(`${unresolved} failure(s) unresolved after repair`);

  return {
    readOnly: true,
    failureCount: result.normalizedFailures.length,
    repairedCount: result.repairLoops.filter((l) => l.resolved).length,
    unresolvedCount: unresolved,
    repairAttemptCount: result.repairAttempts.length,
    patchesApplied: result.repairAttempts.filter((a) => a.outcome === 'RESOLVED').length,
    validationsPassedAfterRepair: result.repairAttempts.filter((a) => a.targetedValidationPassed).length,
    regressionsChecked: result.repairAttempts.filter((a) => a.regressionValidationPassed).length,
    promptDriftDetected: Boolean(result.humanReview?.blockedReason?.includes('prompt')),
    capabilityRiskDetected: result.normalizedFailures.some((f) => f.category === 'CAPABILITY_GAP'),
    unsafeRepairDetected: Boolean(result.humanReview && !result.repairLoops.some((l) => l.resolved)),
    humanReviewRequired: result.permissionVerdict === 'HUMAN_REVIEW',
    permissionVerdict: result.permissionVerdict,
    blockers,
  };
}

export function getAutonomousDebuggingPassToken(): string {
  return AUTONOMOUS_DEBUGGING_ENGINE_PASS_TOKEN;
}
