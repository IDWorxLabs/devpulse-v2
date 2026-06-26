/**
 * Continuous Product Improvement Engine — main authority and orchestrator.
 */

import { buildContinuousImprovementPipelineReport } from './continuous-improvement-report-builder.js';
import { recordImprovementHistory } from './improvement-history.js';
import { intakeImprovementSignals, resetImprovementSignalIntakeForTests } from './improvement-signal-intake.js';
import {
  detectImprovementOpportunities,
  resetImprovementOpportunityDetectorForTests,
} from './improvement-opportunity-detector.js';
import { isLaunchBlockingPriority, rankImprovementOpportunities } from './improvement-priority-ranker.js';
import { assessImprovementSafety } from './improvement-safety-assessor.js';
import { generateImprovementPlan, resetImprovementPlanGeneratorForTests } from './improvement-plan-generator.js';
import { resetImprovementApplicationPlannerForTests } from './improvement-application-planner.js';
import { resetImprovementLoopControllerForTests, runImprovementLoop } from './improvement-loop-controller.js';
import { calculateProductQualityScore } from './improvement-quality-scorer.js';
import type {
  ContinuousImprovementPipelineInput,
  ContinuousImprovementPipelineResult,
  ImprovementVerdict,
  LaunchContinuousImprovementEvidence,
  RankedImprovementOpportunity,
} from './continuous-improvement-types.js';
import { CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_PASS_TOKEN } from './continuous-improvement-types.js';

let pipelineCounter = 0;
let lastPipelineResult: ContinuousImprovementPipelineResult | null = null;

export function resetContinuousImprovementAuthorityForTests(): void {
  pipelineCounter = 0;
  lastPipelineResult = null;
  resetImprovementSignalIntakeForTests();
  resetImprovementOpportunityDetectorForTests();
  resetImprovementPlanGeneratorForTests();
  resetImprovementApplicationPlannerForTests();
  resetImprovementLoopControllerForTests();
}

export function getLastContinuousImprovementPipelineResult(): ContinuousImprovementPipelineResult | null {
  return lastPipelineResult;
}

function nextPipelineId(): string {
  pipelineCounter += 1;
  return `improvement-pipeline-${pipelineCounter}`;
}

function resolvePermissionVerdict(input: {
  rankedOpportunities: readonly RankedImprovementOpportunity[];
  improvementLoops: ContinuousImprovementPipelineResult['improvementLoops'];
  deferredOpportunities: ContinuousImprovementPipelineResult['deferredOpportunities'];
  blockedOpportunities: ContinuousImprovementPipelineResult['blockedOpportunities'];
  qualityScore: ContinuousImprovementPipelineResult['qualityScore'];
  simulateMinorCopyImprovement?: boolean;
}): { verdict: ImprovementVerdict; blockedReason: string | null } {
  if (input.qualityScore.launchBlockingIssues.length > 0) {
    const regression = input.qualityScore.launchBlockingIssues.some((i) => /regression/i.test(i));
    if (regression) {
      return {
        verdict: 'BLOCKED',
        blockedReason: input.qualityScore.launchBlockingIssues[0] ?? 'Improvement regression unresolved',
      };
    }

    const criticalBlocked = input.blockedOpportunities.some((b) => {
      const opp = input.rankedOpportunities.find((o) => o.opportunityId === b.opportunityId);
      return opp && isLaunchBlockingPriority(opp.priority);
    });
    if (criticalBlocked) {
      return {
        verdict: 'BLOCKED',
        blockedReason:
          input.blockedOpportunities[0]?.reason ??
          'Critical safe improvement blocked by safety assessment',
      };
    }

    const unresolvedCritical = input.rankedOpportunities.filter(
      (o) =>
        isLaunchBlockingPriority(o.priority) &&
        !input.improvementLoops.some((l) => l.opportunityIds.includes(o.opportunityId) && l.resolved) &&
        !input.deferredOpportunities.some((d) => d.opportunityId === o.opportunityId),
    );
    if (unresolvedCritical.length) {
      return {
        verdict: 'BLOCKED',
        blockedReason: `Critical safe improvements remain unresolved: ${unresolvedCritical[0]?.summary}`,
      };
    }
  }

  const onlyLowDeferred =
    input.rankedOpportunities.length > 0 &&
    input.rankedOpportunities.every(
      (o) => o.priority === 'LOW' || o.priority === 'DEFERRED',
    ) &&
    input.deferredOpportunities.length > 0;

  if (onlyLowDeferred || input.simulateMinorCopyImprovement) {
    const allCriticalResolved = !input.rankedOpportunities.some(
      (o) =>
        isLaunchBlockingPriority(o.priority) &&
        !input.improvementLoops.some((l) => l.opportunityIds.includes(o.opportunityId) && l.resolved),
    );
    if (allCriticalResolved) {
      return { verdict: 'DEFERRED_ACCEPTABLE', blockedReason: null };
    }
  }

  if (input.rankedOpportunities.length === 0) {
    return { verdict: 'READY_FOR_PREVIEW', blockedReason: null };
  }

  const allResolved = input.improvementLoops.every(
    (l) => l.resolved || l.deferred || (!l.blocked && l.attempts.length === 0),
  );
  const anyFailedBlocking = input.improvementLoops.some(
    (l) => l.blocked && !l.resolved && !l.deferred,
  );

  if (anyFailedBlocking) {
    return {
      verdict: 'BLOCKED',
      blockedReason: input.improvementLoops.find((l) => l.blocked)?.blockedReason ?? 'Improvement blocked',
    };
  }

  if (allResolved) {
    return { verdict: 'READY_FOR_PREVIEW', blockedReason: null };
  }

  return { verdict: 'NEEDS_IMPROVEMENT', blockedReason: 'Improvement loop incomplete' };
}

