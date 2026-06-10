/**
 * Founder Workflow Validation — workflow gap analyzer.
 */

import type {
  WorkflowClarityValidation,
  WorkflowContinuityValidation,
  WorkflowDiscoverabilityValidation,
  WorkflowEfficiencyValidation,
  WorkflowFrictionValidation,
  WorkflowGap,
  WorkflowGapAnalysis,
  WorkflowOutcomeValidation,
  WorkflowRecoveryValidation,
} from './founder-workflow-types.js';
import { WORKFLOW_GAP_ANALYSIS_PASS, MAX_WORKFLOW_GAPS } from './founder-workflow-types.js';
import { mergeBoundedGaps } from './workflow-gap-model.js';
import { getCachedWorkflowGapAnalysis, setCachedWorkflowGapAnalysis } from './founder-workflow-cache.js';

export interface ValidatorGapInputs {
  clarity: WorkflowClarityValidation;
  discoverability: WorkflowDiscoverabilityValidation;
  continuity: WorkflowContinuityValidation;
  friction: WorkflowFrictionValidation;
  recovery: WorkflowRecoveryValidation;
  outcome: WorkflowOutcomeValidation;
  efficiency: WorkflowEfficiencyValidation;
}

let gapAnalysisCount = 0;

export function analyzeWorkflowGaps(requestId: string, validators: ValidatorGapInputs): WorkflowGapAnalysis {
  const cacheKey = [
    requestId,
    validators.clarity.score,
    validators.friction.score,
    validators.continuity.score,
  ].join('|');
  const cached = getCachedWorkflowGapAnalysis(cacheKey);
  if (cached) return cached;

  gapAnalysisCount += 1;

  const gaps = mergeBoundedGaps(
    [
      validators.clarity.gaps,
      validators.discoverability.gaps,
      validators.continuity.gaps,
      validators.friction.gaps,
      validators.recovery.gaps,
      validators.outcome.gaps,
      validators.efficiency.gaps,
    ],
    MAX_WORKFLOW_GAPS,
  );

  const result: WorkflowGapAnalysis = {
    gaps,
    criticalWorkflowGaps: gaps.filter((g) => g.severity === 'CRITICAL'),
    majorWorkflowGaps: gaps.filter((g) => g.severity === 'MAJOR'),
    minorWorkflowGaps: gaps.filter((g) => g.severity === 'MINOR'),
    passToken: WORKFLOW_GAP_ANALYSIS_PASS,
  };
  setCachedWorkflowGapAnalysis(cacheKey, result);
  return result;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetWorkflowGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}
