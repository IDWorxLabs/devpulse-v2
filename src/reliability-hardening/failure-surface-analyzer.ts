/**
 * Reliability Hardening — failure surface analyzer.
 */

import type { FailureSurfaceAnalysis, FailureSurfaceType, ReliabilityHardeningInput } from './reliability-hardening-types.js';
import { getCachedFailureSurfaceAnalysis, setCachedFailureSurfaceAnalysis } from './reliability-hardening-cache.js';

let failureSurfaceAnalysisCount = 0;

export function analyzeFailureSurfaces(input: ReliabilityHardeningInput): FailureSurfaceAnalysis {
  const cacheKey = [
    input.requestId,
    input.startupReadiness ?? '',
    input.importFailureRisk,
    input.registryDrift,
    input.validatorDrift,
  ].join('|');

  const cached = getCachedFailureSurfaceAnalysis(cacheKey);
  if (cached) return cached;

  failureSurfaceAnalysisCount += 1;
  const failureSurfaces: FailureSurfaceType[] = [];
  const missingSignals: string[] = [];

  if ((input.startupReadiness ?? 100) < 50) failureSurfaces.push('startup_instability');
  if (input.importFailureRisk === true) failureSurfaces.push('module_import_failures');
  if (input.registryDrift === true) failureSurfaces.push('registry_drift');
  if (input.exportDrift === true) failureSurfaces.push('export_drift');
  if (input.uvlRowDrift === true) failureSurfaces.push('uvl_row_drift');
  if (input.validatorDrift === true) failureSurfaces.push('validator_drift');
  if (input.cacheGrowthRisk === true) failureSurfaces.push('cache_growth_risk');
  if (input.historyGrowthRisk === true) failureSurfaces.push('history_growth_risk');
  if (input.duplicatedStateRisk === true) failureSurfaces.push('duplicated_state_risk');
  if (input.staleSignalRisk === true) failureSurfaces.push('stale_signal_risk');
  if (input.missingResetRisk === true) failureSurfaces.push('missing_reset_risk');

  if (input.startupReadiness === undefined) missingSignals.push('startup_readiness');
  if (input.uvlReadiness === undefined) missingSignals.push('uvl_readiness');
  if (input.trustEngineReadiness === undefined) missingSignals.push('trust_engine_readiness');

  const failureSurfaceScore = Math.max(0, Math.min(100, Math.round(
    100 - failureSurfaces.length * 8 - missingSignals.length * 5,
  )));

  const result: FailureSurfaceAnalysis = {
    failureSurfaces: [...new Set(failureSurfaces)],
    failureSurfaceScore,
    missingSignals,
  };

  setCachedFailureSurfaceAnalysis(cacheKey, result);
  return result;
}

export function getFailureSurfaceAnalysisCount(): number {
  return failureSurfaceAnalysisCount;
}

export function resetFailureSurfaceAnalyzerForTests(): void {
  failureSurfaceAnalysisCount = 0;
}
