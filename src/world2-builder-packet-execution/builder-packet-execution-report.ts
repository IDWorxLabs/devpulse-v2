/**
 * Builder packet execution report composer.
 */

import type { BuilderPacketExecutionReport, BuilderPacketExecutionPacket } from './types.js';

export function composeBuilderPacketExecutionResponse(
  query: string,
  report: BuilderPacketExecutionReport,
  packet: BuilderPacketExecutionPacket | null,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['World 2 Builder Packet Execution Response', ''];

  lines.push(`Report: ${report.reportId}`);
  lines.push(`State: ${report.state}`);
  lines.push(`Valid: ${report.valid}`);
  lines.push(report.summary);
  lines.push('');

  if (lower.includes('blocked') || lower.includes('why is this builder packet')) {
    lines.push('Blocked reasons:');
    for (const b of packet?.blockedReasons ?? ['No packet prepared']) {
      lines.push(`• ${b}`);
    }
  }

  if (lower.includes('approval') || lower.includes('what approvals')) {
    lines.push('Required approvals:');
    for (const a of packet?.requiredApprovals ?? ['Founder approval required']) {
      lines.push(`• ${a}`);
    }
    lines.push(`Founder approval recorded: ${report.founderApprovalRequirementRecorded}`);
    lines.push(`Task Governor recorded: ${report.taskGovernorRequirementRecorded}`);
  }

  if (packet) {
    lines.push('');
    lines.push(`Packet: ${packet.builderPacketId}`);
    lines.push(`Project: ${packet.projectId} | Workspace: ${packet.workspaceId}`);
    lines.push(`Risk: ${packet.riskLevel}`);
    lines.push(`Steps: ${packet.steps.length}`);
    lines.push(`Execution allowed: ${packet.executionAllowed}`);
    for (const step of packet.steps.slice(0, 8)) {
      lines.push(
        `• [${step.stepType}] ${step.title} — risk ${step.riskLevel}, approval ${step.requiresApproval ? 'YES' : 'NO'}`,
      );
    }
  }

  lines.push('');
  lines.push('Preparation only — simulation-only — no file writes, no apply, no shell commands.');
  lines.push('World 1 protected — executionAllowed remains false in Phase 15.2.');
  return lines.join('\n');
}
