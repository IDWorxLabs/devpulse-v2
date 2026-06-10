/**
 * Auto-Polish Loop — workflow polish analyzer.
 */

import type { AutoPolishInput, WorkflowPolishAnalysis } from './auto-polish-types.js';
import { WORKFLOW_POLISH_PASS, clampScore } from './auto-polish-types.js';
import { boundOpportunities, createPolishOpportunity } from './polish-opportunity-model.js';
import { getCachedCategoryPolish, setCachedCategoryPolish } from './auto-polish-cache.js';

export interface WorkflowPolishUpstream {
  workflowContinuityScore: number;
  previewReportConnectionScore: number;
  chatToFeedConnected: boolean;
  previewToUvlConnected: boolean;
}

let workflowPolishAnalysisCount = 0;

export function analyzeWorkflowPolish(input: AutoPolishInput, upstream: WorkflowPolishUpstream): WorkflowPolishAnalysis {
  const cacheKey = [input.requestId, upstream.workflowContinuityScore, input.workflowBreak].join('|');
  const cached = getCachedCategoryPolish(cacheKey);
  if (cached && cached.passToken === WORKFLOW_POLISH_PASS) return cached as WorkflowPolishAnalysis;

  workflowPolishAnalysisCount += 1;
  const opportunities = [];
  const baseScore = Math.round((upstream.workflowContinuityScore + upstream.previewReportConnectionScore) / 2);

  if (input.workflowBreak === true || baseScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'WORKFLOW', title: 'Repair workflow continuity',
      description: 'Flow between Chat, Preview, UVL, Reports, and Operator Feed has gaps',
      impactLevel: baseScore < 65 ? 'HIGH' : 'MEDIUM',
      founderImpact: 82, userImpact: 75, effortEstimate: 'HIGH', urgency: 76,
      sourceAnalyzer: 'workflow-polish-analyzer', detectionCode: 'WORKFLOW_POLISH_OPPORTUNITY',
    }));
  }
  if (!upstream.chatToFeedConnected) {
    opportunities.push(createPolishOpportunity({
      category: 'WORKFLOW', title: 'Connect Chat to Operator Feed workflow',
      description: 'Chat actions should visibly continue into Operator Feed intelligence',
      impactLevel: 'HIGH', founderImpact: 80, userImpact: 70, effortEstimate: 'MEDIUM', urgency: 72,
      sourceAnalyzer: 'workflow-polish-analyzer', detectionCode: 'WORKFLOW_POLISH_OPPORTUNITY',
    }));
  }
  if (!upstream.previewToUvlConnected) {
    opportunities.push(createPolishOpportunity({
      category: 'WORKFLOW', title: 'Bridge Preview to UVL verification',
      description: 'Preview findings should trace cleanly into UVL report workflow',
      impactLevel: 'MEDIUM', founderImpact: 75, userImpact: 60, effortEstimate: 'MEDIUM', urgency: 65,
      sourceAnalyzer: 'workflow-polish-analyzer', detectionCode: 'WORKFLOW_POLISH_OPPORTUNITY',
    }));
  }

  const penalty = opportunities.length * 4;
  const polishScore = clampScore(baseScore - penalty);

  const result: WorkflowPolishAnalysis = { polishScore, opportunities: boundOpportunities(opportunities), passToken: WORKFLOW_POLISH_PASS };
  setCachedCategoryPolish(cacheKey, result);
  return result;
}

export function getWorkflowPolishAnalysisCount(): number {
  return workflowPolishAnalysisCount;
}

export function resetWorkflowPolishAnalyzerForTests(): void {
  workflowPolishAnalysisCount = 0;
}
