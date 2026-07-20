/**
 * Universal CRUD Generation Engine V1 — shared persistence runtime (generated into every workspace).
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';

const RUNTIME_ROOT = 'src/universal-crud-runtime';

/** Generates the shared persistence abstraction layer once per materialized workspace. */
export function buildUniversalCrudSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: `${RUNTIME_ROOT}/types.ts`,
      content: `/** Universal CRUD runtime — shared entity types */
export interface CrudEntityBase {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

export type CrudSortDirection = 'asc' | 'desc';

export interface CrudListQuery {
  search?: string;
  sortField?: keyof CrudEntityBase;
  sortDirection?: CrudSortDirection;
  page?: number;
  pageSize?: number;
}

export interface CrudListResult<T extends CrudEntityBase> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/persistence-abstraction.ts`,
      content: `/** Universal CRUD persistence abstraction — provider-agnostic */
import type { CrudEntityBase, CrudListQuery, CrudListResult } from './types';

export interface CrudPersistenceProvider<T extends CrudEntityBase> {
  create(entity: T): T;
  update(id: string, patch: Partial<T>): T | null;
  delete(id: string): boolean;
  findById(id: string): T | null;
  list(query?: CrudListQuery): CrudListResult<T>;
  search(term: string, query?: CrudListQuery): CrudListResult<T>;
  count(): number;
  exists(id: string): boolean;
  batchCreate(entities: T[]): T[];
  batchUpdate(updates: Array<{ id: string; patch: Partial<T> }>): T[];
  batchDelete(ids: string[]): number;
  clear(): void;
}

export type CrudPersistenceProviderFactory = <T extends CrudEntityBase>(
  namespace: string,
) => CrudPersistenceProvider<T>;
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/memory-provider.ts`,
      content: `/** In-memory CRUD persistence provider */
import type { CrudEntityBase, CrudListQuery, CrudListResult } from './types';
import type { CrudPersistenceProvider } from './persistence-abstraction';

function applyQuery<T extends CrudEntityBase>(
  items: T[],
  query?: CrudListQuery,
): CrudListResult<T> {
  let filtered = [...items];
  const search = query?.search?.trim().toLowerCase();
  if (search) {
    filtered = filtered.filter((item) => item.label.toLowerCase().includes(search));
  }
  const sortField = query?.sortField ?? 'createdAt';
  const sortDirection = query?.sortDirection ?? 'desc';
  filtered.sort((a, b) => {
    const av = String(a[sortField] ?? '');
    const bv = String(b[sortField] ?? '');
    const cmp = av.localeCompare(bv);
    return sortDirection === 'asc' ? cmp : -cmp;
  });
  const pageSize = Math.max(1, query?.pageSize ?? 10);
  const page = Math.max(1, query?.page ?? 1);
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export function createMemoryCrudProvider<T extends CrudEntityBase>(
  namespace: string,
): CrudPersistenceProvider<T> {
  const store = new Map<string, T>();
  return {
    create(entity: T): T {
      store.set(entity.id, entity);
      return entity;
    },
    update(id: string, patch: Partial<T>): T | null {
      const existing = store.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...patch, id: existing.id, updatedAt: new Date().toISOString() } as T;
      store.set(id, updated);
      return updated;
    },
    delete(id: string): boolean {
      return store.delete(id);
    },
    findById(id: string): T | null {
      return store.get(id) ?? null;
    },
    list(query?: CrudListQuery): CrudListResult<T> {
      return applyQuery([...store.values()], query);
    },
    search(term: string, query?: CrudListQuery): CrudListResult<T> {
      return applyQuery([...store.values()], { ...query, search: term });
    },
    count(): number {
      return store.size;
    },
    exists(id: string): boolean {
      return store.has(id);
    },
    batchCreate(entities: T[]): T[] {
      return entities.map((entity) => this.create(entity));
    },
    batchUpdate(updates: Array<{ id: string; patch: Partial<T> }>): T[] {
      return updates
        .map(({ id, patch }) => this.update(id, patch))
        .filter((item): item is T => item !== null);
    },
    batchDelete(ids: string[]): number {
      let removed = 0;
      for (const id of ids) {
        if (this.delete(id)) removed += 1;
      }
      return removed;
    },
    clear(): void {
      store.clear();
      void namespace;
    },
  };
}
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/local-storage-provider.ts`,
      content: `/** LocalStorage CRUD persistence provider */
import type { CrudEntityBase, CrudListQuery, CrudListResult } from './types';
import type { CrudPersistenceProvider } from './persistence-abstraction';
import { createMemoryCrudProvider } from './memory-provider';

function storageKey(namespace: string): string {
  return \`universal-crud:\${namespace}\`;
}

export function createLocalStorageCrudProvider<T extends CrudEntityBase>(
  namespace: string,
): CrudPersistenceProvider<T> {
  const memory = createMemoryCrudProvider<T>(namespace);
  try {
    const raw = globalThis.localStorage?.getItem(storageKey(namespace));
    if (raw) {
      const parsed = JSON.parse(raw) as T[];
      if (Array.isArray(parsed)) memory.batchCreate(parsed);
    }
  } catch {
    /* start empty */
  }
  const persist = (): void => {
    try {
      const all = memory.list({ page: 1, pageSize: 100000 }).items;
      globalThis.localStorage?.setItem(storageKey(namespace), JSON.stringify(all));
    } catch {
      /* ignore quota errors in preview */
    }
  };
  return {
    ...memory,
    create(entity: T): T {
      const created = memory.create(entity);
      persist();
      return created;
    },
    update(id: string, patch: Partial<T>): T | null {
      const updated = memory.update(id, patch);
      if (updated) persist();
      return updated;
    },
    delete(id: string): boolean {
      const ok = memory.delete(id);
      if (ok) persist();
      return ok;
    },
    batchCreate(entities: T[]): T[] {
      const created = memory.batchCreate(entities);
      persist();
      return created;
    },
    batchUpdate(updates: Array<{ id: string; patch: Partial<T> }>): T[] {
      const updated = memory.batchUpdate(updates);
      if (updated.length > 0) persist();
      return updated;
    },
    batchDelete(ids: string[]): number {
      const removed = memory.batchDelete(ids);
      if (removed > 0) persist();
      return removed;
    },
    clear(): void {
      memory.clear();
      try {
        globalThis.localStorage?.removeItem(storageKey(namespace));
      } catch {
        /* ignore */
      }
    },
    list(query?: CrudListQuery): CrudListResult<T> {
      return memory.list(query);
    },
    search(term: string, query?: CrudListQuery): CrudListResult<T> {
      return memory.search(term, query);
    },
  };
}
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/index.ts`,
      content: `export * from './types';
export * from './persistence-abstraction';
export * from './memory-provider';
export * from './local-storage-provider';
`,
    },
  ];
}
