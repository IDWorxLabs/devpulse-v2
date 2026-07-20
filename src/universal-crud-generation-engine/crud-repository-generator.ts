/**
 * Universal CRUD Generation Engine V1 — repository code generation.
 */

import type { UniversalCrudEntityGenerationInput } from './universal-crud-types.js';
import { escTsString, moduleIdToPascalCase } from './universal-crud-types.js';

export function generateCrudRepositorySource(input: UniversalCrudEntityGenerationInput): string {
  const { descriptor } = input;
  const pascal = moduleIdToPascalCase(descriptor.entityId);
  const providerImport =
    descriptor.persistenceProvider === 'localStorage'
      ? 'createLocalStorageCrudProvider'
      : 'createMemoryCrudProvider';
  const providerModule =
    descriptor.persistenceProvider === 'localStorage' ? 'local-storage-provider' : 'memory-provider';

  return `/** Universal CRUD repository — ${escTsString(descriptor.displayName)} */
import { ${providerImport} } from '../../universal-crud-runtime/${providerModule}';
import type { CrudPersistenceProvider } from '../../universal-crud-runtime/persistence-abstraction';
import type { CrudListQuery, CrudListResult } from '../../universal-crud-runtime/types';
import type { ${pascal}Entity } from './${descriptor.entityId}.types';

const NAMESPACE = '${escTsString(descriptor.contractId)}';

let providerInstance: CrudPersistenceProvider<${pascal}Entity> | null = null;

function provider(): CrudPersistenceProvider<${pascal}Entity> {
  if (!providerInstance) {
    providerInstance = ${providerImport}<${pascal}Entity>(NAMESPACE);
  }
  return providerInstance;
}

export function create${pascal}Entity(entity: ${pascal}Entity): ${pascal}Entity {
  return provider().create(entity);
}

export function update${pascal}Entity(id: string, patch: Partial<${pascal}Entity>): ${pascal}Entity | null {
  return provider().update(id, patch);
}

export function delete${pascal}Entity(id: string): boolean {
  return provider().delete(id);
}

export function find${pascal}EntityById(id: string): ${pascal}Entity | null {
  return provider().findById(id);
}

export function list${pascal}Entities(query?: CrudListQuery): CrudListResult<${pascal}Entity> {
  return provider().list(query);
}

export function search${pascal}Entities(term: string, query?: CrudListQuery): CrudListResult<${pascal}Entity> {
  return provider().search(term, query);
}

export function count${pascal}Entities(): number {
  return provider().count();
}

export function exists${pascal}Entity(id: string): boolean {
  return provider().exists(id);
}

export function batchCreate${pascal}Entities(entities: ${pascal}Entity[]): ${pascal}Entity[] {
  return provider().batchCreate(entities);
}

export function batchUpdate${pascal}Entities(
  updates: Array<{ id: string; patch: Partial<${pascal}Entity> }>,
): ${pascal}Entity[] {
  return provider().batchUpdate(updates);
}

export function batchDelete${pascal}Entities(ids: string[]): number {
  return provider().batchDelete(ids);
}
`;
}
