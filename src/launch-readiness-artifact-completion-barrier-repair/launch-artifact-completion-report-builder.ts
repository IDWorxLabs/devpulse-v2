/**
 * Phase 26.98 — Launch artifact completion report builder (V1).
 */

import type { LaunchReadinessArtifactCompletionBarrierRepairReport } from './launch-readiness-artifact-completion-barrier-repair-types.js';
import {
  LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_CORE_QUESTION,
  LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS,
} from './launch-readiness-artifact-completion-barrier-repair-registry.js';

export function buildLaunchReadinessArtifactCompletionBarrierRepairReportMarkdown(
  report: LaunchReadinessArtifactCompletionBarrierRepairReport,
): string {
  const lines = [
    '# Launch Readiness Artifact Completion Barrier Repair Report',
    '',
    LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_CORE_QUESTION,
    '',
    `Repair ID: ${report.repairId}`,
    `Generated: ${report.generatedAt}`,
    `Repair applied: ${report.repairApplied ? 'yes' : 'no'}`,
    `Pass token: ${report.passToken ?? 'none'}`,
    '',
    '## Step audit',
    '',
    `- Rule 1 satisfied: ${report.stepAudit.rule1Satisfied}`,
    `- Chat stress started/settled/pending: ${report.stepAudit.chatStressStarted}/${report.stepAudit.chatStressSettled}/${report.stepAudit.chatStressPending}`,
    `- Chat settled but artifact active: ${report.stepAudit.chatSettledButArtifactActive}`,
    '',
    '## Budget result detection',
    '',
    `- Budget exceeded: ${report.budgetResultDetection.budgetExceeded}`,
    `- Degraded partial: ${report.budgetResultDetection.simulationDegradedPartial}`,
    `- Budget result dropped: ${report.budgetResultDetection.budgetResultDropped}`,
    '',
    '## Completion detection',
    '',
    `- Launch readiness assessment complete: ${report.completionDetection.launchReadinessAssessmentCompleteEmitted}`,
    `- Launch readiness assessment complete with warnings: ${report.completionDetection.launchReadinessAssessmentCompleteWithWarningsEmitted}`,
    `- Report markdown present: ${report.completionDetection.launchReadinessReportMarkdownPresent}`,
    '',
    '## Repair plan',
    '',
    `- Repair required: ${report.repairPlan.repairRequired}`,
    `- Failure class: ${report.repairPlan.failureClass}`,
    `- Actions: ${report.repairPlan.actions.join(', ') || 'none'}`,
  ];
  return lines.join('\n');
}

export function buildLaunchReadinessArtifactCompletionValidationMarkdown(input: {
  checks: readonly { name: string; passed: boolean; detail: string }[];
  passToken: string | null;
}): string {
  const lines = [
    '# Launch Readiness Artifact Completion Barrier Repair Validation',
    '',
    `Pass token: ${input.passToken ?? 'FAIL'}`,
    '',
    '## Checks',
    '',
  ];
  for (const check of input.checks) {
    lines.push(`- [${check.passed ? 'x' : ' '}] ${check.name}: ${check.detail}`);
  }
  if (input.passToken === LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS) {
    lines.push('', `**${LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS}**`);
  }
  return lines.join('\n');
}
