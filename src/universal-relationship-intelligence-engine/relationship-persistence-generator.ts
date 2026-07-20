/**
 * Universal Relationship Intelligence Engine V1 — shared relationship runtime (B1 reuse).
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import { hierarchyCycleGuardSource } from './relationship-hierarchy-engine.js';

const RUNTIME_ROOT = 'src/universal-relationship-runtime';

export function buildUniversalRelationshipSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: `${RUNTIME_ROOT}/types.ts`,
      content: `/** Universal relationship runtime — shared types */
export interface RelationshipLinkRecord {
  id: string;
  relationshipId: string;
  sourceId: string;
  targetId: string;
  orderedIndex: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipOperationResult {
  ok: boolean;
  message: string;
  linkId?: string;
}

export type RelationshipLifecyclePolicy = 'RESTRICT' | 'CASCADE' | 'SET_NULL' | 'DETACH' | 'PRESERVE';
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/link-store.ts`,
      content: `/** Universal relationship link store — reuses B1 memory provider */
import { createMemoryCrudProvider } from '../universal-crud-runtime/memory-provider';
import type { RelationshipLinkRecord, RelationshipOperationResult } from './types';

const provider = createMemoryCrudProvider<RelationshipLinkRecord & { label: string }>('universal-relationship-links');

export function linkRecords(relationshipId: string, sourceId: string, targetId: string, orderedIndex: number | null = null): RelationshipOperationResult {
  if (!sourceId || !targetId) return { ok: false, message: 'Referential validation failed: missing endpoint' };
  const duplicate = provider.list().items.find(
    (item) => item.relationshipId === relationshipId && item.sourceId === sourceId && item.targetId === targetId,
  );
  if (duplicate) return { ok: false, message: 'Duplicate link prevented' };
  const now = new Date().toISOString();
  const id = \`\${relationshipId}:\${sourceId}:\${targetId}\`;
  provider.create({
    id,
    label: relationshipId,
    relationshipId,
    sourceId,
    targetId,
    orderedIndex,
    createdAt: now,
    updatedAt: now,
  });
  return { ok: true, message: 'Link created', linkId: id };
}

export function unlinkRecords(relationshipId: string, sourceId: string, targetId: string): RelationshipOperationResult {
  const id = \`\${relationshipId}:\${sourceId}:\${targetId}\`;
  const removed = provider.delete(id);
  return removed ? { ok: true, message: 'Link removed' } : { ok: false, message: 'Link not found' };
}

export function listRelatedRecords(relationshipId: string, sourceId: string): RelationshipLinkRecord[] {
  return provider.list().items.filter((item) => item.relationshipId === relationshipId && item.sourceId === sourceId) as RelationshipLinkRecord[];
}

export function listInverseRelatedRecords(relationshipId: string, targetId: string): RelationshipLinkRecord[] {
  return provider.list().items.filter((item) => item.relationshipId === relationshipId && item.targetId === targetId) as RelationshipLinkRecord[];
}

export function countRelatedRecords(relationshipId: string, sourceId: string): number {
  return listRelatedRecords(relationshipId, sourceId).length;
}

export function existsLink(relationshipId: string, sourceId: string, targetId: string): boolean {
  return provider.exists(\`\${relationshipId}:\${sourceId}:\${targetId}\`);
}
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/hierarchy.ts`,
      content: hierarchyCycleGuardSource(),
    },
    {
      relativePath: `${RUNTIME_ROOT}/index.ts`,
      content: `export * from './types';
export * from './link-store';
export * from './hierarchy';
`,
    },
  ];
}
