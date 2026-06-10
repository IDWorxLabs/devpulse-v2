/**
 * Interactive Explanations — reasoning explanation analyzer.
 */

import type {
  InteractiveExplanationsInput,
  ReasoningExplanationAnalysis,
} from './interactive-explanations-types.js';
import { getCachedReasoningExplanation, setCachedReasoningExplanation } from './interactive-explanations-cache.js';

export interface ReasoningExplanationSnapshot {
  hasTrustReasoning: boolean;
  hasVerificationReasoning: boolean;
  hasGovernanceReasoning: boolean;
}

const BASE_REASONING_AREAS = [
  'trust_decisions',
  'verification_decisions',
  'hardening_decisions',
  'documentation_decisions',
  'governance_decisions',
] as const;

let reasoningAnalysisCount = 0;

export function analyzeReasoningExplanation(
  input: InteractiveExplanationsInput,
  snapshot: ReasoningExplanationSnapshot,
): ReasoningExplanationAnalysis {
  const cacheKey = [
    snapshot.hasTrustReasoning,
    snapshot.hasVerificationReasoning,
    input.missingTrustDecisionExplanation,
    input.missingVerificationDecisionExplanation,
    ...(input.undocumentedReasoningAreas ?? []),
  ].join('|');

  const cached = getCachedReasoningExplanation(cacheKey);
  if (cached) return cached;

  reasoningAnalysisCount += 1;
  const reasoningWarnings: string[] = [];
  const undocumentedReasoningAreas: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingTrustDecisionExplanation, 'missing_trust_decision_explanation', 'trust_decisions'],
    [input.missingVerificationDecisionExplanation, 'missing_verification_decision_explanation', 'verification_decisions'],
    [input.missingHardeningDecisionExplanation, 'missing_hardening_decision_explanation', 'hardening_decisions'],
    [input.missingDocumentationDecisionExplanation, 'missing_documentation_decision_explanation', 'documentation_decisions'],
    [input.missingGovernanceDecisionExplanation, 'missing_governance_decision_explanation', 'governance_decisions'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      reasoningWarnings.push(warning);
      undocumentedReasoningAreas.push(area);
      penalty += 9;
    }
  }

  for (const area of input.undocumentedReasoningAreas ?? []) {
    if (!undocumentedReasoningAreas.includes(area)) {
      undocumentedReasoningAreas.push(area);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.hasTrustReasoning ? 10 : 0)
    + (snapshot.hasVerificationReasoning ? 9 : 0)
    + (snapshot.hasGovernanceReasoning ? 8 : 0);
  const documented = BASE_REASONING_AREAS.length - undocumentedReasoningAreas.filter(
    (a) => BASE_REASONING_AREAS.includes(a as typeof BASE_REASONING_AREAS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_REASONING_AREAS.length) * 80 + systemBonus);
  const reasoningCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: ReasoningExplanationAnalysis = {
    reasoningCoverageScore,
    undocumentedReasoningAreas,
    reasoningWarnings,
  };
  setCachedReasoningExplanation(cacheKey, result);
  return result;
}

export function getReasoningAnalysisCount(): number {
  return reasoningAnalysisCount;
}

export function resetReasoningExplanationAnalyzerForTests(): void {
  reasoningAnalysisCount = 0;
}

export function listBaseReasoningAreas(): readonly string[] {
  return BASE_REASONING_AREAS;
}
