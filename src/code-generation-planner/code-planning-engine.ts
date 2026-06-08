/**
 * Rule-based code generation planning — no AI, LLM, code generation, or execution.
 */

import type { ImplementationPhase, ImplementationStrategy } from '../implementation-strategy-engine/types.js';
import { DUPLICATE_RISK_PREFIX as STRATEGY_DUP_PREFIX } from '../implementation-strategy-engine/types.js';
import { DUPLICATE_RISK_PREFIX as PACKAGE_DUP_PREFIX } from '../build-package-generator/types.js';
import { DUPLICATE_RISK_PREFIX as ARCHITECT_DUP_PREFIX } from '../product-architect/types.js';
import { generateUiGuardRequirements } from './code-plan-ui-guard-bridge.js';
import type {
  CodeGenerationPlan,
  CodePlanStatus,
  PlanDuplicateContext,
  PlannedImplementationTask,
} from './types.js';
import { DUPLICATE_RISK_PREFIX } from './types.js';

function createPlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toKebabCase(name: string): string {
  return name
    .replace(/Module$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function extractModuleFromPhase(phase: ImplementationPhase): string {
  const match = phase.title.match(/:\s*(\S+)/);
  return match?.[1] ?? `Module-${phase.order}`;
}

export function detectExistingCapabilities(context: PlanDuplicateContext): string[] {
  const capabilities = new Set<string>();

  for (const summary of context.brainSummaries) {
    const lower = summary.toLowerCase();
    const matches = lower.match(/\b([a-z]+(?:module|service|integration|screen|flow|package|plan))\b/gi) ?? [];
    for (const m of matches) capabilities.add(normalizeName(m));
  }

  for (const cap of context.vaultCapabilities) {
    capabilities.add(normalizeName(cap));
  }

  for (const warnings of [
    context.architectDuplicateWarnings,
    context.packageDuplicateWarnings,
    context.strategyDuplicateWarnings,
  ]) {
    for (const warning of warnings) {
      const nameMatch = warning.match(/:\s*(\S+)/);
      if (nameMatch?.[1]) capabilities.add(normalizeName(nameMatch[1]));
    }
  }

  return [...capabilities];
}

export function detectPotentialDuplicates(
  moduleName: string,
  context: PlanDuplicateContext,
): string[] {
  const existing = detectExistingCapabilities(context);
  const normalized = normalizeName(moduleName);
  const warnings: string[] = [];

  for (const cap of existing) {
    if (cap === normalized || cap.includes(normalized) || normalized.includes(cap)) {
      warnings.push(
        `${DUPLICATE_RISK_PREFIX}: ${moduleName} task may duplicate existing capability — recommend integration, extension, or consolidation`,
      );
      break;
    }
  }

  const corpus = [
    ...context.brainSummaries,
    ...context.vaultCapabilities,
    ...context.architectDuplicateWarnings,
    ...context.packageDuplicateWarnings,
    ...context.strategyDuplicateWarnings,
  ]
    .join(' ')
    .toLowerCase();

  const baseName = moduleName.replace(/Module|Service|Integration|Screen/gi, '').toLowerCase();
  if (baseName.length > 3 && corpus.includes(baseName) && warnings.length === 0) {
    warnings.push(
      `${DUPLICATE_RISK_PREFIX}: ${moduleName} may overlap existing capability "${baseName}" — recommend integration, extension, or consolidation`,
    );
  }

  return warnings;
}

export function generateModuleTargets(phase: ImplementationPhase): string[] {
  const moduleName = extractModuleFromPhase(phase);
  return [moduleName];
}

export function generateFileTargets(moduleName: string): string[] {
  const kebab = toKebabCase(moduleName);
  const files = [
    `src/modules/${kebab}/${kebab}.ts`,
    `src/modules/${kebab}/index.ts`,
  ];

  if (/screen|dashboard|panel|dialog|form/i.test(moduleName)) {
    files.push(`src/screens/${kebab}.tsx`);
    files.push(`src/screens/${kebab}-layout.tsx`);
  }
  if (/expense/i.test(moduleName)) {
    files.push(`src/screens/expense-list-screen.tsx`);
    files.push(`src/screens/add-expense-screen.tsx`);
  }
  if (/offline|storage/i.test(moduleName)) {
    files.push(`src/services/${kebab}-service.ts`);
  }

  return [...new Set(files)];
}

export function generateValidationTasks(phase: ImplementationPhase): string[] {
  const validations = [...phase.validationRequirements];
  validations.push('Pass Verification Loop before merge');
  validations.push('Comply with Validation Budget Policy');
  if (phase.rollbackCheckpoint) {
    validations.push(`Verify rollback checkpoint: ${phase.rollbackCheckpoint}`);
  }
  return [...new Set(validations)];
}

export function generateUiRequirements(
  moduleName: string,
  targetFiles: string[],
  title: string,
  objective: string,
): string[] {
  const requirements: string[] = [];
  const guardReqs = generateUiGuardRequirements({ title, objective, targetFiles });
  requirements.push(...guardReqs);

  if (/screen|dashboard|panel|dialog|form|button|input/i.test(moduleName)) {
    if (!requirements.includes('UI_REGISTRATION_REQUIRED')) {
      requirements.push('UI_REGISTRATION_REQUIRED');
    }
    if (!requirements.includes('CLICKABILITY_PROOF_REQUIRED')) {
      requirements.push('CLICKABILITY_PROOF_REQUIRED');
    }
  }

  return [...new Set(requirements)];
}

export function generateImplementationTasks(
  strategy: ImplementationStrategy,
  duplicateContext?: PlanDuplicateContext,
): PlannedImplementationTask[] {
  const context: PlanDuplicateContext = duplicateContext ?? {
    brainSummaries: [],
    vaultCapabilities: [],
    architectDuplicateWarnings: [],
    packageDuplicateWarnings: [],
    strategyDuplicateWarnings: strategy.duplicateRisks.filter((w) =>
      w.startsWith(STRATEGY_DUP_PREFIX),
    ),
  };

  if (context.strategyDuplicateWarnings.length === 0) {
    context.strategyDuplicateWarnings = strategy.duplicateRisks.filter((w) =>
      w.startsWith(STRATEGY_DUP_PREFIX),
    );
  }

  const tasks: PlannedImplementationTask[] = [];

  for (const phase of strategy.phases) {
    const moduleName = extractModuleFromPhase(phase);
    const targetModules = generateModuleTargets(phase);
    const targetFiles = generateFileTargets(moduleName);
    const title = `Implement ${moduleName}`;
    const objective = phase.objective;
    const validationRequirements = generateValidationTasks(phase);
    const uiRequirements = generateUiRequirements(moduleName, targetFiles, title, objective);

    const taskWarnings: string[] = [...phase.warnings.filter((w) => !w.startsWith(STRATEGY_DUP_PREFIX))];
    const taskErrors: string[] = [...phase.errors];
    const duplicateRisks: string[] = [];

    for (const mod of targetModules) {
      const dupWarnings = detectPotentialDuplicates(mod, context);
      duplicateRisks.push(...dupWarnings);
      taskWarnings.push(...dupWarnings);
    }

    for (const dr of phase.warnings.filter((w) => w.startsWith(STRATEGY_DUP_PREFIX))) {
      if (!duplicateRisks.includes(dr)) duplicateRisks.push(dr);
    }

    tasks.push({
      taskId: createTaskId(),
      title,
      objective,
      targetModules,
      targetFiles,
      validationRequirements,
      uiRequirements,
      duplicateRisks,
      warnings: taskWarnings,
      errors: taskErrors,
    });
  }

  return tasks;
}

function resolvePlanStatus(tasks: PlannedImplementationTask[]): CodePlanStatus {
  if (tasks.some((t) => t.errors.length > 0)) return 'BLOCKED';
  if (tasks.some((t) => t.warnings.length > 0 || t.duplicateRisks.length > 0)) return 'WARN';
  return 'READY';
}

export function generateCodePlan(
  strategy: ImplementationStrategy,
  duplicateContext?: PlanDuplicateContext,
): CodeGenerationPlan {
  const warnings: string[] = [
    'Code Generation Planner performs planning only — no code generation, execution, or project modification.',
  ];
  const errors: string[] = [];

  if (strategy.errors.length > 0) {
    errors.push(...strategy.errors);
  }

  if (strategy.phases.length === 0) {
    errors.push('No implementation phases in strategy — cannot generate code plan.');
    return {
      planId: createPlanId(),
      createdAt: Date.now(),
      strategyId: strategy.strategyId,
      tasks: [],
      status: 'BLOCKED',
      warnings,
      errors,
    };
  }

  const tasks = generateImplementationTasks(strategy, duplicateContext);
  const status = resolvePlanStatus(tasks);

  for (const task of tasks) {
    for (const dr of task.duplicateRisks) {
      if (!warnings.includes(dr)) warnings.push(dr);
    }
  }

  return {
    planId: createPlanId(),
    createdAt: Date.now(),
    strategyId: strategy.strategyId,
    tasks,
    status,
    warnings,
    errors,
  };
}

export function summarizeCodePlan(plan: CodeGenerationPlan): string {
  const validationCount = plan.tasks.reduce((sum, t) => sum + t.validationRequirements.length, 0);
  const uiCount = plan.tasks.reduce((sum, t) => sum + t.uiRequirements.length, 0);
  const dupCount = plan.tasks.reduce((sum, t) => sum + t.duplicateRisks.length, 0);

  return (
    `Plan ${plan.planId}: strategy=${plan.strategyId} tasks=${plan.tasks.length} ` +
    `status=${plan.status} validations=${validationCount} ui_reqs=${uiCount} ` +
    `duplicate_risks=${dupCount} modules=[${plan.tasks.flatMap((t) => t.targetModules).join(', ')}]`
  );
}

export { ARCHITECT_DUP_PREFIX, PACKAGE_DUP_PREFIX, STRATEGY_DUP_PREFIX };
