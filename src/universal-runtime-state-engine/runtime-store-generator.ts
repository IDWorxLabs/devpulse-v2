/**
 * Universal Runtime State Engine V1 — shared runtime store generation.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import { runtimeEventModelSource } from './runtime-event-model.js';

const RUNTIME_ROOT = 'src/universal-runtime-state';

export function buildUniversalRuntimeSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: `${RUNTIME_ROOT}/types.ts`,
      content: `/** Universal runtime state — shared types */
export type RuntimeQueryStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'EMPTY' | 'ERROR' | 'STALE' | 'REFRESHING';
export type RuntimeMutationStatus = 'IDLE' | 'PENDING' | 'OPTIMISTIC' | 'COMMITTED' | 'FAILED' | 'ROLLED_BACK' | 'CANCELLED' | 'RETRYING';

export interface RuntimeQueryState<T = unknown> {
  queryKey: string;
  scopeId: string;
  status: RuntimeQueryStatus;
  data: T | null;
  error: string | null;
  requestedAt: string | null;
  resolvedAt: string | null;
  requestVersion: number;
  invalidated: boolean;
  refreshing: boolean;
}

export interface RuntimeMutationState {
  mutationId: string;
  status: RuntimeMutationStatus;
  optimistic: boolean;
  rollbackSnapshot: unknown;
  affectedQueryKeys: string[];
  error: string | null;
  retryCount: number;
}

export interface RuntimeEntityCache {
  entities: Record<string, unknown>;
  collections: Record<string, string[]>;
  queryStates: Record<string, RuntimeQueryState>;
  mutations: Record<string, RuntimeMutationState>;
  selection: Record<string, string[]>;
  forms: Record<string, { values: Record<string, string>; dirty: boolean; touched: Record<string, boolean>; errors: Record<string, string> }>;
  workflows: Record<string, unknown>;
  relationships: Record<string, unknown>;
  navigation: { moduleId: string | null; recordId: string | null; route: string | null };
  feedback: { success: string | null; error: string | null };
  rules: Record<string, { status: string; value: unknown; explanation: string; version: string }>;
  history: Array<{ event: string; scopeId: string; at: string; outcome: string }>;
}
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/event-model.ts`,
      content: runtimeEventModelSource(),
    },
    {
      relativePath: `${RUNTIME_ROOT}/store.ts`,
      content: STORE_SOURCE,
    },
    {
      relativePath: `${RUNTIME_ROOT}/query-engine.ts`,
      content: QUERY_ENGINE_SOURCE,
    },
    {
      relativePath: `${RUNTIME_ROOT}/cache-engine.ts`,
      content: CACHE_ENGINE_SOURCE,
    },
    {
      relativePath: `${RUNTIME_ROOT}/invalidation-engine.ts`,
      content: INVALIDATION_SOURCE,
    },
    {
      relativePath: `${RUNTIME_ROOT}/mutation-engine.ts`,
      content: MUTATION_SOURCE,
    },
    {
      relativePath: `${RUNTIME_ROOT}/optimistic-update.ts`,
      content: OPTIMISTIC_SOURCE,
    },
    {
      relativePath: `${RUNTIME_ROOT}/rollback-engine.ts`,
      content: ROLLBACK_SOURCE,
    },
    {
      relativePath: `${RUNTIME_ROOT}/concurrency-control.ts`,
      content: CONCURRENCY_SOURCE,
    },
    {
      relativePath: `${RUNTIME_ROOT}/invariants.ts`,
      content: INVARIANTS_SOURCE,
    },
    {
      relativePath: `${RUNTIME_ROOT}/index.ts`,
      content: `export * from './types';
export * from './event-model';
export * from './store';
export * from './query-engine';
export * from './cache-engine';
export * from './invalidation-engine';
export * from './mutation-engine';
export * from './optimistic-update';
export * from './rollback-engine';
export * from './concurrency-control';
export * from './invariants';
`,
    },
  ];
}

const STORE_SOURCE = `/** Universal runtime store */
import type { RuntimeEntityCache, RuntimeQueryState, RuntimeMutationState } from './types';
import type { RuntimeEvent, RuntimeEventType } from './event-model';
import { applyRuntimeTransition } from './mutation-engine';
import { invalidateQueryKeys } from './invalidation-engine';
import { validateRuntimeInvariants } from './invariants';

type Listener = () => void;

const scopes = new Map<string, RuntimeEntityCache>();
const listeners = new Map<string, Set<Listener>>();
const HISTORY_LIMIT = 50;

