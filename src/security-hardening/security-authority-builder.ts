/**
 * Security Hardening — security authority builder.
 */

import type {
  AccessControlReadinessAnalysis,
  SecretExposureAnalysis,
  SecurityBoundaryAnalysis,
  SecurityHardeningInput,
  SecurityRiskLevel,
  SecurityState,
  UnifiedSecurityHardeningAuthority,
  UnsafeCapabilityDetection,
  WorkspaceIsolationAnalysis,
} from './security-hardening-types.js';
import { resolveSecurityRiskLevel, resolveSecurityState } from './security-hardening-types.js';
import { getCachedSecurityAuthority, setCachedSecurityAuthority } from './security-hardening-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedSecurityHardeningAuthority(
  requestId: string,
  boundaries: SecurityBoundaryAnalysis,
  exposure: SecretExposureAnalysis,
  unsafe: UnsafeCapabilityDetection,
  accessControl: AccessControlReadinessAnalysis,
  isolation: WorkspaceIsolationAnalysis,
  input: SecurityHardeningInput,
): UnifiedSecurityHardeningAuthority {
  const cacheKey = [
    requestId,
    boundaries.boundaryScore,
    exposure.exposureScore,
    unsafe.unsafeCapabilityScore,
    isolation.isolationScore,
  ].join('|');

  const cached = getCachedSecurityAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const reliabilityFactor = input.reliabilityScore ?? 75;
  const performanceFactor = input.performanceScore ?? 75;
  const trustFactor = input.trustScore ?? 75;

  const securityScore = Math.max(0, Math.min(100, Math.round(
    boundaries.boundaryScore * 0.25
      + exposure.exposureScore * 0.25
      + unsafe.unsafeCapabilityScore * 0.15
      + accessControl.accessControlReadinessScore * 0.15
      + isolation.isolationScore * 0.2,
  )));

  const adjustedScore = Math.max(0, Math.min(100, Math.round(
    securityScore * 0.7
      + reliabilityFactor * 0.1
      + performanceFactor * 0.1
      + trustFactor * 0.1,
  )));

  const riskLevel: SecurityRiskLevel = resolveSecurityRiskLevel(adjustedScore);
  const state: SecurityState = resolveSecurityState(adjustedScore, input.governanceBlocked);
  const confidence = Math.min(100, Math.round(
    (adjustedScore + boundaries.boundaryScore + isolation.isolationScore) / 3,
  ));

  const authority: UnifiedSecurityHardeningAuthority = {
    authorityId: `security-hardening-authority-${authorityCounter}`,
    securityScore: adjustedScore,
    boundaryScore: boundaries.boundaryScore,
    isolationScore: isolation.isolationScore,
    exposureScore: exposure.exposureScore,
    riskLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedSecurityAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetSecurityAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
