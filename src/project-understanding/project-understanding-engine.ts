/**
 * Project Understanding Engine — knowledge-driven project comprehension.
 */

import { analyzeProjectGaps } from './project-gap-analyzer.js';
import { answerFromReasoning } from './project-answer-composer.js';
import { collectProjectFacts } from './project-fact-collector.js';
import { resolveProjectIntent } from './project-intent-resolver.js';
import { reasonOverProjectFacts } from './project-reasoning-engine.js';
import { recommendProjectNextStep } from './project-next-step-analyzer.js';
import { getCurrentProjectProfile } from './project-profile-store.js';
import { analyzeProjectRisks } from './project-risk-analyzer.js';
import { summarizeProjectStatus } from './project-status-model.js';
import type { ProjectUnderstandingContext } from './project-understanding-types.js';
import type { ProjectBroadIntent, ProjectReasoningContext, ReasoningResult } from './project-knowledge-model.js';

export function buildProjectUnderstandingContext(
  memoryUsed = false,
  crossSystemUsed = false,
): ProjectUnderstandingContext {
  const profile = getCurrentProjectProfile();
  return {
    profile,
    statusSummary: summarizeProjectStatus(),
    gapAnalysis: analyzeProjectGaps(),
    riskAnalysis: analyzeProjectRisks(),
    nextStep: recommendProjectNextStep(),
    memoryContextUsed: memoryUsed,
    crossSystemContextUsed: crossSystemUsed,
  };
}

export function answerProjectQuestion(query: string): string {
  const context = collectProjectFacts(query);
  const intent = resolveProjectIntent(query);
  const reasoning = reasonOverProjectFacts(query, context, intent);
  return answerFromReasoning(reasoning);
}

export function answerProjectQuestionWithTrace(query: string): {
  context: ProjectReasoningContext;
  intent: ProjectBroadIntent;
  reasoning: ReasoningResult;
  responseText: string;
} {
  const context = collectProjectFacts(query);
  const intent = resolveProjectIntent(query);
  const reasoning = reasonOverProjectFacts(query, context, intent);
  return {
    context,
    intent,
    reasoning,
    responseText: answerFromReasoning(reasoning),
  };
}

export function processProjectUnderstanding(query: string): {
  context: ProjectUnderstandingContext;
  responseText: string;
  reasoningContext?: ProjectReasoningContext;
  intent?: ProjectBroadIntent;
  reasoning?: ReasoningResult;
} {
  const trace = answerProjectQuestionWithTrace(query);
  const legacyContext = buildProjectUnderstandingContext(
    trace.context.memoryFactCount > 0,
    trace.context.crossSystemFactCount > 0,
  );
  return {
    context: legacyContext,
    responseText: trace.responseText,
    reasoningContext: trace.context,
    intent: trace.intent,
    reasoning: trace.reasoning,
  };
}
