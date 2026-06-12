/**
 * World 2 Dry-Run Execution Composer — bounded assessment history.
 */

import { MAX_DRY_RUN_COMPOSER_HISTORY } from './world2-dry-run-execution-composer-registry.js';
import type {
  World2DryRunExecutionComposerAssessment,
  World2DryRunExecutionComposerHistorySummary,
  World2DryRunPackageState,
} from './world2-dry-run-execution-composer-types.js';

const history: World2DryRunExecutionComposerAssessment[] = [];

export function resetWorld2DryRunExecutionComposerHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2DryRunExecutionComposerAssessment(
  assessment: World2DryRunExecutionComposerAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_DRY_RUN_COMPOSER_HISTORY) {
    history.shift();
  }
}

export function getWorld2DryRunExecutionComposerHistorySize(): number {
  return history.length;
}

export function getLatestWorld2DryRunExecutionComposerAssessment(): World2DryRunExecutionComposerAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2DryRunExecutionComposerHistory(): readonly World2DryRunExecutionComposerAssessment[] {
  return history;
}

export function buildWorld2DryRunExecutionComposerHistorySummary(
  assessments: readonly World2DryRunExecutionComposerAssessment[] = history,
): World2DryRunExecutionComposerHistorySummary {
  const summary: World2DryRunExecutionComposerHistorySummary = {
    totalAssessments: assessments.length,
    readyPackages: 0,
    readyWithWarningsPackages: 0,
    blockedPackages: 0,
    insufficientEvidencePackages: 0,
    notReadyPackages: 0,
  };

  for (const item of assessments) {
    switch (item.packageState) {
      case 'DRY_RUN_PACKAGE_READY':
        summary.readyPackages += 1;
        break;
      case 'DRY_RUN_PACKAGE_READY_WITH_WARNINGS':
        summary.readyWithWarningsPackages += 1;
        break;
      case 'DRY_RUN_PACKAGE_BLOCKED':
        summary.blockedPackages += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidencePackages += 1;
        break;
      case 'NOT_READY':
        summary.notReadyPackages += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countWorld2DryRunPackageState(
  state: World2DryRunPackageState,
  assessments: readonly World2DryRunExecutionComposerAssessment[] = history,
): number {
  return assessments.filter((item) => item.packageState === state).length;
}
