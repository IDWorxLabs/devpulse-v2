/**
 * Evidence Intelligence — evidence gap analyzer.
 */

import type { EvidenceGap, EvidenceRecord } from './evidence-intelligence-types.js';

let gapAnalysisCount = 0;

const EXPECTED_CATEGORIES = ['VERIFICATION', 'COMPLETION', 'GOVERNANCE', 'TRUST'] as const;

export function analyzeEvidenceGaps(records: EvidenceRecord[]): EvidenceGap[] {
  gapAnalysisCount += 1;
  const gaps: EvidenceGap[] = [];

  const presentCategories = new Set(records.map((r) => r.category));
  for (const category of EXPECTED_CATEGORIES) {
    if (!presentCategories.has(category)) {
      gaps.push({
        gapType: 'missing',
        category,
        description: `Missing evidence for category: ${category}`,
      });
    }
  }

  for (const record of records) {
    if (record.strength < 35) {
      gaps.push({
        gapType: 'weak',
        category: record.category,
        description: `Weak evidence from ${record.source}`,
      });
    }
    if (record.status === 'STALE' || record.freshness < 25) {
      gaps.push({
        gapType: 'stale',
        category: record.category,
        description: `Stale evidence from ${record.source}`,
      });
    }
    if (record.status === 'UNVERIFIED') {
      gaps.push({
        gapType: 'unverified',
        category: record.category,
        description: `Unverified evidence from ${record.source}`,
      });
    }
    if (record.trustworthiness < 30) {
      gaps.push({
        gapType: 'untrusted',
        category: record.category,
        description: `Untrusted evidence from ${record.source}`,
      });
    }
  }

  return gaps;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetEvidenceGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}
