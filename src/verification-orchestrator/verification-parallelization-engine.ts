/**
 * Verification parallelization engine — identifies parallel-safe targets and groups.
 */

import type { ParallelGroup } from './types.js';
import type { DependencyResolution } from './verification-dependency-resolver.js';

let groupCounter = 0;

export function resetParallelGroupCounterForTests(): void {
  groupCounter = 0;
}

function nextGroupId(): string {
  groupCounter += 1;
  return `vpg-${groupCounter.toString().padStart(4, '0')}`;
}

export function identifyParallelGroups(
  targetIds: string[],
  resolution: DependencyResolution,
  executionOrder: string[],
): ParallelGroup[] {
  const groups: ParallelGroup[] = [];
  const assigned = new Set<string>();
  const orderIndex = new Map(executionOrder.map((id, i) => [id, i]));

  const layers = new Map<number, string[]>();
  for (const id of targetIds) {
    const upstream = resolution.upstreamChains.get(id) ?? [];
    const depth = upstream.length === 0 ? 0 : Math.max(...upstream.map((u) => {
      const upUpstream = resolution.upstreamChains.get(u) ?? [];
      return upUpstream.length + 1;
    }), 1);
    const layer = upstream.length === 0 ? 0 : orderIndex.get(id) ?? 0;
    const list = layers.get(layer) ?? [];
    list.push(id);
    layers.set(layer, list);
  }

  const sortedLayers = [...layers.entries()].sort((a, b) => a[0] - b[0]);
  for (const [, layerTargets] of sortedLayers) {
    const parallelSafe = layerTargets.filter((id) => {
      const upstream = resolution.upstreamChains.get(id) ?? [];
      return upstream.every((u) => assigned.has(u) || !targetIds.includes(u));
    });

    if (parallelSafe.length > 0) {
      const independent = findIndependentPaths(parallelSafe, resolution);
      if (independent.length >= 2) {
        groups.push({
          groupId: nextGroupId(),
          targetIds: independent,
          parallelSafe: true,
        });
      } else if (parallelSafe.length >= 2) {
        groups.push({
          groupId: nextGroupId(),
          targetIds: parallelSafe,
          parallelSafe: true,
        });
      }
      for (const id of parallelSafe) assigned.add(id);
    }
  }

  const roots = targetIds.filter((id) => (resolution.upstreamChains.get(id) ?? []).length === 0);
  if (roots.length >= 2 && groups.length === 0) {
    groups.push({
      groupId: nextGroupId(),
      targetIds: roots,
      parallelSafe: true,
    });
  }

  return groups;
}

function findIndependentPaths(targetIds: string[], resolution: DependencyResolution): string[] {
  const independent: string[] = [];
  for (const id of targetIds) {
    const upstream = resolution.upstreamChains.get(id) ?? [];
    const sharesUpstream = independent.some((other) => {
      const otherUpstream = resolution.upstreamChains.get(other) ?? [];
      return upstream.some((u) => otherUpstream.includes(u));
    });
    if (!sharesUpstream) independent.push(id);
  }
  return independent.length >= 2 ? independent : targetIds;
}

export function listParallelSafeTargets(
  targetIds: string[],
  resolution: DependencyResolution,
): string[] {
  const roots = targetIds.filter((id) => (resolution.upstreamChains.get(id) ?? []).length === 0);
  if (roots.length >= 2) return roots;
  return targetIds.filter((id) => {
    const upstream = resolution.upstreamChains.get(id) ?? [];
    return upstream.length <= 1;
  });
}
