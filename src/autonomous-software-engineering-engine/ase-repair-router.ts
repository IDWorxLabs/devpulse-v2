/**
 * ASE — repair router (Autonomous Debugging coordination).
 */

import type { AutonomousDebuggingPipelineResult } from '../autonomous-debugging-engine/autonomous-debugging-types.js';
import type { AseStageId } from './ase-types.js';

export function routeAseRepair(input: {
  autonomousDebugging: AutonomousDebuggingPipelineResult;
  failedStage: AseStageId;
}): {
  readOnly: true;
  repairAttempted: boolean;
  repairResolved: boolean;
  bounded: boolean;
  returnStage: AseStageId;
  escalationReason: string | null;
} {
  const unresolved = input.autonomousDebugging.unresolvedCount > 0;
  const repaired = input.autonomousDebugging.repairedCount > 0;
  const exhausted = input.autonomousDebugging.repairAttemptCount >= 3 && unresolved;
  const returnStage = input.failedStage;
  const repairAttempted =
    input.autonomousDebugging.repairAttemptCount > 0 ||
    input.autonomousDebugging.repairLoops.some((loop) => loop.attempts.length > 0);

  return {
    readOnly: true,
    repairAttempted,
    repairResolved: repaired && !unresolved,
    bounded: !exhausted,
    returnStage,
    escalationReason: exhausted
      ? input.autonomousDebugging.blockedReason ?? 'Autonomous repair exhausted.'
      : null,
  };
}
