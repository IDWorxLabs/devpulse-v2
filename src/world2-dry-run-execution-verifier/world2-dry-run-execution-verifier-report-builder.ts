/**
 * World 2 Dry-Run Execution Verifier — markdown report builder.
 */

import {
  READINESS_SCORE_WEIGHTS,
  VERIFIED_MIN_SCORE,
  VERIFIED_WITH_WARNINGS_MIN_SCORE,
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_PASS_TOKEN,
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_PHASE,
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_REPORT_TITLE,
  WORLD2_DRY_RUN_VERIFIER_CORE_QUESTION,
  WORLD2_DRY_RUN_VERIFIER_SAFETY_GUARANTEES,
  WORLD2_DRY_RUN_VERIFICATION_STATES,
} from './world2-dry-run-execution-verifier-registry.js';
import type { World2DryRunExecutionVerifierReport } from './world2-dry-run-execution-verifier-types.js';

export function buildWorld2DryRunExecutionVerifierReportMarkdown(
  report: World2DryRunExecutionVerifierReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_DRY_RUN_EXECUTION_VERIFIER_REPORT_TITLE}`,
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
    '## Verification States',
    '',
  ];

  for (const state of WORLD2_DRY_RUN_VERIFICATION_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Verification Verdict');
  lines.push('');
  lines.push(`**Verification state:** ${assessment.verificationState}`);
  lines.push(`Verification ID: ${assessment.verificationId}`);
  lines.push(`Package ID: ${assessment.packageId ?? 'none'}`);
  lines.push(`Readiness score: ${assessment.readinessScore}/100`);
  lines.push(`Real execution performed: ${assessment.realExecutionPerformed}`);
  lines.push('');

  lines.push('## Readiness Scoring Weights');
  lines.push('');
  lines.push(`- Ordered steps: ${READINESS_SCORE_WEIGHTS.orderedSteps} points`);
  lines.push(`- Safety checks: ${READINESS_SCORE_WEIGHTS.safetyChecks} points`);
  lines.push(`- Validation coverage: ${READINESS_SCORE_WEIGHTS.validationCoverage} points`);
  lines.push(`- Rollback coverage: ${READINESS_SCORE_WEIGHTS.rollbackCoverage} points`);
  lines.push(`- Audit coverage: ${READINESS_SCORE_WEIGHTS.auditCoverage} points`);
  lines.push(`- Upstream consistency: ${READINESS_SCORE_WEIGHTS.upstreamConsistency} points`);
  lines.push('');
  lines.push(`VERIFIED threshold: >= ${VERIFIED_MIN_SCORE}`);
  lines.push(`VERIFIED_WITH_WARNINGS threshold: >= ${VERIFIED_WITH_WARNINGS_MIN_SCORE}`);
  lines.push('');

  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of WORLD2_DRY_RUN_VERIFIER_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');

  lines.push('### Ordered Step Checks');
  lines.push('');
  for (const check of assessment.orderedStepChecks) {
    lines.push(
      `- [${check.passed ? 'PASS' : 'FAIL'}] ${check.expectedStepId} (order ${check.expectedOrder}): ${check.detail}`,
    );
  }
  lines.push('');

  lines.push('### Safety Checks');
  lines.push('');
  for (const check of assessment.safetyChecks) {
    lines.push(`- [${check.passed ? 'PASS' : 'FAIL'}] ${check.label}: ${check.detail}`);
  }
  lines.push('');

  if (assessment.missingCoverage.length > 0) {
    lines.push('## Missing Coverage');
    lines.push('');
    for (const gap of assessment.missingCoverage.slice(0, 8)) {
      lines.push(`- ${gap}`);
    }
    lines.push('');
  }

  if (assessment.blockingReasons.length > 0) {
    lines.push('## Blocking Reasons');
    lines.push('');
    for (const reason of assessment.blockingReasons.slice(0, 8)) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  if (assessment.warningReasons.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const reason of assessment.warningReasons.slice(0, 8)) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  lines.push('## Pass Token');
  lines.push('');
  lines.push(WORLD2_DRY_RUN_EXECUTION_VERIFIER_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
