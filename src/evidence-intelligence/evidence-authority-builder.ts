/**
 * Evidence Intelligence — unified evidence authority builder.
 */

import type {
  EvidenceConflict,
  EvidenceGap,
  EvidenceQualityScores,
  EvidenceRecord,
  EvidenceSufficiencyLevel,
  UnifiedEvidenceAuthority,
} from './evidence-intelligence-types.js';
import { analyzeEvidenceQuality } from './evidence-quality-analyzer.js';
import { analyzeEvidenceSufficiency } from './evidence-sufficiency-analyzer.js';
import { detectEvidenceConflicts } from './evidence-conflict-detector.js';
import { analyzeEvidenceGaps } from './evidence-gap-analyzer.js';
import { getCachedEvidenceAuthority, setCachedEvidenceAuthority } from './evidence-intelligence-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedEvidenceAuthority(
  requestId: string,
  records: EvidenceRecord[],
): {
  authority: UnifiedEvidenceAuthority;
  quality: EvidenceQualityScores;
  conflicts: EvidenceConflict[];
  gaps: EvidenceGap[];
} {
  const cacheKey = [requestId, records.map((r) => r.evidenceId).join(',')].join('|');
  const cached = getCachedEvidenceAuthority(cacheKey);
  if (cached) {
    const quality = analyzeEvidenceQuality(records);
    const conflicts = detectEvidenceConflicts(records);
    const gaps = analyzeEvidenceGaps(records);
    return { authority: cached, quality, conflicts, gaps };
  }

  authorityBuildCount += 1;
  authorityCounter += 1;

  const quality = analyzeEvidenceQuality(records);
  const conflicts = detectEvidenceConflicts(records);
  const gaps = analyzeEvidenceGaps(records);
  const sufficiencyLevel = analyzeEvidenceSufficiency(records, quality);

  const authority: UnifiedEvidenceAuthority = {
    authorityId: `evidence-authority-${authorityCounter}`,
    sufficiencyLevel,
    quality,
    conflictCount: conflicts.length,
    gapCount: gaps.length,
    evidenceCount: records.length,
    participatingSources: [...new Set(records.map((r) => r.source))],
    createdAt: Date.now(),
  };

  setCachedEvidenceAuthority(cacheKey, authority);
  return { authority, quality, conflicts, gaps };
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetEvidenceAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
