/**
 * Recovery report composer.
 */

import type { RecoveryPlan, RecoveryReport } from './types.js';

export function composeRecoveryResponse(
  query: string,
  report: RecoveryReport,
  plan: RecoveryPlan | null,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['World 2 Recovery Runtime Response', ''];

  lines.push(`Report: ${report.reportId}`);
  lines.push(`State: ${report.state}`);
  lines.push(`Valid: ${report.valid}`);
  lines.push(`Gates: ${report.gatesPassed}/${report.gatesEvaluated}`);
  lines.push(report.summary);
  lines.push('');

  if (lower.includes('blocked') || lower.includes('why is recovery')) {
    lines.push('Blocked reasons:');
    for (const b of plan?.blockedReasons ?? ['No recovery plan prepared']) {
      lines.push(`• ${b}`);
    }
  }

  if (lower.includes('strategy') || lower.includes('what recovery')) {
    lines.push(`Recovery strategy: ${plan?.recoveryStrategy ?? 'Not determined'}`);
    lines.push(`Failure category: ${plan?.failureCategory ?? 'UNKNOWN_RUNTIME_FAILURE'}`);
  }

  if (lower.includes('self-evolution') || lower.includes('self evolution') || lower.includes('3 failed')) {
    lines.push(`Escalation level: ${plan?.escalationLevel ?? 'NONE'}`);
    lines.push('Three failure rule: same strategy must not repeat after 3 failures');
    lines.push('Founder approval required before any future self-evolution action');
  }

  if (lower.includes('approval')) {
    lines.push('Approval requirements:');
    for (const a of plan?.approvalRequirements ?? ['Founder approval required']) {
      lines.push(`• ${a}`);
    }
  }

  if (plan) {
    lines.push('');
    lines.push(`Recovery plan: ${plan.recoveryPlanId}`);
    lines.push(`Rollback plan: ${plan.rollbackPlanId}`);
    lines.push(`Apply plan: ${plan.applyPlanId}`);
    lines.push(`Execution packet: ${plan.executionPacketId}`);
    lines.push(`Risk: ${plan.riskLevel}`);
    lines.push(`Recovery allowed: ${plan.recoveryAllowed}`);
    lines.push(`Steps: ${plan.recoverySteps.length}`);
    for (const step of plan.recoverySteps.slice(0, 8)) {
      lines.push(
        `• [${step.recoveryState}] ${step.title} — ${step.recoveryAction}, risk ${step.riskLevel}`,
      );
    }
  }

  lines.push('');
  lines.push('Recovery plans only — recoveryAllowed false — no restore, apply, rollback, or file operations.');
  lines.push('Phase 15.5 determines what recovery path would be required if apply, verification, or rollback fails.');
  return lines.join('\n');
}
