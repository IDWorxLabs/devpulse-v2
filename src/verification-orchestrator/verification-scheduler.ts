/**
 * Verification scheduler — execution order and priority without execution.
 */

import type { VerificationTarget } from '../verification-registry/types.js';
import type { DependencyResolution } from './verification-dependency-resolver.js';

export interface ScheduleResult {
  executionOrder: string[];
  priorityOrder: string[];
  dependencyOrder: string[];
}

export function scheduleVerificationExecution(
  targets: VerificationTarget[],
  resolution: DependencyResolution,
): ScheduleResult {
  const targetIds = targets.map((t) => t.verificationTargetId);
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const id of targetIds) {
    inDegree.set(id, 0);
    dependents.set(id, []);
  }

  for (const [targetId, upstream] of resolution.upstreamChains) {
    const validUpstream = upstream.filter((u) => targetIds.includes(u));
    inDegree.set(targetId, validUpstream.length);
    for (const up of validUpstream) {
      const list = dependents.get(up) ?? [];
      list.push(targetId);
      dependents.set(up, list);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  queue.sort((a, b) => {
    const ta = targets.find((t) => t.verificationTargetId === a);
    const tb = targets.find((t) => t.verificationTargetId === b);
    return (ta?.phase ?? 0) - (tb?.phase ?? 0);
  });

  const executionOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    executionOrder.push(current);
    for (const dep of dependents.get(current) ?? []) {
      const newDeg = (inDegree.get(dep) ?? 1) - 1;
      inDegree.set(dep, newDeg);
      if (newDeg === 0) queue.push(dep);
    }
    queue.sort((a, b) => {
      const ta = targets.find((t) => t.verificationTargetId === a);
      const tb = targets.find((t) => t.verificationTargetId === b);
      return (ta?.phase ?? 0) - (tb?.phase ?? 0);
    });
  }

  const priorityOrder = [...targets]
    .sort((a, b) => a.phase - b.phase)
    .map((t) => t.verificationTargetId);

  return {
    executionOrder,
    priorityOrder,
    dependencyOrder: executionOrder,
  };
}
