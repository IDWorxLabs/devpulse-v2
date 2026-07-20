/**
 * Universal CRUD Generation Engine V1 — service layer code generation.
 */

import type { UniversalCrudEntityGenerationInput } from './universal-crud-types.js';
import { escTsString, moduleIdToPascalCase } from './universal-crud-types.js';

export function generateCrudServiceSource(input: UniversalCrudEntityGenerationInput): string {
  const { descriptor } = input;
  const pascal = moduleIdToPascalCase(descriptor.entityId);

  return `/** Universal CRUD service — ${escTsString(descriptor.displayName)} */
import type { CrudListQuery, CrudListResult } from '../../universal-crud-runtime/types';
import type { ${pascal}Entity, ${pascal}FormInput } from './${descriptor.entityId}.types';
import {
  batchCreate${pascal}Entities,
  batchDelete${pascal}Entities,
  batchUpdate${pascal}Entities,
  count${pascal}Entities,
  create${pascal}Entity,
  delete${pascal}Entity,
  exists${pascal}Entity,
  find${pascal}EntityById,
  list${pascal}Entities,
  search${pascal}Entities,
  update${pascal}Entity,
} from './${descriptor.entityId}.repository';
import { validate${pascal}FormInput } from './${descriptor.entityId}.validation';

function newEntityId(): string {
  return \`\${Date.now()}-\${Math.random().toString(36).slice(2, 9)}\`;
}

export function create${pascal}Record(input: ${pascal}FormInput): ${pascal}Entity {
  const validation = validate${pascal}FormInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }
  const now = new Date().toISOString();
  return create${pascal}Entity({
    id: newEntityId(),
    label: input.label.trim(),
    createdAt: now,
    updatedAt: now,
  });
}

export function update${pascal}Record(id: string, input: ${pascal}FormInput): ${pascal}Entity {
  const validation = validate${pascal}FormInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }
  const updated = update${pascal}Entity(id, { label: input.label.trim() });
  if (!updated) {
    throw new Error('Record not found');
  }
  return updated;
}

export function delete${pascal}Record(id: string): boolean {
  return delete${pascal}Entity(id);
}

export function get${pascal}Record(id: string): ${pascal}Entity | null {
  return find${pascal}EntityById(id);
}

export function list${pascal}Records(query?: CrudListQuery): CrudListResult<${pascal}Entity> {
  return list${pascal}Entities(query);
}

export function search${pascal}Records(term: string, query?: CrudListQuery): CrudListResult<${pascal}Entity> {
  return search${pascal}Entities(term, query);
}

export function count${pascal}Records(): number {
  return count${pascal}Entities();
}

export function ${pascal}RecordExists(id: string): boolean {
  return exists${pascal}Entity(id);
}

export function batchCreate${pascal}Records(inputs: ${pascal}FormInput[]): ${pascal}Entity[] {
  return batchCreate${pascal}Entities(
    inputs.map((input) => {
      const validation = validate${pascal}FormInput(input);
      if (!validation.valid) throw new Error(validation.errors.join('; '));
      const now = new Date().toISOString();
      return {
        id: newEntityId(),
        label: input.label.trim(),
        createdAt: now,
        updatedAt: now,
      };
    }),
  );
}

export function batchUpdate${pascal}Records(
  updates: Array<{ id: string; input: ${pascal}FormInput }>,
): ${pascal}Entity[] {
  return batchUpdate${pascal}Entities(
    updates.map(({ id, input }) => {
      const validation = validate${pascal}FormInput(input);
      if (!validation.valid) throw new Error(validation.errors.join('; '));
      return { id, patch: { label: input.label.trim() } };
    }),
  );
}

export function batchDelete${pascal}Records(ids: string[]): number {
  return batchDelete${pascal}Entities(ids);
}
`;
}