export function runContinuousImprovementPipeline(
  input: ContinuousImprovementPipelineInput,
): ContinuousImprovementPipelineResult {
  const blockingFailures = input.autonomousDebugging.normalizedFailures.filter(
    (f) => f.severity === 'BLOCKING' && !input.autonomousDebugging.repairLoops.some((l) => l.resolved),
  );
  if (blockingFailures.length) {
    const emptyScore = calculateProductQualityScore({
      rankedOpportunities: [],
      pipeline: {
        improvementLoops: [],
        deferredOpportunities: [],
        blockedOpportunities: [],
        improvementAttempts: [],
      },
    });
    const blocked: ContinuousImprovementPipelineResult = {
      readOnly: true,
      pipelineId: nextPipelineId(),
      signals: [],
      opportunities: [],
      rankedOpportunities: [],
      safetyAssessments: [],
      improvementPlans: [],
      improvementLoops: [],
      improvementAttempts: [],
      deferredOpportunities: [],
      blockedOpportunities: [],
      qualityScore: emptyScore,
      permissionVerdict: 'BLOCKED',
      blockedReason: 'Blocking failures must be resolved by Autonomous Debugging before improvement',
      highestPriorityOpportunity: null,
      reportMarkdown: '',
      completedAt: Date.now(),
    };
    blocked.reportMarkdown = buildContinuousImprovementPipelineReport(blocked);
    recordImprovementHistory(blocked);
    lastPipelineResult = blocked;
    return blocked;
  }

  const signals = intakeImprovementSignals({
    behaviorSimulation: input.behaviorSimulation,
    virtualUserSimulation: input.virtualUserSimulation,
    virtualDeviceLaboratory: input.virtualDeviceLaboratory,
    interactionProof: input.interactionProof,
    autonomousDebugging: input.autonomousDebugging,
    simulateHighFrictionEmergency: input.simulateHighFrictionEmergency,
    simulateLowEndPerformanceWarning: input.simulateLowEndPerformanceWarning,
    simulateAccessibilityLabelWarning: input.simulateAccessibilityLabelWarning,
    simulateMinorCopyImprovement: input.simulateMinorCopyImprovement,
    simulateUnsafeImprovement: input.simulateUnsafeImprovement,
  });

  const opportunities = detectImprovementOpportunities(signals);
  const rankedOpportunities = rankImprovementOpportunities(opportunities);

  const safetyAssessments = rankedOpportunities.map((opp) =>
    assessImprovementSafety({
      opportunity: opp,
      simulateUnsafeImprovement:
        input.simulateUnsafeImprovement &&
        opp.category === 'USABILITY_IMPROVEMENT' &&
        /remove required prompt workflow/i.test(
          'Improvement suggestion would remove a required prompt workflow to simplify UX',
        ),
    }),
  );

  const toProcess = rankedOpportunities.filter((opp, i) => {
    const safety = safetyAssessments[i]!;
    if (!safety.safe && isLaunchBlockingPriority(opp.priority)) return true;
    if (!safety.safe) return false;
    if (opp.priority === 'DEFERRED' || opp.priority === 'LOW') return true;
    return true;
  });

  const improvementPlans = toProcess
    .filter((opp, i) => safetyAssessments[rankedOpportunities.indexOf(opp)]?.safe)
    .map((opp) => generateImprovementPlan({ opportunity: opp }));

  const loopBatch = runImprovementLoop({
    opportunities: rankedOpportunities,
    simulateRegressionAfterImprovement: input.simulateRegressionAfterImprovement,
    simulateImprovementExhaustion: input.simulateImprovementExhaustion,
    simulateUnsafeImprovement: input.simulateUnsafeImprovement,
  });

  const deferredOpportunities: ContinuousImprovementPipelineResult['deferredOpportunities'] = [];
  const blockedOpportunities: ContinuousImprovementPipelineResult['blockedOpportunities'] = [];

  for (const loop of loopBatch.loops) {
    if (loop.deferred && loop.deferredReason) {
      deferredOpportunities.push({
        opportunityId: loop.opportunityIds[0]!,
        reason: loop.deferredReason,
      });
    }
    if (loop.blocked && loop.blockedReason) {
      blockedOpportunities.push({
        opportunityId: loop.opportunityIds[0]!,
        reason: loop.blockedReason,
      });
    }
  }

  for (const opp of rankedOpportunities) {
    if ((opp.priority === 'LOW' || opp.priority === 'DEFERRED') && input.simulateMinorCopyImprovement) {
      if (!deferredOpportunities.some((d) => d.opportunityId === opp.opportunityId)) {
        deferredOpportunities.push({
          opportunityId: opp.opportunityId,
          reason: 'Low-priority copy improvement deferred with evidence',
        });
      }
    }
  }

  if (input.simulateUnsafeImprovement) {
    const unsafeOpp = rankedOpportunities.find(
      (o) => o.category === 'USABILITY_IMPROVEMENT' && isLaunchBlockingPriority(o.priority),
    );
    if (unsafeOpp && !blockedOpportunities.some((b) => b.opportunityId === unsafeOpp.opportunityId)) {
      blockedOpportunities.push({
        opportunityId: unsafeOpp.opportunityId,
        reason: 'Improvement would remove required prompt workflow — prompt faithfulness risk',
      });
    }
  }

  const partial: ContinuousImprovementPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    signals,
    opportunities,
    rankedOpportunities,
    safetyAssessments,
    improvementPlans,
    improvementLoops: loopBatch.loops,
    improvementAttempts: loopBatch.attempts,
    deferredOpportunities,
    blockedOpportunities,
    qualityScore: calculateProductQualityScore({
      rankedOpportunities,
      pipeline: {
        improvementLoops: loopBatch.loops,
        deferredOpportunities,
        blockedOpportunities,
        improvementAttempts: loopBatch.attempts,
      },
    }),
    permissionVerdict: 'IN_PROGRESS',
    blockedReason: null,
    highestPriorityOpportunity: rankedOpportunities[0] ?? null,
    reportMarkdown: '',
    completedAt: Date.now(),
  };

  const { verdict, blockedReason } = resolvePermissionVerdict({
    rankedOpportunities,
    improvementLoops: loopBatch.loops,
    deferredOpportunities,
    blockedOpportunities,
    qualityScore: partial.qualityScore,
    simulateMinorCopyImprovement: input.simulateMinorCopyImprovement,
  });

  const result: ContinuousImprovementPipelineResult = {
    ...partial,
    permissionVerdict: verdict,
    blockedReason,
  };
  result.qualityScore = calculateProductQualityScore({
    rankedOpportunities,
    pipeline: result,
  });
  result.reportMarkdown = buildContinuousImprovementPipelineReport(result);
  recordImprovementHistory(result);
  lastPipelineResult = result;
  return result;
}

