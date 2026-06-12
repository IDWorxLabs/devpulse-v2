/**
 * Autonomous Builder Execution Sandbox — markdown report builder.
 */

import {
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PASS_TOKEN,
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PHASE,
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_REPORT_TITLE,
  SANDBOX_ELIGIBILITY_STATES,
  SANDBOX_FORBIDDEN_ACTIONS,
} from './autonomous-builder-execution-sandbox-registry.js';
import type { SandboxExecutionReport } from './autonomous-builder-execution-sandbox-types.js';

export function buildAutonomousBuilderExecutionSandboxReportMarkdown(
  report: SandboxExecutionReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_REPORT_TITLE}`,
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
    '## Eligibility States',
    '',
  ];

  for (const state of SANDBOX_ELIGIBILITY_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Sandbox Verdict');
  lines.push('');
  lines.push(`**${assessment.eligibilityState}**`);
  lines.push('');
  lines.push(`Sandbox ID: ${assessment.sandboxId}`);
  lines.push(`Plan ID: ${assessment.planId ?? 'none'}`);
  lines.push(`Risk level: ${assessment.riskLevel ?? 'n/a'}`);
  lines.push('');

  lines.push('## Readiness Review');
  lines.push('');
  lines.push('| Dimension | Readiness |');
  lines.push('|-----------|-----------|');
  lines.push(`| Rollback | ${assessment.readinessReview.rollbackReadinessPercent}% |`);
  lines.push(`| Verification | ${assessment.readinessReview.verificationReadinessPercent}% |`);
  lines.push(`| Proof | ${assessment.readinessReview.proofReadinessPercent}% |`);
  lines.push(`| Execution | ${assessment.readinessReview.executionReadinessPercent}% |`);
  lines.push(`| Risk | ${assessment.readinessReview.riskReadinessPercent}% |`);
  lines.push('');

  lines.push('## Safety Review');
  lines.push('');
  if (assessment.blockingReasons.length === 0) {
    lines.push('- No blockers');
  } else {
    for (const reason of assessment.blockingReasons.slice(0, 8)) {
      lines.push(`- ${reason}`);
    }
  }
  lines.push('');
  if (assessment.warningReasons.length > 0) {
    lines.push('### Warnings');
    lines.push('');
    for (const reason of assessment.warningReasons.slice(0, 8)) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  lines.push('## Sandbox Boundaries');
  lines.push('');
  lines.push('The following actions are **forbidden** in all sandbox contexts:');
  lines.push('');
  for (const forbidden of SANDBOX_FORBIDDEN_ACTIONS) {
    lines.push(`- ${forbidden}`);
  }
  lines.push('');

  if (assessment.executionContract) {
    const contract = assessment.executionContract;
    lines.push('## Execution Contract');
    lines.push('');
    lines.push(`Contract ID: ${contract.contractId}`);
    lines.push('');
    lines.push('### Allowed Actions');
    lines.push('');
    for (const action of contract.allowedActions) {
      lines.push(`- ${action}`);
    }
    lines.push('');
    lines.push('### Forbidden Actions');
    lines.push('');
    for (const action of contract.forbiddenActions) {
      lines.push(`- ${action}`);
    }
    lines.push('');
    lines.push('### Required Validation');
    lines.push('');
    for (const item of contract.requiredValidation.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('### Rollback Requirements');
    lines.push('');
    for (const item of contract.rollbackRequirements.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('### Success Requirements');
    lines.push('');
    for (const item of contract.successRequirements.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  lines.push('## Pass Token');
  lines.push('');
  lines.push(AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
