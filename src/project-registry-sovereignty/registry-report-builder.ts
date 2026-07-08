/**
 * Registry Sovereignty V1 — structured repair reports for cleanup and startup.
 */

import type {
  RegistryIntegrityIssue,
  RegistrySovereigntyMigrationResult,
  RegistrySovereigntyReport,
  RegistrySovereigntyTrigger,
} from './types.js';

export function buildRegistrySovereigntyReport(input: {
  trigger: RegistrySovereigntyTrigger;
  preview: boolean;
  issues: readonly RegistryIntegrityIssue[];
  migration: RegistrySovereigntyMigrationResult;
  deletedArtifactProjectIds?: readonly string[];
  preservedUserProjectIds?: readonly string[];
  errors?: readonly string[];
}): RegistrySovereigntyReport {
  const errors = input.errors ?? [];
  return {
    readOnly: true,
    trigger: input.trigger,
    preview: input.preview,
    issues: input.issues,
    migration: input.migration,
    deletedArtifactProjectIds: input.deletedArtifactProjectIds ?? [],
    preservedUserProjectIds: input.preservedUserProjectIds ?? [],
    errors,
    ok:
      errors.length === 0 &&
      input.issues.every(
        (issue) =>
          issue.code === 'ORPHANED_WORKSPACE' ||
          issue.code === 'STALE_WORKSPACE_CACHE' ||
          input.migration.mutated ||
          input.preview,
      ),
  };
}

export function formatRegistrySovereigntyReport(report: RegistrySovereigntyReport): string {
  const lines = [
    `trigger=${report.trigger}`,
    `preview=${report.preview}`,
    `ok=${report.ok}`,
    `issues=${report.issues.length}`,
    `migrated=${report.migration.migrated.length}`,
    `duplicateRepairs=${report.migration.duplicateRepairs.length}`,
    `activeProjectId=${report.migration.repairedActiveProjectId ?? 'null'}`,
    `counts.user=${report.migration.counts.user}`,
    `counts.audit=${report.migration.counts.audit}`,
    `counts.system=${report.migration.counts.system}`,
  ];
  return lines.join(' ');
}
