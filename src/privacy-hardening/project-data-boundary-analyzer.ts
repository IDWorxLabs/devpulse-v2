/**
 * Privacy Hardening — project data boundary analyzer.
 */

import type { PrivacyHardeningInput, ProjectDataBoundaryAnalysis } from './privacy-hardening-types.js';
import { resolvePrivacyRiskLevel } from './privacy-hardening-types.js';
import { getCachedDataBoundaryAnalysis, setCachedDataBoundaryAnalysis } from './privacy-hardening-cache.js';

let dataBoundaryAnalysisCount = 0;

export function analyzeProjectDataBoundaries(input: PrivacyHardeningInput): ProjectDataBoundaryAnalysis {
  const cacheKey = [
    input.projectOwnershipBoundaryWeak,
    input.world1World2DataSeparationWeak,
    input.cloudWorkerDataBoundaryWeak,
    input.futureTenantDataBoundaryMissing,
  ].join('|');

  const cached = getCachedDataBoundaryAnalysis(cacheKey);
  if (cached) return cached;

  dataBoundaryAnalysisCount += 1;
  const dataBoundaryWarnings: string[] = [];
  const dataBoundaryGaps: string[] = [];
  let penalty = 0;

  if (input.projectOwnershipBoundaryWeak === true) {
    dataBoundaryWarnings.push('project_ownership_boundary_weak');
    penalty += 10;
  }
  if (input.workspaceBoundaryWeak === true) {
    dataBoundaryWarnings.push('workspace_boundary_weak');
    penalty += 10;
  }
  if (input.generatedProjectBoundaryWeak === true) {
    dataBoundaryWarnings.push('generated_project_boundary_weak');
    penalty += 8;
  }
  if (input.importedProjectBoundaryWeak === true) {
    dataBoundaryWarnings.push('imported_project_boundary_weak');
    penalty += 8;
  }
  if (input.exportedProjectBoundaryWeak === true) {
    dataBoundaryWarnings.push('exported_project_boundary_weak');
    penalty += 10;
  }
  if (input.world1World2DataSeparationWeak === true) {
    dataBoundaryWarnings.push('world1_world2_data_separation_weak');
    penalty += 12;
  }
  if (input.disposableWorkspaceSeparationWeak === true) {
    dataBoundaryWarnings.push('disposable_workspace_separation_weak');
    penalty += 10;
  }
  if (input.cloudWorkerDataBoundaryWeak === true) {
    dataBoundaryWarnings.push('cloud_worker_data_boundary_weak');
    penalty += 10;
  }
  if (input.mobileCommandDataBoundaryWeak === true) {
    dataBoundaryWarnings.push('mobile_command_data_boundary_weak');
    penalty += 8;
  }
  if (input.futureTenantDataBoundaryMissing === true) {
    dataBoundaryGaps.push('future_tenant_data_boundary');
    penalty += 6;
  }
  if (input.futureOrganizationBoundaryMissing === true) {
    dataBoundaryGaps.push('future_organization_team_boundary');
    penalty += 6;
  }

  const dataBoundaryScore = Math.max(0, Math.min(100, Math.round(90 - penalty - dataBoundaryGaps.length * 4)));

  const result: ProjectDataBoundaryAnalysis = {
    dataBoundaryScore,
    dataBoundaryRiskLevel: resolvePrivacyRiskLevel(dataBoundaryScore),
    dataBoundaryWarnings,
    dataBoundaryGaps,
  };

  setCachedDataBoundaryAnalysis(cacheKey, result);
  return result;
}

export function getDataBoundaryAnalysisCount(): number {
  return dataBoundaryAnalysisCount;
}

export function resetProjectDataBoundaryAnalyzerForTests(): void {
  dataBoundaryAnalysisCount = 0;
}
