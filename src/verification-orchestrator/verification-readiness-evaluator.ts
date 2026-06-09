/**
 * Verification readiness evaluator — classifies targets by registry metadata.
 */

import type { OrchestrationExecutionState } from './types.js';
import type { DependencyResolution } from './verification-dependency-resolver.js';

export interface ReadinessResult {
  readyTargets: string[];
  waitingTargets: string[];
  blockedTargets: string[];
  stateMap: Map<string, OrchestrationExecutionState>;
}

export function evaluateVerificationReadiness(
  targetIds: string[],
  resolution: DependencyResolution,
  satisfiedTargets: Set<string> = new Set(),
): ReadinessResult {
  const readyTargets: string[] = [];
  const waitingTargets: string[] = [];
  const blockedTargets: string[] = [];
  const stateMap = new Map<string, OrchestrationExecutionState>();

  if (resolution.hasCycle) {
    for (const id of targetIds) {
      blockedTargets.push(id);
      stateMap.set(id, 'BLOCKED');
    }
    return { readyTargets, waitingTargets, blockedTargets, stateMap };
  }

  for (const targetId of targetIds) {
    const upstream = resolution.upstreamChains.get(targetId) ?? [];
    const blockers = resolution.blockingDependencies.get(targetId) ?? [];
    const prerequisites = resolution.prerequisiteChains.get(targetId) ?? [];

    if (blockers.includes('MISSING_PREREQUISITE') && prerequisites.length > 0) {
      const unsatisfiedUpstream = upstream.filter((u) => !satisfiedTargets.has(u));
      if (unsatisfiedUpstream.length > 0) {
        waitingTargets.push(targetId);
        stateMap.set(targetId, 'WAITING');
        continue;
      }
    }

    const unsatisfiedDeps = upstream.filter((u) => !satisfiedTargets.has(u) && targetIds.includes(u));
    if (unsatisfiedDeps.length > 0) {
      waitingTargets.push(targetId);
      stateMap.set(targetId, 'WAITING');
      continue;
    }

    if (upstream.length === 0) {
      readyTargets.push(targetId);
      stateMap.set(targetId, 'READY');
    } else if (unsatisfiedDeps.length === 0) {
      readyTargets.push(targetId);
      stateMap.set(targetId, 'READY');
    } else {
      stateMap.set(targetId, 'PLANNED');
    }
  }

  for (const targetId of targetIds) {
    if (!stateMap.has(targetId)) {
      stateMap.set(targetId, 'PLANNED');
    }
  }

  return { readyTargets, waitingTargets, blockedTargets, stateMap };
}
