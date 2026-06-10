/**
 * Resource Allocation — resource budget management.
 */

import type { ResourceBudget, ResourceType } from './resource-allocation-types.js';

const budgets = new Map<string, ResourceBudget>();
let budgetCounter = 0;

export function createResourceBudget(
  resourceType: ResourceType,
  maxUnits: number,
  projectId?: string,
  workspaceId?: string,
): ResourceBudget {
  budgetCounter += 1;
  const budget: ResourceBudget = {
    budgetId: `resource-budget-${budgetCounter}`,
    projectId,
    workspaceId,
    resourceType,
    maxUnits,
    usedUnits: 0,
    createdAt: Date.now(),
  };
  budgets.set(budget.budgetId, budget);
  return budget;
}

export function updateResourceBudget(budgetId: string, deltaUsed: number): ResourceBudget | undefined {
  const budget = budgets.get(budgetId);
  if (!budget) return undefined;
  budget.usedUnits = Math.max(0, Math.min(budget.maxUnits, budget.usedUnits + deltaUsed));
  return budget;
}

export function getResourceBudget(budgetId: string): ResourceBudget | undefined {
  return budgets.get(budgetId);
}

export function getBudgetsForProject(projectId: string): ResourceBudget[] {
  return [...budgets.values()].filter((b) => b.projectId === projectId);
}

export function resetResourceBudgetsForTests(): void {
  budgets.clear();
  budgetCounter = 0;
}
