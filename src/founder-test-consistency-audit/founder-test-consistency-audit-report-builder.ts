/**
 * Phase 26.70 — Founder Test Consistency Audit report builder (V1).
 */

import type {
  ConsistencyClaimAudit,
  FounderTestConsistencyAuditReport,
  FounderTruthMatrix,
} from './founder-test-consistency-audit-types.js';
import { FOUNDER_TEST_CONSISTENCY_AUDIT_REPORT_TITLE } from './founder-test-consistency-audit-registry.js';

function formatClaimAudit(audit: ConsistencyClaimAudit): string[] {
  return [
    `### ${audit.claim}`,
    '',
    `- **Claim:** ${audit.claim}`,
    `- **Chat Verdict:** ${audit.chatVerdict}`,
    `- **Founder Verdict:** ${audit.founderTestVerdict}`,
    `- **Authority Verdicts:** ${audit.authorityVerdicts.map((v) => `${v.displayName}=${v.verdict} (${v.detail})`).join('; ') || 'none'}`,
    `- **Root Cause:** ${audit.rootCause}`,
    `- **Final Truth:** ${audit.finalTruth}`,
    `- **Confidence:** ${audit.confidence}`,
    `- **Contradiction:** ${audit.contradictionDetected ? audit.contradictionReason : 'none'}`,
    '',
  ];
}

function formatTruthMatrix(matrix: FounderTruthMatrix): string[] {
  const lines = [
    '## FOUNDER_TRUTH_MATRIX',
    '',
    '| Claim | Final Truth | Root Cause | Confidence | Contradiction |',
    '| ----- | ----------- | ---------- | ---------- | ------------- |',
  ];
  for (const row of matrix.rows) {
    lines.push(
      `| ${row.claim} | ${row.finalTruth} | ${row.rootCause} | ${row.confidence} | ${row.contradictionDetected ? 'YES' : 'NO'} |`,
    );
  }
  lines.push('', matrix.authoritativeNote, '');
  return lines;
}

export function buildFounderTestConsistencyAuditReportMarkdown(
  report: FounderTestConsistencyAuditReport,
): string {
  const lines = [
    `# ${FOUNDER_TEST_CONSISTENCY_AUDIT_REPORT_TITLE}`,
    '',
    `**Audit ID:** ${report.auditId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Core question:** ${report.coreQuestion}`,
    '',
    '## Founder Answer Summary',
    '',
    `- **What is actually true right now?** ${report.founderAnswerSummary.whatIsTrueNow}`,
    `- **What is actually broken right now?** ${report.founderAnswerSummary.whatIsBrokenNow}`,
    `- **Which authority is wrong when authorities disagree?** ${report.founderAnswerSummary.wrongAuthorityWhenDisagree}`,
    `- **Product gap vs testing-system gap?** ${report.founderAnswerSummary.productGapVsTestingGap}`,
    '',
    '## Contradictions Detected',
    '',
    ...(report.sections.contradictionsDetected.length
      ? report.sections.contradictionsDetected.map((line) => `- ${line}`)
      : ['- None detected']),
    '',
    '## Scoring Defects',
    '',
    ...(report.sections.scoringDefects.length
      ? report.sections.scoringDefects.map((line) => `- ${line}`)
      : ['- None detected']),
    '',
    '## Evidence Propagation Failures',
    '',
    ...(report.sections.evidencePropagationFailures.length
      ? report.sections.evidencePropagationFailures.map((line) => `- ${line}`)
      : ['- None detected']),
    '',
    '## Authority Disagreements',
    '',
    ...(report.sections.authorityDisagreements.length
      ? report.sections.authorityDisagreements.map((line) => `- ${line}`)
      : ['- None detected']),
    '',
    '## Real Product Gaps',
    '',
    ...(report.sections.realProductGaps.length
      ? report.sections.realProductGaps.map((line) => `- ${line}`)
      : ['- None detected']),
    '',
    '## Single Source Of Truth',
    '',
    ...report.sections.singleSourceOfTruth.map((line) => `- ${line}`),
    '',
    ...formatTruthMatrix(report.truthMatrix),
    '## Per-Claim Audit',
    '',
    ...report.claimAudits.flatMap((audit) => formatClaimAudit(audit)),
    '## Summary Counts',
    '',
    `- Contradictions: ${report.contradictionCount}`,
    `- Scoring defects: ${report.scoringDefectCount}`,
    `- Propagation failures: ${report.propagationFailureCount}`,
    `- Authority disagreements: ${report.authorityDisagreementCount}`,
    `- Real product gaps: ${report.realProductGapCount}`,
    `- Overall confidence: ${report.overallConfidence}`,
    '',
  ];
  return lines.join('\n');
}
