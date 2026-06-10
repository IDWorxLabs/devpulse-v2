/**
 * UX Heuristic Evaluator — workflow continuity analyzer.
 */

import type { WorkflowContinuityAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { WORKFLOW_CONTINUITY_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedWorkflowContinuity, setCachedWorkflowContinuity } from './ux-heuristic-cache.js';

export interface WorkflowContinuitySnapshot {
  operatorFeedStagesPresent: boolean;
  chatToFeedLinkage: boolean;
  founderRealityNextStepPresent: boolean;
}

let workflowContinuityAnalysisCount = 0;

export function analyzeWorkflowContinuity(
  input: UXHeuristicInput,
  snapshot: WorkflowContinuitySnapshot,
): WorkflowContinuityAnalysis {
  const cacheKey = [
    input.workflowBreak,
    input.nextStepUnclear,
    input.contextLoss,
    snapshot.operatorFeedStagesPresent,
  ].join('|');

  const cached = getCachedWorkflowContinuity(cacheKey);
  if (cached) return cached;

  workflowContinuityAnalysisCount += 1;
  const workflowProblems: string[] = [];
  let penalty = 0;

  const workflowBreak = input.workflowBreak === true;
  const nextStepUnclear = input.nextStepUnclear === true;
  const contextLoss = input.contextLoss === true;

  if (workflowBreak) { workflowProblems.push('WORKFLOW_BREAK'); penalty += 20; }
  if (nextStepUnclear) { workflowProblems.push('NEXT_STEP_UNCLEAR'); penalty += 18; }
  if (contextLoss) { workflowProblems.push('CONTEXT_LOSS'); penalty += 16; }

  const continuityBonus =
    (snapshot.operatorFeedStagesPresent ? 14 : 0)
    + (snapshot.chatToFeedLinkage ? 12 : 0)
    + (snapshot.founderRealityNextStepPresent ? 10 : 0);

  const workflowContinuityScore = clampScore(82 + continuityBonus - penalty);

  const result: WorkflowContinuityAnalysis = {
    workflowContinuityScore,
    workflowBreak,
    nextStepUnclear,
    contextLoss,
    workflowProblems,
    passToken: WORKFLOW_CONTINUITY_PASS,
  };

  setCachedWorkflowContinuity(cacheKey, result);
  return result;
}

export function getWorkflowContinuityAnalysisCount(): number {
  return workflowContinuityAnalysisCount;
}

export function resetWorkflowContinuityAnalyzerForTests(): void {
  workflowContinuityAnalysisCount = 0;
}
