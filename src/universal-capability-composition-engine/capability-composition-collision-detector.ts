/**
 * Universal Capability Composition Engine V1 — collision detection across all providers.
 */

import { detectContributionCollisions } from '../universal-capability-pack-framework/capability-pack-collision-detector.js';
import { getPack } from '../universal-capability-pack-framework/capability-pack-registry.js';
import type { CollisionDecision } from './universal-capability-composition-types.js';

export function detectCompositionCollisions(input: {
  selectedPackIds: readonly string[];
  moduleIds: readonly string[];
}): CollisionDecision[] {
  const contributions: {
    packId: string;
    relativePath?: string;
    routeId?: string;
    runtimeScopeId?: string;
  }[] = [];

  for (const packId of input.selectedPackIds) {
    const pack = getPack(packId);
    if (!pack) continue;
    contributions.push({
      packId,
      relativePath: `src/universal-capability-packs/${packId}/index.ts`,
      runtimeScopeId: `runtime.pack.${packId}`,
    });
    for (const moduleId of input.moduleIds) {
      contributions.push({
        packId,
        routeId: `${moduleId}:${packId}`,
      });
    }
  }

  const packCollisions = detectContributionCollisions(contributions);
  return packCollisions.map((c) => ({
    collisionCode: c.code,
    detail: c.detail,
    providerIds: [...c.packIds],
    policy: 'REJECT' as const,
    resolved: false,
  }));
}

export function detectRouteCollisions(routes: readonly string[]): CollisionDecision[] {
  const seen = new Map<string, number>();
  const decisions: CollisionDecision[] = [];
  for (const route of routes) {
    const count = (seen.get(route) ?? 0) + 1;
    seen.set(route, count);
    if (count > 1) {
      decisions.push({
        collisionCode: 'route_collision',
        detail: `Duplicate route ${route}`,
        providerIds: [],
        policy: 'REJECT',
        resolved: false,
      });
    }
  }
  return decisions;
}
