/**
 * Autonomous Repair Loop — bounded loop history.
 */

import { MAX_REPAIR_LOOP_HISTORY } from './autonomous-repair-loop-registry.js';
import type {
  AutonomousRepairLoopAssessment,
  AutonomousRepairLoopHistorySummary,
  RepairLoopAction,
} from './autonomous-repair-loop-types.js';

const history: AutonomousRepairLoopAssessment[] = [];

export function resetAutonomousRepairLoopHistoryForTests(): void {
  history.length = 0;
}

export function recordAutonomousRepairLoopAssessment(assessment: AutonomousRepairLoopAssessment): void {
  history.push(assessment);
  while (history.length > MAX_REPAIR_LOOP_HISTORY) {
    history.shift();
  }
}

export function getAutonomousRepairLoopHistorySize(): number {
  return history.length;
}

export function getLatestAutonomousRepairLoopAssessment(): AutonomousRepairLoopAssessment | null {
  return history.at(-1) ?? null;
}

export function getAutonomousRepairLoopHistory(): readonly AutonomousRepairLoopAssessment[] {
  return history;
}

export function buildAutonomousRepairLoopHistorySummary(
  assessments: readonly AutonomousRepairLoopAssessment[] = history,
): AutonomousRepairLoopHistorySummary {
  const summary: AutonomousRepairLoopHistorySummary = {
    totalLoops: assessments.length,
    acceptedFixes: 0,
    revertedFixes: 0,
    escalations: 0,
    retries: 0,
    stoppedLoops: 0,
  };

  for (const item of assessments) {
    switch (item.decision.recommendedAction) {
      case 'ACCEPT_FIX':
        summary.acceptedFixes += 1;
        break;
      case 'REVERT_FIX':
        summary.revertedFixes += 1;
        break;
      case 'ESCALATE':
        summary.escalations += 1;
        break;
      case 'RETRY_FIX':
      case 'RETEST':
        summary.retries += 1;
        break;
      case 'STOP':
        summary.stoppedLoops += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countRepairLoopAction(
  action: RepairLoopAction,
  assessments: readonly AutonomousRepairLoopAssessment[] = history,
): number {
  return assessments.filter((item) => item.decision.recommendedAction === action).length;
}
