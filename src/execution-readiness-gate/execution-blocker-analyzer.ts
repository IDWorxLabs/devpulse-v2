/**
 * Execution Blocker Analyzer — classifies unresolved execution blockers (V1).
 */

import type { AssessExecutionReadinessInput } from './execution-readiness-types.js';
import type {
  ExecutionBlockerItem,
  ExecutionBlockerSummary,
} from './execution-readiness-types.js';

let blockerCounter = 0;

export function resetExecutionBlockerCounterForTests(): void {
  blockerCounter = 0;
}

function nextBlockerId(): string {
  blockerCounter += 1;
  return `exec-blocker-${blockerCounter}`;
}

export function analyzeExecutionBlockers(input: AssessExecutionReadinessInput): ExecutionBlockerSummary {
  const blockers: ExecutionBlockerItem[] = [];

  const gate = input.planningGateAnalysis;
  if (gate?.planningGateDecision === 'REJECT_PLANNING') {
    blockers.push({
      readOnly: true,
      blockerId: nextBlockerId(),
      title: 'Planning rejected by Planning Gate',
      priority: 'CRITICAL',
      category: 'PLANNING',
      resolved: false,
      sourceAuthority: 'PLANNING_GATE_AUTHORITY',
      explanation: gate.planningGateExplanation.summary,
      evidence: [`GATE_${gate.planningGateDecision}`],
    });
  }

  for (const question of gate?.planningGateQuestions.filter((q) => q.priority === 'CRITICAL') ?? []) {
    blockers.push({
      readOnly: true,
      blockerId: nextBlockerId(),
      title: question.question,
      priority: 'CRITICAL',
      category: 'CLARIFICATION',
      resolved: false,
      sourceAuthority: 'PLANNING_GATE_AUTHORITY',
      explanation: 'Critical planning gate clarification unresolved.',
      evidence: [question.questionId, ...question.evidence],
    });
  }

  for (const question of gate?.planningGateQuestions.filter((q) => q.priority === 'HIGH') ?? []) {
    blockers.push({
      readOnly: true,
      blockerId: nextBlockerId(),
      title: question.question,
      priority: 'HIGH',
      category: 'CLARIFICATION',
      resolved: false,
      sourceAuthority: 'PLANNING_GATE_AUTHORITY',
      explanation: 'High-priority planning gate clarification unresolved.',
      evidence: [question.questionId, ...question.evidence],
    });
  }

  for (const gap of input.planningBrief?.knownGaps.filter((g) => g.category === 'UNRESOLVED_CONFLICT') ?? []) {
    blockers.push({
      readOnly: true,
      blockerId: nextBlockerId(),
      title: gap.description,
      priority: 'HIGH',
      category: 'CONFLICT',
      resolved: false,
      sourceAuthority: 'PLANNING_BRIEF_GENERATOR',
      explanation: 'Unresolved evidence conflict blocks execution readiness.',
      evidence: [gap.gapId, ...gap.evidence],
    });
  }

  for (const blocker of input.founderTestAnalysis?.prioritizedBlockers ?? []) {
    blockers.push({
      readOnly: true,
      blockerId: nextBlockerId(),
      title: blocker.title,
      priority: blocker.priority,
      category: blocker.category,
      resolved: false,
      sourceAuthority: blocker.sourceAuthority,
      explanation: blocker.explanation,
      evidence: [...blocker.evidence],
    });
  }

  for (const failure of input.orchestrationProofAnalysis?.orchestrationFailures.filter(
    (f) => f.severity === 'CRITICAL' || f.severity === 'HIGH',
  ) ?? []) {
    blockers.push({
      readOnly: true,
      blockerId: nextBlockerId(),
      title: failure.launchImpact,
      priority: failure.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      category: 'ORCHESTRATION',
      resolved: false,
      sourceAuthority: failure.failingAuthority,
      explanation: failure.recommendedRepair,
      evidence: [...failure.evidence],
    });
  }

  if (input.founderSimulationResult?.finalVerdict === 'NOT_READY') {
    blockers.push({
      readOnly: true,
      blockerId: nextBlockerId(),
      title: 'Founder simulation not ready',
      priority: 'CRITICAL',
      category: 'SIMULATION',
      resolved: false,
      sourceAuthority: 'FOUNDER_SIMULATION_ENGINE',
      explanation: input.founderSimulationResult.nextBestAction,
      evidence: [input.founderSimulationResult.finalVerdict],
    });
  }

  const criticalCount = blockers.filter((b) => b.priority === 'CRITICAL').length;
  const highCount = blockers.filter((b) => b.priority === 'HIGH').length;
  const unresolvedCount = blockers.filter((b) => !b.resolved).length;
  const unresolvedCriticalCount = blockers.filter((b) => !b.resolved && b.priority === 'CRITICAL').length;

  return {
    readOnly: true,
    blockers,
    criticalCount,
    highCount,
    unresolvedCount,
    unresolvedCriticalCount,
  };
}
