/**
 * Recovery Hardening — rollback readiness analyzer.
 */

import type { RecoveryHardeningInput, RollbackReadinessAnalysis } from './recovery-hardening-types.js';
import { resolveRecoveryRiskLevel } from './recovery-hardening-types.js';
import { getCachedRollbackAnalysis, setCachedRollbackAnalysis } from './recovery-hardening-cache.js';

let rollbackAnalysisCount = 0;

export function analyzeRollbackReadiness(input: RecoveryHardeningInput): RollbackReadinessAnalysis {
  const cacheKey = [
    input.missingGitCheckpoint,
    input.missingPhaseTagConvention,
    input.missingLastKnownGoodCheckpoint,
    input.missingRollbackGuidance,
  ].join('|');

  const cached = getCachedRollbackAnalysis(cacheKey);
  if (cached) return cached;

  rollbackAnalysisCount += 1;
  const rollbackWarnings: string[] = [];
  const rollbackGaps: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingGitCheckpoint, 'missing_git_checkpoint', 'git_checkpoint_tag_presence'],
    [input.missingCleanWorkingTreeSignal, 'missing_clean_working_tree_signal', 'clean_working_tree_signal'],
    [input.missingPhaseTagConvention, 'missing_phase_tag_convention', 'phase_commit_tag_convention'],
    [input.missingLastKnownGoodCheckpoint, 'missing_last_known_good_checkpoint', 'last_known_good_checkpoint'],
    [input.missingFailureReport, 'missing_failure_report', 'failure_report_availability'],
    [input.missingValidatorPassToken, 'missing_validator_pass_token', 'validator_pass_token_availability'],
    [input.missingUvlCheckpointReport, 'missing_uvl_checkpoint_report', 'uvl_checkpoint_report'],
    [input.missingFounderApprovalCheckpoint, 'missing_founder_approval_checkpoint', 'founder_approval_checkpoint'],
    [input.missingRollbackGuidance, 'missing_rollback_guidance', 'rollback_guidance'],
    [input.missingRestorePathClarity, 'missing_restore_path_clarity', 'restore_path_clarity'],
  ];

  for (const [flag, warning, gap] of checks) {
    if (flag === true) {
      rollbackWarnings.push(warning);
      rollbackGaps.push(gap);
      penalty += 8;
    }
  }

  const rollbackReadinessScore = Math.max(0, Math.min(100, Math.round(92 - penalty)));

  const result: RollbackReadinessAnalysis = {
    rollbackReadinessScore,
    rollbackRiskLevel: resolveRecoveryRiskLevel(rollbackReadinessScore),
    rollbackWarnings,
    rollbackGaps,
  };

  setCachedRollbackAnalysis(cacheKey, result);
  return result;
}

export function getRollbackAnalysisCount(): number {
  return rollbackAnalysisCount;
}

export function resetRollbackReadinessAnalyzerForTests(): void {
  rollbackAnalysisCount = 0;
}
