/**
 * Recovery Report Builder — engineering recovery reports.
 */

import type { EngineeringContinuationResult } from '../engineering-continuation/index.js';
import type { RecoveryEscalationDecision } from '../recovery-escalation-authority/index.js';
import type { RecoveryExecutionResult } from '../recovery-executor/index.js';
import type { EngineeringRecoveryPlan } from '../recovery-planner/index.js';
import type { RootCauseAnalysis } from '../recovery-root-cause/index.js';
import type { RecoveryStrategySelection } from '../recovery-strategy-engine/index.js';
import type { ValidationReplayResult } from '../validation-replay-engine/index.js';

export interface RecoveryReport {
  readOnly: true;
  reportId: string;
  generatedAt: number;
  engineeringTimeline: readonly string[];
  failureStage: string;
  failureReason: string;
  diagnosis: RootCauseAnalysis;
  selectedRecovery: RecoveryStrategySelection;
  executionResults: readonly RecoveryExecutionResult[];
  replayEvidence: ValidationReplayResult | null;
  continuationEvidence: EngineeringContinuationResult | null;
  escalation: RecoveryEscalationDecision | null;
  finalState: 'RECOVERED' | 'CONTINUED' | 'ESCALATED' | 'FAILED';
  markdown: string;
}

export function buildRecoveryReport(input: {
  plan: EngineeringRecoveryPlan;
  diagnosis: RootCauseAnalysis;
  selection: RecoveryStrategySelection;
  executions: readonly RecoveryExecutionResult[];
  replay: ValidationReplayResult | null;
  continuation: EngineeringContinuationResult | null;
  escalation: RecoveryEscalationDecision | null;
}): RecoveryReport {
  const finalState = deriveFinalState(input);
  const reportId = `recovery-report-${Date.now()}`;

  const timeline = [
    `FAILURE:${input.plan.failureStage}`,
    `DIAGNOSIS:${input.diagnosis.category}`,
    `STRATEGY:${input.selection.selected?.operation ?? 'none'}`,
    ...input.executions.map((e) => `EXEC:${e.operation}:${e.success ? 'ok' : 'fail'}`),
    input.replay ? `REPLAY:${input.replay.passed ? 'pass' : 'fail'}` : 'REPLAY:skipped',
    input.continuation ? `CONTINUE:${input.continuation.continued ? 'ok' : 'fail'}` : 'CONTINUE:skipped',
    `FINAL:${finalState}`,
  ];

  const markdown = [
    '# Autonomous Recovery Report',
    '',
    `**Failure Stage:** ${input.plan.failureStage}`,
    `**Failure Reason:** ${input.plan.failureReason}`,
    '',
    '## Diagnosis',
    `- Category: ${input.diagnosis.category}`,
    `- Confidence: ${input.diagnosis.confidence}`,
    `- Summary: ${input.diagnosis.summary}`,
    '',
    '## Selected Recovery',
    `- Operation: ${input.selection.selected?.operation ?? 'none'}`,
    `- Reason: ${input.selection.selectionReason}`,
    '',
    '## Replay Evidence',
    input.replay
      ? `- Passed: ${input.replay.passed}\n- Detail: ${input.replay.detail}`
      : '- No replay executed',
    '',
    '## Continuation',
    input.continuation
      ? `- Continued: ${input.continuation.continued}\n- Detail: ${input.continuation.detail}`
      : '- No continuation executed',
    '',
    '## Escalation',
    input.escalation
      ? `- Escalate: ${input.escalation.escalate}\n- Reason: ${input.escalation.reason}`
      : '- No escalation required',
    '',
    `**Final State:** ${finalState}`,
  ].join('\n');

  return {
    readOnly: true,
    reportId,
    generatedAt: Date.now(),
    engineeringTimeline: timeline,
    failureStage: input.plan.failureStage,
    failureReason: input.plan.failureReason,
    diagnosis: input.diagnosis,
    selectedRecovery: input.selection,
    executionResults: input.executions,
    replayEvidence: input.replay,
    continuationEvidence: input.continuation,
    escalation: input.escalation,
    finalState,
    markdown,
  };
}

function deriveFinalState(input: {
  continuation: EngineeringContinuationResult | null;
  escalation: RecoveryEscalationDecision | null;
  executions: readonly RecoveryExecutionResult[];
  replay: ValidationReplayResult | null;
}): RecoveryReport['finalState'] {
  if (input.escalation?.escalate) return 'ESCALATED';
  if (input.continuation?.continued) return 'CONTINUED';
  if (input.executions.some((e) => e.success) && input.replay?.passed) return 'RECOVERED';
  return 'FAILED';
}
