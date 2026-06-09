/**
 * Rollback report composer.
 */

import type { RollbackPlan, RollbackReport } from './types.js';

export function composeRollbackResponse(
  query: string,
  report: RollbackReport,
  plan: RollbackPlan | null,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['World 2 Rollback Runtime Response', ''];

  lines.push(`Report: ${report.reportId}`);
  lines.push(`State: ${report.state}`);
  lines.push(`Valid: ${report.valid}`);
  lines.push(`Gates: ${report.gatesPassed}/${report.gatesEvaluated}`);
  lines.push(report.summary);
  lines.push('');

  if (lower.includes('blocked') || lower.includes('why is rollback')) {
    lines.push('Blocked reasons:');
    for (const b of plan?.blockedReasons ?? ['No rollback plan prepared']) {
      lines.push(`• ${b}`);
    }
  }

  if (lower.includes('snapshot') || lower.includes('what snapshots')) {
    lines.push('Snapshot requirements (recorded only — no snapshots created):');
    for (const s of plan?.snapshotRequirement ?? []) {
      lines.push(`• ${s}`);
    }
  }

  if (lower.includes('approval') || lower.includes('safety')) {
    lines.push('Approval requirements:');
    for (const a of plan?.approvalRequirements ?? ['Founder approval required']) {
      lines.push(`• ${a}`);
    }
  }

  if (plan) {
    lines.push('');
    lines.push(`Rollback plan: ${plan.rollbackPlanId}`);
    lines.push(`Apply plan: ${plan.applyPlanId}`);
    lines.push(`Execution packet: ${plan.executionPacketId}`);
    lines.push(`Risk: ${plan.riskLevel}`);
    lines.push(`Rollback allowed: ${plan.rollbackAllowed}`);
    lines.push(`Steps: ${plan.rollbackSteps.length}`);
    for (const step of plan.rollbackSteps.slice(0, 8)) {
      lines.push(
        `• [${step.rollbackState}] ${step.title} — ${step.rollbackAction}, risk ${step.riskLevel}`,
      );
    }
  }

  lines.push('');
  lines.push('Rollback plans only — rollbackAllowed false — no restore, no git, no file operations.');
  lines.push('Phase 15.4 determines what rollback safety would be required before future apply.');
  return lines.join('\n');
}
