/**
 * Universal CRUD Generation Engine V1 — runtime state hook generation.
 */

import type { UniversalCrudEntityGenerationInput } from './universal-crud-types.js';
import { escTsString, moduleIdToPascalCase } from './universal-crud-types.js';

export function generateCrudRuntimeStateSource(input: UniversalCrudEntityGenerationInput): string {
  const { descriptor } = input;
  const pascal = moduleIdToPascalCase(descriptor.entityId);

  return `/** Universal CRUD runtime state — ${escTsString(descriptor.displayName)} */
import { useCallback, useMemo, useState } from 'react';
import type { CrudListQuery } from '../../universal-crud-runtime/types';
import type { ${pascal}Entity, ${pascal}FormInput } from './${descriptor.entityId}.types';
import {
  create${pascal}Record,
  delete${pascal}Record,
  list${pascal}Records,
  search${pascal}Records,
  update${pascal}Record,
} from './${descriptor.entityId}.service';

export interface ${pascal}CrudRuntimeState {
  items: ${pascal}Entity[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  success: string | null;
  search: string;
  sortField: 'label' | 'createdAt' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
  selectedIds: string[];
  dirty: boolean;
  pendingDeleteId: string | null;
  undoSnapshot: ${pascal}Entity | null;
  refresh: () => void;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  setSort: (field: 'label' | 'createdAt' | 'updatedAt', direction: 'asc' | 'desc') => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  create: (input: ${pascal}FormInput) => void;
  update: (id: string, input: ${pascal}FormInput) => void;
  requestDelete: (id: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  undoDelete: () => void;
}

export function use${pascal}CrudRuntime(pageSize = 10): ${pascal}CrudRuntimeState {
  const [items, setItems] = useState<${pascal}Entity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearchState] = useState('');
  const [sortField, setSortField] = useState<'label' | 'createdAt' | 'updatedAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<${pascal}Entity | null>(null);

  const query = useMemo(
    (): CrudListQuery => ({ search, sortField, sortDirection, page, pageSize }),
    [search, sortField, sortDirection, page, pageSize],
  );

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const result = search.trim()
        ? search${pascal}Records(search.trim(), query)
        : list${pascal}Records(query);
      setItems(result.items);
      setTotal(result.total);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [query, search]);

  const create = useCallback(
    (input: ${pascal}FormInput) => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        create${pascal}Record(input);
        setSuccess('Created successfully');
        setDirty(true);
        reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Create failed');
      } finally {
        setLoading(false);
      }
    },
    [reload],
  );

  const update = useCallback(
    (id: string, input: ${pascal}FormInput) => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        update${pascal}Record(id, input);
        setSuccess('Updated successfully');
        setDirty(true);
        reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed');
      } finally {
        setLoading(false);
      }
    },
    [reload],
  );

  const requestDelete = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!pendingDeleteId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const snapshot = items.find((item) => item.id === pendingDeleteId) ?? null;
      const ok = delete${pascal}Record(pendingDeleteId);
      if (!ok) throw new Error('Delete failed');
      setUndoSnapshot(snapshot);
      setSuccess('Deleted successfully');
      setPendingDeleteId(null);
      setDirty(true);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  }, [items, pendingDeleteId, reload]);

  const cancelDelete = useCallback(() => setPendingDeleteId(null), []);

  const undoDelete = useCallback(() => {
    if (!undoSnapshot) return;
    create${pascal}Record({ label: undoSnapshot.label });
    setUndoSnapshot(null);
    setSuccess('Restored deleted record');
    reload();
  }, [undoSnapshot, reload]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
    setDirty(true);
  }, []);

  const setSort = useCallback((field: 'label' | 'createdAt' | 'updatedAt', direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setPage(1);
    setDirty(true);
  }, []);

  return {
    items,
    total,
    page,
    pageSize,
    loading,
    error,
    success,
    search,
    sortField,
    sortDirection,
    selectedIds,
    dirty,
    pendingDeleteId,
    undoSnapshot,
    refresh: reload,
    setSearch,
    setPage,
    setSort,
    toggleSelection,
    clearSelection,
    create,
    update,
    requestDelete,
    confirmDelete,
    cancelDelete,
    undoDelete,
  };
}
`;
}
