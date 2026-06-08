/**
 * Founder-readable Evidence Registry report.
 */

import type { EvidenceRecord, EvidenceRegistryReport, EvidenceRegistryState } from './types.js';
import { REGISTRY_OWNER_MODULE } from './types.js';

export function buildEvidenceRegistryReport(
  state: EvidenceRegistryState,
  latest: EvidenceRecord | null,
): EvidenceRegistryReport {
  let recommendation =
    'Evidence Registry foundation healthy — single source of proof references active.';
  if (state.evidenceCount === 0) {
    recommendation = 'Add evidence records from existing system outputs to begin proof indexing.';
  } else if (state.failCount > 0) {
    recommendation = 'Review FAIL evidence records before treating system claims as proven.';
  } else if (state.warnCount > 0) {
    recommendation = 'Review WARN evidence records; attach more proof references as systems run.';
  }

  const summary = [
    `Evidence count=${state.evidenceCount}`,
    `warn=${state.warnCount}`,
    `fail=${state.failCount}`,
    `snapshots=${state.snapshotCount}`,
  ].join(' | ');

  return {
    ownerModule: REGISTRY_OWNER_MODULE,
    evidenceCount: state.evidenceCount,
    sourceCounts: { ...state.sourceCounts },
    latestEvidence: latest?.label ?? null,
    warnCount: state.warnCount,
    failCount: state.failCount,
    snapshotCount: state.snapshotCount,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
    summary,
  };
}

export function formatEvidenceRegistryReport(
  state: EvidenceRegistryState,
  latest: EvidenceRecord | null,
): string {
  const report = buildEvidenceRegistryReport(state, latest);
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Evidence Registry Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Registry owner:         ${report.ownerModule}`);
  lines.push(`Summary:                ${report.summary}`);
  lines.push('');
  lines.push(`Evidence count:         ${report.evidenceCount}`);
  lines.push(`Warn / Fail:            ${report.warnCount} / ${report.failCount}`);
  lines.push(`Snapshot count:         ${report.snapshotCount}`);
  lines.push(`Latest evidence:        ${report.latestEvidence ?? '(none)'}`);
  lines.push('');

  lines.push('Source counts:');
  for (const [source, count] of Object.entries(report.sourceCounts)) {
    lines.push(`  ${source}: ${count}`);
  }
  lines.push('');

  if (latest) {
    lines.push('Latest record:');
    lines.push(`  [${latest.evidenceId}] ${latest.label} — ${latest.status}`);
    lines.push(`  ${latest.summary}`);
    lines.push('');
  }

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
