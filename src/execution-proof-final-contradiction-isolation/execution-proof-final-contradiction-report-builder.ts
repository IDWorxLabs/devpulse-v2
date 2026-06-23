/**
 * Phase 27.06 — Execution Proof Final Contradiction report builder (V1).
 */

import type { ExecutionProofFinalContradictionIsolationReport } from './execution-proof-final-contradiction-isolation-types.js';
import {
  EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_CORE_QUESTION,
  EXECUTION_PROOF_FINAL_CONTRADICTION_REPORT_BASENAME,
  FINAL_CONTRADICTION_ISOLATION_RULES,
  FINAL_STALE_CONSUMER_AUTHORITY_ID,
  FINAL_STALE_CONSUMER_AUTHORITY_NAME,
  FINAL_STALE_CONSUMER_REASON,
  FINAL_STALE_CONSUMER_SOURCE_MODULE,
  STALE_FOUNDER_TEST_AUTHORITY_IDS,
} from './execution-proof-final-contradiction-isolation-registry.js';

export function buildExecutionProofFinalContradictionReportMarkdown(
  report: ExecutionProofFinalContradictionIsolationReport,
): string {
  const lines: string[] = [
    `# ${EXECUTION_PROOF_FINAL_CONTRADICTION_REPORT_BASENAME}`,
    '',
    `Generated: ${report.generatedAt}`,
    `Isolation ID: ${report.isolationId}`,
    '',
    '## Core Question',
    '',
    EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_CORE_QUESTION,
    '',
    '## Detection Rules',
    '',
    ...FINAL_CONTRADICTION_ISOLATION_RULES.map((rule) => `- ${rule}`),
    '',
    '## Authoritative Converged Evidence',
    '',
    `- Workspace: **${report.authoritative.workspaceId ?? 'none'}**`,
    `- RunId: **${report.authoritative.runId ?? 'none'}**`,
    `- Manifest: **${report.authoritative.manifestId ?? 'none'}**`,
    `- Proof Timestamp: **${report.authoritative.proofTimestamp ?? 'none'}**`,
    `- Proof Level: **${report.authoritative.proofLevel}**`,
    `- Source Authority: **${report.authoritative.sourceAuthority}**`,
    `- Disk missingArtifacts: **${report.authoritative.missingArtifacts}**`,
    `- Application Proven: **${report.authoritative.applicationProven ? 'yes' : 'no'}**`,
    `- Authority Reality Convergence: **${report.authoritative.convergencePassed ? 'PASS' : 'FAIL'}**`,
    `- Execution Proof Contradiction Elimination: **${report.authoritative.contradictionEliminationPassed ? 'PASS' : 'FAIL'}**`,
    '',
    '## Final Stale Consumer',
    '',
    `**${FINAL_STALE_CONSUMER_AUTHORITY_NAME}** (\`${FINAL_STALE_CONSUMER_AUTHORITY_ID}\`)`,
    '',
    `- Source module: \`${FINAL_STALE_CONSUMER_SOURCE_MODULE}\``,
    `- Reason: ${FINAL_STALE_CONSUMER_REASON}`,
    `- First pre-convergence authority read: **${
      report.rankedTable.find((entry) =>
        STALE_FOUNDER_TEST_AUTHORITY_IDS.some((id) => entry.authorityId === id),
      )?.authorityId ?? 'REQUIREMENT_REALITY'
    }**`,
    '',
    '## Ranked Contradiction Table',
    '',
    '| Authority | Current Verdict | Expected Verdict | Root Cause |',
    '| --------- | --------------- | ---------------- | ---------- |',
    ...report.rankedTable.map(
      (entry) =>
        `| ${entry.authority} | ${entry.currentVerdict} | ${entry.expectedVerdict} | ${entry.divergence}: ${entry.rootCause.slice(0, 80)} |`,
    ),
    '',
    '## First Authority Per Dimension',
    '',
    `- BUILD=PARTIAL: **${report.summary.firstBuildPartialAuthorityId ?? 'none'}**`,
    `- RUNTIME=NOT_PROVEN: **${report.summary.firstRuntimeNotProvenAuthorityId ?? 'none'}**`,
    `- PREVIEW=NOT_PROVEN: **${report.summary.firstPreviewNotProvenAuthorityId ?? 'none'}**`,
    `- LAUNCH=NOT_PROVEN/PARTIAL: **${report.summary.firstLaunchNotProvenAuthorityId ?? 'none'}**`,
    '',
    '## Contradictions',
    '',
  ];

  for (const consumption of report.consumptions) {
    lines.push(
      `### ${consumption.claim ?? consumption.authorityName}`,
      '',
      `- **Authority:** ${consumption.authorityName}`,
      `- **Current Verdict:** ${consumption.currentVerdict}`,
      `- **Expected Verdict:** ${consumption.expectedVerdict}`,
      `- **Workspace:** ${consumption.consumedEvidence.workspaceId ?? 'none'}`,
      `- **RunId:** ${consumption.consumedEvidence.runId ?? 'none'}`,
      `- **Manifest:** ${consumption.consumedEvidence.manifestId ?? 'none'}`,
      `- **Proof Timestamp:** ${consumption.consumedEvidence.proofTimestamp ?? 'none'}`,
      `- **Evidence Source:** ${consumption.inputEvidence.sourceAuthority}`,
      `- **Root Cause:** ${consumption.rootCause}`,
      `- **Divergence:** ${consumption.divergence}`,
      '',
    );
  }

  lines.push(
    `Pass token: **${report.passToken ?? 'ISOLATION_INCOMPLETE'}**`,
    '',
    `Contradictions isolated: **${report.summary.contradictionCount}**`,
  );

  return lines.join('\n');
}

export function buildExecutionProofFinalContradictionValidationMarkdown(input: {
  passToken: string | null;
  checks: readonly { name: string; passed: boolean; detail: string }[];
}): string {
  return [
    '# Execution Proof Final Contradiction Isolation Validation',
    '',
    `Result: ${input.passToken ?? 'FAILED'}`,
    '',
    `Final stale consumer: **${FINAL_STALE_CONSUMER_AUTHORITY_NAME}** (\`${FINAL_STALE_CONSUMER_AUTHORITY_ID}\`)`,
    '',
    ...input.checks.map((check) => `- [${check.passed ? 'x' : ' '}] ${check.name}: ${check.detail}`),
    '',
    input.passToken ? `**${input.passToken}**` : '',
  ].join('\n');
}
