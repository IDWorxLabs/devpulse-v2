/**
 * Recovery Hardening — reset readiness analyzer.
 */

import type { RecoveryHardeningInput, ResetReadinessAnalysis } from './recovery-hardening-types.js';
import { resolveRecoveryRiskLevel } from './recovery-hardening-types.js';
import { getCachedResetAnalysis, setCachedResetAnalysis } from './recovery-hardening-cache.js';

let resetAnalysisCount = 0;

export function analyzeResetReadiness(input: RecoveryHardeningInput): ResetReadinessAnalysis {
  const cacheKey = [
    input.missingModuleResetFunctions,
    input.missingCacheResetFunctions,
    input.missingHardeningLayerResetReadiness,
    input.repeatedRunIsolationWeak,
  ].join('|');

  const cached = getCachedResetAnalysis(cacheKey);
  if (cached) return cached;

  resetAnalysisCount += 1;
  const resetWarnings: string[] = [];
  const resetGaps: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingModuleResetFunctions, 'missing_module_reset_functions', 'module_reset_functions'],
    [input.missingCacheResetFunctions, 'missing_cache_reset_functions', 'cache_reset_functions'],
    [input.missingHistoryResetFunctions, 'missing_history_reset_functions', 'history_reset_functions'],
    [input.missingRegistryResetFunctions, 'missing_registry_reset_functions', 'registry_reset_functions'],
    [input.missingValidatorResetPatterns, 'missing_validator_reset_patterns', 'validator_reset_patterns'],
    [input.missingUvlResetReadiness, 'missing_uvl_reset_readiness', 'uvl_reset_readiness'],
    [input.missingTrustEngineResetReadiness, 'missing_trust_engine_reset_readiness', 'trust_engine_reset_readiness'],
    [input.missingHardeningLayerResetReadiness, 'missing_hardening_layer_reset_readiness', 'hardening_layer_reset_readiness'],
    [input.missingNotificationFeedResetReadiness, 'missing_notification_feed_reset_readiness', 'notification_feed_reset_readiness'],
    [input.repeatedRunIsolationWeak, 'repeated_run_isolation_weak', 'repeated_run_isolation_readiness'],
  ];

  for (const [flag, warning, gap] of checks) {
    if (flag === true) {
      resetWarnings.push(warning);
      resetGaps.push(gap);
      penalty += 8;
    }
  }

  const resetReadinessScore = Math.max(0, Math.min(100, Math.round(90 - penalty)));

  const result: ResetReadinessAnalysis = {
    resetReadinessScore,
    resetRiskLevel: resolveRecoveryRiskLevel(resetReadinessScore),
    resetWarnings,
    resetGaps,
  };

  setCachedResetAnalysis(cacheKey, result);
  return result;
}

export function getResetAnalysisCount(): number {
  return resetAnalysisCount;
}

export function resetResetReadinessAnalyzerForTests(): void {
  resetAnalysisCount = 0;
}
