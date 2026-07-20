/**
 * Universal Capability Composition Engine V1 — deterministic collision resolution.
 */

import type { CollisionDecision, CollisionResolutionPolicy } from './universal-capability-composition-types.js';

export function resolveCompositionCollisions(
  collisions: readonly CollisionDecision[],
  defaultPolicy: CollisionResolutionPolicy = 'REJECT',
): CollisionDecision[] {
  return collisions.map((c) => {
    if (c.resolved) return c;
    const policy = c.policy ?? defaultPolicy;
    const resolved = policy === 'SHARED_CONTRIBUTION' || policy === 'MERGE_DECLARATIVE';
    return { ...c, policy, resolved: policy === 'REJECT' ? false : resolved };
  });
}

export function hasUnresolvedCriticalCollisions(collisions: readonly CollisionDecision[]): boolean {
  return collisions.some((c) => !c.resolved && c.policy === 'REJECT');
}
