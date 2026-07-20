/**
 * Universal Runtime State Engine V1 — per-module universal runtime hook generation.
 */

import type { UniversalRuntimeMaterializationInput, UniversalRuntimeStateDescriptor } from './universal-runtime-types.js';
import { stableRuntimeScopeId, stableQueryKey } from './universal-runtime-types.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';

export function generateModuleUniversalRuntimeSource(
  descriptors: readonly UniversalRuntimeStateDescriptor[],
  input: UniversalRuntimeMaterializationInput,
): string {
  const pascal = moduleIdToPascalCase(input.moduleId);
  const scopeId = stableRuntimeScopeId(input.moduleId, input.moduleId);
  const listQueryKey = stableQueryKey(scopeId, 'entity-list');

  return `/** Universal runtime hook — ${input.moduleDisplayName} */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  registerRuntimeScope,
  dispatchRuntimeEvent,
  subscribeRuntimeScope,
  getRuntimeState,
  selectRuntimeQuery,
  snapshotRuntimeState,
  restoreRuntimeState,
} from '../../universal-runtime-state/store';
import { createRuntimeEvent } from '../../universal-runtime-state/event-model';
import { executeRuntimeQuery, stableQueryKey as buildQueryKey } from '../../universal-runtime-state/query-engine';
import { tryAcquireMutationLock, releaseMutationLock, rejectDuplicateMutation } from '../../universal-runtime-state/concurrency-control';
import { invalidateQueryKeys } from '../../universal-runtime-state/invalidation-engine';
import { use${pascal}CrudRuntime } from './${input.moduleId}.runtime-state';
${input.workflowBacked ? `import { use${pascal}WorkflowRuntime } from './${input.moduleId}.workflow-runtime';` : ''}
${input.relationshipBacked ? `import { use${pascal}RelationshipRuntime } from './${input.moduleId}.relationship-runtime';` : ''}

const RUNTIME_SCOPE_ID = '${scopeId}';
const LIST_QUERY_KEY = '${listQueryKey}';

export function use${pascal}UniversalRuntime(pageSize = 10) {
  const crud = use${pascal}CrudRuntime(pageSize);
  ${input.workflowBacked ? `const workflow = use${pascal}WorkflowRuntime();` : ''}
  ${input.relationshipBacked ? `const relationship = use${pascal}RelationshipRuntime();` : ''}
  const [, force] = useState(0);

  useEffect(() => {
    registerRuntimeScope(RUNTIME_SCOPE_ID);
    dispatchRuntimeEvent(createRuntimeEvent('runtime/initialize', RUNTIME_SCOPE_ID, { moduleId: '${input.moduleId}' }, 'universal-runtime-state-engine'));
    return subscribeRuntimeScope(RUNTIME_SCOPE_ID, () => force((v) => v + 1));
  }, []);

  const runtimeState = useSyncExternalStore(
    (cb) => subscribeRuntimeScope(RUNTIME_SCOPE_ID, cb),
    () => getRuntimeState(RUNTIME_SCOPE_ID),
    () => getRuntimeState(RUNTIME_SCOPE_ID),
  );

  const syncCrudToRuntime = useCallback(() => {
    dispatchRuntimeEvent(createRuntimeEvent('query/success', RUNTIME_SCOPE_ID, {
      queryKey: LIST_QUERY_KEY,
      data: crud.items,
      total: crud.total,
    }, 'b1-crud-sync'));
    dispatchRuntimeEvent(createRuntimeEvent('collection/replace', RUNTIME_SCOPE_ID, {
      collectionKey: LIST_QUERY_KEY,
      ids: crud.items.map((item) => item.id),
    }, 'b1-crud-sync'));
    for (const item of crud.items) {
      dispatchRuntimeEvent(createRuntimeEvent('entity/upsert', RUNTIME_SCOPE_ID, { id: item.id, entity: item }, 'b1-crud-sync'));
    }
    dispatchRuntimeEvent(createRuntimeEvent('selection/set', RUNTIME_SCOPE_ID, { ids: crud.selectedIds }, 'b1-crud-sync'));
    if (crud.success) dispatchRuntimeEvent(createRuntimeEvent('feedback/success', RUNTIME_SCOPE_ID, { message: crud.success }, 'b1-crud-sync'));
    if (crud.error) dispatchRuntimeEvent(createRuntimeEvent('feedback/error', RUNTIME_SCOPE_ID, { message: crud.error }, 'b1-crud-sync'));
  }, [crud.items, crud.total, crud.selectedIds, crud.success, crud.error]);

  useEffect(() => { syncCrudToRuntime(); }, [syncCrudToRuntime]);

  ${input.workflowBacked ? `useEffect(() => {
    dispatchRuntimeEvent(createRuntimeEvent('workflow/transition', RUNTIME_SCOPE_ID, {
      workflowId: workflow.instance.workflowId,
      instance: workflow.instance,
      route: '${input.moduleRoute}',
    }, 'b3-workflow-sync'));
  }, [workflow.instance]);` : ''}

  ${input.relationshipBacked ? `useEffect(() => {
    dispatchRuntimeEvent(createRuntimeEvent('relationship/link', RUNTIME_SCOPE_ID, {
      relationshipId: 'sync',
      relatedLists: relationship.relatedLists,
      relatedCounts: relationship.relatedCounts,
    }, 'b4-relationship-sync'));
  }, [relationship.relatedLists, relationship.relatedCounts]);` : ''}

  const dispatchRuntimeMutation = useCallback(async (mutationId: string, execute: () => void, optimistic?: { id?: string; entity?: unknown }) => {
    if (rejectDuplicateMutation(RUNTIME_SCOPE_ID, mutationId)) {
      dispatchRuntimeEvent(createRuntimeEvent('mutation/failure', RUNTIME_SCOPE_ID, {
        mutationId,
        error: 'Duplicate mutation rejected',
        affectedQueryKeys: [LIST_QUERY_KEY],
      }, 'runtime-concurrency'));
      return;
    }
    if (!tryAcquireMutationLock(RUNTIME_SCOPE_ID, mutationId)) return;
    const rollbackSnapshot = snapshotRuntimeState(RUNTIME_SCOPE_ID);
    dispatchRuntimeEvent(createRuntimeEvent('mutation/start', RUNTIME_SCOPE_ID, {
      mutationId,
      affectedQueryKeys: [LIST_QUERY_KEY],
    }, 'runtime-mutation'));
    if (optimistic?.id && optimistic.entity) {
      dispatchRuntimeEvent(createRuntimeEvent('mutation/optimistic', RUNTIME_SCOPE_ID, {
        mutationId,
        id: optimistic.id,
        entity: optimistic.entity,
        rollbackSnapshot,
        affectedQueryKeys: [LIST_QUERY_KEY],
      }, 'runtime-optimistic'));
    }
    try {
      execute();
      dispatchRuntimeEvent(createRuntimeEvent('mutation/commit', RUNTIME_SCOPE_ID, {
        mutationId,
        message: 'Mutation committed',
        affectedQueryKeys: [LIST_QUERY_KEY],
      }, 'runtime-mutation'));
      invalidateQueryKeys(getRuntimeState(RUNTIME_SCOPE_ID), [LIST_QUERY_KEY]);
      crud.refresh();
      ${input.relationshipBacked ? 'relationship.refreshRelated();' : ''}
      dispatchRuntimeEvent(createRuntimeEvent('synchronization/complete', RUNTIME_SCOPE_ID, { mutationId }, 'runtime-sync'));
    } catch (err) {
      restoreRuntimeState(RUNTIME_SCOPE_ID, rollbackSnapshot);
      dispatchRuntimeEvent(createRuntimeEvent('mutation/rollback', RUNTIME_SCOPE_ID, {
        mutationId,
        rollbackSnapshot,
        error: err instanceof Error ? err.message : 'Mutation failed',
        affectedQueryKeys: [LIST_QUERY_KEY],
      }, 'runtime-rollback'));
      dispatchRuntimeEvent(createRuntimeEvent('mutation/failure', RUNTIME_SCOPE_ID, {
        mutationId,
        error: err instanceof Error ? err.message : 'Mutation failed',
        affectedQueryKeys: [LIST_QUERY_KEY],
      }, 'runtime-mutation'));
    } finally {
      releaseMutationLock(RUNTIME_SCOPE_ID, mutationId);
    }
  }, [crud${input.relationshipBacked ? ', relationship' : ''}]);

  const dispatchTypedRuntimeEvent = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    dispatchRuntimeEvent(createRuntimeEvent(type as never, RUNTIME_SCOPE_ID, payload, 'b2-action-dispatch'));
  }, []);

  const revalidateQueries = useCallback(() => {
    dispatchRuntimeEvent(createRuntimeEvent('query/revalidate', RUNTIME_SCOPE_ID, { queryKey: LIST_QUERY_KEY }, 'runtime-revalidate'));
    return executeRuntimeQuery(RUNTIME_SCOPE_ID, LIST_QUERY_KEY, () => crud.items, true);
  }, [crud.items]);

  const queryState = useMemo(() => selectRuntimeQuery(RUNTIME_SCOPE_ID, LIST_QUERY_KEY), [runtimeState]);

  return {
    scopeId: RUNTIME_SCOPE_ID,
    crud,
    ${input.workflowBacked ? 'workflow,' : ''}
    ${input.relationshipBacked ? 'relationship,' : ''}
    runtimeState,
    queryState,
    dispatchRuntimeEvent: dispatchTypedRuntimeEvent,
    dispatchRuntimeMutation,
    revalidateQueries,
    invalidateQueries: () => dispatchRuntimeEvent(createRuntimeEvent('query/invalidate', RUNTIME_SCOPE_ID, { affectedQueryKeys: [LIST_QUERY_KEY] }, 'runtime-invalidate')),
    createWithRuntime: (input: Parameters<typeof crud.create>[0]) =>
      dispatchRuntimeMutation('create', () => crud.create(input)),
    updateWithRuntime: (id: string, input: Parameters<typeof crud.update>[1]) =>
      dispatchRuntimeMutation('update', () => crud.update(id, input), { id, entity: { id, ...input } }),
    deleteWithRuntime: (id: string) =>
      dispatchRuntimeMutation('delete', () => { crud.requestDelete(id); crud.confirmDelete(); }),
    retryQuery: () => revalidateQueries(),
  };
}
`;
}
