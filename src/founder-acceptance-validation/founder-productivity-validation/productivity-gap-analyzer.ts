/**
 * Founder Productivity Validation — productivity gap analyzer.
 */

import type {
  WorkflowAccelerationValidation,
  ManualWorkReductionValidation,
  DecisionReductionValidation,
  ContextSwitchingValidation,
  ExecutionEfficiencyValidation,
  ThroughputValidation,
  WorkflowOverheadValidation,
  ProductivityGap,
  ProductivityGapAnalysis,
} from './founder-productivity-types.js';
import { PRODUCTIVITY_GAP_ANALYSIS_PASS, MAX_PRODUCTIVITY_GAPS } from './founder-productivity-types.js';
import { mergeBoundedGaps } from './productivity-gap-model.js';
import { getCachedProductivityGapAnalysis, setCachedProductivityGapAnalysis } from './founder-productivity-cache.js';

export interface ValidatorGapInputs {
  workflowAcceleration: WorkflowAccelerationValidation;
  manualWorkReduction: ManualWorkReductionValidation;
  decisionReduction: DecisionReductionValidation;
  contextSwitching: ContextSwitchingValidation;
  executionEfficiency: ExecutionEfficiencyValidation;
  throughput: ThroughputValidation;
  workflowOverhead: WorkflowOverheadValidation;
}

let gapAnalysisCount = 0;

export function analyzeProductivityGaps(requestId: string, validators: ValidatorGapInputs): ProductivityGapAnalysis {
  const cacheKey = [
    requestId,
    validators.workflowAcceleration.score,
    validators.throughput.score,
    validators.workflowOverhead.score,
  ].join('|');
  const cached = getCachedProductivityGapAnalysis(cacheKey);
  if (cached) return cached;

  gapAnalysisCount += 1;

  const gaps = mergeBoundedGaps(
    [
      validators.workflowAcceleration.gaps,
      validators.manualWorkReduction.gaps,
      validators.decisionReduction.gaps,
      validators.contextSwitching.gaps,
      validators.executionEfficiency.gaps,
      validators.throughput.gaps,
      validators.workflowOverhead.gaps,
    ],
    MAX_PRODUCTIVITY_GAPS,
  );

  const result: ProductivityGapAnalysis = {
    gaps,
    criticalProductivityGaps: gaps.filter((g) => g.severity === 'CRITICAL'),
    majorProductivityGaps: gaps.filter((g) => g.severity === 'MAJOR'),
    minorProductivityGaps: gaps.filter((g) => g.severity === 'MINOR'),
    passToken: PRODUCTIVITY_GAP_ANALYSIS_PASS,
  };
  setCachedProductivityGapAnalysis(cacheKey, result);
  return result;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetProductivityGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}
