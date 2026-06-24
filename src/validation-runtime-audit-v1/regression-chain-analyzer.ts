/**
 * Validation Runtime Audit V1 — regression chain / overhead analysis.
 */

import {
  TYPICAL_IMPLEMENTATION_MINUTES,
  TYPICAL_PHASE_REGRESSION_VALIDATORS,
} from './validation-runtime-audit-bounds.js';
import type { RegressionChainAnalysis, ValidatorRuntimeMetric } from './validation-runtime-audit-types.js';

export function buildRegressionChainAnalysis(
  metrics: readonly ValidatorRuntimeMetric[],
): RegressionChainAnalysis {
  const byName = new Map(metrics.map((m) => [m.validatorName, m]));

  let totalSeconds = 0;
  const phaseValidators: string[] = [];

  for (const name of TYPICAL_PHASE_REGRESSION_VALIDATORS) {
    const metric = byName.get(name);
    if (metric) {
      totalSeconds += metric.runtimeSeconds;
      phaseValidators.push(name);
    }
  }

  const typicalRegressionValidationMinutes = Math.round((totalSeconds / 60) * 10) / 10;
  const implementationMinutes = TYPICAL_IMPLEMENTATION_MINUTES;
  const totalPhaseMinutes = implementationMinutes + typicalRegressionValidationMinutes;
  const validationOverheadRatio =
    totalPhaseMinutes === 0
      ? 0
      : Math.round((typicalRegressionValidationMinutes / totalPhaseMinutes) * 1000) / 10;

  return {
    typicalImplementationMinutes: implementationMinutes,
    typicalRegressionValidationMinutes,
    validationOverheadRatio,
    phaseValidators,
    totalPhaseRuntimeSeconds: Math.round(totalSeconds * 10) / 10,
  };
}
