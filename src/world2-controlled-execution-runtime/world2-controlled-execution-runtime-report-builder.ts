/**
 * World 2 Controlled Execution Runtime — markdown report builder.
 */

import {
  MAX_ATTEMPTS,
  MAX_REPAIRS,
  MAX_RUNTIME_MS,
  MAX_SANDBOX_FAILURES,
  MAX_VALIDATIONS,
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_PASS_TOKEN,
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_PHASE,
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_REPORT_TITLE,
  WORLD2_EXECUTION_STATES,
  WORLD2_FORBIDDEN_ACTIONS,
} from './world2-controlled-execution-runtime-registry.js';
import type { World2RuntimeReport } from './world2-controlled-execution-runtime-types.js';

export function buildWorld2ControlledExecutionRuntimeReportMarkdown(
  report: World2RuntimeReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_CONTROLLED_EXECUTION_RUNTIME_REPORT_TITLE}`,
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
    '## Execution States',
    '',
  ];

  for (const state of WORLD2_EXECUTION_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## World 2 Verdict');
  lines.push('');
  lines.push(`**${assessment.executionState}**`);
  lines.push('');
  lines.push(`Runtime ID: ${assessment.runtimeId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push(`Plan ID: ${assessment.executionPlanId ?? 'none'}`);
  lines.push(`Sandbox eligibility: ${assessment.sandboxEligibilityState}`);
  lines.push(`Risk level: ${assessment.riskLevel ?? 'n/a'}`);
  lines.push('');

  lines.push('## Runtime Limits');
  lines.push('');
  lines.push('| Limit | Value |');
  lines.push('|-------|-------|');
  lines.push(`| MAX_RUNTIME | ${MAX_RUNTIME_MS} ms |`);
  lines.push(`| MAX_ATTEMPTS | ${MAX_ATTEMPTS} |`);
  lines.push(`| MAX_VALIDATIONS | ${MAX_VALIDATIONS} |`);
  lines.push(`| MAX_REPAIRS | ${MAX_REPAIRS} |`);
  lines.push(`| MAX_SANDBOX_FAILURES | ${MAX_SANDBOX_FAILURES} |`);
  lines.push('');

  lines.push('## Termination Authority');
  lines.push('');
  lines.push(`Decision: **${assessment.terminationAssessment.decision}**`);
  lines.push('');
  lines.push(`Attempt budget remaining: ${assessment.terminationAssessment.attemptBudgetRemaining}`);
  lines.push(`Proof failure: ${assessment.terminationAssessment.proofFailureDetected}`);
  lines.push(`Acceptance failure: ${assessment.terminationAssessment.acceptanceFailureDetected}`);
  lines.push(`Regression: ${assessment.terminationAssessment.regressionDetected}`);
  lines.push(`Loop risk: ${assessment.terminationAssessment.loopRiskDetected}`);
  lines.push('');
  if (assessment.terminationAssessment.reasons.length > 0) {
    lines.push('### Termination Reasons');
    lines.push('');
    for (const reason of assessment.terminationAssessment.reasons.slice(0, 8)) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  lines.push('## Safety Guarantees');
  lines.push('');
  lines.push('The following are **explicitly prohibited** during World 2 authorization:');
  lines.push('');
  for (const forbidden of WORLD2_FORBIDDEN_ACTIONS) {
    lines.push(`- ${forbidden}`);
  }
  lines.push('');

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

  if (assessment.executionContract) {
    const contract = assessment.executionContract;
    lines.push('## World 2 Execution Contract');
    lines.push('');
    lines.push(`Contract ID: ${contract.contractId}`);
    lines.push(`Workspace ID: ${contract.workspaceId}`);
    lines.push(`Execution plan ID: ${contract.executionPlanId}`);
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
    lines.push('### Resource Limits');
    lines.push('');
    lines.push(`- maxRuntimeMs: ${contract.resourceLimits.maxRuntimeMs}`);
    lines.push(`- maxAttempts: ${contract.resourceLimits.maxAttempts}`);
    lines.push(`- maxValidations: ${contract.resourceLimits.maxValidations}`);
    lines.push(`- maxRepairs: ${contract.resourceLimits.maxRepairs}`);
    lines.push(`- maxSandboxFailures: ${contract.resourceLimits.maxSandboxFailures}`);
    lines.push('');
    lines.push('### Rollback Requirements');
    lines.push('');
    for (const item of contract.rollbackRequirements.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('### Verification Requirements');
    lines.push('');
    for (const item of contract.verificationRequirements.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('### Acceptance Requirements');
    lines.push('');
    for (const item of contract.acceptanceRequirements.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('### Termination Conditions');
    lines.push('');
    for (const item of contract.terminationConditions) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  lines.push('## Pass Token');
  lines.push('');
  lines.push(WORLD2_CONTROLLED_EXECUTION_RUNTIME_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
