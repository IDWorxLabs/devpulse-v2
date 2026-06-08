/**
 * Central Brain founder-readable report — awareness and coordination only.
 */

import { buildBrainCoordinationSummary } from './central-brain-coordination.js';
import type { BrainState, CentralBrainReport } from './types.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from './types.js';

export function buildCentralBrainReport(state: BrainState): CentralBrainReport {
  const coordination = buildBrainCoordinationSummary(state.systems);

  let recommendation =
    'Central Brain coordinates read-only awareness — source systems retain ownership.';
  if (coordination.overallStatus === 'FAIL') {
    recommendation =
      'One or more observed systems report FAIL — inspect source authorities before expanding coordination.';
  } else if (coordination.overallStatus === 'WARN') {
    recommendation =
      'Some systems need attention — review source summaries; Central Brain does not fix or execute.';
  } else if (state.systems.length === 0) {
    recommendation =
      'Collect system summaries to populate Central Brain awareness — no execution or answer generation.';
  }

  return {
    ownerModule: CENTRAL_BRAIN_OWNER_MODULE,
    systemCount: coordination.totalSystems,
    readyCount: coordination.readySystems,
    warningCount: coordination.warningSystems,
    failCount: coordination.failedSystems,
    overallStatus: coordination.overallStatus,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatCentralBrainReport(state: BrainState): string {
  const report = buildCentralBrainReport(state);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Central Brain Report',
    '═══════════════════════════════════════════════════',
    '',
    `Brain owner: ${report.ownerModule}`,
    `Brain ID: ${state.brainId}`,
    `System count: ${report.systemCount}`,
    `Ready: ${report.readyCount} | Warning: ${report.warningCount} | Fail: ${report.failCount}`,
    `Overall status: ${report.overallStatus}`,
    '',
  ];

  if (state.systems.length > 0) {
    lines.push('Observed systems:');
    for (const system of state.systems) {
      lines.push(`  • ${system.systemId} [${system.status}] — ${system.summary}`);
      lines.push(`    owner=${system.owner}`);
    }
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const e of report.errors) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
