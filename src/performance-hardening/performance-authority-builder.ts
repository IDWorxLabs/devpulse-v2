/**
 * Performance Hardening — performance authority builder.
 */

import type {
  CacheEfficiencyAnalysis,
  PerformanceBottleneckDetection,
  PerformanceHardeningInput,
  PerformanceRiskLevel,
  PerformanceState,
  StartupPerformanceAnalysis,
  UiResponsivenessAnalysis,
  UnifiedPerformanceHardeningAuthority,
  ValidationPerformanceAnalysis,
} from './performance-hardening-types.js';
import { resolvePerformanceRiskLevel, resolvePerformanceState } from './performance-hardening-types.js';
import { getCachedPerformanceAuthority, setCachedPerformanceAuthority } from './performance-hardening-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedPerformanceHardeningAuthority(
  requestId: string,
  startup: StartupPerformanceAnalysis,
  validation: ValidationPerformanceAnalysis,
  cache: CacheEfficiencyAnalysis,
  responsiveness: UiResponsivenessAnalysis,
  bottlenecks: PerformanceBottleneckDetection,
  input: PerformanceHardeningInput,
): UnifiedPerformanceHardeningAuthority {
  const cacheKey = [requestId, startup.startupScore, validation.validationScore, bottlenecks.bottleneckScore].join('|');
  const cached = getCachedPerformanceAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const reliabilityFactor = input.reliabilityScore ?? 75;
  const performanceScore = Math.max(0, Math.min(100, Math.round(
    startup.startupScore * 0.25
      + validation.validationScore * 0.25
      + cache.cacheEfficiencyScore * 0.2
      + responsiveness.responsivenessScore * 0.2
      + bottlenecks.bottleneckScore * 0.1,
  )));

  const adjustedScore = Math.max(0, Math.min(100, Math.round(
    performanceScore * 0.85 + reliabilityFactor * 0.15,
  )));

  const riskLevel: PerformanceRiskLevel = resolvePerformanceRiskLevel(adjustedScore);
  const state: PerformanceState = resolvePerformanceState(adjustedScore, input.governanceBlocked);
  const confidence = Math.min(100, Math.round(
    (adjustedScore + startup.startupScore + validation.validationScore) / 3,
  ));

  const authority: UnifiedPerformanceHardeningAuthority = {
    authorityId: `performance-hardening-authority-${authorityCounter}`,
    performanceScore: adjustedScore,
    startupScore: startup.startupScore,
    validationScore: validation.validationScore,
    responsivenessScore: responsiveness.responsivenessScore,
    cacheEfficiencyScore: cache.cacheEfficiencyScore,
    riskLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedPerformanceAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetPerformanceAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
