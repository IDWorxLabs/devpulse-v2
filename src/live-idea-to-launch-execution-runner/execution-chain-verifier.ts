/**
 * Execution chain verifier — lifecycle stage ordering and gap analysis.
 */

import {
  EXECUTION_LIFECYCLE_STAGE_ORDER,
  STAGE_TO_LIFECYCLE_STATE,
} from './live-idea-to-launch-execution-runner-registry.js';
import type {
  ExecutionChainAnalysis,
  ExecutionLifecycleStage,
  StageAnalysis,
} from './live-idea-to-launch-execution-runner-types.js';

export function verifyExecutionChain(stages: {
  idea: StageAnalysis;
  planning: StageAnalysis;
  build: StageAnalysis;
  validation: StageAnalysis;
  runtime: StageAnalysis;
  launch: StageAnalysis;
}): ExecutionChainAnalysis {
  const ordered: StageAnalysis[] = [
    stages.idea,
    stages.planning,
    stages.build,
    stages.validation,
    stages.runtime,
    stages.launch,
  ];

  const completedStages = ordered.filter((s) => s.confirmed).map((s) => s.stage);
  const incompleteStages = ordered.filter((s) => !s.confirmed && s.evidenceLevel !== 'BLOCKED').map((s) => s.stage);
  const blockedStages = ordered.filter((s) => s.evidenceLevel === 'BLOCKED').map((s) => s.stage);

  const missingEvidence = ordered.flatMap((s) => s.missingEvidence);
  const weakEvidence = ordered.flatMap((s) => s.weakEvidence);

  const executionGaps: string[] = [];
  let firstBrokenStage: ExecutionLifecycleStage | null = null;
  for (const stage of EXECUTION_LIFECYCLE_STAGE_ORDER) {
    const analysis = ordered.find((s) => s.stage === stage)!;
    if (!analysis.confirmed) {
      firstBrokenStage = stage;
      executionGaps.push(
        `${stage} not confirmed (${analysis.evidenceLevel}, score ${analysis.score}/100)`,
      );
      break;
    }
  }

  for (let i = 1; i < EXECUTION_LIFECYCLE_STAGE_ORDER.length; i += 1) {
    const prev = ordered[i - 1]!;
    const curr = ordered[i]!;
    if (prev.confirmed && !curr.confirmed && curr.evidenceLevel !== 'BLOCKED') {
      executionGaps.push(`Gap after ${prev.stage}: ${curr.stage} lacks confirming evidence`);
    }
  }

  const nextRequiredStage =
    firstBrokenStage ??
    (completedStages.length === EXECUTION_LIFECYCLE_STAGE_ORDER.length
      ? null
      : EXECUTION_LIFECYCLE_STAGE_ORDER.find((s) => !completedStages.includes(s)) ?? null);

  const lowestScoreStage = [...ordered].sort((a, b) => a.score - b.score)[0];
  const highestRiskStage =
    blockedStages[0] ??
    (lowestScoreStage && lowestScoreStage.score < 55 ? lowestScoreStage.stage : firstBrokenStage);

  const chainConnected =
    completedStages.length === EXECUTION_LIFECYCLE_STAGE_ORDER.length &&
    firstBrokenStage === null;

  return {
    readOnly: true,
    completedStages,
    incompleteStages,
    blockedStages,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 16),
    weakEvidence: [...new Set(weakEvidence)].slice(0, 12),
    executionGaps: [...new Set(executionGaps)].slice(0, 10),
    highestRiskStage,
    nextRequiredStage,
    chainConnected,
    firstBrokenStage,
  };
}

export function deriveExecutionState(stages: {
  idea: StageAnalysis;
  planning: StageAnalysis;
  build: StageAnalysis;
  validation: StageAnalysis;
  runtime: StageAnalysis;
  launch: StageAnalysis;
}): import('./live-idea-to-launch-execution-runner-types.js').ExecutionLifecycleState {
  const ordered: StageAnalysis[] = [
    stages.launch,
    stages.runtime,
    stages.validation,
    stages.build,
    stages.planning,
    stages.idea,
  ];

  for (const analysis of ordered) {
    if (analysis.confirmed) {
      return STAGE_TO_LIFECYCLE_STATE[analysis.stage];
    }
  }

  const anyPartial = [
    stages.idea,
    stages.planning,
    stages.build,
    stages.validation,
    stages.runtime,
    stages.launch,
  ].some((s) => s.evidenceLevel === 'PARTIAL' || s.score > 0);

  return anyPartial ? 'NOT_STARTED' : 'NOT_STARTED';
}

export function deriveOverallScore(stages: StageAnalysis[]): number {
  if (stages.length === 0) return 0;
  const total = stages.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / stages.length);
}

export function deriveExecutionVerdict(input: {
  chain: ExecutionChainAnalysis;
  overallScore: number;
}): import('./live-idea-to-launch-execution-runner-types.js').ExecutionVerdict {
  if (input.chain.chainConnected) return 'PROVEN';
  if (input.chain.completedStages.length >= 3 && input.overallScore >= 55) return 'PARTIAL';
  if (input.overallScore === 0 && input.chain.missingEvidence.length > 0) return 'UNKNOWN';
  return 'NOT_PROVEN';
}

export function deriveRiskAssessment(
  chain: ExecutionChainAnalysis,
  stages: StageAnalysis[],
): import('./live-idea-to-launch-execution-runner-types.js').ExecutionRiskAssessment {
  const riskFactors: string[] = [];
  if (!chain.chainConnected) riskFactors.push('Full lifecycle chain not connected');
  if (chain.blockedStages.length > 0) {
    riskFactors.push(`Blocked stages: ${chain.blockedStages.join(', ')}`);
  }
  riskFactors.push(...chain.executionGaps.slice(0, 4));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (chain.blockedStages.length > 0 || chain.firstBrokenStage === 'IDEA') riskLevel = 'CRITICAL';
  else if (chain.firstBrokenStage === 'LAUNCH' || chain.firstBrokenStage === 'RUNTIME') {
    riskLevel = 'HIGH';
  } else if (chain.firstBrokenStage !== null) riskLevel = 'MEDIUM';

  const lowest = [...stages].sort((a, b) => a.score - b.score)[0];
  const highestRiskStage = chain.highestRiskStage ?? lowest?.stage ?? null;

  return {
    readOnly: true,
    riskLevel,
    riskFactors: riskFactors.slice(0, 8),
    highestRiskStage,
  };
}
