/**
 * Product Experience Verification Engine — bounded record registry.
 */

import type { ProductExperienceRecord, ProductExperienceResult } from './product-experience-types.js';

const recordsById = new Map<string, ProductExperienceRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<ProductExperienceResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerProductExperienceRecord(record: ProductExperienceRecord): void {
  recordsById.set(record.productExperienceId, record);
  addToIndex(recordsByProject, record.projectId, record.productExperienceId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.productExperienceId);
  addToIndex(recordsByResult, record.productExperienceResult, record.productExperienceId);
}

export function getProductExperienceRecord(productExperienceId: string): ProductExperienceRecord | undefined {
  return recordsById.get(productExperienceId);
}

export function lookupProductExperienceByProjectId(projectId: string): ProductExperienceRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is ProductExperienceRecord => r !== undefined);
}

export function lookupProductExperienceByResult(result: ProductExperienceResult): ProductExperienceRecord[] {
  const ids = recordsByResult.get(result);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is ProductExperienceRecord => r !== undefined);
}

export function listProductExperienceRecords(): ProductExperienceRecord[] {
  return [...recordsById.values()];
}

export function getProductExperienceRecordCount(): number {
  return recordsById.size;
}

export function resetProductExperienceRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
