/**
 * Founder Launch Decision Authority — markdown report builder.
 */

import {
  FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS_TOKEN,
  FOUNDER_LAUNCH_DECISION_AUTHORITY_PHASE,
  FOUNDER_LAUNCH_DECISION_AUTHORITY_REPORT_TITLE,
  FOUNDER_LAUNCH_DECISION_CORE_QUESTION,
  SAFETY_GUARANTEES,
} from './founder-launch-decision-authority-registry.js';
import type { FounderLaunchDecisionReport } from './founder-launch-decision-authority-types.js';

export function buildFounderLaunchDecisionReportMarkdown(
  report: FounderLaunchDecisionReport,
): string {
  const lines: string[] = [
    `# ${FOUNDER_LAUNCH_DECISION_AUTHORITY_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Phase',
    '',
    FOUNDER_LAUNCH_DECISION_AUTHORITY_PHASE,
    '',
    '## Core Question',
    '',
    FOUNDER_LAUNCH_DECISION_CORE_QUESTION,
    '',
    '# Founder Launch Decision Authority',
    '',
    '## Founder Launch Decision',
    '',
    `**${report.founderLaunchDecision}**`,
    '',
    '## Can Launch Now',
    '',
    report.canLaunchNow ? '**YES** — proof chain supports founder launch.' : '**NO** — launch not supported by current evidence.',
    '',
    '## Decision Confidence',
    '',
    `- decision confidence: ${report.decisionConfidence}/100`,
    `- founder decision confidence: ${report.founderDecisionConfidence}/100`,
    `- proof chain score: ${report.proofChainScore}/100`,
    `- launch readiness score: ${report.launchReadinessScore}/100`,
    `- runtime confidence score: ${report.runtimeConfidenceScore}/100`,
    `- risk score: ${report.riskScore}/100`,
    '',
    '## Proof Chain Summary',
    '',
    `- execution state: **${report.proofSignals.executionState}**`,
    `- execution verdict: **${report.proofSignals.executionVerdict}**`,
    `- proof chain score: ${report.proofSignals.proofChainScore}/100`,
    '',
    ...report.proofSignals.signals.map(
      (s) => `- [${s.strength}] ${s.label}: ${s.detail} (${s.sourceAuthority})`,
    ),
    '',
    '## Runtime Confidence',
    '',
    `- runtime proven: ${report.proofSignals.runtimeProven ? 'YES' : 'NO'}`,
    `- runtime confidence score: ${report.runtimeConfidenceScore}/100`,
    `- preview proven: ${report.proofSignals.previewProven ? 'YES' : 'NO'}`,
    '',
    '## Launch Readiness Summary',
    '',
    `- launch readiness proven: ${report.proofSignals.launchReadinessProven ? 'YES' : 'NO'}`,
    `- launch readiness score: ${report.launchReadinessScore}/100`,
    '',
    '## Blockers',
    '',
    `- critical: ${report.blockers.criticalCount}`,
    `- high: ${report.blockers.highCount}`,
    '',
    ...report.blockers.blockers.map(
      (b) => `- [${b.severity}] ${b.message} → ${b.recommendedFix}`,
    ),
    ...(report.blockers.blockers.length === 0 ? ['- none'] : []),
    '',
    '## Risks',
    '',
    `- risk level: **${report.riskSignals.riskLevel}**`,
    `- risk score: ${report.riskSignals.riskScore}/100`,
    '',
    ...report.riskSignals.riskSignals.map((r) => `- ${r}`),
    ...(report.riskSignals.riskSignals.length === 0 ? ['- none identified'] : []),
    '',
    '## Missing Evidence',
    '',
    ...report.missingEvidence.map((m) => `- ${m}`),
    ...(report.missingEvidence.length === 0 ? ['- none reported'] : []),
    '',
    '## Recommended Next Actions',
    '',
    ...report.recommendedNextActions.map((a) => `- ${a}`),
    ...(report.recommendedNextActions.length === 0 ? ['- none'] : []),
    '',
    '## Final Founder Verdict',
    '',
    report.decisionSummary,
    '',
    `Reason: ${report.reason}`,
    '',
    '## Safety',
    '',
    ...SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '## Pass Token',
    '',
    FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS_TOKEN,
  ];

  return lines.join('\n');
}

export function formatFounderLaunchDecisionSummary(report: FounderLaunchDecisionReport): string {
  return (
    `Founder Launch Decision: ${report.founderLaunchDecision} — ` +
    `canLaunchNow=${report.canLaunchNow}, confidence=${report.decisionConfidence}/100. ` +
    report.reason
  );
}
