/**
 * Rollback impact analyzer — maps apply steps to proposal-only rollback actions.
 */

import type { ControlledApplyStep } from '../world2-controlled-apply-runtime/types.js';
import type { RollbackAction } from './types.js';

export function mapApplyStepToRollbackAction(applyStep: ControlledApplyStep): RollbackAction {
  const text = `${applyStep.title} ${applyStep.targetArea}`.toLowerCase();

  if (text.includes('test')) return 'RESET_TEST_STATE_PROPOSAL';
  if (text.includes('dependency')) return 'RESTORE_DEPENDENCY_STATE_PROPOSAL';
  if (text.includes('directory') || text.includes('folder')) return 'REVERT_DIRECTORY_PROPOSAL';
  if (text.includes('patch') || text.includes('modify')) return 'UNDO_PATCH_PROPOSAL';
  if (text.includes('file') || text.includes('create')) return 'REVERT_FILE_PROPOSAL';
  if (text.includes('report') || text.includes('result')) return 'REPORT_ROLLBACK_RESULT';

  return 'RESTORE_SNAPSHOT_PROPOSAL';
}

export function estimateRollbackImpact(applySteps: ControlledApplyStep[]): {
  affectedAreas: string[];
  stepCount: number;
  highRiskAreas: string[];
} {
  const affectedAreas = [...new Set(applySteps.map((s) => s.targetArea))];
  const highRiskAreas = applySteps
    .filter((s) => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL')
    .map((s) => s.targetArea);

  return {
    affectedAreas,
    stepCount: applySteps.length,
    highRiskAreas: [...new Set(highRiskAreas)],
  };
}
