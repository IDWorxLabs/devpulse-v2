/**
 * Scale Hardening — cloud usage readiness analyzer.
 */

import type { CloudUsageReadinessAnalysis, ScaleHardeningInput } from './scale-hardening-types.js';
import { resolveScaleRiskLevel } from './scale-hardening-types.js';
import { getCachedCloudUsageAnalysis, setCachedCloudUsageAnalysis } from './scale-hardening-cache.js';

let cloudUsageAnalysisCount = 0;

export function analyzeCloudUsageReadiness(input: ScaleHardeningInput): CloudUsageReadinessAnalysis {
  const cacheKey = [
    input.cloudBuildMinutesRisk,
    input.futurePackageQuotaRisk,
    input.futureBillingIntegrationRisk,
    input.accountWorkspaceQuotaRisk,
  ].join('|');

  const cached = getCachedCloudUsageAnalysis(cacheKey);
  if (cached) return cached;

  cloudUsageAnalysisCount += 1;
  const cloudUsageWarnings: string[] = [];
  const cloudUsageGaps: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.cloudBuildMinutesRisk, 'cloud_build_minutes_risk', 'cloud_build_minutes'],
    [input.aiRequestUsageRisk, 'ai_request_usage_risk', 'ai_request_usage'],
    [input.verificationUsageRisk, 'verification_usage_risk', 'verification_usage'],
    [input.storageUsageRisk, 'storage_usage_risk', 'storage_usage'],
    [input.executionRuntimeUsageRisk, 'execution_runtime_usage_risk', 'execution_runtime_usage'],
    [input.world2UsageRisk, 'world2_usage_risk', 'world2_usage'],
    [input.projectImportExportUsageRisk, 'project_import_export_usage_risk', 'project_import_export_usage'],
    [input.futurePackageQuotaRisk, 'future_package_quota_risk', 'future_package_plan_quotas'],
    [input.futureUsageMeteringRisk, 'future_usage_metering_risk', 'future_usage_metering'],
    [input.futureBillingIntegrationRisk, 'future_billing_integration_risk', 'future_billing_integration'],
    [input.founderUserUsageSeparationRisk, 'founder_user_usage_separation_risk', 'founder_user_usage_separation'],
    [input.accountWorkspaceQuotaRisk, 'account_workspace_quota_risk', 'account_workspace_quota_boundaries'],
  ];

  for (const [flag, warning, gap] of checks) {
    if (flag === true) {
      cloudUsageWarnings.push(warning);
      cloudUsageGaps.push(gap);
      penalty += 7;
    }
  }

  const cloudUsageReadinessScore = Math.max(0, Math.min(100, Math.round(90 - penalty)));

  const result: CloudUsageReadinessAnalysis = {
    cloudUsageReadinessScore,
    cloudUsageRiskLevel: resolveScaleRiskLevel(cloudUsageReadinessScore),
    cloudUsageWarnings,
    cloudUsageGaps,
  };

  setCachedCloudUsageAnalysis(cacheKey, result);
  return result;
}

export function getCloudUsageAnalysisCount(): number {
  return cloudUsageAnalysisCount;
}

export function resetCloudUsageReadinessAnalyzerForTests(): void {
  cloudUsageAnalysisCount = 0;
}
