/**
 * Unified Trust Runtime — authority record registry.
 */

import type { TrustRuntimeRecord } from './trust-runtime-types.js';

const recordRegistry = new Map<string, TrustRuntimeRecord>();

export function registerTrustRuntimeRecord(record: TrustRuntimeRecord): void {
  recordRegistry.set(record.recordId, record);
}

export function getTrustRuntimeRecord(recordId: string): TrustRuntimeRecord | undefined {
  return recordRegistry.get(recordId);
}

export function listTrustRuntimeRecords(): TrustRuntimeRecord[] {
  return [...recordRegistry.values()];
}

export function getTrustRuntimeRecordCount(): number {
  return recordRegistry.size;
}

export function resetTrustRuntimeRegistryForTests(): void {
  recordRegistry.clear();
}
