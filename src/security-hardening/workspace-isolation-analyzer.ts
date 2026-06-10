/**
 * Security Hardening — workspace isolation analyzer.
 */

import type { SecurityHardeningInput, WorkspaceIsolationAnalysis } from './security-hardening-types.js';
import { resolveSecurityRiskLevel } from './security-hardening-types.js';
import { getCachedIsolationAnalysis, setCachedIsolationAnalysis } from './security-hardening-cache.js';

let isolationAnalysisCount = 0;

export function analyzeWorkspaceIsolation(input: SecurityHardeningInput): WorkspaceIsolationAnalysis {
  const cacheKey = [
    input.stableDisposableWorkspaceMixRisk,
    input.world1World2SeparationWeak,
    input.cloudWorkerBoundaryWeak,
    input.futureUserTenantBoundaryMissing,
  ].join('|');

  const cached = getCachedIsolationAnalysis(cacheKey);
  if (cached) return cached;

  isolationAnalysisCount += 1;
  const isolationWarnings: string[] = [];
  const isolationGaps: string[] = [];
  let penalty = 0;

  if (input.stableDisposableWorkspaceMixRisk === true) {
    isolationWarnings.push('stable_disposable_workspace_mix_risk');
    penalty += 10;
  }
  if (input.world1World2SeparationWeak === true) {
    isolationWarnings.push('world1_world2_separation_weak');
    penalty += 12;
  }
  if (input.founderAutonomousModeMixRisk === true) {
    isolationWarnings.push('founder_autonomous_mode_mix_risk');
    penalty += 10;
  }
  if (input.projectOwnershipBoundaryWeak === true) {
    isolationWarnings.push('project_ownership_boundary_weak');
    penalty += 8;
  }
  if (input.cloudWorkerBoundaryWeak === true) {
    isolationWarnings.push('cloud_worker_boundary_weak');
    penalty += 10;
  }
  if (input.generatedProjectBoundaryWeak === true) {
    isolationWarnings.push('generated_project_boundary_weak');
    penalty += 8;
  }
  if (input.rollbackBoundaryWeak === true) {
    isolationWarnings.push('rollback_boundary_weak');
    penalty += 8;
  }
  if (input.filesystemMutationBoundaryWeak === true) {
    isolationWarnings.push('filesystem_mutation_boundary_weak');
    penalty += 12;
  }
  if (input.futureUserTenantBoundaryMissing === true) {
    isolationGaps.push('future_user_tenant_boundary');
    penalty += 6;
  }

  const isolationScore = Math.max(0, Math.min(100, Math.round(90 - penalty - isolationGaps.length * 4)));

  const result: WorkspaceIsolationAnalysis = {
    isolationScore,
    isolationRiskLevel: resolveSecurityRiskLevel(isolationScore),
    isolationWarnings,
    isolationGaps,
  };

  setCachedIsolationAnalysis(cacheKey, result);
  return result;
}

export function getIsolationAnalysisCount(): number {
  return isolationAnalysisCount;
}

export function resetWorkspaceIsolationAnalyzerForTests(): void {
  isolationAnalysisCount = 0;
}
