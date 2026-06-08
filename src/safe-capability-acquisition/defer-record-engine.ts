/**
 * Defer record engine — creates defer records for deferred capabilities.
 * Planning only. No defer execution performed.
 */

import type { AcquisitionInput, AcquisitionStrategy, DeferRecord } from './types.js';
import { nextDeferRecordId } from './types.js';

export function createDeferRecord(
  input: AcquisitionInput,
  strategy: AcquisitionStrategy,
  blocked: boolean,
): DeferRecord | null {
  if (blocked || strategy !== 'DEFER') return null;

  return {
    deferRecordId: nextDeferRecordId(),
    capabilityGapId: input.capabilityGapId,
    capabilityName: input.capabilityName,
    deferReason: input.gapReason || `Capability ${input.capabilityName} deferred — not required for current phase`,
    recommendedRevisitTrigger: `Revisit when ${input.gapSeverity} severity gap reappears or project goal changes`,
    status: 'ACTIVE',
  };
}

export function deferRecordKey(record: DeferRecord | null): string {
  if (!record) return 'none';
  return `${record.deferRecordId}|${record.status}`;
}
