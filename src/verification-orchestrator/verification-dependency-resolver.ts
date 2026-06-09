/**
 * Verification dependency resolver — upstream/downstream chains and cycle detection.
 */

import type {
  VerificationTarget,
  VerificationDependencyRecord,
  VerificationTargetCategory,
} from '../verification-registry/types.js';

export interface DependencyResolution {
  upstreamChains: Map<string, string[]>;
  downstreamChains: Map<string, string[]>;
  prerequisiteChains: Map<string, string[]>;
  blockingDependencies: Map<string, string[]>;
  hasCycle: boolean;
  cyclePath: string[];
}

export function resolveVerificationDependencies(
  targets: VerificationTarget[],
  dependencies: VerificationDependencyRecord[],
): DependencyResolution {
  const categoryToId = new Map(targets.map((t) => [t.verificationCategory, t.verificationTargetId]));
  const idToCategory = new Map(targets.map((t) => [t.verificationTargetId, t.verificationCategory]));
  const depByTarget = new Map(dependencies.map((d) => [d.targetId, d]));

  const upstreamChains = new Map<string, string[]>();
  const downstreamChains = new Map<string, string[]>();
  const prerequisiteChains = new Map<string, string[]>();
  const blockingDependencies = new Map<string, string[]>();

  for (const target of targets) {
    const dep = depByTarget.get(target.verificationTargetId);
    const upstream = (dep?.upstreamDependencies ?? []).map(
      (cat) => categoryToId.get(cat as VerificationTargetCategory) ?? cat,
    );
    const downstream = (dep?.downstreamDependencies ?? []).map(
      (cat) => categoryToId.get(cat as VerificationTargetCategory) ?? cat,
    );
    upstreamChains.set(target.verificationTargetId, upstream);
    downstreamChains.set(target.verificationTargetId, downstream);
    prerequisiteChains.set(target.verificationTargetId, dep?.verificationPrerequisites ?? []);
    blockingDependencies.set(target.verificationTargetId, dep?.verificationBlockers ?? []);
  }

  const cycle = detectDependencyCycle(targets, dependencies, categoryToId);

  return {
    upstreamChains,
    downstreamChains,
    prerequisiteChains,
    blockingDependencies,
    hasCycle: cycle.hasCycle,
    cyclePath: cycle.cyclePath,
  };
}

export function detectDependencyCycle(
  targets: VerificationTarget[],
  dependencies: VerificationDependencyRecord[],
  categoryToId?: Map<string, string>,
): { hasCycle: boolean; cyclePath: string[] } {
  const catMap = categoryToId ?? new Map(targets.map((t) => [t.verificationCategory, t.verificationTargetId]));
  const depByTarget = new Map(dependencies.map((d) => [d.targetId, d]));

  const adjacency = new Map<string, string[]>();
  for (const target of targets) {
    const dep = depByTarget.get(target.verificationTargetId);
    const upstreamIds = (dep?.upstreamDependencies ?? [])
      .map((cat) => catMap.get(cat))
      .filter((id): id is string => !!id);
    adjacency.set(target.verificationTargetId, upstreamIds);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): boolean {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      return cycleStart >= 0;
    }
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);
    path.push(node);

    for (const neighbor of adjacency.get(node) ?? []) {
      if (dfs(neighbor)) return true;
    }

    stack.delete(node);
    path.pop();
    return false;
  }

  for (const target of targets) {
    path.length = 0;
    if (dfs(target.verificationTargetId)) {
      return { hasCycle: true, cyclePath: [...path] };
    }
  }

  return { hasCycle: false, cyclePath: [] };
}

export function detectInjectedCycle(
  upstreamMap: Map<string, string[]>,
): { hasCycle: boolean; cyclePath: string[] } {
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): boolean {
    if (stack.has(node)) {
      const idx = path.indexOf(node);
      if (idx >= 0) path.splice(0, idx);
      return true;
    }
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    path.push(node);
    for (const neighbor of upstreamMap.get(node) ?? []) {
      if (dfs(neighbor)) return true;
    }
    stack.delete(node);
    path.pop();
    return false;
  }

  for (const node of upstreamMap.keys()) {
    path.length = 0;
    if (dfs(node)) return { hasCycle: true, cyclePath: [...path] };
  }
  return { hasCycle: false, cyclePath: [] };
}
