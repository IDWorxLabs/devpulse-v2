/**
 * Scale Hardening — capacity readiness analyzer.
 */

import type { CapacityReadinessAnalysis, ScaleHardeningInput } from './scale-hardening-types.js';
import { resolveScaleRiskLevel } from './scale-hardening-types.js';
import { getCachedCapacityAnalysis, setCachedCapacityAnalysis } from './scale-hardening-cache.js';

let capacityAnalysisCount = 0;

export function analyzeCapacityReadiness(input: ScaleHardeningInput): CapacityReadinessAnalysis {
  const cacheKey = [
    input.largePromptRisk,
    input.manyUvlRowsRisk,
    input.manyCloudWorkerTasksRisk,
    input.manyFutureUsersRisk,
  ].join('|');

  const cached = getCachedCapacityAnalysis(cacheKey);
  if (cached) return cached;

  capacityAnalysisCount += 1;
  const capacityWarnings: string[] = [];
  const capacityGaps: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.largePromptRisk, 'large_prompt_risk', 'large_prompts'],
    [input.largeProjectContextRisk, 'large_project_context_risk', 'large_project_contexts'],
    [input.multiFileProjectRisk, 'multi_file_project_risk', 'multi_file_projects'],
    [input.largeValidationReportRisk, 'large_validation_report_risk', 'large_validation_reports'],
    [input.manyUvlRowsRisk, 'many_uvl_rows_risk', 'many_uvl_rows'],
    [input.manyOperatorFeedEntriesRisk, 'many_operator_feed_entries_risk', 'many_operator_feed_entries'],
    [input.manyNotificationsRisk, 'many_notifications_risk', 'many_notifications'],
    [input.manyProjectVaultRecordsRisk, 'many_project_vault_records_risk', 'many_project_vault_records'],
    [input.manyWorld2WorkspacesRisk, 'many_world2_workspaces_risk', 'many_world2_workspaces'],
    [input.manyCloudWorkerTasksRisk, 'many_cloud_worker_tasks_risk', 'many_cloud_worker_tasks'],
    [input.manyMobileCommandRequestsRisk, 'many_mobile_command_requests_risk', 'many_mobile_command_requests'],
    [input.manyFutureUsersRisk, 'many_future_users_risk', 'many_future_users_accounts'],
  ];

  for (const [flag, warning, gap] of checks) {
    if (flag === true) {
      capacityWarnings.push(warning);
      capacityGaps.push(gap);
      penalty += 7;
    }
  }

  const capacityScore = Math.max(0, Math.min(100, Math.round(92 - penalty)));

  const result: CapacityReadinessAnalysis = {
    capacityScore,
    capacityRiskLevel: resolveScaleRiskLevel(capacityScore),
    capacityWarnings,
    capacityGaps,
  };

  setCachedCapacityAnalysis(cacheKey, result);
  return result;
}

export function getCapacityAnalysisCount(): number {
  return capacityAnalysisCount;
}

export function resetCapacityReadinessAnalyzerForTests(): void {
  capacityAnalysisCount = 0;
}
