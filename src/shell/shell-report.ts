/**
 * Founder-readable DevPulse V2 shell report.
 */

import { getClickabilityReport } from './clickability-tracker.js';
import type { DevPulseV2ShellAuthority } from './shell-authority.js';
import {
  SHELL_CONSTITUTIONAL_TARGETS,
  type DevPulseV2ShellState,
  type ShellReport,
  type ShellStartupGovernorUsage,
} from './types.js';

export function buildShellReport(
  state: DevPulseV2ShellState,
  governorUsage: ShellStartupGovernorUsage,
): ShellReport {
  const clickability = getClickabilityReport();

  const visibleTargetMet = clickability.visibleTargetMet;
  const clickableTargetMet = clickability.clickableTargetMet;

  let recommendation = 'Shell foundation healthy — proceed to Chat Authority when ready.';
  if (state.status === 'DEGRADED') {
    recommendation =
      'Shell exceeded constitutional timing targets — review startup path and Task Governor queue before Chat.';
  } else if (state.status === 'BOOTING') {
    recommendation = 'Complete shell boot via Task Governor before user interaction.';
  } else if (!governorUsage.usedTaskGovernor) {
    recommendation = 'All shell startup work must schedule through Task Governor.';
  }

  const summary = [
    `Shell ${state.status}`,
    state.visibleMs !== undefined ? `visible=${state.visibleMs}ms` : 'visible=pending',
    state.clickableMs !== undefined ? `clickable=${state.clickableMs}ms` : 'clickable=pending',
    `governor=${governorUsage.usedTaskGovernor ? 'yes' : 'no'}`,
  ].join(' | ');

  return {
    ...state,
    constitutionalTargets: SHELL_CONSTITUTIONAL_TARGETS,
    visibleTargetMet,
    clickableTargetMet,
    readinessStatus: state.status,
    recommendation,
    summary,
    governorUsage,
  };
}

export function formatShellReport(report: ShellReport): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Shell Foundation Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Startup ID:           ${report.startupId}`);
  lines.push(`Readiness status:     ${report.readinessStatus}`);
  lines.push(`Summary:              ${report.summary}`);
  lines.push('');
  lines.push('Constitutional targets:');
  lines.push(`  Visible target:     <= ${report.constitutionalTargets.visibleTargetMs}ms`);
  lines.push(`  Clickable target:   <= ${report.constitutionalTargets.clickableTargetMs}ms`);
  lines.push('');
  lines.push('Timing:');
  lines.push(
    `  Visible:            ${report.visibleMs !== undefined ? `${report.visibleMs}ms` : 'pending'} ${formatTarget(report.visibleTargetMet)}`,
  );
  lines.push(
    `  Clickable:          ${report.clickableMs !== undefined ? `${report.clickableMs}ms` : 'pending'} ${formatTarget(report.clickableTargetMet)}`,
  );
  lines.push(`  Started at:         ${report.startupStartedAt}`);
  if (report.shellVisibleAt) lines.push(`  Visible at:         ${report.shellVisibleAt}`);
  if (report.shellClickableAt) lines.push(`  Clickable at:       ${report.shellClickableAt}`);
  lines.push('');
  lines.push('Task Governor startup usage:');
  lines.push(`  Used governor:      ${report.governorUsage.usedTaskGovernor}`);
  lines.push(`  Tasks scheduled:    ${report.governorUsage.tasksScheduled}`);
  lines.push(`  P0 tasks:           ${report.governorUsage.p0Tasks}`);
  lines.push(`  P1 tasks:           ${report.governorUsage.p1Tasks}`);
  lines.push(`  P3 tasks:           ${report.governorUsage.p3Tasks} (must be 0 at startup)`);
  lines.push(`  P4 tasks:           ${report.governorUsage.p4Tasks} (must be 0 at startup)`);
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

  lines.push(`Recommendation:       ${report.recommendation}`);
  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}

export function formatShellReportFromAuthority(
  authority: DevPulseV2ShellAuthority,
): string {
  const state = authority.getState();
  const report = buildShellReport(state, authority.getGovernorUsage());
  return formatShellReport(report);
}

function formatTarget(met: boolean | null): string {
  if (met === null) return '';
  return met ? '[PASS]' : '[WARN]';
}
