/**
 * Reliability Hardening — reliability boundary checker.
 */

import type { ReliabilityBoundaryCheck, ReliabilityHardeningInput } from './reliability-hardening-types.js';
import { getCachedBoundaryCheck, setCachedBoundaryCheck } from './reliability-hardening-cache.js';

let boundaryCheckCount = 0;

export function checkReliabilityBoundaries(input: ReliabilityHardeningInput): ReliabilityBoundaryCheck {
  const cacheKey = [
    input.unboundedLoopRisk,
    input.historyGrowthRisk,
    input.cacheGrowthRisk,
    input.repeatedBootstrapRisk,
    input.repeatedHttpStartupRisk,
    input.missingTimeoutGuard,
    input.missingResetIsolation,
  ].join('|');

  const cached = getCachedBoundaryCheck(cacheKey);
  if (cached) return cached;

  boundaryCheckCount += 1;
  const boundaryViolations: string[] = [];
  const boundaryWarnings: string[] = [];

  if (input.unboundedLoopRisk === true) boundaryViolations.push('unbounded_loops');
  if (input.historyGrowthRisk === true) boundaryViolations.push('unbounded_history');
  if (input.cacheGrowthRisk === true) boundaryViolations.push('unbounded_caches');
  if (input.repeatedBootstrapRisk === true) boundaryWarnings.push('repeated_bootstrap_risk');
  if (input.repeatedHttpStartupRisk === true) boundaryViolations.push('repeated_http_startup_risk');
  if (input.duplicatedStateRisk === true) boundaryWarnings.push('repeated_registry_aggregation');
  if (input.staleSignalRisk === true) boundaryWarnings.push('repeated_context_aggregation');
  if (input.missingTimeoutGuard === true) boundaryViolations.push('missing_timeout_guards');
  if (input.missingResetIsolation === true) boundaryViolations.push('missing_reset_isolation');

  const boundaryScore = Math.max(0, Math.min(100, Math.round(
    100 - boundaryViolations.length * 15 - boundaryWarnings.length * 5,
  )));

  const result: ReliabilityBoundaryCheck = {
    boundaryScore,
    boundaryViolations,
    boundaryWarnings,
  };

  setCachedBoundaryCheck(cacheKey, result);
  return result;
}

export function getBoundaryCheckCount(): number {
  return boundaryCheckCount;
}

export function resetReliabilityBoundaryCheckerForTests(): void {
  boundaryCheckCount = 0;
}
