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
      relativePath: `${RUNTIME_ROOT}/persistence-scope.ts`,
      content: `/** Durable persistence scope — project-isolated keys for browser-generated apps */
export const AIDEV_CRUD_SCHEMA_VERSION = 1 as const;

/**
 * Resolve a stable project identity for storage namespacing.
 * Prefer stamped preview meta (aidevengine-project-id); never use preview port, URL, or PID.
 */
export function resolvePersistenceProjectId(): string {
  try {
    const meta = globalThis.document?.querySelector?.('meta[name="aidevengine-project-id"]');
    const fromMeta = meta?.getAttribute?.('content')?.trim();
    if (fromMeta) return fromMeta;
  } catch {
    /* ignore */
  }
  try {
    const attr = globalThis.document?.documentElement?.getAttribute?.('data-aidev-project-id')?.trim();
    if (attr) return attr;
  } catch {
    /* ignore */
  }
  return 'unscoped-project';
}

export function buildDurableStorageKey(namespace: string, projectId?: string): string {
  const scope = (projectId?.trim() || resolvePersistenceProjectId()).replace(/[^a-zA-Z0-9._:-]/g, '_');
  const ns = namespace.replace(/[^a-zA-Z0-9._:-]/g, '_');
  return \`aidev-crud:v\${AIDEV_CRUD_SCHEMA_VERSION}:\${scope}:\${ns}\`;
}

export function isBrowserLocalStorageAvailable(): boolean {
  try {
    const store = globalThis.localStorage;
    if (!store) return false;
    const probe = '__aidev_persist_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export class DurableStorageUnavailableError extends Error {
  readonly code = 'STORAGE_UNAVAILABLE' as const;
  constructor(message = 'Durable browser storage is unavailable') {
    super(message);
    this.name = 'DurableStorageUnavailableError';
  }
}

export class DurableStorageCorruptionError extends Error {
  readonly code = 'STORAGE_CORRUPTED' as const;
  constructor(message = 'Persisted application state is incompatible or corrupted') {
    super(message);
    this.name = 'DurableStorageCorruptionError';
  }
}
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/local-storage-provider.ts`,
      content: `/** Durable LocalStorage CRUD persistence provider — project-scoped, schema-versioned */
import type { CrudEntityBase, CrudListQuery, CrudListResult } from './types';
import type { CrudPersistenceProvider } from './persistence-abstraction';
import { createMemoryCrudProvider } from './memory-provider';
import {
  AIDEV_CRUD_SCHEMA_VERSION,
  buildDurableStorageKey,
  DurableStorageCorruptionError,
  DurableStorageUnavailableError,
  isBrowserLocalStorageAvailable,
  resolvePersistenceProjectId,
} from './persistence-scope';

interface DurableEnvelope<T extends CrudEntityBase> {
  schemaVersion: number;
  projectId: string;
  namespace: string;
  records: T[];
  updatedAt: string;
}

function readEnvelope<T extends CrudEntityBase>(
  key: string,
  expectedProjectId: string,
  namespace: string,
): T[] {
  const raw = globalThis.localStorage!.getItem(key);
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DurableStorageCorruptionError(\`Invalid JSON in persistence key \${key}\`);
  }
  // Legacy bare-array format — migrate once into envelope on next write.
  if (Array.isArray(parsed)) return parsed as T[];
  if (!parsed || typeof parsed !== 'object') {
    throw new DurableStorageCorruptionError(\`Unexpected persistence payload for \${key}\`);
  }
  const envelope = parsed as DurableEnvelope<T>;
  if (envelope.schemaVersion !== AIDEV_CRUD_SCHEMA_VERSION) {
    // Controlled reset on schema mismatch — do not merge incompatible shapes.
    globalThis.localStorage!.removeItem(key);
    return [];
  }
  if (envelope.projectId && envelope.projectId !== expectedProjectId) {
    throw new DurableStorageCorruptionError(
      \`Persistence project mismatch for \${namespace}: expected \${expectedProjectId}, found \${envelope.projectId}\`,
    );
  }
  return Array.isArray(envelope.records) ? envelope.records : [];
}

/**
 * Authoritative durable provider for browser-generated applications.
 * Does NOT silently fall back to memory-only on storage failure.
 */
export function createLocalStorageCrudProvider<T extends CrudEntityBase>(
  namespace: string,
): CrudPersistenceProvider<T> {
  if (!isBrowserLocalStorageAvailable()) {
    throw new DurableStorageUnavailableError(
      \`Cannot initialize durable persistence for "\${namespace}" — localStorage is unavailable\`,
    );
  }
  const projectId = resolvePersistenceProjectId();
  const key = buildDurableStorageKey(namespace, projectId);
  const memory = createMemoryCrudProvider<T>(namespace);
  try {
    const records = readEnvelope<T>(key, projectId, namespace);
    if (records.length > 0) memory.batchCreate(records);
  } catch (error) {
    if (error instanceof DurableStorageCorruptionError) {
      // Controlled recovery: clear bad state and continue empty.
      try {
        globalThis.localStorage!.removeItem(key);
      } catch {
        /* ignore */
      }
    } else {
      throw error;
    }
  }

  const persist = (): void => {
    if (!isBrowserLocalStorageAvailable()) {
      throw new DurableStorageUnavailableError(\`Save failed for "\${namespace}" — storage unavailable\`);
    }
    const all = memory.list({ page: 1, pageSize: 1_000_000 }).items;
    const envelope: DurableEnvelope<T> = {
      schemaVersion: AIDEV_CRUD_SCHEMA_VERSION,
      projectId,
      namespace,
      records: all,
      updatedAt: new Date().toISOString(),
    };
    try {
      globalThis.localStorage!.setItem(key, JSON.stringify(envelope));
    } catch (error) {
      throw new DurableStorageUnavailableError(
        \`Save failed for "\${namespace}": \${error instanceof Error ? error.message : String(error)}\`,
      );
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
        globalThis.localStorage!.removeItem(key);
      } catch {
        throw new DurableStorageUnavailableError(\`Clear failed for "\${namespace}"\`);
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

/** Alias used by relationship/workflow generators — same durable authority. */
export const createDurableCrudProvider = createLocalStorageCrudProvider;
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/index.ts`,
      content: `export * from './types';
export * from './persistence-abstraction';
export * from './memory-provider';
export * from './persistence-scope';
export * from './local-storage-provider';
`,
    },
  ];
}
