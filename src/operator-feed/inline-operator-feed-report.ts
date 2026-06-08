/**
 * Founder-readable Inline Operator Feed report.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import type { DevPulseV2InlineOperatorFeedAuthority } from './inline-operator-feed-authority.js';
import { FEED_OWNER_MODULE, type InlineOperatorFeedReport } from './types.js';

export function buildInlineOperatorFeedReport(
  authority: DevPulseV2InlineOperatorFeedAuthority,
  attachedToChatAuthority: boolean,
): InlineOperatorFeedReport {
  const state = authority.getState();
  const events = state.events;
  const latest = events.length > 0 ? events[events.length - 1] : null;
  const feedOwner = getDevPulseV2Owner('inline_operator_feed');
  const chatOwner = getDevPulseV2Owner('chat_authority');

  const visibleEventTextPresent = events.every((e) => e.visibleText.trim().length > 0);

  let recommendation =
    'Inline Operator Feed foundation healthy — execution and intelligence remain deferred.';
  if (!attachedToChatAuthority) {
    recommendation = 'Attach feed to Chat Authority submit flow.';
  } else if (chatOwner.ownerModule !== FEED_OWNER_MODULE && feedOwner.ownerModule !== FEED_OWNER_MODULE) {
    recommendation = 'Verify ownership registry.';
  } else if (!visibleEventTextPresent) {
    recommendation = 'All feed events require visibleText.';
  }

  const summary = [
    `Feed ${state.status}`,
    `events=${events.length}`,
    `turn=${latest?.turnId ?? 'none'}`,
    `stage=${latest?.stage ?? 'none'}`,
    `attached=${attachedToChatAuthority}`,
  ].join(' | ');

  return {
    feedAuthorityOwner: feedOwner.ownerModule,
    totalEvents: events.length,
    latestTurnId: latest?.turnId ?? null,
    latestStage: latest?.stage ?? null,
    visibleEventTextPresent,
    attachedToChatAuthority,
    warnings: state.warnings,
    errors: state.errors,
    recommendation,
    summary,
    governorUsage: authority.getGovernorUsage(),
  };
}

export function formatInlineOperatorFeedReport(
  authority: DevPulseV2InlineOperatorFeedAuthority,
  attachedToChatAuthority: boolean,
): string {
  const report = buildInlineOperatorFeedReport(authority, attachedToChatAuthority);
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Inline Operator Feed Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Feed authority owner:     ${report.feedAuthorityOwner}`);
  lines.push(`Total events:             ${report.totalEvents}`);
  lines.push(`Latest turn id:           ${report.latestTurnId ?? 'none'}`);
  lines.push(`Latest stage:             ${report.latestStage ?? 'none'}`);
  lines.push(`Visible event text:       ${report.visibleEventTextPresent}`);
  lines.push(`Attached to Chat Auth:    ${report.attachedToChatAuthority}`);
  lines.push(`Chat authority (answer):  ${CHAT_OWNER_MODULE}`);
  lines.push(`Summary:                  ${report.summary}`);
  lines.push('');
  lines.push('Task Governor usage:');
  lines.push(`  Used governor:          ${report.governorUsage.usedTaskGovernor}`);
  lines.push(`  P1 tasks:               ${report.governorUsage.p1Tasks}`);
  lines.push(`  P3 tasks:               ${report.governorUsage.p3Tasks} (must be 0)`);
  lines.push(`  P4 tasks:               ${report.governorUsage.p4Tasks} (must be 0)`);
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

  lines.push(`Recommendation:           ${report.recommendation}`);
  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}
