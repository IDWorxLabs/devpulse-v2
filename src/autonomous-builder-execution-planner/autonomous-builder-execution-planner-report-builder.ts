/**
 * Autonomous Builder Execution Planner — markdown report builder.
 */

import {
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PASS_TOKEN,
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PHASE,
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_REPORT_TITLE,
  EXECUTION_PLAN_COMPLEXITIES,
  EXECUTION_PLAN_RISK_LEVELS,
  EXECUTION_PLAN_TYPES,
} from './autonomous-builder-execution-planner-registry.js';
import type { ExecutionPlannerReport } from './autonomous-builder-execution-planner-types.js';

export function buildAutonomousBuilderExecutionPlannerReportMarkdown(
  report: ExecutionPlannerReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${AUTONOMOUS_BUILDER_EXECUTION_PLANNER_REPORT_TITLE}`,
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
    '## Plan Types',
    '',
  ];

  for (const planType of EXECUTION_PLAN_TYPES) {
    lines.push(`- ${planType}`);
  }
  lines.push('');

  lines.push('## Risk Matrix');
  lines.push('');
  lines.push('| Risk Level | Typical Plans |');
  lines.push('|------------|---------------|');
  for (const risk of EXECUTION_PLAN_RISK_LEVELS) {
    lines.push(`| ${risk} | FIX / RETEST / ROLLBACK scoped to ${risk} severity findings |`);
  }
  lines.push('');

  lines.push('## Complexity Matrix');
  lines.push('');
  lines.push('| Complexity | Typical Plans |');
  lines.push('|------------|---------------|');
  for (const complexity of EXECUTION_PLAN_COMPLEXITIES) {
    lines.push(`| ${complexity} | Validation/retest (${complexity === 'TRIVIAL' || complexity === 'SMALL' ? 'yes' : 'no'}) — fix/rollback scale with severity |`);
  }
  lines.push('');

  if (assessment.plan) {
    const plan = assessment.plan;
    lines.push('## Sample Plan');
    lines.push('');
    lines.push(`- **Plan ID:** ${plan.planId}`);
    lines.push(`- **Type:** ${plan.planType}`);
    lines.push(`- **Repair decision:** ${plan.repairDecision}`);
    lines.push(`- **Reason:** ${plan.reason}`);
    lines.push(`- **Risk:** ${plan.riskLevel}`);
    lines.push(`- **Complexity:** ${plan.estimatedComplexity}`);
    lines.push(`- **Expected outcome:** ${plan.expectedOutcome}`);
    lines.push('');

    lines.push('### Steps');
    lines.push('');
    for (const step of plan.steps) {
      lines.push(`${step.order}. **${step.title}** — ${step.description}`);
    }
    lines.push('');

    lines.push('## Verification Strategy');
    lines.push('');
    lines.push(`- **Validation:** ${plan.verificationPlan.validationStrategy}`);
    lines.push(`- **Execution proof:** ${plan.verificationPlan.executionProofStrategy}`);
    lines.push(`- **Founder test:** ${plan.verificationPlan.founderTestStrategy}`);
    lines.push(`- **Acceptance:** ${plan.verificationPlan.acceptanceStrategy}`);
    lines.push('');

    lines.push('## Rollback Strategy');
    lines.push('');
    lines.push(`- **Trigger:** ${plan.rollbackPlan.rollbackTrigger}`);
    lines.push(`- **Method:** ${plan.rollbackPlan.rollbackMethod}`);
    lines.push(`- **Success criteria:** ${plan.rollbackPlan.rollbackSuccessCriteria}`);
    lines.push('');

    lines.push('### Success Criteria');
    lines.push('');
    for (const criterion of plan.successCriteria) {
      lines.push(`- ${criterion}`);
    }
    lines.push('');
  } else {
    lines.push('## Plan');
    lines.push('');
    lines.push(`No executable plan — ${assessment.nonExecutableReason ?? 'repair decision STOP'}`);
    lines.push('');
  }

  lines.push('## Pass Token');
  lines.push('');
  lines.push(AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
