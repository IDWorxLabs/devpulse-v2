/**
 * Recovery chain founder-readable report.
 */

import type { RecoveryChain, RecoveryChainReport, RecoveryChainsState } from './types.js';
import { RECOVERY_CHAINS_OWNER_MODULE } from './types.js';

export function buildRecoveryChainReport(
  state: RecoveryChainsState,
  chains: RecoveryChain[],
): RecoveryChainReport {
  const latestChain = chains.length > 0 ? chains[chains.length - 1] : null;

  return {
    ownerModule: RECOVERY_CHAINS_OWNER_MODULE,
    chainCount: state.chainCount,
    latestChain,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Recovery Chains generate planning-only recovery step sequences — no execution, repair, or rollback.',
  };
}

export function formatRecoveryChainReport(state: RecoveryChainsState, chains: RecoveryChain[]): string {
  const report = buildRecoveryChainReport(state, chains);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Recovery Chains Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Chains ID: ${state.chainsId}`,
    `Chain count: ${report.chainCount}`,
    '',
  ];

  if (report.latestChain) {
    const c = report.latestChain;
    lines.push(`Chain ID: ${c.chainId}`);
    lines.push(`Package ID: ${c.packageId}`);
    lines.push(`Failure reason: ${c.failureReason}`);
    lines.push(`Step count: ${c.recoverySteps.length}`);
    lines.push(`Risk level: ${c.riskLevel}`);
    lines.push(`Approval required: ${c.approvalRequired}`);
    lines.push(`Verification required: ${c.verificationRequired}`);
    lines.push(`Rollback required: ${c.rollbackRequired}`);
    lines.push(`Retry required: ${c.retryRequired}`);
    lines.push(`Evidence count: ${c.evidenceLinks.length}`);
    lines.push(`Planning-only behavior: ${c.planningOnlyConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push(`No recovery executed: ${c.noRecoveryExecuted ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
