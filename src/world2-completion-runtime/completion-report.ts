/**
 * Completion report composer.
 */

import type { CompletionPlan, CompletionReport } from './types.js';

export function composeCompletionResponse(
  query: string,
  report: CompletionReport,
  plan: CompletionPlan | null,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['World 2 Completion Runtime Response', ''];

  lines.push(`Report: ${report.reportId}`);
  lines.push(`State: ${report.state}`);
  lines.push(`Valid: ${report.valid}`);
  lines.push(`Gates: ${report.gatesPassed}/${report.gatesEvaluated}`);
  lines.push(report.summary);
  lines.push('');

  if (lower.includes('blocked') || lower.includes('why is completion')) {
    lines.push('Blocked reasons:');
    for (const b of plan?.blockedReasons ?? ['No completion plan prepared']) {
      lines.push(`• ${b}`);
    }
  }

  if (lower.includes('evidence') || lower.includes('missing')) {
    lines.push('Completion evidence:');
    for (const e of plan?.completionEvidence ?? []) {
      lines.push(`• [${e.satisfied ? 'SATISFIED' : 'MISSING'}] ${e.evidenceType}: ${e.summary}`);
    }
  }

  if (lower.includes('criteria') || lower.includes('defines completion') || lower.includes('success')) {
    lines.push('Completion criteria:');
    for (const c of plan?.completionCriteria ?? []) {
      lines.push(`• ${c}`);
    }
  }

  if (lower.includes('verification') || lower.includes('required')) {
    lines.push('Verification requirements:');
    for (const v of plan?.verificationRequirements ?? []) {
      lines.push(`• ${v}`);
    }
  }

  if (plan) {
    lines.push('');
    lines.push(`Completion plan: ${plan.completionPlanId}`);
    lines.push(`Project: ${plan.projectId}`);
    lines.push(`Recovery plan: ${plan.recoveryPlanId}`);
    lines.push(`Rollback plan: ${plan.rollbackPlanId}`);
    lines.push(`Apply plan: ${plan.applyPlanId}`);
    lines.push(`Risk: ${plan.riskLevel}`);
    lines.push(`Completion allowed: ${plan.completionAllowed}`);
  }

  lines.push('');
  lines.push('Completion plans only — completionAllowed false — no marking complete, no apply, rollback, or recovery.');
  lines.push('Phase 15.6 determines what would be required before completion could be declared.');
  return lines.join('\n');
}
