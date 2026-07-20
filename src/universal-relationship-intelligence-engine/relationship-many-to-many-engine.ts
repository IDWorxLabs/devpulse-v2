/**
 * Universal Relationship Intelligence Engine V1 — many-to-many helpers.
 */

import type { UniversalRelationshipDescriptor } from './universal-relationship-types.js';

export function isManyToManyRelationship(descriptor: UniversalRelationshipDescriptor): boolean {
  return descriptor.cardinality === 'MANY_TO_MANY';
}

export function junctionRecordTypeName(descriptor: UniversalRelationshipDescriptor): string {
  const source = descriptor.sourceModuleId.replace(/-/g, '_');
  const target = descriptor.targetModuleId.replace(/-/g, '_');
  return `${source}_${target}_link`;
}
