/**
 * Rollback/retry engine founder-readable report.
 */

import type {
  RollbackRetryEngineState,
  RollbackRetryPlan,
  RollbackRetryReport,
} from './types.js';
import { ROLLBACK_RETRY_ENGINE_OWNER_MODULE } from './types.js';

export function buildRollbackRetryReport(
  state: RollbackRetryEngineState,
  plans: RollbackRetryPlan[],
): RollbackRetryReport {
  const latestPlan = plans.length > 0 ? plans[plans.length - 1] : null;

  return {
    ownerModule: ROLLBACK_RETRY_ENGINE_OWNER_MODULE,
    planCount: state.planCount,
    latestPlan,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Rollback & Retry Engine produces planning-only strategies — no rollback, retry, or file modification.',
  };
}

export function formatRollbackRetryReport(
  state: RollbackRetryEngineState,
  plans: RollbackRetryPlan[],
): string {
  const report = buildRollbackRetryReport(state, plans);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Rollback & Retry Engine Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Engine ID: ${state.engineId}`,
    `Plan count: ${report.planCount}`,
    '',
  ];

  if (report.latestPlan) {
    const p = report.latestPlan;
    lines.push(`Plan ID: ${p.planId}`);
    lines.push(`Package ID: ${p.packageId}`);
    lines.push(`Rollback state: ${p.rollbackState}`);
    lines.push(`Retry state: ${p.retryState}`);
    lines.push(`Checkpoint ID: ${p.checkpoint.checkpointId}`);
    lines.push(`Approval required: ${p.approvalRequired}`);
    lines.push(`Verification required: ${p.verificationRequired}`);
    lines.push(`Risk level: ${p.riskLevel}`);
    lines.push(`Evidence count: ${p.evidenceLinks.length}`);
    lines.push(`Planning only: ${p.planningOnlyConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push(`No rollback executed: ${p.noRollbackExecuted ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push(`No retry executed: ${p.noRetryExecuted ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
