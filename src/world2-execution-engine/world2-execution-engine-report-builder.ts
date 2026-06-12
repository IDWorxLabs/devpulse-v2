/**
 * World 2 Execution Engine — markdown report builder.
 */

import {
  MAX_QUEUED_STEPS,
  MAX_RUN_DURATION_MS,
  MAX_SIMULATED_STEPS,
  WORLD2_EXECUTION_ENGINE_PASS_TOKEN,
  WORLD2_EXECUTION_ENGINE_PHASE,
  WORLD2_EXECUTION_ENGINE_REPORT_TITLE,
  WORLD2_EXECUTION_MODES,
  WORLD2_FORBIDDEN_SCOPE,
} from './world2-execution-engine-registry.js';
import type { World2ExecutionEngineReport } from './world2-execution-engine-types.js';

export function buildWorld2ExecutionEngineReportMarkdown(
  report: World2ExecutionEngineReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_EXECUTION_ENGINE_REPORT_TITLE}`,
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
    '## Execution Modes',
    '',
  ];

  for (const mode of WORLD2_EXECUTION_MODES) {
    lines.push(`- ${mode}`);
  }
  lines.push('');

  lines.push('## Engine Verdict');
  lines.push('');
  lines.push(`**Mode:** ${assessment.executionMode}`);
  lines.push(`**Final state:** ${assessment.finalState}`);
  lines.push('');
  lines.push(`Engine run ID: ${assessment.engineRunId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId ?? 'none'}`);
  lines.push(`Step count: ${assessment.steps.length}`);
  lines.push('');

  lines.push('## Queue Bounds');
  lines.push('');
  lines.push('| Bound | Value |');
  lines.push('|-------|-------|');
  lines.push(`| maxQueuedSteps | ${MAX_QUEUED_STEPS} |`);
  lines.push(`| maxSimulatedSteps | ${MAX_SIMULATED_STEPS} |`);
  lines.push(`| maxRunDurationMs | ${MAX_RUN_DURATION_MS} |`);
  lines.push(`| queued (this run) | ${assessment.queueSnapshot.queuedStepCount} |`);
  lines.push(`| simulated (this run) | ${assessment.queueSnapshot.simulatedStepCount} |`);
  lines.push(`| recursive runs blocked | ${assessment.queueSnapshot.recursiveRunBlocked} |`);
  lines.push('');

  lines.push('## Forbidden Scope');
  lines.push('');
  for (const scope of WORLD2_FORBIDDEN_SCOPE) {
    lines.push(`- ${scope}`);
  }
  lines.push('');

  if (assessment.steps.length > 0) {
    lines.push('## Execution Steps');
    lines.push('');
    lines.push('| Step ID | Action | Status | Validation | Rollback |');
    lines.push('|---------|--------|--------|------------|----------|');
    for (const step of assessment.steps.slice(0, 12)) {
      lines.push(
        `| ${step.stepId} | ${step.actionType} | ${step.status} | ${step.validationRequired} | ${step.rollbackRequired} |`,
      );
    }
    lines.push('');
  }

  if (assessment.auditTrail.length > 0) {
    lines.push('## Audit Trail');
    lines.push('');
    for (const entry of assessment.auditTrail.slice(0, 8)) {
      lines.push(`- **${entry.stepId}** — ${entry.whyAllowed}`);
      lines.push(`  - Plan: ${entry.sourcePlanId}`);
      lines.push(`  - Contract: ${entry.sourceContractId ?? 'none'}`);
      if (entry.requiredValidation.length > 0) {
        lines.push(`  - Validation: ${entry.requiredValidation[0]}`);
      }
    }
    lines.push('');
  }

  if (assessment.blockers.length > 0) {
    lines.push('## Blockers');
    lines.push('');
    for (const blocker of assessment.blockers.slice(0, 8)) {
      lines.push(`- ${blocker}`);
    }
    lines.push('');
  }

  if (assessment.warnings.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const warning of assessment.warnings.slice(0, 8)) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  if (assessment.nextRequiredValidation.length > 0) {
    lines.push('## Next Required Validation');
    lines.push('');
    for (const item of assessment.nextRequiredValidation.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  lines.push('## Pass Token');
  lines.push('');
  lines.push(WORLD2_EXECUTION_ENGINE_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
