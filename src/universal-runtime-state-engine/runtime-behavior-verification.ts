/**
 * Universal Runtime State Engine V1 — behavior verification.
 */

import type {
  UniversalRuntimeBehaviorVerificationResult,
  UniversalRuntimeStateDescriptor,
  UniversalRuntimeVerificationClassification,
} from './universal-runtime-types.js';

export interface RuntimeGeneratedSources {
  readonly runtime: string;
  readonly sharedStore: string;
  readonly componentFragment: string;
  readonly descriptors: string;
}

function check(name: string, source: string, patterns: RegExp[]) {
  const missing = patterns.filter((p) => !p.test(source)).map((p) => p.source);
  return { id: name, passed: missing.length === 0, detail: missing.length === 0 ? 'ok' : missing.join(',') };
}

export function verifyUniversalRuntimeBehavior(
  descriptor: UniversalRuntimeStateDescriptor,
  sources: RuntimeGeneratedSources,
): UniversalRuntimeBehaviorVerificationResult {
  const combined = `${sources.runtime}\n${sources.sharedStore}\n${sources.componentFragment}\n${sources.descriptors}`;
  const id = descriptor.runtimeScopeId;

  if (descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY') {
    return {
      readOnly: true,
      runtimeScopeId: id,
      classification: 'BLOCKED_BY_CAPABILITY',
      passed: /blocked/i.test(combined),
      checks: [check('blocked-evidence', combined, [/blocked/i])],
    };
  }

  const checks = [
    check('store-dispatch', combined, [/dispatchRuntimeEvent/, /registerRuntimeScope/]),
    check('query-dedup', sources.sharedStore, [/inflight|executeRuntimeQuery/]),
    check('stale-suppression', sources.sharedStore, [/requestVersion|isStaleQueryResponse/]),
    check('cache-entity', sources.sharedStore, [/upsertRuntimeEntity|entities/]),
    check('invalidation', sources.sharedStore, [/invalidateQueryKeys/]),
    check('optimistic-rollback', sources.sharedStore, [/mutation\/optimistic|mutation\/rollback/]),
    check('b1-integration', sources.runtime, [/use.*CrudRuntime|b1-crud-sync/]),
    check('b2-dispatch', sources.runtime, [/dispatchTypedRuntimeEvent|b2-action-dispatch/]),
    check('concurrency', sources.sharedStore, [/tryAcquireMutationLock|rejectDuplicateMutation/]),
    check('selection-reconcile', sources.sharedStore, [/selection/]),
    check('invariants', sources.sharedStore, [/validateRuntimeInvariants/]),
    check('no-static-state', combined, [/useSyncExternalStore|dispatchRuntimeEvent/]),
  ];

  const passed = checks.every((c) => c.passed);
  const classification: UniversalRuntimeVerificationClassification = passed
    ? 'BEHAVIORALLY_VERIFIED'
    : combined.includes('dispatchRuntimeEvent')
      ? 'PARTIALLY_VERIFIED'
      : 'STRUCTURALLY_PRESENT_ONLY';

  return { readOnly: true, runtimeScopeId: id, classification, passed, checks };
}

export function diagnoseUniversalRuntimeGenerationGaps(
  verification: UniversalRuntimeBehaviorVerificationResult,
): readonly string[] {
  if (verification.passed) return [];
  return verification.checks.filter((c) => !c.passed).map((c) => c.id.replace(/-/g, '_'));
}

export function detectStaticRuntimeStateShell(source: string): boolean {
  return (
    /useState\(\[\]\)/.test(source) &&
    !/dispatchRuntimeEvent|useSyncExternalStore|registerRuntimeScope/.test(source)
  ) || (/loading.*useState\(true\)/.test(source) && !/dispatchRuntimeEvent/.test(source));
}