export function isContinuousImprovementReadyForPreview(
  result: ContinuousImprovementPipelineResult,
): boolean {
  return (
    result.permissionVerdict === 'READY_FOR_PREVIEW' ||
    result.permissionVerdict === 'DEFERRED_ACCEPTABLE'
  );
}

export function buildLaunchContinuousImprovementEvidence(
  result: ContinuousImprovementPipelineResult,
): LaunchContinuousImprovementEvidence {
  const blockers: string[] = [];
  if (result.blockedReason) blockers.push(result.blockedReason);
  blockers.push(...result.qualityScore.launchBlockingIssues);

  const unresolvedCriticalOrHigh = result.rankedOpportunities.filter(
    (o) =>
      isLaunchBlockingPriority(o.priority) &&
      !result.improvementLoops.some((l) => l.opportunityIds.includes(o.opportunityId) && l.resolved) &&
      !result.deferredOpportunities.some((d) => d.opportunityId === o.opportunityId) &&
      result.blockedOpportunities.some((b) => b.opportunityId === o.opportunityId),
  ).length;

  return {
    readOnly: true,
    signalCount: result.signals.length,
    opportunityCount: result.opportunities.length,
    appliedCount: result.improvementAttempts.filter((a) => a.outcome === 'APPLIED').length,
    deferredCount: result.deferredOpportunities.length,
    blockedCount: result.blockedOpportunities.length,
    unresolvedCriticalOrHigh,
    regressionIntroduced: result.improvementAttempts.some((a) => a.outcome === 'ROLLED_BACK'),
    promptFaithfulnessIntact: !result.blockedOpportunities.some((b) => /prompt faithfulness/i.test(b.reason)),
    qualityScore: result.qualityScore.overallScore,
    residualRisks: result.qualityScore.residualRisk,
    permissionVerdict: result.permissionVerdict,
    blockers,
  };
}

export function getContinuousImprovementPassToken(): string {
  return CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_PASS_TOKEN;
}
