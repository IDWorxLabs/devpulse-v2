/**
 * Founder Guides — reporting.
 */

import type {
  CheckpointGuideAnalysis,
  EvolutionGuideAnalysis,
  FounderGuideRecord,
  FounderGuidesEvaluation,
  FounderGuidesReport,
  ModificationSafetyGuideAnalysis,
  RoadmapGuideAnalysis,
  SystemNavigationGuideAnalysis,
} from './founder-guides-types.js';
import { getFounderGuidesCacheStats } from './founder-guides-cache.js';
import { getFounderGuidesHistorySize } from './founder-guides-history.js';

let reportCount = 0;

export function generateFounderGuidesReport(
  record: FounderGuideRecord,
  evaluation: FounderGuidesEvaluation,
  roadmap: RoadmapGuideAnalysis,
  checkpoint: CheckpointGuideAnalysis,
  navigation: SystemNavigationGuideAnalysis,
  safety: ModificationSafetyGuideAnalysis,
  evolution: EvolutionGuideAnalysis,
  missingSignals: string[],
): FounderGuidesReport {
  reportCount += 1;
  const cache = getFounderGuidesCacheStats();
  const recommendations: string[] = [];

  const undocumentedAreas = [
    ...roadmap.undocumentedRoadmapAreas,
    ...checkpoint.undocumentedCheckpoints,
    ...navigation.undocumentedNavigationAreas,
    ...safety.unsafeModificationAreas,
    ...evolution.undocumentedEvolutionAreas,
  ];

  if (roadmap.undocumentedRoadmapAreas.length > 0 || roadmap.roadmapWarnings.length > 0) {
    recommendations.push('Review roadmap progression and document completed, current, and future phases');
  }
  if (checkpoint.undocumentedCheckpoints.length > 0) {
    recommendations.push('Document trust, hardening, launch, and founder readiness checkpoints');
  }
  if (navigation.undocumentedNavigationAreas.length > 0) {
    recommendations.push('Improve capability discovery via find panel aliases and ownership mapping');
  }
  if (safety.unsafeModificationAreas.length > 0 || safety.safetyWarnings.length > 0) {
    recommendations.push('Clarify protected foundations and governance-controlled modification zones');
  }
  if (evolution.undocumentedEvolutionAreas.length > 0) {
    recommendations.push('Document self-evolution, escalation, and founder approval boundaries');
  }
  if (missingSignals.length > 0) {
    recommendations.push('Collect missing founder guide signals before major changes');
  }
  if (evaluation.state === 'READY' || evaluation.state === 'PARTIAL') {
    recommendations.push('Continue founder guide coverage monitoring');
  } else {
    recommendations.push('Require founder guide review before structural changes');
  }

  return {
    founderCoverageScore: record.founderCoverageScore,
    roadmapCoverageScore: record.roadmapCoverageScore,
    checkpointCoverageScore: record.checkpointCoverageScore,
    navigationCoverageScore: evaluation.navigationCoverageScore,
    safetyCoverageScore: evaluation.safetyCoverageScore,
    evolutionCoverageScore: evaluation.evolutionCoverageScore,
    completenessLevel: record.completenessLevel,
    state: record.state,
    confidence: record.confidence,
    roadmapGuidance: [
      'Completed phases establish what was built',
      'Current phase shows active work',
      'Future phases indicate planned evolution',
      ...roadmap.roadmapWarnings,
    ],
    checkpointGuidance: [
      'Trust Engine Verification validates trust stack composition',
      'Product Hardening Verification validates hardening stack composition',
      ...checkpoint.checkpointWarnings,
    ],
    navigationGuidance: [
      'Use find panel aliases for capability discovery',
      'Ownership registry maps modules to phases',
      ...navigation.navigationWarnings,
    ],
    safetyGuidance: [
      'Protected foundations require checkpoint validation before changes',
      'Governance-controlled areas need founder approval',
      ...safety.safetyWarnings,
    ],
    evolutionGuidance: [
      'Self-evolution governance controls autonomous growth',
      'Missing capability escalation routes unknown features',
      ...evolution.evolutionWarnings,
    ],
    undocumentedAreas: [...new Set(undocumentedAreas)],
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getFounderGuidesHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetFounderGuidesReportingForTests(): void {
  reportCount = 0;
}
