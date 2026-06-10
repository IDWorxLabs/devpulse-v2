/**
 * Scale Hardening — multi-project scale analyzer.
 */

import type { MultiProjectScaleAnalysis, ScaleHardeningInput } from './scale-hardening-types.js';
import { resolveScaleRiskLevel } from './scale-hardening-types.js';
import { getCachedMultiProjectAnalysis, setCachedMultiProjectAnalysis } from './scale-hardening-cache.js';

let multiProjectAnalysisCount = 0;

export function analyzeMultiProjectScale(input: ScaleHardeningInput): MultiProjectScaleAnalysis {
  const cacheKey = [
    input.projectIsolationWeak,
    input.projectRegistryGrowthRisk,
    input.crossProjectVerificationRisk,
    input.futureTenantProjectMappingRisk,
  ].join('|');

  const cached = getCachedMultiProjectAnalysis(cacheKey);
  if (cached) return cached;

  multiProjectAnalysisCount += 1;
  const multiProjectWarnings: string[] = [];
  const multiProjectGaps: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.projectIsolationWeak, 'project_isolation_weak', 'project_isolation'],
    [input.projectRegistryGrowthRisk, 'project_registry_growth_risk', 'project_registry_growth'],
    [input.projectVaultGrowthRisk, 'project_vault_growth_risk', 'project_vault_growth'],
    [input.crossProjectVerificationRisk, 'cross_project_verification_risk', 'cross_project_verification'],
    [input.crossProjectMonitoringRisk, 'cross_project_monitoring_risk', 'cross_project_monitoring'],
    [input.crossProjectTrustScoringRisk, 'cross_project_trust_scoring_risk', 'cross_project_trust_scoring'],
    [input.crossProjectRecoveryRisk, 'cross_project_recovery_risk', 'cross_project_recovery'],
    [input.projectSwitchingRisk, 'project_switching_risk', 'project_switching'],
    [input.projectImportExportRisk, 'project_import_export_risk', 'project_import_export'],
    [input.projectOwnershipRisk, 'project_ownership_risk', 'project_ownership'],
    [input.futureTenantProjectMappingRisk, 'future_tenant_project_mapping_risk', 'future_tenant_project_mapping'],
  ];

  for (const [flag, warning, gap] of checks) {
    if (flag === true) {
      multiProjectWarnings.push(warning);
      multiProjectGaps.push(gap);
      penalty += 7;
    }
  }

  const multiProjectScaleScore = Math.max(0, Math.min(100, Math.round(90 - penalty)));

  const result: MultiProjectScaleAnalysis = {
    multiProjectScaleScore,
    multiProjectRiskLevel: resolveScaleRiskLevel(multiProjectScaleScore),
    multiProjectWarnings,
    multiProjectGaps,
  };

  setCachedMultiProjectAnalysis(cacheKey, result);
  return result;
}

export function getMultiProjectAnalysisCount(): number {
  return multiProjectAnalysisCount;
}

export function resetMultiProjectScaleAnalyzerForTests(): void {
  multiProjectAnalysisCount = 0;
}
