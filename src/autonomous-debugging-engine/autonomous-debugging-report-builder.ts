/**
 * Autonomous Debugging Engine — pipeline report builder.
 */

import type { AutonomousDebuggingPipelineResult } from './autonomous-debugging-types.js';

export function buildAutonomousDebuggingPipelineReport(
  result: AutonomousDebuggingPipelineResult,
): string {
  return [
    '# Autonomous Debugging Pipeline Report',
    '',
    `**Pipeline ID:** ${result.pipelineId}`,
    `**Verdict:** ${result.permissionVerdict}`,
    `**Blocked:** ${result.blockedReason ?? 'none'}`,
    '',
    '## Failure Intake',
    ...result.intakeRecords.map((r) => `- [${r.sourceGate}] ${r.failureType}: ${r.observedResult}`),
    '',
    '## Normalized Failures',
    ...result.normalizedFailures.map((f) => `- ${f.category} (${f.severity}): ${f.observed}`),
    '',
    '## Root Causes',
    ...result.rootCauses.map((rc) => `- ${rc.causeSummary} (${rc.confidence}) → ${rc.responsibleSubsystem}`),
    '',
    '## Repair Loops',
    ...result.repairLoops.map(
      (l) =>
        `- ${l.loopId}: ${l.resolved ? 'RESOLVED' : l.escalated ? 'ESCALATED' : 'FAILED'} (${l.attempts.length} attempts)`,
    ),
    '',
    '## Repair Attempts',
    ...result.repairAttempts.map(
      (a) =>
        `- Attempt ${a.attemptNumber}: ${a.outcome} — targeted ${a.targetedValidationPassed ? 'PASS' : 'FAIL'}, regression ${a.regressionValidationPassed ? 'PASS' : 'FAIL'}`,
    ),
    '',
    '## Human Review',
    result.humanReview
      ? `- ${result.humanReview.problemSummary}\n- Blocked: ${result.humanReview.blockedReason}\n- Decision: ${result.humanReview.recommendedHumanDecision}`
      : '- none',
  ].join('\n');
}
