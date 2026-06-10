/**
 * Scale Hardening — concurrency risk analyzer.
 */

import type { ConcurrencyRiskAnalysis, ScaleHardeningInput } from './scale-hardening-types.js';
import { resolveScaleRiskLevel } from './scale-hardening-types.js';
import { getCachedConcurrencyAnalysis, setCachedConcurrencyAnalysis } from './scale-hardening-cache.js';

let concurrencyAnalysisCount = 0;

export function analyzeConcurrencyRisk(input: ScaleHardeningInput): ConcurrencyRiskAnalysis {
  const cacheKey = [
    input.multipleProjectsActiveRisk,
    input.multipleValidationRunsRisk,
    input.futureMultiUserSessionsRisk,
    input.simultaneousAutonomousBuildersRisk,
  ].join('|');

  const cached = getCachedConcurrencyAnalysis(cacheKey);
  if (cached) return cached;

  concurrencyAnalysisCount += 1;
  const concurrencyWarnings: string[] = [];
  const concurrencyGaps: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.multipleProjectsActiveRisk, 'multiple_projects_active_risk', 'multiple_projects_active'],
    [input.multipleValidationRunsRisk, 'multiple_validation_runs_risk', 'multiple_validation_runs'],
    [input.multipleCloudTasksRisk, 'multiple_cloud_tasks_risk', 'multiple_cloud_tasks'],
    [input.multipleMobileCommandsRisk, 'multiple_mobile_commands_risk', 'multiple_mobile_commands'],
    [input.simultaneousOperatorFeedUpdatesRisk, 'simultaneous_operator_feed_updates_risk', 'simultaneous_operator_feed_updates'],
    [input.simultaneousNotificationWritesRisk, 'simultaneous_notification_writes_risk', 'simultaneous_notification_writes'],
    [input.simultaneousWorld2WorkspacesRisk, 'simultaneous_world2_workspaces_risk', 'simultaneous_world2_workspaces'],
    [input.simultaneousProjectImportExportRisk, 'simultaneous_project_import_export_risk', 'simultaneous_project_import_export'],
    [input.simultaneousAutonomousBuildersRisk, 'simultaneous_autonomous_builders_risk', 'simultaneous_autonomous_builders'],
    [input.futureMultiUserSessionsRisk, 'future_multi_user_sessions_risk', 'future_multi_user_sessions'],
    [input.futureOrganizationUsageRisk, 'future_organization_usage_risk', 'future_organization_team_usage'],
  ];

  for (const [flag, warning, gap] of checks) {
    if (flag === true) {
      concurrencyWarnings.push(warning);
      concurrencyGaps.push(gap);
      penalty += 7;
    }
  }

  const concurrencyScore = Math.max(0, Math.min(100, Math.round(90 - penalty)));

  const result: ConcurrencyRiskAnalysis = {
    concurrencyScore,
    concurrencyRiskLevel: resolveScaleRiskLevel(concurrencyScore),
    concurrencyWarnings,
    concurrencyGaps,
  };

  setCachedConcurrencyAnalysis(cacheKey, result);
  return result;
}

export function getConcurrencyAnalysisCount(): number {
  return concurrencyAnalysisCount;
}

export function resetConcurrencyRiskAnalyzerForTests(): void {
  concurrencyAnalysisCount = 0;
}
