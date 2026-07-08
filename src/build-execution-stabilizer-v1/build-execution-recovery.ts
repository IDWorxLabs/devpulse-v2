/**
 * Build Execution Stabilizer V1 — recovery.
 *
 * Exactly one recovery attempt is allowed per stage. Recovery actions are provided by the host
 * (the real build pipeline) via simple async callbacks — this module never reaches into process
 * management itself, it only enforces the single-attempt rule and records what happened.
 */

import type { BuildExecutionRecoveryActionKind, BuildExecutionRecoveryAttempt, BuildExecutionStageName } from './build-execution-types.js';
import type { BuildExecutionMonitor } from './build-execution-monitor.js';

export interface RecoveryOutcome {
  ok: boolean;
  detail: string;
}

export interface BuildExecutionRecoveryHost {
  restartNpmInstall?: () => Promise<RecoveryOutcome>;
  restartNpmBuild?: () => Promise<RecoveryOutcome>;
  restartPreviewServer?: () => Promise<RecoveryOutcome>;
  recreatePreviewProcess?: () => Promise<RecoveryOutcome>;
  terminateOrphanedProcess?: () => Promise<RecoveryOutcome>;
  retryFilesystemWatcher?: () => Promise<RecoveryOutcome>;
  retryDevServerStartup?: () => Promise<RecoveryOutcome>;
}

export const STAGE_RECOVERY_ACTION: Partial<Record<BuildExecutionStageName, BuildExecutionRecoveryActionKind>> = {
  NPM_INSTALL: 'RESTART_NPM_INSTALL',
  NPM_BUILD: 'RESTART_NPM_BUILD',
  PREVIEW_STARTUP: 'RESTART_PREVIEW_SERVER',
};

function resolveHostFn(actionKind: BuildExecutionRecoveryActionKind, host: BuildExecutionRecoveryHost): (() => Promise<RecoveryOutcome>) | null {
  switch (actionKind) {
    case 'RESTART_NPM_INSTALL':
      return host.restartNpmInstall ?? null;
    case 'RESTART_NPM_BUILD':
      return host.restartNpmBuild ?? null;
    case 'RESTART_PREVIEW_SERVER':
      return host.restartPreviewServer ?? null;
    case 'RECREATE_PREVIEW_PROCESS':
      return host.recreatePreviewProcess ?? null;
    case 'TERMINATE_ORPHANED_PROCESS':
      return host.terminateOrphanedProcess ?? null;
    case 'RETRY_FILESYSTEM_WATCHER':
      return host.retryFilesystemWatcher ?? null;
    case 'RETRY_DEV_SERVER_STARTUP':
      return host.retryDevServerStartup ?? null;
    default:
      return null;
  }
}

/**
 * Attempts recovery for a stage — at most once, ever, per monitor instance. Returns null when no
 * recovery was possible (already attempted, or no matching action/host callback exists) so the
 * caller can move straight to a FAILED result instead of retrying.
 */
export async function attemptStageRecovery(
  stage: BuildExecutionStageName,
  host: BuildExecutionRecoveryHost,
  monitor: BuildExecutionMonitor,
  actionKindOverride?: BuildExecutionRecoveryActionKind,
): Promise<BuildExecutionRecoveryAttempt | null> {
  if (monitor.hasAttemptedRecovery(stage)) return null;

  const actionKind = actionKindOverride ?? STAGE_RECOVERY_ACTION[stage];
  if (!actionKind) return null;

  const hostFn = resolveHostFn(actionKind, host);
  if (!hostFn) return null;

  monitor.markRecovering(stage);
  let outcome: RecoveryOutcome;
  try {
    outcome = await hostFn();
  } catch (err) {
    outcome = { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }

  const attempt: BuildExecutionRecoveryAttempt = {
    readOnly: true,
    stage,
    actionKind,
    attemptedAtMs: Date.now(),
    succeeded: outcome.ok,
    detail: outcome.detail,
  };
  monitor.recordRecoveryAttempt(attempt);

  if (outcome.ok) {
    monitor.markRecovered(stage, outcome.detail);
  } else {
    monitor.failStage(stage, outcome.detail);
  }

  return attempt;
}
