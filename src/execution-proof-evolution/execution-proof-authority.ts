/**
 * Execution Proof Evolution — proof authority.
 * Proves whether an AutoFix/capability/change actually solved the original problem.
 */

import { createHash } from 'node:crypto';
import { evaluateExecutionProofAttempt } from './execution-proof-evaluator.js';
import {
  buildExecutionProofHistorySummary,
  buildVerdictDistribution,
  countPriorUnprovenAttemptsForProblem,
  recordExecutionProofAssessment,
  resetExecutionProofHistoryForTests,
} from './execution-proof-history.js';
import {
  EXECUTION_PROOF_CACHE_KEY_PREFIX,
  EXECUTION_PROOF_EVOLUTION_OWNER_MODULE,
  EXECUTION_PROOF_EVOLUTION_PASS_TOKEN,
  EXECUTION_PROOF_EVOLUTION_PHASE,
  MAX_EXECUTION_PROOF_MEMORY,
  MAX_EXECUTION_PROOF_RECOMMENDATIONS,
} from './execution-proof-registry.js';
import { buildExecutionProofEvolutionReportMarkdown } from './execution-proof-report-builder.js';
import type {
  AssessExecutionProofEvolutionInput,
  ExecutionProofAssessment,
  ExecutionProofEvolutionMemory,
  ExecutionProofReport,
  ExecutionProofVerdict,
} from './execution-proof-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function stableCacheKey(problemId: string, attemptId: string, score: number, verdict: ExecutionProofVerdict): string {
  const digest = createHash('sha256')
    .update([EXECUTION_PROOF_EVOLUTION_OWNER_MODULE, problemId, attemptId, score, verdict].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${EXECUTION_PROOF_CACHE_KEY_PREFIX}:${digest}`;
}

function buildRecommendations(assessment: Omit<ExecutionProofAssessment, 'recommendations' | 'cacheKey'>): string[] {
  const items: string[] = [];

  if (assessment.verdict === 'REGRESSION_DETECTED') {
    items.push('Revert the claimed fix — regression evidence outweighs improvement signals.');
    items.push('Re-run the original failing scenario before attempting another fix path.');
  }

  if (assessment.verdict === 'LOOP_RISK') {
    items.push('Stop repeating the same fix path — three or more unproven attempts detected.');
    items.push('Require a new diagnostic or capability before another AutoFix attempt.');
    items.push('Require stronger before/after evidence tied to the original failure signal.');
    items.push('Consider external research for novel failure classes (no automated lookup in this phase).');
  }

  if (assessment.verdict === 'INSUFFICIENT_EVIDENCE') {
    items.push('Do not accept fix-created or validator-pass alone as proof.');
    items.push('Collect before/after evidence and retest the exact original failure.');
  }

  if (assessment.verdict === 'NOT_PROVEN' || assessment.verdict === 'PARTIALLY_PROVEN') {
    items.push('Improvement is not fully proven — gather independent confirmation from another evidence source.');
    if (!assessment.attempt.originalFailureRetested) {
      items.push('Retest the exact original failing signal before accepting the fix.');
    }
    if (!assessment.attempt.causalLinkToFix) {
      items.push('Establish causal linkage between the fix and the original failure.');
    }
  }

  if (assessment.verdict === 'PROVEN_FIXED') {
    items.push('Fix is proven — retain the change and store the proof pattern for future memory.');
  }

  if (!items.length) {
    items.push('Maintain before/after evidence for every execution proof assessment.');
  }

  return items.slice(0, MAX_EXECUTION_PROOF_RECOMMENDATIONS);
}

function buildEvolutionMemory(assessment: ExecutionProofAssessment): ExecutionProofEvolutionMemory | null {
  const { problem, attempt, verdict, confidence } = assessment;

  if (verdict === 'PROVEN_FIXED') {
    return {
      memoryId: `mem-proven-${problem.problemId}`,
      problemType: problem.problemType,
      successfulFixType: attempt.claimedFixType,
      evidenceThatProved: attempt.evidence
        .filter((item) => item.supportsImprovement)
        .map((item) => `${item.source}: ${item.summary}`)
        .slice(0, 6),
      confidence,
      reusableGuidance: `When ${problem.problemType} fails with "${problem.originalFailingSignal}", ${attempt.claimedFixType} with before/after retest is a proven path.`,
      escalationGuidance: [],
      storedAt: new Date().toISOString(),
    };
  }

  if (verdict === 'LOOP_RISK' || verdict === 'INSUFFICIENT_EVIDENCE' || verdict === 'NOT_PROVEN') {
    return {
      memoryId: `mem-escalate-${problem.problemId}`,
      problemType: problem.problemType,
      successfulFixType: null,
      evidenceThatProved: [],
      confidence: 'LOW',
      reusableGuidance: `Repeated unproven attempts for ${problem.problemType} — do not reuse ${attempt.claimedFixType} without new diagnostics.`,
      escalationGuidance: [
        'Stop repeating the same fix path.',
        'Require new diagnostic or capability before retry.',
        'Require stronger before/after evidence tied to original failure.',
        'Optional: recommend external research for unfamiliar failure classes.',
      ],
      storedAt: new Date().toISOString(),
    };
  }

  return null;
}

const evolutionMemoryStore: ExecutionProofEvolutionMemory[] = [];

export function resetExecutionProofEvolutionMemoryForTests(): void {
  evolutionMemoryStore.length = 0;
}

export function getExecutionProofEvolutionMemory(): readonly ExecutionProofEvolutionMemory[] {
  return evolutionMemoryStore;
}

function recordEvolutionMemory(memory: ExecutionProofEvolutionMemory): void {
  evolutionMemoryStore.push(memory);
  while (evolutionMemoryStore.length > MAX_EXECUTION_PROOF_MEMORY) {
    evolutionMemoryStore.shift();
  }
}

export function assessExecutionProofEvolution(
  input: AssessExecutionProofEvolutionInput,
): ExecutionProofAssessment {
  const priorUnproven =
    input.priorUnprovenAttemptsForProblem ??
    countPriorUnprovenAttemptsForProblem(input.problem.problemId);

  const evaluation = evaluateExecutionProofAttempt(input.attempt, priorUnproven);
  const { snapshot, claimedFixType, claimedFixDescription } = input.attempt;

  const partial: Omit<ExecutionProofAssessment, 'recommendations' | 'cacheKey'> = {
    readOnly: true,
    advisoryOnly: true,
    problem: input.problem,
    attempt: input.attempt,
    executionProofScore: evaluation.executionProofScore,
    verdict: evaluation.verdict,
    confidence: evaluation.confidence,
    originalFailureImproved: evaluation.originalFailureImproved,
    regressionDetected: evaluation.regressionDetected,
    proofStrongEnough: evaluation.proofStrongEnough,
    fixDisposition: evaluation.fixDisposition,
    scoreBreakdown: evaluation.scoreBreakdown,
    authorityAnswers: {
      originalProblem: `${input.problem.problemType}: ${input.problem.originalFailingSignal}`,
      claimedFix: `${claimedFixType} — ${claimedFixDescription}`,
      beforeAfterSummary: `Before: ${snapshot.beforeState} → After: ${snapshot.afterState}`,
      originalFailureGone: !snapshot.originalFailureStillPresent,
      causallyTiedToFix: input.attempt.causalLinkToFix,
      regressionAppeared: evaluation.regressionDetected,
      proofStrongEnough: evaluation.proofStrongEnough,
      recommendedAction: evaluation.fixDisposition,
    },
  };

  const assessment: ExecutionProofAssessment = {
    ...partial,
    recommendations: buildRecommendations(partial),
    cacheKey: stableCacheKey(
      input.problem.problemId,
      input.attempt.attemptId,
      evaluation.executionProofScore,
      evaluation.verdict,
    ),
  };

  recordExecutionProofAssessment(assessment);
  const memory = buildEvolutionMemory(assessment);
  if (memory) recordEvolutionMemory(memory);

  return assessment;
}

export function buildExecutionProofEvolutionReport(
  assessments: ExecutionProofAssessment[],
  generatedAt = new Date().toISOString(),
): ExecutionProofReport {
  const verdictDistribution = buildVerdictDistribution(assessments);
  const averageProofScore =
    assessments.length === 0
      ? 0
      : clamp(assessments.reduce((sum, item) => sum + item.executionProofScore, 0) / assessments.length);

  return {
    generatedAt,
    phaseName: EXECUTION_PROOF_EVOLUTION_PHASE,
    purpose:
      'Prove whether an AutoFix/capability/change actually solved the original problem — code change ≠ proof.',
    assessments,
    verdictDistribution,
    averageProofScore,
    historySummary: buildExecutionProofHistorySummary(assessments),
    evolutionMemory: [...getExecutionProofEvolutionMemory()],
    passToken: EXECUTION_PROOF_EVOLUTION_PASS_TOKEN,
  };
}

export function buildExecutionProofEvolutionArtifacts(
  input: AssessExecutionProofEvolutionInput,
): {
  executionProofAssessment: ExecutionProofAssessment;
  executionProofReportMarkdown: string;
} {
  const executionProofAssessment = assessExecutionProofEvolution(input);
  const report = buildExecutionProofEvolutionReport([executionProofAssessment]);
  return {
    executionProofAssessment,
    executionProofReportMarkdown: buildExecutionProofEvolutionReportMarkdown(report),
  };
}

export function resetExecutionProofEvolutionModuleForTests(): void {
  resetExecutionProofHistoryForTests();
  resetExecutionProofEvolutionMemoryForTests();
}
