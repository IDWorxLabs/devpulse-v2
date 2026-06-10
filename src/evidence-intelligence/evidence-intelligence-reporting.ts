/**
 * Evidence Intelligence — runtime reporting.
 */

import type {
  EvidenceConflict,
  EvidenceGap,
  EvidenceIntelligenceEvaluation,
  EvidenceIntelligenceRecord,
  EvidenceIntelligenceReport,
  EvidenceQualityScores,
} from './evidence-intelligence-types.js';
import { getEvidenceIntelligenceCacheStats } from './evidence-intelligence-cache.js';
import { getEvidenceIntelligenceHistorySize } from './evidence-intelligence-history.js';

let reportCount = 0;

export function generateEvidenceIntelligenceReport(
  record: EvidenceIntelligenceRecord,
  quality: EvidenceQualityScores,
  evaluation: EvidenceIntelligenceEvaluation,
  conflicts: EvidenceConflict[],
  gaps: EvidenceGap[],
): EvidenceIntelligenceReport {
  reportCount += 1;
  const cache = getEvidenceIntelligenceCacheStats();

  return {
    sourceParticipation: [...record.authority.participatingSources],
    quality,
    sufficiencyLevel: record.authority.sufficiencyLevel,
    conflicts: [...conflicts],
    gaps: [...gaps],
    historySize: getEvidenceIntelligenceHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    evaluation,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetEvidenceIntelligenceReportingForTests(): void {
  reportCount = 0;
}
