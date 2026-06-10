/**
 * Security Hardening — access control readiness analyzer.
 * Readiness only — no sign-in or billing implementation.
 */

import type { AccessControlReadinessAnalysis, SecurityHardeningInput } from './security-hardening-types.js';
import { getCachedAccessControlAnalysis, setCachedAccessControlAnalysis } from './security-hardening-cache.js';

let accessControlAnalysisCount = 0;

export function analyzeAccessControlReadiness(input: SecurityHardeningInput): AccessControlReadinessAnalysis {
  const cacheKey = [
    input.missingUserIdentityBoundary,
    input.missingPermissionModel,
    input.missingPackageEntitlementModel,
    input.missingAuditTrailBoundary,
  ].join('|');

  const cached = getCachedAccessControlAnalysis(cacheKey);
  if (cached) return cached;

  accessControlAnalysisCount += 1;
  const accessControlGaps: string[] = [];
  const recommendedFutureControls: string[] = [];
  let penalty = 0;

  if (input.missingUserIdentityBoundary === true) {
    accessControlGaps.push('user_identity_boundary');
    recommendedFutureControls.push('Implement user identity boundary before multi-tenant rollout');
    penalty += 8;
  }
  if (input.missingFounderIdentityBoundary === true) {
    accessControlGaps.push('founder_identity_boundary');
    recommendedFutureControls.push('Separate founder identity from future user accounts');
    penalty += 6;
  }
  if (input.missingRoleBoundary === true) {
    accessControlGaps.push('role_boundary');
    recommendedFutureControls.push('Define role-based access control model');
    penalty += 8;
  }
  if (input.missingPermissionModel === true) {
    accessControlGaps.push('permission_model');
    recommendedFutureControls.push('Add permission model for capability gating');
    penalty += 10;
  }
  if (input.missingPackageEntitlementModel === true) {
    accessControlGaps.push('package_plan_entitlement_model');
    recommendedFutureControls.push('Prepare package/plan entitlement boundary for commercial rollout');
    penalty += 8;
  }
  if (input.missingCloudUsageQuota === true) {
    accessControlGaps.push('cloud_usage_quota_boundary');
    recommendedFutureControls.push('Add cloud usage quota controls');
    penalty += 8;
  }
  if (input.missingOrganizationBoundary === true) {
    accessControlGaps.push('organization_team_boundary');
    recommendedFutureControls.push('Define organization/team isolation boundary');
    penalty += 6;
  }
  if (input.missingProjectOwnershipBoundary === true) {
    accessControlGaps.push('project_ownership_boundary');
    recommendedFutureControls.push('Enforce project ownership boundary');
    penalty += 8;
  }
  if (input.missingWorkspaceIsolationBoundary === true) {
    accessControlGaps.push('workspace_isolation_boundary');
    recommendedFutureControls.push('Strengthen workspace isolation boundary');
    penalty += 8;
  }
  if (input.missingAuditTrailBoundary === true) {
    accessControlGaps.push('audit_trail_boundary');
    recommendedFutureControls.push('Add audit trail for security-sensitive actions');
    penalty += 10;
  }

  const accessControlReadinessScore = Math.max(0, Math.min(100, Math.round(90 - penalty)));

  const result: AccessControlReadinessAnalysis = {
    accessControlReadinessScore,
    accessControlGaps,
    recommendedFutureControls,
  };

  setCachedAccessControlAnalysis(cacheKey, result);
  return result;
}

export function getAccessControlAnalysisCount(): number {
  return accessControlAnalysisCount;
}

export function resetAccessControlReadinessAnalyzerForTests(): void {
  accessControlAnalysisCount = 0;
}
