/**
 * Verification blocker analyzer — missing deps, ownership, prerequisites.
 */

import type { VerificationTarget } from '../verification-registry/types.js';
import type { VerificationOwnerRecord } from '../verification-registry/types.js';
import type { DependencyResolution } from './verification-dependency-resolver.js';
import type { ReadinessResult } from './verification-readiness-evaluator.js';

export interface BlockerAnalysis {
  blockedTargets: string[];
  waitingTargets: string[];
  missingDependencies: string[];
  ownershipFailures: string[];
  prerequisiteFailures: string[];
  blockerReasons: string[];
}

export function analyzeVerificationBlockers(
  targets: VerificationTarget[],
  owners: VerificationOwnerRecord[],
  resolution: DependencyResolution,
  readiness: ReadinessResult,
): BlockerAnalysis {
  const ownerModules = new Set(owners.map((o) => o.ownerModule));
  const targetIds = new Set(targets.map((t) => t.verificationTargetId));
  const categoryToId = new Map(targets.map((t) => [t.verificationCategory, t.verificationTargetId]));

  const blockedTargets = [...readiness.blockedTargets];
  const waitingTargets = [...readiness.waitingTargets];
  const missingDependencies: string[] = [];
  const ownershipFailures: string[] = [];
  const prerequisiteFailures: string[] = [];
  const blockerReasons: string[] = [];

  if (resolution.hasCycle) {
    blockerReasons.push(`Dependency cycle detected: ${resolution.cyclePath.join(' → ')}`);
  }

  for (const target of targets) {
    if (!ownerModules.has(target.ownerModule)) {
      ownershipFailures.push(target.verificationTargetId);
      if (!blockedTargets.includes(target.verificationTargetId)) {
        blockedTargets.push(target.verificationTargetId);
      }
      blockerReasons.push(`Missing owner for ${target.verificationTargetId}`);
    }

    const upstream = resolution.upstreamChains.get(target.verificationTargetId) ?? [];
    for (const upId of upstream) {
      if (!targetIds.has(upId)) {
        missingDependencies.push(`${target.verificationTargetId} → ${upId}`);
        blockerReasons.push(`Missing upstream dependency: ${upId}`);
      }
    }

    const prereqs = resolution.prerequisiteChains.get(target.verificationTargetId) ?? [];
    const blockers = resolution.blockingDependencies.get(target.verificationTargetId) ?? [];
    if (blockers.includes('MISSING_PREREQUISITE') && prereqs.length > 0) {
      const unsatisfiedUpstream = upstream.filter((u) => waitingTargets.includes(u) || blockedTargets.includes(u));
      if (unsatisfiedUpstream.length > 0) {
        prerequisiteFailures.push(target.verificationTargetId);
      }
    }
  }

  return {
    blockedTargets,
    waitingTargets,
    missingDependencies,
    ownershipFailures,
    prerequisiteFailures,
    blockerReasons,
  };
}
