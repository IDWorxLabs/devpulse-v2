/**
 * Founder-readable Task Governor report formatting.
 */

import type { DevPulseV2TaskGovernorReport } from './types.js';

export function formatTaskGovernorReport(report: DevPulseV2TaskGovernorReport): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Task Governor Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Verdict:              ${report.verdict}`);
  lines.push(`Responsiveness:       ${report.responsivenessState}`);
  lines.push(`Summary:              ${report.summary}`);
  lines.push('');
  lines.push('Queue state:');
  lines.push(`  Queue length:       ${report.queueLength}`);
  lines.push(`  Running task:       ${report.runningTaskId ?? '(none)'}`);
  lines.push(`  Paused:             ${report.paused}${report.pauseReason ? ` (${report.pauseReason})` : ''}`);
  lines.push(`  Interaction active: ${report.interactionActive}${report.interactionReason ? ` (${report.interactionReason})` : ''}`);
  lines.push('');
  lines.push('Counts:');
  lines.push(`  Completed:          ${report.completedCount}`);
  lines.push(`  Failed:             ${report.failedCount}`);
  lines.push(`  Cancelled:          ${report.cancelledCount}`);
  lines.push(`  Deferred:           ${report.deferredCount}`);
  lines.push(`  Long tasks:         ${report.longTaskCount}`);
  lines.push('');

  if (report.longTasks.length > 0) {
    lines.push(`Long tasks (${report.longTasks.length}):`);
    for (const t of report.longTasks) {
      lines.push(`  • ${t.id} [${t.priority}] ${t.durationMs}ms`);
    }
    lines.push('');
  }

  if (report.deferredTasks.length > 0) {
    lines.push(`Deferred tasks (${report.deferredTasks.length}):`);
    for (const t of report.deferredTasks) {
      lines.push(`  • ${t.id} [${t.priority}] ${t.error ?? 'deferred'}`);
    }
    lines.push('');
  }

  if (report.cancelledStaleTasks.length > 0) {
    lines.push(`Cancelled stale tasks (${report.cancelledStaleTasks.length}):`);
    for (const t of report.cancelledStaleTasks) {
      lines.push(`  • ${t.id} [${t.priority}] ${t.error ?? 'cancelled'}`);
    }
    lines.push('');
  }

  if (report.lastWarning) {
    lines.push(`Last warning:         ${report.lastWarning}`);
    lines.push('');
  }

  if (report.lastTask) {
    lines.push(
      `Last task:            ${report.lastTask.id} → ${report.lastTask.status} (${report.lastTask.durationMs}ms)`,
    );
    lines.push('');
  }

  lines.push(`Recommended action:   ${report.recommendedAction}`);
  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}
