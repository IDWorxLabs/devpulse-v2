/**
 * Builder execution plan authority — plan only, no autonomous execution (Phase 24B).
 */

import { MAX_EXECUTION_PLANS } from './autonomous-builder-execution-foundation-bounds.js';

export interface ExecutionPlanStep {
  stepId: string;
  title: string;
  actionType: string;
  sourceTaskId: string;
  order: number;
}

export interface ExecutionPlan {
  planId: string;
  projectId: string;
  workspaceId: string;
  executionSteps: ExecutionPlanStep[];
  requiredFiles: string[];
  dependencies: string[];
  estimatedEffort: string;
  executionOrdering: string[];
  createdAt: number;
}

export interface BuildExecutionPlanInput {
  projectId: string;
  workspaceId: string;
  requirements: string[];
  architecture: string[];
  tasks: Array<{ taskId: string; title: string; actionType?: string }>;
}

const plans = new Map<string, ExecutionPlan>();
let planCounter = 0;

export function resetBuilderExecutionPlansForTests(): void {
  plans.clear();
  planCounter = 0;
}

function nextPlanId(): string {
  planCounter += 1;
  return `builder-exec-plan-${planCounter}`;
}

export function buildExecutionPlan(input: BuildExecutionPlanInput): ExecutionPlan {
  const steps: ExecutionPlanStep[] = input.tasks.map((task, index) => ({
    stepId: `step-${index + 1}`,
    title: task.title,
    actionType: task.actionType ?? 'GENERATE_CODE',
    sourceTaskId: task.taskId,
    order: index + 1,
  }));

  const requiredFiles = input.architecture
    .filter((line) => line.includes('/') || line.includes('.'))
    .slice(0, 12);
  if (requiredFiles.length === 0 && input.tasks.length > 0) {
    requiredFiles.push('src/generated/output.ts');
  }

  const dependencies = input.requirements
    .filter((r) => r.toLowerCase().includes('depend') || r.toLowerCase().includes('package'))
    .slice(0, 8);

  const plan: ExecutionPlan = {
    planId: nextPlanId(),
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    executionSteps: steps,
    requiredFiles,
    dependencies,
    estimatedEffort: steps.length <= 3 ? 'small' : steps.length <= 8 ? 'medium' : 'large',
    executionOrdering: steps.map((s) => s.stepId),
    createdAt: Date.now(),
  };

  plans.set(plan.planId, plan);
  if (plans.size > MAX_EXECUTION_PLANS) {
    const oldest = [...plans.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) plans.delete(oldest.planId);
  }

  return plan;
}

export function getExecutionPlan(planId: string): ExecutionPlan | null {
  return plans.get(planId) ?? null;
}

export function listExecutionPlans(): ExecutionPlan[] {
  return [...plans.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getExecutionPlanCount(): number {
  return plans.size;
}
