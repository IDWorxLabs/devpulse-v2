/**
 * Security Hardening — security boundary analyzer.
 */

import type { SecurityBoundaryAnalysis, SecurityHardeningInput } from './security-hardening-types.js';
import { resolveSecurityRiskLevel } from './security-hardening-types.js';
import { getCachedBoundaryAnalysis, setCachedBoundaryAnalysis } from './security-hardening-cache.js';

let boundaryAnalysisCount = 0;

export function analyzeSecurityBoundaries(input: SecurityHardeningInput): SecurityBoundaryAnalysis {
  const cacheKey = [
    input.founderApprovalBoundaryWeak,
    input.governanceBoundaryWeak,
    input.executionBoundaryWeak,
    input.cloudControlBoundaryWeak,
    input.world2IsolationBoundaryWeak,
  ].join('|');

  const cached = getCachedBoundaryAnalysis(cacheKey);
  if (cached) return cached;

  boundaryAnalysisCount += 1;
  const boundaryWarnings: string[] = [];
  const missingBoundaries: string[] = [];
  let penalty = 0;

  if (input.founderApprovalBoundaryWeak === true) {
    boundaryWarnings.push('founder_approval_boundary_weak');
    penalty += 10;
  }
  if (input.governanceBoundaryWeak === true) {
    boundaryWarnings.push('governance_boundary_weak');
    penalty += 10;
  }
  if (input.executionBoundaryWeak === true) {
    boundaryWarnings.push('execution_boundary_weak');
    penalty += 12;
  }
  if (input.verificationBoundaryWeak === true) {
    boundaryWarnings.push('verification_boundary_weak');
    penalty += 8;
  }
  if (input.deploymentBoundaryWeak === true) {
    boundaryWarnings.push('deployment_boundary_weak');
    penalty += 12;
  }
  if (input.cloudControlBoundaryWeak === true) {
    boundaryWarnings.push('cloud_control_boundary_weak');
    penalty += 12;
  }
  if (input.world2IsolationBoundaryWeak === true) {
    boundaryWarnings.push('world2_isolation_boundary_weak');
    penalty += 10;
  }
  if (input.mobileCommandBoundaryWeak === true) {
    boundaryWarnings.push('mobile_command_boundary_weak');
    penalty += 10;
  }
  if (input.projectWorkspaceBoundaryWeak === true) {
    boundaryWarnings.push('project_workspace_boundary_weak');
    penalty += 8;
  }
  if (input.futureUserAccountBoundaryMissing === true) {
    missingBoundaries.push('future_user_account_boundary');
    penalty += 5;
  }
  if (input.futurePackagePlanBoundaryMissing === true) {
    missingBoundaries.push('future_package_plan_boundary');
    penalty += 5;
  }

  const boundaryScore = Math.max(0, Math.min(100, Math.round(92 - penalty - missingBoundaries.length * 3)));

  const result: SecurityBoundaryAnalysis = {
    boundaryScore,
    boundaryRiskLevel: resolveSecurityRiskLevel(boundaryScore),
    boundaryWarnings,
    missingBoundaries,
  };

  setCachedBoundaryAnalysis(cacheKey, result);
  return result;
}

export function getBoundaryAnalysisCount(): number {
  return boundaryAnalysisCount;
}

export function resetSecurityBoundaryAnalyzerForTests(): void {
  boundaryAnalysisCount = 0;
}
