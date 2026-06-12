/**
 * Autonomous Repair Loop — markdown report builder.
 */

import {
  AUTONOMOUS_REPAIR_LOOP_PASS_TOKEN,
  AUTONOMOUS_REPAIR_LOOP_PHASE,
  AUTONOMOUS_REPAIR_LOOP_REPORT_TITLE,
  REPAIR_LOOP_ACTIONS,
} from './autonomous-repair-loop-registry.js';
import type { AutonomousRepairLoopReport } from './autonomous-repair-loop-types.js';

export function buildAutonomousRepairLoopReportMarkdown(report: AutonomousRepairLoopReport): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${AUTONOMOUS_REPAIR_LOOP_REPORT_TITLE}`,
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
    '## Core Question',
    '',
    assessment.coreQuestion,
    '',
    '## Finding',
    '',
  ];

  if (assessment.inputSnapshot.finding) {
    lines.push(`- **Summary:** ${assessment.inputSnapshot.finding.summary}`);
    lines.push(`- **Severity:** ${assessment.inputSnapshot.finding.severity}`);
    lines.push(`- **Source:** ${assessment.inputSnapshot.finding.sourceAuthority}`);
  } else {
    lines.push('- None — loop idle');
  }
  lines.push('');

  lines.push('## Attempts');
  lines.push('');
  if (assessment.attempts.length === 0) {
    lines.push('- None');
  } else {
    for (const attempt of assessment.attempts.slice(-6)) {
      lines.push(
        `- Attempt ${attempt.attemptNumber}: ${attempt.action} (proof=${attempt.executionProofVerdict ?? 'n/a'}, acceptance=${attempt.founderAcceptanceState ?? 'n/a'})`,
      );
    }
  }
  lines.push('');

  lines.push('## Proof Verdict');
  lines.push('');
  lines.push(assessment.inputSnapshot.executionProofVerdict ?? 'Not available');
  lines.push('');

  lines.push('## Acceptance Verdict');
  lines.push('');
  lines.push(assessment.inputSnapshot.founderAcceptanceState ?? 'Not available');
  lines.push('');

  lines.push('## Decision');
  lines.push('');
  lines.push(`- **Action:** ${assessment.decision.recommendedAction}`);
  lines.push(`- **Loop state:** ${assessment.decision.loopState}`);
  lines.push(`- **Reason:** ${assessment.decision.decisionReason}`);
  lines.push(`- **Attempt budget:** ${assessment.inputSnapshot.priorAttemptCount}/${assessment.inputSnapshot.attemptBudget}`);
  lines.push('');

  lines.push('## Supported Actions');
  lines.push('');
  for (const action of REPAIR_LOOP_ACTIONS) {
    lines.push(`- ${action}`);
  }
  lines.push('');

  if (assessment.decision.escalationGuidance) {
    const guidance = assessment.decision.escalationGuidance;
    lines.push('## Escalation Reasons');
    lines.push('');
    lines.push(`- ${guidance.whyEscalationHappened}`);
    lines.push(`- ${guidance.whyLoopStopped}`);
    lines.push('');

    lines.push('## Missing Capability Suggestions');
    lines.push('');
    for (const item of guidance.missingCapabilitySuggestions.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('## Missing Evidence Suggestions');
    lines.push('');
    for (const item of guidance.missingEvidenceSuggestions.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('## Diagnostic Recommendations');
    lines.push('');
    for (const item of guidance.diagnosticRecommendations.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  lines.push('## Pass Token');
  lines.push('');
  lines.push(AUTONOMOUS_REPAIR_LOOP_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
