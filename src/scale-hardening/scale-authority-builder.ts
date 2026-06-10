/**
 * Scale Hardening — scale authority builder.
 */

import type {
  CapacityReadinessAnalysis,
  CloudUsageReadinessAnalysis,
  ConcurrencyRiskAnalysis,
  MultiProjectScaleAnalysis,
  QueueLoadAnalysis,
  ScaleHardeningInput,
  ScaleRiskLevel,
  ScaleState,
  UnifiedScaleHardeningAuthority,
} from './scale-hardening-types.js';
import { resolveScaleRiskLevel, resolveScaleState } from './scale-hardening-types.js';
import { getCachedScaleAuthority, setCachedScaleAuthority } from './scale-hardening-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedScaleHardeningAuthority(
  requestId: string,
  capacity: CapacityReadinessAnalysis,
  concurrency: ConcurrencyRiskAnalysis,
  cloudUsage: CloudUsageReadinessAnalysis,
  queueLoad: QueueLoadAnalysis,
  multiProject: MultiProjectScaleAnalysis,
  input: ScaleHardeningInput,
): UnifiedScaleHardeningAuthority {
  const cacheKey = [
    requestId,
    capacity.capacityScore,
    concurrency.concurrencyScore,
    cloudUsage.cloudUsageReadinessScore,
    multiProject.multiProjectScaleScore,
  ].join('|');

  const cached = getCachedScaleAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const reliabilityFactor = input.reliabilityScore ?? 75;
  const performanceFactor = input.performanceScore ?? 75;
  const securityFactor = input.securityScore ?? 75;
  const privacyFactor = input.privacyScore ?? 75;
  const recoveryFactor = input.recoveryScore ?? 75;
  const trustFactor = input.trustScore ?? 75;

  const scaleScore = Math.max(0, Math.min(100, Math.round(
    capacity.capacityScore * 0.2
      + concurrency.concurrencyScore * 0.2
      + cloudUsage.cloudUsageReadinessScore * 0.2
      + queueLoad.queueLoadScore * 0.2
      + multiProject.multiProjectScaleScore * 0.2,
  )));

  const adjustedScore = Math.max(0, Math.min(100, Math.round(
    scaleScore * 0.55
      + reliabilityFactor * 0.08
      + performanceFactor * 0.1
      + securityFactor * 0.07
      + privacyFactor * 0.05
      + recoveryFactor * 0.07
      + trustFactor * 0.08,
  )));

  const riskLevel: ScaleRiskLevel = resolveScaleRiskLevel(adjustedScore);
  const state: ScaleState = resolveScaleState(adjustedScore, input.governanceBlocked);
  const confidence = Math.min(100, Math.round(
    (adjustedScore + capacity.capacityScore + concurrency.concurrencyScore) / 3,
  ));

  const authority: UnifiedScaleHardeningAuthority = {
    authorityId: `scale-hardening-authority-${authorityCounter}`,
    scaleScore: adjustedScore,
    capacityScore: capacity.capacityScore,
    concurrencyScore: concurrency.concurrencyScore,
    cloudUsageReadinessScore: cloudUsage.cloudUsageReadinessScore,
    queueLoadScore: queueLoad.queueLoadScore,
    multiProjectScaleScore: multiProject.multiProjectScaleScore,
    riskLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedScaleAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetScaleAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