function emptyCache(scopeId: string): RuntimeEntityCache {
  return {
    entities: {},
    collections: {},
    queryStates: {},
    mutations: {},
    selection: { [scopeId]: [] },
    forms: {},
    workflows: {},
    relationships: {},
    navigation: { moduleId: null, recordId: null, route: null },
    feedback: { success: null, error: null },
    rules: {},
    history: [],
  };
}

export function registerRuntimeScope(scopeId: string): RuntimeEntityCache {
  if (!scopes.has(scopeId)) scopes.set(scopeId, emptyCache(scopeId));
  return scopes.get(scopeId)!;
}

export function unregisterRuntimeScope(scopeId: string): void {
  scopes.delete(scopeId);
  listeners.delete(scopeId);
}

export function getRuntimeState(scopeId: string): RuntimeEntityCache {
  return registerRuntimeScope(scopeId);
}

export function dispatchRuntimeEvent(event: RuntimeEvent): RuntimeEntityCache {
  const state = registerRuntimeScope(event.scopeId);
  const next = applyRuntimeTransition(state, event);
  if (event.type === 'query/invalidate' || event.type === 'mutation/commit') {
    const keys = (event.payload.affectedQueryKeys as string[] | undefined) ?? [];
    invalidateQueryKeys(next, keys.length ? keys : Object.keys(next.queryStates));
  }
  validateRuntimeInvariants(next, event.scopeId);
  next.history = [...next.history, { event: event.type, scopeId: event.scopeId, at: event.timestamp, outcome: 'applied' }].slice(-HISTORY_LIMIT);
  scopes.set(event.scopeId, next);
  listeners.get(event.scopeId)?.forEach((fn) => fn());
  return next;
}

export function subscribeRuntimeScope(scopeId: string, listener: Listener): () => void {
  if (!listeners.has(scopeId)) listeners.set(scopeId, new Set());
  listeners.get(scopeId)!.add(listener);
  return () => listeners.get(scopeId)?.delete(listener);
}

export function selectRuntimeQuery<T>(scopeId: string, queryKey: string): RuntimeQueryState<T> {
  const state = getRuntimeState(scopeId);
  return (state.queryStates[queryKey] as RuntimeQueryState<T> | undefined) ?? {
    queryKey,
    scopeId,
    status: 'IDLE',
    data: null,
    error: null,
    requestedAt: null,
    resolvedAt: null,
    requestVersion: 0,
    invalidated: false,
    refreshing: false,
  };
}

export function snapshotRuntimeState(scopeId: string): RuntimeEntityCache {
  return structuredClone(getRuntimeState(scopeId));
}

export function restoreRuntimeState(scopeId: string, snapshot: RuntimeEntityCache): void {
  scopes.set(scopeId, structuredClone(snapshot));
  listeners.get(scopeId)?.forEach((fn) => fn());
}

export function resetRuntimeScope(scopeId: string): void {
  scopes.set(scopeId, emptyCache(scopeId));
  listeners.get(scopeId)?.forEach((fn) => fn());
}
`;

const QUERY_ENGINE_SOURCE = `/** Universal runtime query engine with deduplication and stale suppression */
import type { RuntimeQueryState } from './types';
import { getRuntimeState } from './store';

const inflight = new Map<string, Promise<unknown>>();

