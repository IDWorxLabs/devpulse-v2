/**
 * Recovery Hardening — failure containment analyzer.
 */

import type { FailureContainmentAnalysis, RecoveryHardeningInput } from './recovery-hardening-types.js';
import { resolveRecoveryRiskLevel } from './recovery-hardening-types.js';
import { getCachedContainmentAnalysis, setCachedContainmentAnalysis } from './recovery-hardening-cache.js';

let containmentAnalysisCount = 0;

export function analyzeFailureContainment(input: RecoveryHardeningInput): FailureContainmentAnalysis {
  const cacheKey = [
    input.world1World2SeparationWeak,
    input.cloudWorkerBoundaryWeak,
    input.validationFailureContainmentWeak,
    input.autonomousExecutionBoundaryWeak,
  ].join('|');

  const cached = getCachedContainmentAnalysis(cacheKey);
  if (cached) return cached;

  containmentAnalysisCount += 1;
  const containmentWarnings: string[] = [];
  const containmentGaps: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.world1World2SeparationWeak, 'world1_world2_separation_weak', 'world1_world2_separation'],
    [input.disposableWorkspaceIsolationWeak, 'disposable_workspace_isolation_weak', 'disposable_workspace_isolation'],
    [input.cloudWorkerBoundaryWeak, 'cloud_worker_boundary_weak', 'cloud_worker_boundary'],
    [input.projectWorkspaceBoundaryWeak, 'project_workspace_boundary_weak', 'project_workspace_boundary'],
    [input.generatedArtifactBoundaryWeak, 'generated_artifact_boundary_weak', 'generated_artifact_boundary'],
    [input.validationFailureContainmentWeak, 'validation_failure_containment_weak', 'validation_failure_containment'],
    [input.notificationFailureContainmentWeak, 'notification_failure_containment_weak', 'notification_failure_containment'],
    [input.operatorFeedFailureContainmentWeak, 'operator_feed_failure_containment_weak', 'operator_feed_failure_containment'],
    [input.selfEvolutionFailureContainmentWeak, 'self_evolution_failure_containment_weak', 'self_evolution_failure_containment'],
    [input.autonomousExecutionBoundaryWeak, 'autonomous_execution_boundary_weak', 'autonomous_execution_boundary'],
  ];

  for (const [flag, warning, gap] of checks) {
    if (flag === true) {
      containmentWarnings.push(warning);
      containmentGaps.push(gap);
      penalty += 8;
    }
  }

  const containmentScore = Math.max(0, Math.min(100, Math.round(90 - penalty)));

  const result: FailureContainmentAnalysis = {
    containmentScore,
    containmentRiskLevel: resolveRecoveryRiskLevel(containmentScore),
    containmentWarnings,
    containmentGaps,
  };

  setCachedContainmentAnalysis(cacheKey, result);
  return result;
}

export function getContainmentAnalysisCount(): number {
  return containmentAnalysisCount;
}

export function resetFailureContainmentAnalyzerForTests(): void {
  containmentAnalysisCount = 0;
}
