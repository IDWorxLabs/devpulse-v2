/**
 * Recovery Hardening — disaster recovery readiness analyzer.
 */

import type { DisasterRecoveryReadinessAnalysis, RecoveryHardeningInput } from './recovery-hardening-types.js';
import { resolveRecoveryRiskLevel } from './recovery-hardening-types.js';
import { getCachedDisasterRecoveryAnalysis, setCachedDisasterRecoveryAnalysis } from './recovery-hardening-cache.js';

let disasterRecoveryAnalysisCount = 0;

export function analyzeDisasterRecoveryReadiness(input: RecoveryHardeningInput): DisasterRecoveryReadinessAnalysis {
  const cacheKey = [
    input.missingRepositoryCheckpointStrategy,
    input.missingValidationCheckpointStrategy,
    input.backupReadinessWeak,
    input.productionIncidentReadinessWeak,
  ].join('|');

  const cached = getCachedDisasterRecoveryAnalysis(cacheKey);
  if (cached) return cached;

  disasterRecoveryAnalysisCount += 1;
  const disasterRecoveryWarnings: string[] = [];
  const disasterRecoveryGaps: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingRepositoryCheckpointStrategy, 'missing_repository_checkpoint_strategy', 'repository_checkpoint_strategy'],
    [input.missingTagStrategy, 'missing_tag_strategy', 'tag_strategy'],
    [input.missingValidationCheckpointStrategy, 'missing_validation_checkpoint_strategy', 'validation_checkpoint_strategy'],
    [input.cloudWorkerRecoveryWeak, 'cloud_worker_recovery_weak', 'cloud_worker_recovery_readiness'],
    [input.mobileCommandRecoveryWeak, 'mobile_command_recovery_weak', 'mobile_command_recovery_readiness'],
    [input.projectExportImportRecoveryWeak, 'project_export_import_recovery_weak', 'project_export_import_recovery'],
    [input.backupReadinessWeak, 'backup_readiness_weak', 'backup_readiness'],
    [input.stateReconstructionWeak, 'state_reconstruction_weak', 'state_reconstruction_readiness'],
    [input.auditTrailPreservationWeak, 'audit_trail_preservation_weak', 'audit_trail_preservation'],
    [input.productionIncidentReadinessWeak, 'production_incident_readiness_weak', 'production_incident_readiness'],
  ];

  for (const [flag, warning, gap] of checks) {
    if (flag === true) {
      disasterRecoveryWarnings.push(warning);
      disasterRecoveryGaps.push(gap);
      penalty += 8;
    }
  }

  const disasterRecoveryScore = Math.max(0, Math.min(100, Math.round(90 - penalty)));

  const result: DisasterRecoveryReadinessAnalysis = {
    disasterRecoveryScore,
    disasterRecoveryRiskLevel: resolveRecoveryRiskLevel(disasterRecoveryScore),
    disasterRecoveryWarnings,
    disasterRecoveryGaps,
  };

  setCachedDisasterRecoveryAnalysis(cacheKey, result);
  return result;
}

export function getDisasterRecoveryAnalysisCount(): number {
  return disasterRecoveryAnalysisCount;
}

export function resetDisasterRecoveryReadinessAnalyzerForTests(): void {
  disasterRecoveryAnalysisCount = 0;
}
