/**
 * Universal Relationship Intelligence Engine V1 — relationship navigation.
 */

import type { UniversalRelationshipDescriptor } from './universal-relationship-types.js';

export function resolveRelationshipNavigationTarget(
  descriptor: UniversalRelationshipDescriptor,
  relatedId: string,
  inverse: boolean,
): string {
  const route = inverse ? descriptor.sourceRoute : descriptor.targetRoute;
  return `${route}?related=${relatedId}&relationship=${descriptor.relationshipId}`;
}

export function generateRelationshipNavigationHelperSource(): string {
  return `/** Universal relationship navigation helpers */
export function buildRelationshipDeepLink(route: string, relatedId: string, relationshipId: string): string {
  const separator = route.includes('?') ? '&' : '?';
  return \`\${route}\${separator}related=\${encodeURIComponent(relatedId)}&relationship=\${encodeURIComponent(relationshipId)}\`;
}
`;
}
