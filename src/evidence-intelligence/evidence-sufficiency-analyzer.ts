/**
 * Evidence Intelligence — evidence sufficiency analyzer.
 */

import type {
  EvidenceQualityScores,
  EvidenceRecord,
  EvidenceSufficiencyLevel,
} from './evidence-intelligence-types.js';

let sufficiencyAnalysisCount = 0;

export function analyzeEvidenceSufficiency(
  records: EvidenceRecord[],
  quality: EvidenceQualityScores,
): EvidenceSufficiencyLevel {
  sufficiencyAnalysisCount += 1;

  if (records.length === 0 || quality.qualityScore < 20) return 'INSUFFICIENT';
  if (records.length < 2 || quality.qualityScore < 40) return 'PARTIAL';
  if (quality.qualityScore < 60) return 'SUFFICIENT';
  if (quality.qualityScore < 80) return 'STRONG';

  const hasVerification = records.some((r) => r.category === 'VERIFICATION' || r.source.includes('VERIFICATION'));
  const hasGovernance = records.some((r) => r.category === 'GOVERNANCE' || r.source === 'SELF_EVOLUTION_GOVERNANCE');
  const hasTrust = records.some((r) => r.source === 'UNIFIED_TRUST_RUNTIME' || r.source === 'TRUST_ENGINE');

  if (hasVerification && hasGovernance && hasTrust && records.length >= 4) {
    return 'AUTHORITATIVE';
  }

  return quality.qualityScore >= 85 ? 'AUTHORITATIVE' : 'STRONG';
}

export function getSufficiencyAnalysisCount(): number {
  return sufficiencyAnalysisCount;
}

export function resetEvidenceSufficiencyAnalyzerForTests(): void {
  sufficiencyAnalysisCount = 0;
}
