/**
 * ASE — shared evidence bus.
 */

import type { AseEvidenceRecord, AseStageId } from './ase-types.js';

let evidenceCounter = 0;
const bus: AseEvidenceRecord[] = [];

export function resetAseEvidenceBusForTests(): void {
  evidenceCounter = 0;
  bus.length = 0;
}

function nextEvidenceId(stage: AseStageId): string {
  evidenceCounter += 1;
  return `ase-evidence-${stage.toLowerCase()}-${evidenceCounter}`;
}

export function publishAseEvidence(input: Omit<AseEvidenceRecord, 'readOnly' | 'evidenceId' | 'freshness'> & {
  evidenceId?: string;
}): AseEvidenceRecord {
  const record: AseEvidenceRecord = {
    readOnly: true,
    evidenceId: input.evidenceId ?? nextEvidenceId(input.sourceStage),
    freshness: 'FRESH',
    ...input,
  };
  bus.push(record);
  return record;
}

export function getAseEvidenceBus(): readonly AseEvidenceRecord[] {
  return bus;
}

export function getAseEvidenceByStage(stageId: AseStageId): readonly AseEvidenceRecord[] {
  return bus.filter((e) => e.sourceStage === stageId);
}

export function getLatestAseEvidence(stageId?: AseStageId): AseEvidenceRecord | null {
  if (stageId) {
    const filtered = bus.filter((e) => e.sourceStage === stageId);
    return filtered[filtered.length - 1] ?? null;
  }
  return bus[bus.length - 1] ?? null;
}
