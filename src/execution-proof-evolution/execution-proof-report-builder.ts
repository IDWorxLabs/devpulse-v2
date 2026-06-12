/**
 * Execution Proof Evolution — markdown report builder.
 */

import {
  EXECUTION_PROOF_EVOLUTION_PASS_TOKEN,
  EXECUTION_PROOF_EVOLUTION_PHASE,
  EXECUTION_PROOF_EVOLUTION_REPORT_TITLE,
} from './execution-proof-registry.js';
import type { ExecutionProofAssessment, ExecutionProofReport } from './execution-proof-types.js';

export function buildExecutionProofEvolutionReportMarkdown(report: ExecutionProofReport): string {
  const lines: string[] = [
    `# ${EXECUTION_PROOF_EVOLUTION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Phase',
    '',
    report.phaseName,
    '',
    '## Purpose',
    '',
    report.purpose,
    '',
    '## Problem → Fix → Proof Chain',
    '',
  ];

  for (const assessment of report.assessments.slice(0, 8)) {
    lines.push(`### ${assessment.problem.problemId}`);
    lines.push('');
    lines.push(`- **Problem:** ${assessment.authorityAnswers.originalProblem}`);
    lines.push(`- **Claimed fix:** ${assessment.authorityAnswers.claimedFix}`);
    lines.push(`- **Before/after:** ${assessment.authorityAnswers.beforeAfterSummary}`);
    lines.push(`- **Original failure gone:** ${assessment.authorityAnswers.originalFailureGone ? 'yes' : 'no'}`);
    lines.push(`- **Causally tied:** ${assessment.authorityAnswers.causallyTiedToFix ? 'yes' : 'no'}`);
    lines.push(`- **Regression:** ${assessment.authorityAnswers.regressionAppeared ? 'yes' : 'no'}`);
    lines.push(`- **Proof score:** ${assessment.executionProofScore}/100`);
    lines.push(`- **Verdict:** ${assessment.verdict}`);
    lines.push(`- **Disposition:** ${assessment.fixDisposition}`);
    lines.push('');
  }

  lines.push('## Verdict Distribution');
  lines.push('');
  lines.push('| Verdict | Count |');
  lines.push('|---------|-------|');
  for (const [verdict, count] of Object.entries(report.verdictDistribution)) {
    lines.push(`| ${verdict} | ${count} |`);
  }
  lines.push('');

  lines.push('## Proof Score');
  lines.push('');
  lines.push(`Average execution proof score: **${report.averageProofScore}/100**`);
  lines.push('');

  lines.push('## History Summary');
  lines.push('');
  lines.push(`- Total proof attempts: ${report.historySummary.totalProofAttempts}`);
  lines.push(`- Proven fixes: ${report.historySummary.provenFixes}`);
  lines.push(`- Partial fixes: ${report.historySummary.partialFixes}`);
  lines.push(`- Regressions: ${report.historySummary.regressions}`);
  lines.push(`- Loop risks: ${report.historySummary.loopRisks}`);
  lines.push(`- Insufficient evidence: ${report.historySummary.insufficientEvidenceCount}`);
  lines.push('');

  if (report.evolutionMemory.length > 0) {
    lines.push('## Evolution Memory');
    lines.push('');
    for (const memory of report.evolutionMemory.slice(0, 6)) {
      lines.push(`- **${memory.problemType}:** ${memory.reusableGuidance}`);
    }
    lines.push('');
  }

  lines.push('## Pass Token');
  lines.push('');
  lines.push(EXECUTION_PROOF_EVOLUTION_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}

export function buildSampleExecutionProofReportMarkdown(
  assessments: ExecutionProofAssessment[],
): string {
  const averageProofScore =
    assessments.length === 0
      ? 0
      : Math.round(
          assessments.reduce((sum, item) => sum + item.executionProofScore, 0) / assessments.length,
        );

  const verdictDistribution = {
    PROVEN_FIXED: 0,
    PARTIALLY_PROVEN: 0,
    NOT_PROVEN: 0,
    REGRESSION_DETECTED: 0,
    INSUFFICIENT_EVIDENCE: 0,
    LOOP_RISK: 0,
  } as ExecutionProofReport['verdictDistribution'];

  for (const item of assessments) {
    verdictDistribution[item.verdict] += 1;
  }

  return buildExecutionProofEvolutionReportMarkdown({
    generatedAt: new Date().toISOString(),
    phaseName: EXECUTION_PROOF_EVOLUTION_PHASE,
    purpose:
      'Prove whether an AutoFix/capability/change actually solved the original problem — code change ≠ proof.',
    assessments,
    verdictDistribution,
    averageProofScore,
    historySummary: {
      totalProofAttempts: assessments.length,
      provenFixes: verdictDistribution.PROVEN_FIXED,
      partialFixes: verdictDistribution.PARTIALLY_PROVEN,
      regressions: verdictDistribution.REGRESSION_DETECTED,
      loopRisks: verdictDistribution.LOOP_RISK,
      insufficientEvidenceCount: verdictDistribution.INSUFFICIENT_EVIDENCE,
    },
    evolutionMemory: [],
    passToken: EXECUTION_PROOF_EVOLUTION_PASS_TOKEN,
  });
}
