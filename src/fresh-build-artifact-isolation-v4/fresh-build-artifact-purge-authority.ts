/**
 * Fresh Build Artifact Purge Authority.
 *
 * For every NEW_BUILD, before planning/materialization/runtime activation begins, this computes
 * (and, given executors, applies) the purge/invalidation plan for previous build artifacts that
 * could otherwise affect the new result.
 *
 * - NEW_BUILD: every category is purged. The six "required project artifact" categories are
 *   purged by construction (a freshly-minted project id has no prior workspace/state at all —
 *   the same FRESH_SCOPE reasoning `buildPromptResetPlan` already uses); the eleven per-build
 *   runtime-evidence categories are purged via injected executors when provided.
 * - CONTINUE_EXISTING_PROJECT: the six required project artifact categories are preserved
 *   (never purged) — continuation needs its own workspace path, manifest, module manifest,
 *   routes, navigation, and tab registry entry. The eleven per-build runtime-evidence categories
 *   are still purged, so each build turn (even a continuation) computes its own fresh evidence
 *   instead of displaying a previous turn's evidence.
 *
 * Never deletes persistent saved project registry/history — only runtime/session-scoped, in
 * process-memory evidence stores that callers explicitly wire in via `executors`.
 */

import {
  PER_BUILD_RUNTIME_PURGE_CATEGORIES,
  PROJECT_ARTIFACT_PURGE_CATEGORIES,
  type PurgeAction,
  type PurgeAuthorityInput,
  type PurgeAuthorityResult,
  type PurgeExecutorMap,
} from './fresh-build-artifact-isolation-types.js';

export function planFreshBuildArtifactPurge(input: PurgeAuthorityInput): PurgeAuthorityResult {
  const actions: PurgeAction[] = [];

  for (const category of PROJECT_ARTIFACT_PURGE_CATEGORIES) {
    if (input.decision === 'CONTINUE_EXISTING_PROJECT') {
      actions.push({
        category,
        required: true,
        purged: false,
        method: 'NOT_APPLICABLE',
        note: 'Preserved — required project artifact for CONTINUE_EXISTING_PROJECT; continuation needs its own workspace path, manifest, routes, navigation, and tab registry entry.',
      });
    } else {
      actions.push({
        category,
        required: true,
        purged: true,
        method: input.freshProjectScope ? 'FRESH_SCOPE' : 'EXECUTOR',
        note: input.freshProjectScope
          ? `Purged by construction — project id ${input.projectId} was freshly minted for this build and has no prior workspace/state under that id at all.`
          : `Purged via executor for build ${input.buildId} / project ${input.projectId}.`,
      });
    }
  }

  const liveExecutorCategories = new Set(input.categoriesWithLiveExecutor ?? []);
  for (const category of PER_BUILD_RUNTIME_PURGE_CATEGORIES) {
    const hasLiveExecutor = liveExecutorCategories.has(category);
    actions.push({
      category,
      required: true,
      purged: true,
      method: hasLiveExecutor ? 'EXECUTOR' : 'FRESH_SCOPE',
      note: hasLiveExecutor
        ? `Invalidated via in-process executor for build ${input.buildId} / request ${input.requestId} regardless of decision — each build computes its own evidence rather than reusing a previous build's.`
        : `No orchestrator-level cache exists for this evidence — it is computed fresh per build call downstream and validated by the Build Artifact Staleness Detector before use in build ${input.buildId} / request ${input.requestId}.`,
    });
  }

  return {
    readOnly: true,
    decision: input.decision,
    actions,
    persistentProjectsPreserved: true,
  };
}

/** Applies any injected executors for categories the plan marked as purged. Never touches disk-persisted project registry/history — only whatever in-memory stores callers wire in. */
export function applyFreshBuildArtifactPurge(plan: PurgeAuthorityResult, executors: PurgeExecutorMap): PurgeAction[] {
  const applied: PurgeAction[] = [];
  for (const action of plan.actions) {
    if (!action.purged || action.method !== 'EXECUTOR') continue;
    const executor = executors[action.category];
    if (executor) {
      executor();
      applied.push(action);
    }
  }
  return applied;
}
