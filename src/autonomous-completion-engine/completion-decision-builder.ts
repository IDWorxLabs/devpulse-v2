/**
 * Autonomous Completion Engine — completion decision builder pipeline.
 */

import { analyzeCompletionEvidence } from './completion-evidence-analyzer.js';
import { analyzeCompletionConfidence } from './completion-confidence-analyzer.js';
import { analyzeCompletionRisk } from './completion-risk-analyzer.js';
import { evaluateCompletionReadiness } from './completion-readiness-evaluator.js';
import { evaluateCompletionLoopGuard } from './completion-loop-guard.js';
import { selectCompletionDecision } from './completion-decision-selector.js';
import { buildCompletionState } from './completion-state-model.js';
import type {
  CompletionInput,
  CompletionResult,
  CompletionState,
} from './autonomous-completion-engine-types.js';

let resultCounter = 0;

export interface CompletionDecisionBuildResult {
  result: CompletionResult;
  state: CompletionState;
}

export function buildCompletionDecision(input: CompletionInput): CompletionDecisionBuildResult {
  const reasoning: string[] = [];

  const evidence = analyzeCompletionEvidence(input);
  reasoning.push(`Evidence quality: ${evidence.evidenceQualityScore}`);
  reasoning.push(`Evidence items: ${evidence.evidenceSummary.length}`);

  const riskScore = analyzeCompletionRisk(input, evidence);
  reasoning.push(`Risk score: ${riskScore}`);

  const trustScore = input.trustScore;
  reasoning.push(`Trust score: ${trustScore}`);

  const confidence = analyzeCompletionConfidence(input, evidence, riskScore);
  reasoning.push(`Completion confidence: ${confidence}`);

  const loopGuard = evaluateCompletionLoopGuard(input);
  reasoning.push(...loopGuard.reasoning);

  const readiness = evaluateCompletionReadiness(
    input,
    evidence,
    trustScore,
    riskScore,
    confidence,
    loopGuard,
  );
  reasoning.push(`Readiness: ${readiness}`);

  const decision = selectCompletionDecision(
    input,
    evidence,
    readiness,
    trustScore,
    riskScore,
    confidence,
    loopGuard,
  );
  reasoning.push(`Decision: ${decision}`);

  const state = buildCompletionState(
    input,
    decision,
    readiness,
    confidence,
    trustScore,
    riskScore,
    evidence,
    loopGuard,
  );
  reasoning.push(`Next action: ${state.nextRecommendedAction}`);

  if (evidence.missingEvidence.length > 0) {
    reasoning.push(`Missing evidence: ${evidence.missingEvidence.join(', ')}`);
  }

  resultCounter += 1;

  const result: CompletionResult = {
    id: `completion-result-${resultCounter}`,
    decision,
    readiness,
    confidence,
    trustScore,
    riskScore,
    completionScore: state.completionScore,
    evidenceSummary: evidence.evidenceSummary,
    reasoning,
    generatedAt: Date.now(),
  };

  return { result, state };
}

export function resetCompletionDecisionCounterForTests(): void {
  resultCounter = 0;
}
