/**
 * Requirement Completeness History — bounded analysis history (max 32).
 */

import { MAX_REQUIREMENT_COMPLETENESS_HISTORY } from './requirement-completeness-registry.js';
import type {
  RequirementCompletenessAnalysis,
  RequirementCompletenessHistoryEntry,
} from './requirement-completeness-types.js';

const history: RequirementCompletenessHistoryEntry[] = [];
const analyses: RequirementCompletenessAnalysis[] = [];

export function resetRequirementCompletenessHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordRequirementCompletenessAnalysis(analysis: RequirementCompletenessAnalysis): void {
  const entry: RequirementCompletenessHistoryEntry = {
    analysisId: analysis.analysisId,
    timestamp: analysis.analyzedAt,
    completenessScore: analysis.completenessScore,
    readinessScore: analysis.readinessScore,
    projectRequirementReadiness: analysis.projectRequirementReadiness,
    riskLevel: analysis.riskLevel,
    safeToProceed: analysis.safeToProceed,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_REQUIREMENT_COMPLETENESS_HISTORY) {
    history.length = MAX_REQUIREMENT_COMPLETENESS_HISTORY;
  }
  if (analyses.length > MAX_REQUIREMENT_COMPLETENESS_HISTORY) {
    analyses.length = MAX_REQUIREMENT_COMPLETENESS_HISTORY;
  }
}

export function getRequirementCompletenessHistorySize(): number {
  return history.length;
}

export function getRequirementCompletenessHistory(): readonly RequirementCompletenessHistoryEntry[] {
  return [...history];
}

export function getRequirementCompletenessAnalyses(): readonly RequirementCompletenessAnalysis[] {
  return [...analyses];
}

export function getLatestRequirementCompletenessAnalysis(): RequirementCompletenessAnalysis | null {
  return analyses[0] ?? null;
}
