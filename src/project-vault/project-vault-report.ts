/**
 * Founder-readable Project Vault report.
 */

import type { ProjectRecord, ProjectVaultReport, ProjectVaultState } from './types.js';
import { VAULT_OWNER_MODULE } from './types.js';

export function buildProjectVaultReport(
  state: ProjectVaultState,
  latestProject: ProjectRecord | null,
): ProjectVaultReport {
  const warnings = [...state.warnings];
  const errors = [...state.errors];

  let recommendation =
    'Project Vault foundation healthy — lightweight in-memory project memory active.';
  if (state.projectCount === 0) {
    recommendation = 'Create a project record to begin storing project identity and facts.';
  } else if (errors.length > 0) {
    recommendation = 'Resolve vault errors before adding intelligence or execution layers.';
  } else if (state.activeProjectCount === 0) {
    recommendation = 'All projects are paused or archived — create or activate a project.';
  }

  const summary = [
    `Vault projects=${state.projectCount}`,
    `active=${state.activeProjectCount}`,
    `facts=${state.factCount}`,
    `snapshots=${state.snapshotCount}`,
  ].join(' | ');

  return {
    ownerModule: VAULT_OWNER_MODULE,
    projectCount: state.projectCount,
    activeProjectCount: state.activeProjectCount,
    factCount: state.factCount,
    latestProject: latestProject?.name ?? null,
    warnings,
    errors,
    recommendation,
    summary,
  };
}

export function formatProjectVaultReport(
  state: ProjectVaultState,
  latestProject: ProjectRecord | null,
): string {
  const report = buildProjectVaultReport(state, latestProject);
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Project Vault Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Vault owner:            ${report.ownerModule}`);
  lines.push(`Summary:                ${report.summary}`);
  lines.push('');
  lines.push(`Project count:          ${report.projectCount}`);
  lines.push(`Active projects:        ${report.activeProjectCount}`);
  lines.push(`Fact count:             ${report.factCount}`);
  lines.push(`Latest project:         ${report.latestProject ?? '(none)'}`);
  lines.push('');

  if (latestProject) {
    lines.push('Latest project detail:');
    lines.push(`  ID:       ${latestProject.projectId}`);
    lines.push(`  Status:   ${latestProject.status}`);
    lines.push(`  Phase:    ${latestProject.phase}`);
    lines.push(`  Summary:  ${latestProject.summary}`);
    lines.push(`  Facts:    ${latestProject.facts.length}`);
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
