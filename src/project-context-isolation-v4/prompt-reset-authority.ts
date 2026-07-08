/**
 * Prompt Reset Authority — builds and applies a deterministic reset plan for "new prompt",
 * "reset test", and "build with a new product prompt" actions.
 *
 * A build targeting a brand-new project id has no prior workspace/state at all under that id, so
 * every reset category is satisfied by construction ("FRESH_SCOPE"). A build re-using an existing
 * project id (reset-test on the same project, or any trigger without a fresh id) can only be
 * marked cleared for categories where the caller supplies a real executor; categories without an
 * executor are honestly reported as not cleared — this module never claims a reset happened when
 * it did not.
 *
 * Persistent saved projects (the project record itself) are never touched here — only transient
 * generation state categories are in scope, and only when explicitly triggered.
 */

import { ALL_RESET_CATEGORIES } from './project-context-isolation-types.js';
import type {
  PromptResetPlan,
  ResetAction,
  ResetCategory,
  ResetExecutorMap,
  ResetTrigger,
} from './project-context-isolation-types.js';

export function buildPromptResetPlan(input: {
  trigger: ResetTrigger;
  projectId: string | null;
  freshProjectScope: boolean;
}): PromptResetPlan {
  const actions: ResetAction[] = ALL_RESET_CATEGORIES.map((category) => {
    if (input.freshProjectScope) {
      return {
        category,
        required: true,
        cleared: true,
        method: 'FRESH_SCOPE',
        note: `Project scope is fresh (no prior workspace/state exists for this project id) — ${category} has nothing stale to clear.`,
      };
    }
    return {
      category,
      required: true,
      cleared: false,
      method: 'NOT_APPLICABLE',
      note: `No executor registered yet for ${category}; reset not applied. Not masked as success.`,
    };
  });

  return {
    readOnly: true,
    trigger: input.trigger,
    projectId: input.projectId,
    freshProjectScope: input.freshProjectScope,
    actions,
    preservesPersistentProjects: true,
  };
}

/**
 * Applies real per-category clear callbacks supplied by the caller (which owns the concrete
 * stores). Categories with a registered executor are executed and marked cleared; the rest keep
 * whatever the base plan already determined (FRESH_SCOPE = cleared, otherwise honestly not
 * cleared). This function never throws on a missing executor — omission is reported, not hidden.
 */
export function applyPromptResetPlan(plan: PromptResetPlan, executors: ResetExecutorMap): PromptResetPlan {
  const actions: ResetAction[] = plan.actions.map((action) => {
    const executor = executors[action.category];
    if (!executor) return action;
    executor();
    return {
      ...action,
      cleared: true,
      method: 'EXECUTOR',
      note: `${action.category} cleared via registered executor for trigger ${plan.trigger}.`,
    };
  });

  return { ...plan, actions };
}

export function unclearedCategories(plan: PromptResetPlan): ResetCategory[] {
  return plan.actions.filter((a) => !a.cleared).map((a) => a.category);
}
