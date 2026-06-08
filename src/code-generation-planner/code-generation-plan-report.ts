/**
 * Code Generation Planner founder-readable report.
 */

import type {
  CodeGenerationPlan,
  CodeGenerationPlanReport,
  CodeGenerationPlannerState,
} from './types.js';
import { DUPLICATE_RISK_PREFIX, PLANNER_OWNER_MODULE } from './types.js';

export function buildCodeGenerationPlanReport(
  state: CodeGenerationPlannerState,
  plans: CodeGenerationPlan[],
): CodeGenerationPlanReport {
  const allTasks = plans.flatMap((p) => p.tasks);
  const latestPlan = plans.length > 0 ? plans[plans.length - 1] : null;
  const validationCount = allTasks.reduce((sum, t) => sum + t.validationRequirements.length, 0);
  const uiRequirementCount = allTasks.reduce((sum, t) => sum + t.uiRequirements.length, 0);
  const duplicateRiskCount = allTasks.reduce((sum, t) => sum + t.duplicateRisks.length, 0);

  let recommendation =
    'Code Generation Planner produces implementation plans — future code generation systems consume plans, not raw strategies.';
  if (state.planCount === 0) {
    recommendation =
      'Generate code plans from Implementation Strategy Engine output before any code generation.';
  } else if (duplicateRiskCount > 0) {
    recommendation =
      'Review DUPLICATE_RISK warnings — prefer integration, extension, or consolidation before planning tasks.';
  } else if (uiRequirementCount > 0) {
    recommendation =
      'Ensure UI_REGISTRATION_REQUIRED and CLICKABILITY_PROOF_REQUIRED are satisfied via Visible UI Guard before UI code generation.';
  }

  return {
    ownerModule: PLANNER_OWNER_MODULE,
    planCount: state.planCount,
    taskCount: allTasks.length,
    validationCount,
    uiRequirementCount,
    duplicateRiskCount,
    latestPlan: latestPlan
      ? {
          ...latestPlan,
          tasks: latestPlan.tasks.map((t) => ({
            ...t,
            targetModules: [...t.targetModules],
            targetFiles: [...t.targetFiles],
            validationRequirements: [...t.validationRequirements],
            uiRequirements: [...t.uiRequirements],
            duplicateRisks: [...t.duplicateRisks],
            warnings: [...t.warnings],
            errors: [...t.errors],
          })),
          warnings: [...latestPlan.warnings],
          errors: [...latestPlan.errors],
        }
      : null,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatCodeGenerationPlanReport(
  state: CodeGenerationPlannerState,
  plans: CodeGenerationPlan[],
): string {
  const report = buildCodeGenerationPlanReport(state, plans);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Code Generation Planner Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Planner ID: ${state.plannerId}`,
    `Plan count: ${report.planCount}`,
    `Task count: ${report.taskCount}`,
    `Validation count: ${report.validationCount}`,
    `UI requirement count: ${report.uiRequirementCount}`,
    `Duplicate risk count: ${report.duplicateRiskCount}`,
    '',
  ];

  if (report.latestPlan) {
    lines.push(`Latest plan: ${report.latestPlan.planId}`);
    lines.push(`  Strategy: ${report.latestPlan.strategyId}`);
    lines.push(`  Status: ${report.latestPlan.status}`);
    lines.push(`  Tasks: ${report.latestPlan.tasks.length}`);
    if (report.latestPlan.tasks.length > 0) {
      const latestTask = report.latestPlan.tasks[report.latestPlan.tasks.length - 1];
      lines.push(`  Latest task: ${latestTask.title}`);
      lines.push(`  Target files: ${latestTask.targetFiles.slice(0, 3).join(', ')}`);
    }
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const e of report.errors) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
