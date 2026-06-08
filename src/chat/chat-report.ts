/**
 * Founder-readable Chat Authority report.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import type { DevPulseV2ChatAuthority } from './chat-authority.js';
import { CHAT_OWNER_MODULE, type ChatAuthorityReport } from './types.js';

export function buildChatAuthorityReport(
  authority: DevPulseV2ChatAuthority,
): ChatAuthorityReport {
  const state = authority.getState();
  const lastAnswer = authority.getLastAnswer();
  const governorUsage = authority.getGovernorUsage();

  const chatOwner = getDevPulseV2Owner('chat_authority');
  const answerOwner = getDevPulseV2Owner('chat_answer_authority');

  const visibleAnswerTextPresent =
    lastAnswer !== null &&
    lastAnswer.status === 'READY' &&
    lastAnswer.visibleAnswerText.trim().length > 0;

  let recommendation =
    'Chat Authority foundation healthy — Operator Feed may follow after stability proof.';
  if (!governorUsage.usedTaskGovernor) {
    recommendation = 'Schedule all chat work through Task Governor.';
  } else if (state.status === 'ERROR') {
    recommendation = 'Resolve answer path errors before adding intelligence.';
  } else if (state.messages.length === 0) {
    recommendation = 'Submit a user message to prove visible answer path.';
  } else if (chatOwner.ownerModule !== answerOwner.ownerModule) {
    recommendation = 'CRITICAL: Duplicate answer authority detected in registry.';
  }

  const summary = [
    `Chat ${state.status}`,
    `messages=${state.messages.length}`,
    `answer=${lastAnswer?.status ?? 'none'}`,
    `visible=${visibleAnswerTextPresent}`,
    `governor=${governorUsage.usedTaskGovernor}`,
  ].join(' | ');

  return {
    chatAuthorityOwner: chatOwner.ownerModule,
    answerAuthorityOwner: answerOwner.ownerModule,
    messageCount: state.messages.length,
    lastAnswerStatus: lastAnswer?.status ?? null,
    visibleAnswerTextPresent,
    warnings: [...state.warnings, ...lastAnswer?.warnings ?? []],
    errors: [...state.errors, ...lastAnswer?.errors ?? []],
    recommendation,
    summary,
    governorUsage,
  };
}

export function formatChatAuthorityReport(authority: DevPulseV2ChatAuthority): string {
  const report = buildChatAuthorityReport(authority);
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Chat Authority Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Chat authority owner:   ${report.chatAuthorityOwner}`);
  lines.push(`Answer authority owner: ${report.answerAuthorityOwner}`);
  lines.push(`Message count:          ${report.messageCount}`);
  lines.push(`Last answer status:     ${report.lastAnswerStatus ?? 'none'}`);
  lines.push(`Visible answer present: ${report.visibleAnswerTextPresent}`);
  lines.push(`Summary:                ${report.summary}`);
  lines.push('');
  lines.push('Task Governor usage:');
  lines.push(`  Used governor:        ${report.governorUsage.usedTaskGovernor}`);
  lines.push(`  P0 tasks:             ${report.governorUsage.p0Tasks}`);
  lines.push(`  P1 tasks:             ${report.governorUsage.p1Tasks}`);
  lines.push(`  P3 tasks:             ${report.governorUsage.p3Tasks} (must be 0)`);
  lines.push(`  P4 tasks:             ${report.governorUsage.p4Tasks} (must be 0)`);
  lines.push('');

  if (report.warnings.length > 0) {
    lines.push(`Warnings (${report.warnings.length}):`);
    for (const w of report.warnings) {
      lines.push(`  • ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push(`Errors (${report.errors.length}):`);
    for (const e of report.errors) {
      lines.push(`  • ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation:         ${report.recommendation}`);
  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}

export function assertSingleAnswerAuthorityRegistered(): boolean {
  const chatOwner = getDevPulseV2Owner('chat_authority');
  const answerOwner = getDevPulseV2Owner('chat_answer_authority');
  return (
    chatOwner.ownerModule === CHAT_OWNER_MODULE &&
    answerOwner.ownerModule === CHAT_OWNER_MODULE
  );
}
