/**
 * Interactive Explanations — authority builder.
 */

import type {
  ExplanationCoverageLevel,
  ExplanationState,
  InteractiveExplanationsInput,
  NextStepGuidanceAnalysis,
  ReasoningExplanationAnalysis,
  ReportInterpretationAnalysis,
  SystemExplanationAnalysis,
  UnifiedInteractiveExplanationsAuthority,
  WorkflowExplanationAnalysis,
} from './interactive-explanations-types.js';
import { resolveExplanationCoverageLevel, resolveExplanationState } from './interactive-explanations-types.js';
import {
  getCachedInteractiveExplanationsAuthority,
  setCachedInteractiveExplanationsAuthority,
} from './interactive-explanations-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedInteractiveExplanationsAuthority(
  requestId: string,
  system: SystemExplanationAnalysis,
  workflow: WorkflowExplanationAnalysis,
  reasoning: ReasoningExplanationAnalysis,
  report: ReportInterpretationAnalysis,
  guidance: NextStepGuidanceAnalysis,
  input: InteractiveExplanationsInput,
): UnifiedInteractiveExplanationsAuthority {
  const cacheKey = [
    requestId,
    system.systemCoverageScore,
    workflow.workflowCoverageScore,
    reasoning.reasoningCoverageScore,
    report.reportCoverageScore,
    guidance.guidanceCoverageScore,
  ].join('|');

  const cached = getCachedInteractiveExplanationsAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const explanationCoverageScore = Math.max(0, Math.min(100, Math.round(
    system.systemCoverageScore * 0.2
      + workflow.workflowCoverageScore * 0.2
      + reasoning.reasoningCoverageScore * 0.2
      + report.reportCoverageScore * 0.2
      + guidance.guidanceCoverageScore * 0.2,
  )));

  const coverageLevel: ExplanationCoverageLevel = resolveExplanationCoverageLevel(explanationCoverageScore);
  const state: ExplanationState = resolveExplanationState(explanationCoverageScore, input.governanceBlocked);
  const confidence = Math.min(100, Math.round(
    (explanationCoverageScore + system.systemCoverageScore + reasoning.reasoningCoverageScore) / 3,
  ));

  const authority: UnifiedInteractiveExplanationsAuthority = {
    authorityId: `interactive-explanations-authority-${authorityCounter}`,
    explanationCoverageScore,
    workflowCoverageScore: workflow.workflowCoverageScore,
    reasoningCoverageScore: reasoning.reasoningCoverageScore,
    reportCoverageScore: report.reportCoverageScore,
    guidanceCoverageScore: guidance.guidanceCoverageScore,
    coverageLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedInteractiveExplanationsAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetInteractiveExplanationsAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
