/**
 * Reliability Hardening — reliability authority builder.
 */

import type {
  FailureSurfaceAnalysis,
  RecoveryReadinessAnalysis,
  ReliabilityBoundaryCheck,
  ReliabilityConsistencyAnalysis,
  ReliabilityHardeningInput,
  ReliabilityRiskLevel,
  ReliabilityState,
  RuntimeStabilityAnalysis,
  UnifiedReliabilityHardeningAuthority,
} from './reliability-hardening-types.js';
import { resolveReliabilityRiskLevel, resolveReliabilityState } from './reliability-hardening-types.js';
import { getCachedReliabilityAuthority, setCachedReliabilityAuthority } from './reliability-hardening-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedReliabilityHardeningAuthority(
  requestId: string,
  failures: FailureSurfaceAnalysis,
  runtime: RuntimeStabilityAnalysis,
  boundaries: ReliabilityBoundaryCheck,
  recovery: RecoveryReadinessAnalysis,
  consistency: ReliabilityConsistencyAnalysis,
  input: ReliabilityHardeningInput,
): UnifiedReliabilityHardeningAuthority {
  const cacheKey = [requestId, failures.failureSurfaceScore, runtime.runtimeStabilityScore, boundaries.boundaryScore].join('|');
  const cached = getCachedReliabilityAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const reliabilityScore = Math.max(0, Math.min(100, Math.round(
    failures.failureSurfaceScore * 0.2
      + runtime.runtimeStabilityScore * 0.25
      + boundaries.boundaryScore * 0.2
      + recovery.recoveryReadinessScore * 0.2
      + consistency.consistencyScore * 0.15,
  )));

  const stabilityScore = Math.round((runtime.runtimeStabilityScore + boundaries.boundaryScore) / 2);
  const recoveryReadinessScore = recovery.recoveryReadinessScore;
  const riskLevel: ReliabilityRiskLevel = resolveReliabilityRiskLevel(reliabilityScore);
  const state: ReliabilityState = resolveReliabilityState(reliabilityScore, input.governanceBlocked);
  const confidence = Math.min(100, Math.round(
    (reliabilityScore + consistency.consistencyScore + recovery.recoveryReadinessScore) / 3,
  ));

  const authority: UnifiedReliabilityHardeningAuthority = {
    authorityId: `reliability-hardening-authority-${authorityCounter}`,
    reliabilityScore,
    stabilityScore,
    recoveryReadinessScore,
    riskLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedReliabilityAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetReliabilityAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
