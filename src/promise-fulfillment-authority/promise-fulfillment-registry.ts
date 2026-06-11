/**
 * Promise Fulfillment Registry — bounded promise definitions.
 */

import type { RegisteredPromiseDefinition } from './promise-fulfillment-types.js';

export const REGISTERED_PROMISES: readonly RegisteredPromiseDefinition[] = [
  {
    promiseId: 'understands-product-ideas',
    promise: 'Understands product ideas',
    category: 'PRODUCT_PROMISE',
  },
  {
    promiseId: 'helps-create-applications',
    promise: 'Helps create applications',
    category: 'PRODUCT_PROMISE',
  },
  {
    promiseId: 'understands-requirements',
    promise: 'Understands requirements',
    category: 'PRODUCT_PROMISE',
  },
  {
    promiseId: 'assists-planning',
    promise: 'Assists planning',
    category: 'PRODUCT_PROMISE',
  },
  {
    promiseId: 'understands-intent',
    promise: 'Understands intent',
    category: 'INTELLIGENCE_PROMISE',
  },
  {
    promiseId: 'answers-correctly',
    promise: 'Answers correctly',
    category: 'INTELLIGENCE_PROMISE',
  },
  {
    promiseId: 'provides-useful-guidance',
    promise: 'Provides useful guidance',
    category: 'INTELLIGENCE_PROMISE',
  },
  {
    promiseId: 'readiness-visibility',
    promise: 'Provides readiness visibility',
    category: 'LAUNCH_PROMISE',
  },
  {
    promiseId: 'verification-visibility',
    promise: 'Provides verification visibility',
    category: 'LAUNCH_PROMISE',
  },
  {
    promiseId: 'launch-confidence',
    promise: 'Ready for launch',
    category: 'LAUNCH_PROMISE',
  },
  {
    promiseId: 'honesty',
    promise: 'Responds honestly',
    category: 'TRUST_PROMISE',
  },
  {
    promiseId: 'transparency',
    promise: 'Operates transparently',
    category: 'TRUST_PROMISE',
  },
  {
    promiseId: 'uncertainty-visibility',
    promise: 'Surfaces uncertainty visibly',
    category: 'TRUST_PROMISE',
  },
  {
    promiseId: 'software-creation',
    promise: 'Creates software from bounded execution',
    category: 'BUILDER_PROMISE',
  },
  {
    promiseId: 'project-understanding',
    promise: 'Understands project context',
    category: 'BUILDER_PROMISE',
  },
  {
    promiseId: 'architecture-support',
    promise: 'Supports architecture planning',
    category: 'BUILDER_PROMISE',
  },
] as const;

export function listRegisteredPromises(): readonly RegisteredPromiseDefinition[] {
  return REGISTERED_PROMISES;
}

export function getRegisteredPromise(promiseId: string): RegisteredPromiseDefinition | null {
  return REGISTERED_PROMISES.find((entry) => entry.promiseId === promiseId) ?? null;
}

export function assertPromiseRegistryIntegrity(): boolean {
  const categories = new Set(REGISTERED_PROMISES.map((entry) => entry.category));
  const ids = new Set(REGISTERED_PROMISES.map((entry) => entry.promiseId));
  return (
    REGISTERED_PROMISES.length === 16 &&
    ids.size === REGISTERED_PROMISES.length &&
    categories.size === 5 &&
    REGISTERED_PROMISES.every((entry) => entry.promiseId.length > 0 && entry.promise.length > 0)
  );
}