export function stableQueryKey(scopeId: string, kind: string, params: Record<string, string | number> = {}): string {
  const paramKey = Object.keys(params).sort().map((k) => \`\${k}:\${params[k]}\`).join('|');
  return \`\${scopeId}::\${kind}\${paramKey ? \`::\${paramKey}\` : ''}\`;
}

export async function executeRuntimeQuery<T>(
  scopeId: string,
  queryKey: string,
  fetcher: () => T | Promise<T>,
  force = false,
): Promise<T> {
  const state = getRuntimeState(scopeId);
  const existing = state.queryStates[queryKey] as RuntimeQueryState<T> | undefined;
  const nextVersion = (existing?.requestVersion ?? 0) + 1;
  if (!force && inflight.has(queryKey)) return inflight.get(queryKey) as Promise<T>;

  state.queryStates[queryKey] = {
    queryKey,
    scopeId,
    status: 'LOADING',
    data: existing?.data ?? null,
    error: null,
    requestedAt: new Date().toISOString(),
    resolvedAt: null,
    requestVersion: nextVersion,
    invalidated: false,
    refreshing: !!existing?.data,
  };

  const promise = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      const current = getRuntimeState(scopeId).queryStates[queryKey] as RuntimeQueryState<T> | undefined;
      if (!current || current.requestVersion !== nextVersion) return data;
      const items = Array.isArray(data) ? data : data;
      current.status = Array.isArray(items) && items.length === 0 ? 'EMPTY' : 'SUCCESS';
      current.data = data;
      current.resolvedAt = new Date().toISOString();
      current.refreshing = false;
      current.invalidated = false;
      return data;
    })
    .catch((err) => {
      const current = getRuntimeState(scopeId).queryStates[queryKey] as RuntimeQueryState<T> | undefined;
      if (current && current.requestVersion === nextVersion) {
        current.status = 'ERROR';
        current.error = err instanceof Error ? err.message : 'Query failed';
        current.refreshing = false;
      }
      throw err;
    })
    .finally(() => inflight.delete(queryKey));

  inflight.set(queryKey, promise);
  return promise;
}

export function isStaleQueryResponse(scopeId: string, queryKey: string, version: number): boolean {
  const current = getRuntimeState(scopeId).queryStates[queryKey];
  return !current || current.requestVersion !== version;
}
`;

const CACHE_ENGINE_SOURCE = `/** Universal runtime normalized cache */
import type { RuntimeEntityCache } from './types';

export function upsertRuntimeEntity(cache: RuntimeEntityCache, id: string, entity: unknown): void {
  cache.entities[id] = entity;
}

export function removeRuntimeEntity(cache: RuntimeEntityCache, id: string): void {
  delete cache.entities[id];
  for (const key of Object.keys(cache.collections)) {
    cache.collections[key] = (cache.collections[key] ?? []).filter((entityId) => entityId !== id);
  }
  for (const key of Object.keys(cache.selection)) {
    cache.selection[key] = (cache.selection[key] ?? []).filter((entityId) => entityId !== id);
  }
}

export function replaceRuntimeCollection(cache: RuntimeEntityCache, collectionKey: string, ids: string[]): void {
  cache.collections[collectionKey] = [...new Set(ids)];
  for (const id of ids) {
    if (cache.entities[id]) continue;
  }
}
`;

const INVALIDATION_SOURCE = `/** Universal runtime cache invalidation */
import type { RuntimeEntityCache } from './types';

export function invalidateQueryKeys(cache: RuntimeEntityCache, keys: string[]): void {
  for (const key of keys) {
    const query = cache.queryStates[key];
    if (query) {
      query.invalidated = true;
      query.status = query.status === 'LOADING' ? query.status : 'STALE';
    }
  }
}

export function invalidateEntityDependents(cache: RuntimeEntityCache, entityId: string): string[] {
  const affected: string[] = [];
  for (const [key, ids] of Object.entries(cache.collections)) {
    if ((ids ?? []).includes(entityId)) affected.push(key);
  }
  invalidateQueryKeys(cache, affected);
  return affected;
}
`;

const MUTATION_SOURCE = `/** Universal runtime mutation transitions */
import type { RuntimeEntityCache } from './types';
import type { RuntimeEvent } from './event-model';
import { upsertRuntimeEntity, removeRuntimeEntity, replaceRuntimeCollection } from './cache-engine';
import { applyOptimisticUpdate, commitOptimisticUpdate, rollbackOptimisticUpdate } from './optimistic-update';

export function applyRuntimeTransition(state: RuntimeEntityCache, event: RuntimeEvent): RuntimeEntityCache {
  const next = structuredClone(state);
  switch (event.type) {
    case 'runtime/initialize':
      return next;
    case 'query/start':
      next.queryStates[event.payload.queryKey as string] = {
        queryKey: event.payload.queryKey as string,
        scopeId: event.scopeId,
        status: 'LOADING',
        data: null,
        error: null,
        requestedAt: event.timestamp,
        resolvedAt: null,
        requestVersion: (event.payload.requestVersion as number) ?? 1,
        invalidated: false,
        refreshing: false,
      };
      return next;
    case 'query/success':
      next.queryStates[event.payload.queryKey as string] = {
        ...(next.queryStates[event.payload.queryKey as string] ?? {}),
        queryKey: event.payload.queryKey as string,
        scopeId: event.scopeId,
        status: 'SUCCESS',
        data: event.payload.data,
        error: null,
        resolvedAt: event.timestamp,
        invalidated: false,
        refreshing: false,
      } as never;
      return next;
    case 'mutation/start':
      next.mutations[event.payload.mutationId as string] = {
        mutationId: event.payload.mutationId as string,
        status: 'PENDING',
        optimistic: false,
        rollbackSnapshot: null,
        affectedQueryKeys: (event.payload.affectedQueryKeys as string[]) ?? [],
        error: null,
        retryCount: 0,
      };
      return next;
    case 'mutation/optimistic':
      return applyOptimisticUpdate(next, event);
    case 'mutation/commit':
      commitOptimisticUpdate(next, event);
      next.feedback.success = (event.payload.message as string) ?? 'Committed';
      next.feedback.error = null;
      return next;
    case 'mutation/rollback':
      return rollbackOptimisticUpdate(next, event);
    case 'mutation/failure':
      next.mutations[event.payload.mutationId as string] = {
        ...(next.mutations[event.payload.mutationId as string] ?? {}),
        mutationId: event.payload.mutationId as string,
        status: 'FAILED',
        optimistic: false,
        rollbackSnapshot: null,
        affectedQueryKeys: (event.payload.affectedQueryKeys as string[]) ?? [],
        error: (event.payload.error as string) ?? 'Mutation failed',
        retryCount: ((next.mutations[event.payload.mutationId as string]?.retryCount) ?? 0) + 1,
      };
      next.feedback.error = (event.payload.error as string) ?? 'Mutation failed';
      next.feedback.success = null;
      return next;
    case 'entity/upsert':
      upsertRuntimeEntity(next, event.payload.id as string, event.payload.entity);
      return next;
    case 'entity/remove':
      removeRuntimeEntity(next, event.payload.id as string);
      return next;
    case 'collection/replace':
      replaceRuntimeCollection(next, event.payload.collectionKey as string, (event.payload.ids as string[]) ?? []);
      return next;
    case 'selection/set':
      next.selection[event.scopeId] = (event.payload.ids as string[]) ?? [];
      return next;
    case 'selection/clear':
      next.selection[event.scopeId] = [];
      return next;
    case 'form/change':
      next.forms[event.scopeId] = {
        values: (event.payload.values as Record<string, string>) ?? {},
        dirty: true,
        touched: (event.payload.touched as Record<string, boolean>) ?? {},
        errors: (event.payload.errors as Record<string, string>) ?? {},
      };
      return next;
    case 'form/clean':
      if (next.forms[event.scopeId]) next.forms[event.scopeId].dirty = false;
      return next;
    case 'workflow/transition':
      next.workflows[event.payload.workflowId as string] = event.payload.instance;
      return next;
    case 'workflow/resume':
      next.workflows[event.payload.workflowId as string] = event.payload.instance;
      return next;
    case 'relationship/link':
    case 'relationship/unlink':
      next.relationships[event.payload.relationshipId as string] = event.payload;
      return next;
    case 'navigation/change':
      next.navigation = {
        moduleId: (event.payload.moduleId as string) ?? null,
        recordId: (event.payload.recordId as string) ?? null,
        route: (event.payload.route as string) ?? null,
      };
      return next;
    case 'feedback/success':
      next.feedback.success = (event.payload.message as string) ?? null;
      next.feedback.error = null;
      return next;
    case 'feedback/error':
      next.feedback.error = (event.payload.message as string) ?? null;
      next.feedback.success = null;
      return next;
    case 'rule/evaluation-start':
      next.rules[event.payload.ruleId as string] = {
        status: 'PENDING',
        value: null,
        explanation: '',
        version: (event.payload.version as string) ?? '',
      };
      return next;
    case 'rule/evaluation-success':
    case 'rule/evaluation-failure':
    case 'rule/value-updated':
    case 'rule/blocked':
    case 'rule/invalid':
      next.rules[event.payload.ruleId as string] = {
        status: (event.payload.status as string) ?? 'VALUE',
        value: event.payload.value,
        explanation: (event.payload.explanation as string) ?? '',
        version: (event.payload.version as string) ?? '',
      };
      return next;
    case 'rule/dependency-invalidated':
      delete next.rules[event.payload.ruleId as string];
      return next;
    case 'capability/register':
    case 'capability/initialize':
    case 'pack/configure':
    case 'pack/materialize':
      next.workflows[event.payload.packId as string] = { stage: event.type, ready: false };
      return next;
    case 'capability/ready':
    case 'pack/verify':
      next.workflows[event.payload.packId as string] = { stage: event.type, ready: true };
      return next;
    case 'capability/blocked':
    case 'capability/failure':
    case 'pack/unload':
      delete next.workflows[event.payload.packId as string];
      return next;
    case 'capability/reset':
      return next;
    case 'query/invalidate':
    case 'query/revalidate':
    case 'runtime/reset':
    case 'retry/request':
    case 'synchronization/complete':
      return next;
    default:
      return next;
  }
}
`;

const OPTIMISTIC_SOURCE = `/** Universal runtime optimistic updates */
import type { RuntimeEntityCache } from './types';
import type { RuntimeEvent } from './event-model';
import { upsertRuntimeEntity, removeRuntimeEntity } from './cache-engine';

export function applyOptimisticUpdate(cache: RuntimeEntityCache, event: RuntimeEvent): RuntimeEntityCache {
  const mutationId = event.payload.mutationId as string;
  cache.mutations[mutationId] = {
    mutationId,
    status: 'OPTIMISTIC',
    optimistic: true,
    rollbackSnapshot: event.payload.rollbackSnapshot ?? null,
    affectedQueryKeys: (event.payload.affectedQueryKeys as string[]) ?? [],
    error: null,
    retryCount: 0,
  };
  if (event.payload.entity && event.payload.id) {
    upsertRuntimeEntity(cache, event.payload.id as string, event.payload.entity);
  }
  return cache;
}

export function commitOptimisticUpdate(cache: RuntimeEntityCache, event: RuntimeEvent): void {
  const mutationId = event.payload.mutationId as string;
  if (cache.mutations[mutationId]) {
    cache.mutations[mutationId].status = 'COMMITTED';
    cache.mutations[mutationId].optimistic = false;
  }
}

export function rollbackOptimisticUpdate(cache: RuntimeEntityCache, event: RuntimeEvent): RuntimeEntityCache {
  const mutationId = event.payload.mutationId as string;
  const snapshot = cache.mutations[mutationId]?.rollbackSnapshot as { entities?: Record<string, unknown>; selection?: Record<string, string[]> } | null;
  if (snapshot?.entities) cache.entities = { ...snapshot.entities };
  if (snapshot?.selection) cache.selection = { ...snapshot.selection };
  if (event.payload.removeId) removeRuntimeEntity(cache, event.payload.removeId as string);
  cache.mutations[mutationId] = {
    mutationId,
    status: 'ROLLED_BACK',
    optimistic: false,
    rollbackSnapshot: null,
    affectedQueryKeys: (event.payload.affectedQueryKeys as string[]) ?? [],
    error: (event.payload.error as string) ?? 'Rolled back',
    retryCount: cache.mutations[mutationId]?.retryCount ?? 0,
  };
  cache.feedback.error = (event.payload.error as string) ?? 'Mutation rolled back';
  cache.feedback.success = null;
  return cache;
}
`;

const ROLLBACK_SOURCE = `/** Universal runtime rollback helpers */
export { rollbackOptimisticUpdate } from './optimistic-update';
`;

const CONCURRENCY_SOURCE = `/** Universal runtime concurrency control */
const activeMutations = new Map<string, string>();

export function tryAcquireMutationLock(scopeId: string, mutationId: string): boolean {
  const existing = activeMutations.get(scopeId);
  if (existing && existing !== mutationId) return false;
  activeMutations.set(scopeId, mutationId);
  return true;
}

export function releaseMutationLock(scopeId: string, mutationId: string): void {
  if (activeMutations.get(scopeId) === mutationId) activeMutations.delete(scopeId);
}

export function rejectDuplicateMutation(scopeId: string, mutationId: string): boolean {
  return activeMutations.has(scopeId) && activeMutations.get(scopeId) !== mutationId;
}
`;

const INVARIANTS_SOURCE = `/** Universal runtime invariant validation */
import type { RuntimeEntityCache } from './types';

export function validateRuntimeInvariants(state: RuntimeEntityCache, scopeId: string): void {
  const selection = state.selection[scopeId] ?? [];
  for (const id of selection) {
    if (!state.entities[id] && Object.keys(state.entities).length > 0 && !selection.includes('__allowed_missing__')) {
      state.selection[scopeId] = selection.filter((x) => x !== id);
    }
  }
  for (const mutation of Object.values(state.mutations)) {
    if (mutation.status === 'COMMITTED' && mutation.optimistic) mutation.optimistic = false;
    if (mutation.status === 'ROLLED_BACK' && state.feedback.success) state.feedback.success = null;
  }
  for (const query of Object.values(state.queryStates)) {
    if (query.invalidated && query.status === 'SUCCESS') query.status = 'STALE';
  }
}
`;
