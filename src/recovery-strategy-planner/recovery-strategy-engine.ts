/**
 * Rule-based recovery strategy planning — no AI, LLM, code generation, execution, or rollback.
 */

import type { CodeGenerationPlan } from '../code-generation-planner/types.js';
import { DUPLICATE_RISK_PREFIX as PLAN_DUP_PREFIX } from '../code-generation-planner/types.js';
import { DUPLICATE_RISK_PREFIX as STRATEGY_DUP_PREFIX } from '../implementation-strategy-engine/types.js';
import type {
  GenerateRecoveryInput,
  RecoveryDuplicateContext,
  RecoveryScenario,
  RecoveryStatus,
  RecoveryStrategy,
} from './types.js';
import { DUPLICATE_RISK_PREFIX } from './types.js';

function createStrategyId(): string {
  return `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createScenarioId(prefix: string): string {
  return `scenario-${prefix}-${Date.now().toString(36).slice(-5)}`;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function detectExistingCapabilities(context: RecoveryDuplicateContext): string[] {
  const capabilities = new Set<string>();

  for (const summary of context.brainSummaries) {
    const lower = summary.toLowerCase();
    const matches = lower.match(/\b([a-z]+(?:module|service|recovery|rollback|plan))\b/gi) ?? [];
    for (const m of matches) capabilities.add(normalizeName(m));
  }

  for (const cap of context.vaultCapabilities) {
    capabilities.add(normalizeName(cap));
  }

  for (const warnings of [
    context.architectDuplicateWarnings,
    context.packageDuplicateWarnings,
    context.strategyDuplicateWarnings,
    context.codePlanDuplicateWarnings,
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
  context: RecoveryDuplicateContext,
): string[] {
  const existing = detectExistingCapabilities(context);
  const normalized = normalizeName(moduleName);
  const warnings: string[] = [];

  for (const cap of existing) {
    if (cap === normalized || cap.includes(normalized) || normalized.includes(cap)) {
      warnings.push(
        `${DUPLICATE_RISK_PREFIX}: ${moduleName} recovery may duplicate existing capability — recommend integration, extension, or consolidation`,
      );
      break;
    }
  }

  return warnings;
}

export function generateDependencyFailureResponses(
  taskTitle: string,
  modules: string[],
): RecoveryScenario[] {
  return modules.map((mod) => ({
    scenarioId: createScenarioId('dep'),
    failureType: 'DEPENDENCY_FAILURE',
    trigger: `Dependency unavailable for ${mod} during ${taskTitle}`,
    recommendedRecovery: `Fallback to last known good state for ${mod}; defer dependent tasks until dependency resolves`,
    rollbackRecommendation: `Revert ${mod} integration to previous checkpoint — recommendation only, not execution`,
    validationRequirements: [
      'Verify dependency graph after fallback',
      'Re-run Verification Loop on affected modules',
    ],
    warnings: [],
    errors: [],
  }));
}

export function generateValidationFailureResponses(
  taskTitle: string,
  validations: string[],
): RecoveryScenario[] {
  return [
    {
      scenarioId: createScenarioId('val'),
      failureType: 'VALIDATION_FAILURE',
      trigger: `Validation failed during ${taskTitle}`,
      recommendedRecovery:
        'Halt forward progress; isolate failing validation; apply targeted fix before retry',
      rollbackRecommendation:
        'Restore pre-validation Project Vault snapshot — recommendation only, not execution',
      validationRequirements: [...validations, 'Re-run failed validation before proceeding'],
      warnings: [],
      errors: [],
    },
  ];
}

export function generateRollbackRecommendations(
  phases: GenerateRecoveryInput['phases'],
): RecoveryScenario[] {
  if (!phases || phases.length === 0) {
    return [
      {
        scenarioId: createScenarioId('rb'),
        failureType: 'ROLLBACK_RECOMMENDATION',
        trigger: 'Implementation phase failure without explicit checkpoint',
        recommendedRecovery: 'Pause implementation; assess impact; select fallback path',
        rollbackRecommendation:
          'Restore Project Vault snapshot from before plan start — recommendation only, not execution',
        validationRequirements: ['Verify system state after recommended rollback point'],
        warnings: [],
        errors: [],
      },
    ];
  }

  return phases.map((phase) => ({
    scenarioId: createScenarioId('rb'),
    failureType: 'ROLLBACK_RECOMMENDATION',
    trigger: `Failure during ${phase.title}`,
    recommendedRecovery: `Use fallback path: skip forward to next stable phase after remediation`,
    rollbackRecommendation: `${phase.rollbackCheckpoint} — recommendation only, not execution`,
    validationRequirements: [...phase.validationRequirements, 'Confirm rollback checkpoint integrity'],
    warnings: [],
    errors: [],
  }));
}

export function generateRecoveryCheckpoints(
  phases: GenerateRecoveryInput['phases'],
  tasks: GenerateRecoveryInput['tasks'],
): RecoveryScenario[] {
  const checkpoints: RecoveryScenario[] = [];

  if (phases) {
    for (const phase of phases) {
      checkpoints.push({
        scenarioId: createScenarioId('chk'),
        failureType: 'RECOVERY_CHECKPOINT',
        trigger: `Checkpoint after ${phase.title}`,
        recommendedRecovery: `Recovery path: restore to ${phase.rollbackCheckpoint} and re-validate`,
        rollbackRecommendation: phase.rollbackCheckpoint,
        validationRequirements: phase.validationRequirements,
        warnings: [],
        errors: [],
      });
    }
  }

  for (const task of tasks) {
    checkpoints.push({
      scenarioId: createScenarioId('chk'),
      failureType: 'RECOVERY_CHECKPOINT',
      trigger: `Checkpoint after task ${task.title}`,
      recommendedRecovery: `Fallback path: revert ${task.targetModules.join(', ')} task changes and retry`,
      rollbackRecommendation: `Snapshot before ${task.taskId} — recommendation only, not execution`,
      validationRequirements: task.validationRequirements,
      warnings: [],
      errors: [],
    });
  }

  return checkpoints;
}

export function generateFailureResponses(input: GenerateRecoveryInput): RecoveryScenario[] {
  const scenarios: RecoveryScenario[] = [];

  for (const task of input.tasks) {
    scenarios.push(...generateDependencyFailureResponses(task.title, task.targetModules));
    scenarios.push(...generateValidationFailureResponses(task.title, task.validationRequirements));

    if (task.duplicateRisks.length > 0) {
      scenarios.push({
        scenarioId: createScenarioId('dup'),
        failureType: 'DUPLICATE_OVERLAP',
        trigger: `Duplicate risk detected for ${task.title}`,
        recommendedRecovery:
          'Prefer integration, extension, or consolidation over parallel implementation',
        rollbackRecommendation: 'No rollback required — adjust recovery path to reuse existing capability',
        validationRequirements: ['Verify no duplicate capability introduced'],
        warnings: [...task.duplicateRisks],
        errors: [],
      });
    }
  }

  return scenarios;
}

function resolveRecoveryStatus(
  scenarios: RecoveryScenario[],
  duplicateRisks: string[],
  errors: string[],
): RecoveryStatus {
  if (errors.length > 0 || scenarios.some((s) => s.errors.length > 0)) return 'BLOCKED';
  if (duplicateRisks.length > 0 || scenarios.some((s) => s.warnings.length > 0)) return 'WARN';
  return 'READY';
}

export function generateRecoveryStrategy(
  input: GenerateRecoveryInput,
  duplicateContext?: RecoveryDuplicateContext,
): RecoveryStrategy {
  const warnings: string[] = [
    'Recovery Strategy Planner performs planning only — no code generation, execution, rollback, recovery, or project modification.',
  ];
  const errors: string[] = [...input.planErrors];

  if (input.tasks.length === 0) {
    errors.push('No implementation tasks in code plan — cannot generate recovery strategy.');
    return {
      strategyId: createStrategyId(),
      createdAt: Date.now(),
      codePlanId: input.codePlanId,
      scenarios: [],
      duplicateRisks: [],
      status: 'BLOCKED',
      warnings,
      errors,
    };
  }

  const context: RecoveryDuplicateContext = duplicateContext ?? {
    brainSummaries: [],
    vaultCapabilities: [],
    architectDuplicateWarnings: [],
    packageDuplicateWarnings: [],
    strategyDuplicateWarnings: [],
    codePlanDuplicateWarnings: input.tasks.flatMap((t) =>
      t.duplicateRisks.filter((w) => w.startsWith(PLAN_DUP_PREFIX)),
    ),
  };

  const scenarios: RecoveryScenario[] = [
    ...generateFailureResponses(input),
    ...generateRollbackRecommendations(input.phases),
    ...generateRecoveryCheckpoints(input.phases, input.tasks),
  ];

  const duplicateRisks: string[] = [];

  for (const task of input.tasks) {
    for (const mod of task.targetModules) {
      const dupWarnings = detectPotentialDuplicates(mod, context);
      for (const w of dupWarnings) {
        if (!duplicateRisks.includes(w)) {
          duplicateRisks.push(w);
          if (!warnings.includes(w)) warnings.push(w);
        }
      }
    }
    for (const dr of task.duplicateRisks) {
      if (!duplicateRisks.includes(dr)) duplicateRisks.push(dr);
    }
  }

  for (const w of input.planWarnings) {
    if (w.startsWith(PLAN_DUP_PREFIX) && !duplicateRisks.includes(w)) {
      duplicateRisks.push(w);
    }
  }

  const status = resolveRecoveryStatus(scenarios, duplicateRisks, errors);

  return {
    strategyId: createStrategyId(),
    createdAt: Date.now(),
    codePlanId: input.codePlanId,
    scenarios,
    duplicateRisks,
    status,
    warnings,
    errors,
  };
}

export function buildRecoveryInputFromCodePlan(
  plan: CodeGenerationPlan,
  phases?: GenerateRecoveryInput['phases'],
): GenerateRecoveryInput {
  return {
    codePlanId: plan.planId,
    implementationStrategyId: plan.strategyId,
    tasks: plan.tasks.map((t) => ({
      taskId: t.taskId,
      title: t.title,
      targetModules: t.targetModules,
      validationRequirements: t.validationRequirements,
      duplicateRisks: t.duplicateRisks,
      warnings: t.warnings,
      errors: t.errors,
    })),
    phases,
    planWarnings: plan.warnings,
    planErrors: plan.errors,
  };
}

export function summarizeRecoveryStrategy(strategy: RecoveryStrategy): string {
  const byType = (type: string) => strategy.scenarios.filter((s) => s.failureType === type).length;
  return (
    `Recovery ${strategy.strategyId}: plan=${strategy.codePlanId} ` +
    `scenarios=${strategy.scenarios.length} status=${strategy.status} ` +
    `DEP=${byType('DEPENDENCY_FAILURE')} VAL=${byType('VALIDATION_FAILURE')} ` +
    `RB=${byType('ROLLBACK_RECOMMENDATION')} CHK=${byType('RECOVERY_CHECKPOINT')} ` +
    `duplicate_risks=${strategy.duplicateRisks.length}`
  );
}

export { PLAN_DUP_PREFIX, STRATEGY_DUP_PREFIX };
