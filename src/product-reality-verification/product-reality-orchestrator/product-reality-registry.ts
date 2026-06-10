/**
 * Product Reality Orchestrator — bounded record registry.
 */

import type { ProductRealityRecord, ProductRealityVerdict } from './product-reality-types.js';

const recordsById = new Map<string, ProductRealityRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByVerdict = new Map<ProductRealityVerdict, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerProductRealityRecord(record: ProductRealityRecord): void {
  recordsById.set(record.productRealityId, record);
  addToIndex(recordsByProject, record.projectId, record.productRealityId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.productRealityId);
  addToIndex(recordsByVerdict, record.productRealityVerdict, record.productRealityId);
}

export function getProductRealityRecord(productRealityId: string): ProductRealityRecord | undefined {
  return recordsById.get(productRealityId);
}

export function lookupProductRealityByProjectId(projectId: string): ProductRealityRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is ProductRealityRecord => r !== undefined);
}

export function lookupProductRealityByVerdict(verdict: ProductRealityVerdict): ProductRealityRecord[] {
  const ids = recordsByVerdict.get(verdict);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is ProductRealityRecord => r !== undefined);
}

export function listProductRealityRecords(): ProductRealityRecord[] {
  return [...recordsById.values()];
}

export function getProductRealityRecordCount(): number {
  return recordsById.size;
}

export function resetProductRealityRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByVerdict.clear();
}
