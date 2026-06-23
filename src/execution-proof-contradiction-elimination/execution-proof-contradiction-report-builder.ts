/**
 * Phase 27.01 — Execution Proof Contradiction report builder (V1).
 */

import {
  CONTRADICTION_AUDIT_TARGETS,
  CONTRADICTION_ELIMINATION_RULES,
  EXECUTION_PROOF_CONTRADICTION_ELIMINATION_CORE_QUESTION,
} from './execution-proof-contradiction-elimination-registry.js';
import type { ExecutionProofContradictionEliminationReport } from './execution-proof-contradiction-elimination-types.js';

export function buildExecutionProofContradictionEliminationReportMarkdown(
  report: ExecutionProofContradictionEliminationReport,
): string {
  const lines: string[] = [
    '# Execution Proof Contradiction Elimination Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Elimination ID: ${report.eliminationId}`,
    '',
    '## Core Question',
    '',
    EXECUTION_PROOF_CONTRADICTION_ELIMINATION_CORE_QUESTION,
    '',
    '## Rules',
    '',
    ...CONTRADICTION_ELIMINATION_RULES.map((r) => `- ${r}`),
    '',
    '## Authoritative Context',
    '',
    `- Application proven: **${report.authoritative.applicationProven ? 'yes' : 'no'}**`,
    `- Workspace: **${report.authoritative.authoritativeWorkspaceId ?? 'n/a'}**`,
    `- RunId: **${report.authoritative.authoritativeRunId ?? 'n/a'}**`,
    `- Manifest: **${report.authoritative.authoritativeManifestId ?? 'n/a'}**`,
    `- Disk missingArtifacts: **${report.authoritative.diskMissingArtifacts}**`,
    `- Convergence passed: **${report.authoritative.convergencePassed ? 'yes' : 'no'}**`,
    `- Unification passed: **${report.authoritative.unificationPassed ? 'yes' : 'no'}**`,
    '',
    '## Contradictions',
    '',
  ];

  if (report.contradictions.length) {
    for (const c of report.contradictions) {
      lines.push(`### ${c.authorityName} (${c.dimension})`);
      lines.push('');
      lines.push(`- Authority: **${c.authorityName}**`);
      lines.push(`- Workspace: **${c.workspaceId ?? 'n/a'}**`);
      lines.push(`- RunId: **${c.runId ?? 'n/a'}**`);
      lines.push(`- Manifest: **${c.manifestId ?? 'n/a'}**`);
      lines.push(`- Timestamp: **${c.proofTimestamp ?? 'n/a'}**`);
      lines.push(`- Verdict: **${c.verdict}**`);
      lines.push(`- Expected Verdict: **${c.expectedVerdict}**`);
      lines.push(`- Root Cause: **${c.rootCause}**`);
      lines.push(`- Reclassification: **${c.reclassification}**`);
      lines.push(`- Evidence Path: ${c.evidencePath}`);
      lines.push('');
    }
  } else {
    lines.push('- No post-convergence contradictions detected');
    lines.push('');
  }

  lines.push('## Elimination Summary');
  lines.push('');
  lines.push(`- Contradictions eliminated: **${report.elimination.contradictionsEliminated}**`);
  lines.push(`- Infrastructure defects: **${report.elimination.infrastructureDefectCount}**`);
  lines.push(`- Genuine product gaps: **${report.elimination.genuineProductGapCount}**`);
  lines.push(`- BUILD=PARTIAL authority: **${report.elimination.buildPartialAuthorityId ?? 'none'}**`);
  lines.push(`- RUNTIME=NOT_PROVEN authority: **${report.elimination.runtimeNotProvenAuthorityId ?? 'none'}**`);
  lines.push(`- PREVIEW=NOT_PROVEN authority: **${report.elimination.previewNotProvenAuthorityId ?? 'none'}**`);
  lines.push(`- LAUNCH=NOT_PROVEN authority: **${report.elimination.launchNotProvenAuthorityId ?? 'none'}**`);
  lines.push('');
  report.passToken ? lines.push(`Pass token: **${report.passToken}**`) : lines.push('Pass token: not issued');

  return lines.join('\n');
}

export function buildExecutionProofContradictionAuditMarkdown(
  report: ExecutionProofContradictionEliminationReport,
): string {
  const lines: string[] = [
    '# Execution Proof Contradiction Audit',
    '',
    `Targets: ${CONTRADICTION_AUDIT_TARGETS.join(', ')}`,
    '',
    '| Authority | Dimension | Workspace | RunId | Verdict | Source File |',
    '|-----------|-----------|-----------|-------|---------|-------------|',
  ];

  for (const trace of report.authorityTraces) {
    lines.push(
      `| ${trace.authorityName} | ${trace.dimension} | ${trace.workspaceId ?? 'n/a'} | ${trace.runId ?? 'n/a'} | ${trace.verdict} | ${trace.sourceFile} |`,
    );
  }

  return lines.join('\n');
}

export function buildExecutionProofContradictionRootCauseMarkdown(
  report: ExecutionProofContradictionEliminationReport,
): string {
  const lines: string[] = ['# Execution Proof Contradiction Root Cause', ''];

  if (report.contradictions.length) {
    for (const c of report.contradictions) {
      lines.push(`## ${c.authorityName}`);
      lines.push('');
      lines.push(`- Root cause: **${c.rootCause}**`);
      lines.push(`- Reclassification: **${c.reclassification}**`);
      lines.push(`- Evidence: ${c.evidencePath}`);
      lines.push(`- Source chain: ${report.authorityTraces.find((t) => t.authorityId === c.authorityId && t.dimension === c.dimension)?.sourceChain ?? 'n/a'}`);
      lines.push('');
    }
  } else {
    lines.push('No contradictions requiring root cause classification.');
  }

  return lines.join('\n');
}

export function buildExecutionProofContradictionValidationMarkdown(
  passed: boolean,
  checkCount: number,
  failedCount: number,
): string {
  return [
    '# Execution Proof Contradiction Validation',
    '',
    `- Checks: ${checkCount}`,
    `- Failed: ${failedCount}`,
    `- Result: **${passed ? 'PASS' : 'FAIL'}**`,
    passed ? `- Pass token: **EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS**` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
