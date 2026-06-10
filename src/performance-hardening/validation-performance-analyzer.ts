/**
 * Performance Hardening — validation performance analyzer.
 */

import type { PerformanceHardeningInput, ValidationPerformanceAnalysis } from './performance-hardening-types.js';
import { resolvePerformanceRiskLevel } from './performance-hardening-types.js';
import { getCachedValidationAnalysis, setCachedValidationAnalysis } from './performance-hardening-cache.js';

let validationAnalysisCount = 0;

export function analyzeValidationPerformance(input: PerformanceHardeningInput): ValidationPerformanceAnalysis {
  const cacheKey = [
    input.slowValidationGroupRisk,
    input.stressRuntimeGrowthRisk,
    input.unboundedValidatorRisk,
    input.repeatedBootstrapInValidators,
  ].join('|');

  const cached = getCachedValidationAnalysis(cacheKey);
  if (cached) return cached;

  validationAnalysisCount += 1;
  const validationWarnings: string[] = [];
  const slowGroups: string[] = [];
  const missingSignals: string[] = [];
  let penalty = 0;

  if (input.slowValidationGroupRisk === true) {
    validationWarnings.push('slow_validation_group_risk');
    slowGroups.push('M-STRESS-5000');
    penalty += 12;
  }
  if (input.stressRuntimeGrowthRisk === true) {
    validationWarnings.push('stress_test_runtime_growth');
    slowGroups.push('M-STRESS-1000');
    penalty += 10;
  }
  if (input.unboundedValidatorRisk === true) {
    validationWarnings.push('unbounded_validator_risk');
    penalty += 15;
  }
  if (input.repeatedBootstrapInValidators === true) {
    validationWarnings.push('repeated_bootstrap_in_validators');
    penalty += 10;
  }
  if (input.repeatedHttpStartupInValidators === true) {
    validationWarnings.push('repeated_http_startup_in_validators');
    penalty += 15;
  }
  if (input.duplicateFixtureGeneration === true) {
    validationWarnings.push('duplicate_fixture_generation');
    penalty += 8;
  }
  if (input.duplicateRegistryAggregation === true) {
    validationWarnings.push('duplicate_registry_aggregation');
    penalty += 8;
  }
  if (input.unboundedScenarioGeneration === true) {
    validationWarnings.push('unbounded_scenario_generation');
    penalty += 12;
  }
  if (input.missingTimeoutGuard === true) {
    validationWarnings.push('missing_timeout_guards');
    penalty += 10;
  }
  if (input.missingProgressLogging === true) {
    validationWarnings.push('missing_progress_logging');
    penalty += 5;
  }
  if (input.missingSlowGroupReporting === true) {
    validationWarnings.push('missing_slow_group_reporting');
    penalty += 5;
  }

  if (input.missingTimeoutGuard === undefined && input.missingProgressLogging === undefined) {
    missingSignals.push('validator_safeguard_signals');
  }

  const validationScore = Math.max(0, Math.min(100, Math.round(90 - penalty - missingSignals.length * 4)));

  const result: ValidationPerformanceAnalysis = {
    validationScore,
    validationRiskLevel: resolvePerformanceRiskLevel(validationScore),
    slowGroups,
    validationWarnings,
    missingSignals,
  };

  setCachedValidationAnalysis(cacheKey, result);
  return result;
}

export function getValidationAnalysisCount(): number {
  return validationAnalysisCount;
}

export function resetValidationPerformanceAnalyzerForTests(): void {
  validationAnalysisCount = 0;
}
