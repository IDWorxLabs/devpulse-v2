/**
 * Evidence Intelligence — bounded history.
 */

import type { EvidenceIntelligenceHistoryEntry, EvidenceIntelligenceRecord } from './evidence-intelligence-types.js';
import { DEFAULT_MAX_EVIDENCE_HISTORY_SIZE } from './evidence-intelligence-types.js';

const history: EvidenceIntelligenceHistoryEntry[] = [];

export function recordEvidenceIntelligenceHistory(record: EvidenceIntelligenceRecord): void {
  history.push({
    recordId: record.recordId,
    sufficiencyLevel: record.authority.sufficiencyLevel,
    evidenceCount: record.authority.evidenceCount,
    qualityScore: record.authority.quality.qualityScore,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_EVIDENCE_HISTORY_SIZE) {
    history.shift();
  }
}

export function getEvidenceIntelligenceHistory(): readonly EvidenceIntelligenceHistoryEntry[] {
  return [...history];
}

export function getEvidenceIntelligenceHistorySize(): number {
  return history.length;
}

export function clearEvidenceIntelligenceHistory(): void {
  history.length = 0;
}

export function resetEvidenceIntelligenceHistoryForTests(): void {
  clearEvidenceIntelligenceHistory();
}
