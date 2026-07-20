/**
 * Universal Relationship Intelligence Engine V1 — relationship-aware type extensions.
 */

import type { UniversalRelationshipDescriptor, UniversalRelationshipMaterializationInput } from './universal-relationship-types.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';

export function generateRelationshipTypeExtensionsSource(
  descriptors: readonly UniversalRelationshipDescriptor[],
  input: UniversalRelationshipMaterializationInput,
): string {
  const pascal = moduleIdToPascalCase(input.moduleId);
  const fields = descriptors
    .filter((d) => d.sourceModuleId === input.moduleId || d.targetModuleId === input.moduleId)
    .map((d) => {
      if (d.cardinality === 'MANY_TO_MANY') {
        return `  ${d.targetModuleId.replace(/-/g, '_')}Ids?: string[];`;
      }
      if (d.targetModuleId === input.moduleId && d.cardinality === 'MANY_TO_ONE') {
        return `  ${d.sourceField}: string | null;`;
      }
      return `  ${d.sourceField}: string | null;`;
    });

  return `/** Universal relationship type extensions — ${pascal} */
export interface ${pascal}RelationshipFields {
${fields.length ? fields.join('\n') : '  readonly _relationshipReady?: true;'}
}

export interface ${pascal}RelatedProjection {
  relationshipId: string;
  relatedId: string;
  inverse: boolean;
}
`;
}
