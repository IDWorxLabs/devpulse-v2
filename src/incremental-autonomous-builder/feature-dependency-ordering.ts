/**
 * Incremental Autonomous Builder — feature dependency ordering.
 */

import type { FeatureSlicePlan } from './incremental-builder-types.js';

export interface FeatureOrderingResult {
  readOnly: true;
  orderedSliceIds: readonly string[];
  missingPrerequisites: readonly string[];
  circularDependencies: readonly string[][];
  unsafeOrdering: readonly string[];
  unvalidatedDependencies: readonly string[];
  blockedSliceIds: readonly string[];
}

const ORDERING_RULES = [
  'FOUNDATION_BEFORE_DEPENDENT',
  'DATA_MODEL_BEFORE_UI_MUTATIONS',
  'NAVIGATION_BEFORE_ROUTED_SCREENS',
  'AUTH_BEFORE_PROTECTED',
  'STORAGE_BEFORE_HISTORY',
  'ACCESSIBILITY_BASELINE_BEFORE_SPECIALIZED_INPUT',
  'CORE_WORKFLOW_BEFORE_ADVANCED',
  'VALIDATION_HARNESS_BEFORE_EXECUTION',
] as const;

function detectCycles(slices: readonly FeatureSlicePlan[]): string[][] {
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(slices.map((s) => [s.sliceId, s]));

  function dfs(id: string, path: string[]): void {
    if (visiting.has(id)) {
      const cycleStart = path.indexOf(id);
      if (cycleStart >= 0) cycles.push(path.slice(cycleStart).concat(id));
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const slice = byId.get(id);
    for (const dep of slice?.dependencySliceIds ?? []) {
      dfs(dep, [...path, id]);
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const slice of slices) dfs(slice.sliceId, []);
  return cycles;
}

function topologicalSort(slices: readonly FeatureSlicePlan[]): string[] {
  const byId = new Map(slices.map((s) => [s.sliceId, s]));
  const inDegree = new Map<string, number>();
  for (const slice of slices) {
    inDegree.set(slice.sliceId, slice.dependencySliceIds.length);
  }

  const queue = slices.filter((s) => s.dependencySliceIds.length === 0).map((s) => s.sliceId);
  const ordered: string[] = [];

  while (queue.length) {
    const id = queue.shift()!;
    ordered.push(id);
    for (const slice of slices) {
      if (!slice.dependencySliceIds.includes(id)) continue;
      const next = (inDegree.get(slice.sliceId) ?? 1) - 1;
      inDegree.set(slice.sliceId, next);
      if (next === 0) queue.push(slice.sliceId);
    }
  }

  if (ordered.length !== slices.length) {
    return slices.map((s) => s.sliceId);
  }

  const priority = (name: string): number => {
    if (/data model|shell|layout|core/i.test(name)) return 0;
    if (/create|auth|storage|accessib/i.test(name)) return 1;
    if (/edit|delete|list|filter/i.test(name)) return 2;
    if (/report|export|caregiver|emergency/i.test(name)) return 3;
    return 2;
  };

  return [...ordered].sort((a, b) => {
    const sa = byId.get(a);
    const sb = byId.get(b);
    return priority(sa?.name ?? '') - priority(sb?.name ?? '');
  });
}

export function orderFeatureSlices(
  slices: readonly FeatureSlicePlan[],
  capabilityBlockedSliceIds: readonly string[] = [],
): FeatureOrderingResult {
  const sliceIds = new Set(slices.map((s) => s.sliceId));
  const missingPrerequisites: string[] = [];
  for (const slice of slices) {
    for (const dep of slice.dependencySliceIds) {
      if (!sliceIds.has(dep)) missingPrerequisites.push(`${slice.sliceId}->${dep}`);
    }
  }

  const circularDependencies = detectCycles(slices);
  const unsafeOrdering: string[] = [];
  for (const slice of slices) {
    if (/export/i.test(slice.name)) {
      const deps = slice.dependencySliceIds.map((id) => slices.find((s) => s.sliceId === id)?.name ?? id);
      if (!deps.some((d) => /report|data model/i.test(d))) {
        unsafeOrdering.push(slice.sliceId);
      }
    }
  }

  const blockedSliceIds = [...new Set([...capabilityBlockedSliceIds, ...unsafeOrdering])];
  const orderedSliceIds = topologicalSort(slices.filter((s) => !blockedSliceIds.includes(s.sliceId)));

  return {
    readOnly: true,
    orderedSliceIds,
    missingPrerequisites,
    circularDependencies,
    unsafeOrdering,
    unvalidatedDependencies: [],
    blockedSliceIds,
  };
}

export function getOrderingRules(): readonly string[] {
  return ORDERING_RULES;
}
