/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — structured report builder.
 */

import {
  REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1_PASS,
  type RepoTypecheckDiagnostic,
  type RepoTypecheckFailureClass,
  type RepoTypecheckPatchRecord,
  type RepoTypecheckRootCauseGroup,
  type RepoTypecheckStabilizationReport,
  type RepoTypecheckVerdict,
} from './repo-typecheck-types.js';
import { classifyDiagnostics } from './repo-typecheck-classifier.js';

export function buildRepoTypecheckStabilizationReport(input: {
  startedAt: number;
  command: string;
  initialDiagnostics: RepoTypecheckDiagnostic[];
  initialErrorCount: number;
  finalDiagnostics: RepoTypecheckDiagnostic[];
  finalErrorCount: number;
  rootCauseSelected: RepoTypecheckRootCauseGroup | null;
  patches: RepoTypecheckPatchRecord[];
  repairCycles: number;
  verdict: RepoTypecheckVerdict;
}): RepoTypecheckStabilizationReport {
  const durationMs = Math.round(performance.now() - input.startedAt);
  const failureClasses = classifyDiagnostics(input.initialDiagnostics);
  const filesModified = [...new Set(input.patches.flatMap((patch) => patch.filesModified))];
  const errorsRemoved = Math.max(0, input.initialErrorCount - input.finalErrorCount);
  const passToken =
    input.verdict === 'TYPECHECK_ALREADY_CLEAN' ||
    input.verdict === 'TYPECHECK_REPAIRED' ||
    (input.verdict === 'TYPECHECK_PARTIALLY_REPAIRED' && input.finalErrorCount === 0)
      ? REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1_PASS
      : null;

  return {
    readOnly: true,
    initialDiagnostics: input.initialDiagnostics,
    initialErrorCount: input.initialErrorCount,
    failureClasses,
    rootCauseSelected: input.rootCauseSelected,
    patches: input.patches,
    filesModified,
    finalDiagnostics: input.finalDiagnostics,
    finalErrorCount: input.finalErrorCount,
    errorsRemoved,
    errorsRemaining: input.finalErrorCount,
    repairCycles: input.repairCycles,
    command: input.command,
    durationMs,
    verdict: input.verdict,
    passToken,
    generatedAt: new Date().toISOString(),
  };
}

export function formatRepoTypecheckStabilizationReportMarkdown(
  report: RepoTypecheckStabilizationReport,
): string {
  const lines = [
    '# Repository Typecheck Stabilization Report',
    '',
    `- Verdict: **${report.verdict}**`,
    `- Command: \`${report.command}\``,
    `- Initial errors: ${report.initialErrorCount}`,
    `- Final errors: ${report.finalErrorCount}`,
    `- Errors removed: ${report.errorsRemoved}`,
    `- Repair cycles: ${report.repairCycles}`,
    `- Duration: ${report.durationMs}ms`,
    '',
    '## Failure classes',
    ...report.failureClasses.map((item) => `- ${item}`),
    '',
    '## Root cause',
    report.rootCauseSelected
      ? `- ${report.rootCauseSelected.failureClass} (${report.rootCauseSelected.downstreamCount} downstream)`
      : '- none selected',
    '',
    '## Patches',
    ...report.patches.map(
      (patch) =>
        `- Cycle ${patch.cycle}: ${patch.applied ? 'applied' : 'skipped'}${patch.rolledBack ? ' (rolled back)' : ''} — ${patch.detail}`,
    ),
    '',
    '## Files modified',
    ...(report.filesModified.length > 0 ? report.filesModified.map((file) => `- ${file}`) : ['- none']),
  ];
  return `${lines.join('\n')}\n`;
}
