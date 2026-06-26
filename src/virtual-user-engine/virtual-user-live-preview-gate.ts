/**
 * Virtual User Engine — Live Preview gate.
 */

import type {
  LivePreviewVirtualUserGateResult,
  VirtualUserPipelineResult,
} from './virtual-user-types.js';

export function evaluateLivePreviewVirtualUserGate(
  result: VirtualUserPipelineResult,
): LivePreviewVirtualUserGateResult {
  const failed = result.journeyResults.find(
    (j) => j.completionStatus === 'FAILED' || j.completionStatus === 'BLOCKED',
  );
  const frictionBlocked = result.journeyResults.find((j) =>
    j.frictionEvents.some((f) => f.severity === 'BLOCKING' || f.severity === 'HIGH'),
  );
  const unlocked =
    result.permissionVerdict === 'READY_FOR_PREVIEW' &&
    result.wholeAppSweep.passed &&
    !failed &&
    !frictionBlocked;

  const profile = failed
    ? result.profiles.find((p) => p.userId === failed.userId)
    : frictionBlocked
      ? result.profiles.find((p) => p.userId === frictionBlocked.userId)
      : null;
  const goal = failed
    ? result.goals.find((g) => g.goalId === failed.goalId)
    : frictionBlocked
      ? result.goals.find((g) => g.goalId === frictionBlocked.goalId)
      : null;
  const failedStep = failed?.stepResults.find((s) => !s.passed) ?? failed?.stepResults[0];

  return {
    readOnly: true,
    unlocked,
    blockedReason: unlocked ? null : result.blockedReason ?? 'Virtual user simulation did not pass',
    affectedUser: profile?.role ?? null,
    failedGoal: goal?.description ?? null,
    blockedStep: failedStep?.step ?? null,
    failureCategory: failed?.failure?.category ?? frictionBlocked?.frictionEvents[0]?.category ?? null,
    responsibleFeature: failed?.failure?.affectedFeatureSliceIds[0] ?? null,
    repairPlan: failed?.repairRecommendation?.suggestedRepairScope ?? null,
    gateStatus: unlocked ? 'VIRTUAL_USER_SIMULATION_PASS' : 'VIRTUAL_USER_SIMULATION_BLOCKED',
  };
}
