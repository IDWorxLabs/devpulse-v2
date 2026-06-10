/**
 * Reliability Hardening — recovery readiness analyzer.
 */

import type { RecoveryReadinessAnalysis, ReliabilityHardeningInput } from './reliability-hardening-types.js';
import { resolveReliabilityState } from './reliability-hardening-types.js';
import { getCachedRecoveryReadinessAnalysis, setCachedRecoveryReadinessAnalysis } from './reliability-hardening-cache.js';

let recoveryReadinessAnalysisCount = 0;

export interface RecoveryReadinessSignals {
  resetFunctionsPresent: boolean;
  boundedHistoriesPresent: boolean;
  boundedCachesPresent: boolean;
  failureReportsPresent: boolean;
  passTokensPresent: boolean;
  validationCommandsPresent: boolean;
  checkpointTagsPresent: boolean;
  statusReportingPresent: boolean;
}

export function analyzeRecoveryReadiness(
  input: ReliabilityHardeningInput,
  signals: RecoveryReadinessSignals,
): RecoveryReadinessAnalysis {
  const cacheKey = [
    signals.resetFunctionsPresent,
    signals.boundedHistoriesPresent,
    signals.validationCommandsPresent,
    input.missingResetRisk,
  ].join('|');

  const cached = getCachedRecoveryReadinessAnalysis(cacheKey);
  if (cached) return cached;

  recoveryReadinessAnalysisCount += 1;
  const recoveryGaps: string[] = [];

  if (!signals.resetFunctionsPresent || input.missingResetRisk === true) recoveryGaps.push('missing_reset_functions');
  if (!signals.boundedHistoriesPresent) recoveryGaps.push('missing_bounded_histories');
  if (!signals.boundedCachesPresent) recoveryGaps.push('missing_bounded_caches');
  if (!signals.failureReportsPresent) recoveryGaps.push('missing_failure_reports');
  if (!signals.passTokensPresent) recoveryGaps.push('missing_pass_tokens');
  if (!signals.validationCommandsPresent) recoveryGaps.push('missing_validation_commands');
  if (!signals.checkpointTagsPresent) recoveryGaps.push('missing_checkpoint_tags');
  if (!signals.statusReportingPresent) recoveryGaps.push('missing_status_reporting');

  const recoveryReadinessScore = Math.max(0, Math.min(100, Math.round(
    100 - recoveryGaps.length * 10,
  )));

  const result: RecoveryReadinessAnalysis = {
    recoveryReadinessScore,
    recoveryReadinessState: resolveReliabilityState(recoveryReadinessScore),
    recoveryGaps,
  };

  setCachedRecoveryReadinessAnalysis(cacheKey, result);
  return result;
}

export function getRecoveryReadinessAnalysisCount(): number {
  return recoveryReadinessAnalysisCount;
}

export function resetRecoveryReadinessAnalyzerForTests(): void {
  recoveryReadinessAnalysisCount = 0;
}
