/**
 * Privacy Hardening — privacy authority builder.
 */

import type {
  ComplianceReadinessAnalysis,
  DisclosureRiskAnalysis,
  PersonalDataSurfaceAnalysis,
  PrivacyHardeningInput,
  PrivacyRiskLevel,
  PrivacyState,
  ProjectDataBoundaryAnalysis,
  RedactionReadinessAnalysis,
  RetentionRiskAnalysis,
  UnifiedPrivacyHardeningAuthority,
} from './privacy-hardening-types.js';
import { resolvePrivacyRiskLevel, resolvePrivacyState } from './privacy-hardening-types.js';
import { getCachedPrivacyAuthority, setCachedPrivacyAuthority } from './privacy-hardening-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedPrivacyHardeningAuthority(
  requestId: string,
  surfaces: PersonalDataSurfaceAnalysis,
  boundaries: ProjectDataBoundaryAnalysis,
  retention: RetentionRiskAnalysis,
  disclosure: DisclosureRiskAnalysis,
  redaction: RedactionReadinessAnalysis,
  compliance: ComplianceReadinessAnalysis,
  input: PrivacyHardeningInput,
): UnifiedPrivacyHardeningAuthority {
  const cacheKey = [
    requestId,
    surfaces.personalDataSurfaceScore,
    boundaries.dataBoundaryScore,
    disclosure.disclosureRiskScore,
    compliance.complianceReadinessScore,
  ].join('|');

  const cached = getCachedPrivacyAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const reliabilityFactor = input.reliabilityScore ?? 75;
  const performanceFactor = input.performanceScore ?? 75;
  const securityFactor = input.securityScore ?? 75;
  const trustFactor = input.trustScore ?? 75;

  const privacyScore = Math.max(0, Math.min(100, Math.round(
    surfaces.personalDataSurfaceScore * 0.2
      + boundaries.dataBoundaryScore * 0.2
      + retention.retentionScore * 0.15
      + disclosure.disclosureRiskScore * 0.2
      + redaction.redactionReadinessScore * 0.15
      + compliance.complianceReadinessScore * 0.1,
  )));

  const adjustedScore = Math.max(0, Math.min(100, Math.round(
    privacyScore * 0.65
      + reliabilityFactor * 0.1
      + performanceFactor * 0.05
      + securityFactor * 0.1
      + trustFactor * 0.1,
  )));

  const riskLevel: PrivacyRiskLevel = resolvePrivacyRiskLevel(adjustedScore);
  const state: PrivacyState = resolvePrivacyState(adjustedScore, input.governanceBlocked);
  const confidence = Math.min(100, Math.round(
    (adjustedScore + boundaries.dataBoundaryScore + disclosure.disclosureRiskScore) / 3,
  ));

  const authority: UnifiedPrivacyHardeningAuthority = {
    authorityId: `privacy-hardening-authority-${authorityCounter}`,
    privacyScore: adjustedScore,
    dataBoundaryScore: boundaries.dataBoundaryScore,
    retentionScore: retention.retentionScore,
    disclosureRiskScore: disclosure.disclosureRiskScore,
    riskLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedPrivacyAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetPrivacyAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
