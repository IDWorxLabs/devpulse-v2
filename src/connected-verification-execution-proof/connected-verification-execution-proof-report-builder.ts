/**
 * Connected Verification Execution Proof — markdown report builder.
 */

import {
  CONNECTED_VERIFICATION_EXECUTION_PROOF_CORE_QUESTION,
  CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS_TOKEN,
  CONNECTED_VERIFICATION_EXECUTION_PROOF_PHASE,
  CONNECTED_VERIFICATION_EXECUTION_PROOF_REPORT_TITLE,
  SAFETY_GUARANTEES,
} from './connected-verification-execution-proof-registry.js';
import type { VerificationExecutionProofReport } from './connected-verification-execution-proof-types.js';

export function buildVerificationExecutionProofReportMarkdown(
  report: VerificationExecutionProofReport,
): string {
  const lines: string[] = [
    `# ${CONNECTED_VERIFICATION_EXECUTION_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_VERIFICATION_EXECUTION_PROOF_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_VERIFICATION_EXECUTION_PROOF_PHASE,
    '',
    '## CONNECTED VERIFICATION EXECUTION PROOF',
    '',
    `**Verification proof level:** ${report.verificationProofLevel}`,
    `**Verification state:** ${report.verificationState}`,
    `**Preview experience proven:** ${report.previewExperienceProven ? 'YES' : 'NO'}`,
    '',
    '## Verification State',
    '',
    `- state: **${report.verificationState}**`,
    `- readiness: **${report.readiness.readinessState}**`,
    '',
    '## Verification Run Evidence',
    '',
    `- run observed: ${report.run.runObserved}`,
    `- run id: ${report.run.runId ?? 'none'}`,
    `- status: ${report.run.runState}`,
    `- executor: ${report.run.executor ?? 'none'}`,
    '',
    '## Verification Target Evidence',
    '',
    `- target state: **${report.target.targetState}**`,
    `- linked to preview: ${report.target.targetLinkedToPreview}`,
    `- linked to runtime: ${report.target.targetLinkedToRuntime}`,
    `- target url: ${report.target.targetUrl ?? 'none'}`,
    '',
    '## Verification Result Evidence',
    '',
    `- results observed: ${report.results.resultsObserved}`,
    `- pass/fail/warn/skip: ${report.results.passCount}/${report.results.failCount}/${report.results.warningCount}/${report.results.skippedCount}`,
    `- result state: **${report.results.resultState}**`,
    '',
    '## Verification Evidence Artifacts',
    '',
    `- evidence state: **${report.evidence.evidenceState}**`,
    `- evidence count: ${report.evidence.evidenceCount}`,
    `- types: ${report.evidence.evidenceTypes.join(', ') || 'none'}`,
    '',
    '## Failure Analysis',
    '',
    `- failures: ${report.failures.failures.length}`,
    `- critical: ${report.failures.criticalCount}`,
    '',
    '## Readiness Analysis',
    '',
    `- readiness: **${report.readiness.readinessState}**`,
    `- can proceed: ${report.readiness.canProceed}`,
    `- summary: ${report.readiness.founderSummary}`,
    '',
    '## Manifest Evidence',
    '',
    `- manifest exists: ${report.manifest.manifestExists}`,
    `- traceability score: ${report.manifest.traceabilityScore}/100`,
    '',
    '## Linkage Analysis',
    '',
    `- verification linkage connected: **${report.linkage.verificationLinkageConnected ? 'YES' : 'NO'}**`,
    `- first broken verification link: ${report.linkage.firstBrokenVerificationLink ?? 'none'}`,
    `- traceability score: ${report.linkage.traceabilityScore}/100`,
    '',
    '## Missing Evidence',
    '',
  ];

  for (const item of report.missingEvidence) {
    lines.push(`- ${item}`);
  }

  lines.push('');
  lines.push('## Recommended Fix');
  lines.push('');
  lines.push(report.recommendedFix);
  lines.push('');
  lines.push('## Founder Questions');
  lines.push('');
  lines.push('| Question | Answer |');
  lines.push('|----------|--------|');
  lines.push(`| Can verification be trusted? | ${report.founderQuestions.canVerificationBeTrusted ? 'YES' : 'NO'} |`);
  lines.push(`| Was generated app verified? | ${report.founderQuestions.wasGeneratedAppVerified ? 'YES' : 'NO'} |`);

  lines.push('');
  lines.push('## Safety Guarantees');
  lines.push('');
  for (const g of SAFETY_GUARANTEES) {
    lines.push(`- ${g}`);
  }

  lines.push('');
  lines.push(`Pass token: \`${CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS_TOKEN}\``);
  lines.push('');

  return lines.join('\n');
}

export function formatVerificationExecutionProofSummary(
  report: VerificationExecutionProofReport,
): string {
  return (
    `Connected Verification Execution Proof: ${report.verificationProofLevel} — ` +
    `state ${report.verificationState}, readiness ${report.readiness.readinessState}, ` +
    `linkage ${report.linkage.verificationLinkageConnected ? 'connected' : 'broken'}.`
  );
}
