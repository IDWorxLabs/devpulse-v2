/**
 * Controlled apply report composer.
 */

import type { ControlledApplyPlan, ControlledApplyReport } from './types.js';

export function composeControlledApplyResponse(
  query: string,
  report: ControlledApplyReport,
  plan: ControlledApplyPlan | null,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['World 2 Controlled Apply Runtime Response', ''];

  lines.push(`Report: ${report.reportId}`);
  lines.push(`State: ${report.state}`);
  lines.push(`Valid: ${report.valid}`);
  lines.push(`Gates: ${report.gatesPassed}/${report.gatesEvaluated}`);
  lines.push(report.summary);
  lines.push('');

  if (lower.includes('blocked') || lower.includes('why is apply')) {
    lines.push('Blocked reasons:');
    for (const b of plan?.blockedReasons ?? ['No apply plan prepared']) {
      lines.push(`• ${b}`);
    }
  }

  if (lower.includes('approval') || lower.includes('what approvals')) {
    lines.push('Approval requirements:');
    for (const a of plan?.approvalRequirements ?? ['Founder approval required']) {
      lines.push(`• ${a}`);
    }
  }

  if (plan) {
    lines.push('');
    lines.push(`Apply plan: ${plan.applyPlanId}`);
    lines.push(`Execution packet: ${plan.executionPacketId}`);
    lines.push(`Risk: ${plan.riskLevel}`);
    lines.push(`Apply allowed: ${plan.applyAllowed}`);
    lines.push(`Steps: ${plan.applySteps.length}`);
    for (const step of plan.applySteps.slice(0, 8)) {
      lines.push(
        `• [${step.applyState}] ${step.title} — risk ${step.riskLevel}, approval ${step.approvalLevel}`,
      );
    }
  }

  lines.push('');
  lines.push('Apply plans only — applyAllowed false — no file writes, no apply, no shell commands.');
  lines.push('Phase 15.3 determines what would be required before apply.');
  return lines.join('\n');
}
