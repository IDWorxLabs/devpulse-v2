/**
 * General Question Understanding & Reasoning Router — Phase 11.4C orchestration.
 */

import type { BrainClassification, BrainRoadmapContext, BrainSystemRecord } from '../brain-types.js';
import { generateBrainResponse } from '../brain-response-generator.js';
import { processCrossSystemAwareness } from '../cross-system-awareness/index.js';
import { formatMemoryRecallResponse, recallRelevantMemories } from '../../shared-memory/index.js';
import { answerProjectQuestionWithTrace, processProjectUnderstandingRequest } from '../../project-understanding/index.js';
import { isTimelineQuestion } from '../../timeline-intelligence/timeline-types.js';
import { processTimelineIntelligenceRequest } from '../../timeline-intelligence/index.js';
import { detectContextNeeds, needsUnavailableDevelopmentContext } from './context-need-detector.js';
import {
  GENERAL_QUESTION_UNDERSTANDING_OWNER_MODULE,
  GENERAL_QUESTION_UNDERSTANDING_PASS_TOKEN,
  GENERAL_QUESTION_FEED_STAGES,
  type GeneralQuestionRoutingDiagnostics,
  type GeneralRoutingExecutionResult,
  type QuestionRoutingPlan,
} from './general-question-types.js';
import {
  buildDevelopmentLimitationMessage,
  composeGeneralAnswer,
} from './general-answer-composer.js';
import {
  buildQuestionRoutingPlan,
  shouldAllowGenericFallback,
} from './question-routing-plan.js';
import { isBroadProjectQuestion, isPlanningNotImpactQuestion } from './question-understanding-engine.js';

export {
  GENERAL_QUESTION_UNDERSTANDING_OWNER_MODULE,
  GENERAL_QUESTION_UNDERSTANDING_PASS_TOKEN,
  GENERAL_QUESTION_FEED_STAGES,
};
export type { QuestionRoutingPlan, GeneralQuestionRoutingDiagnostics, GeneralRoutingExecutionResult };
export { buildQuestionRoutingPlan, shouldAllowGenericFallback } from './question-routing-plan.js';
export { detectQuestionDimensions, isBroadProjectQuestion, isPlanningNotImpactQuestion } from './question-understanding-engine.js';
export { detectContextNeeds } from './context-need-detector.js';
export { selectReasoningModes } from './reasoning-mode-selector.js';
export { selectCapabilities } from './capability-selector.js';

let lastGeneralQuestionDiagnostics: GeneralQuestionRoutingDiagnostics = {
  lastQuestionDimensions: [],
  lastContextNeeds: [],
  lastReasoningModes: [],
  lastCapabilitiesSelected: [],
  unavailableCapabilities: [],
  routingConfidence: 'LOW',
  routingReason: 'None',
};

export function getLastGeneralQuestionDiagnostics(): GeneralQuestionRoutingDiagnostics {
  return { ...lastGeneralQuestionDiagnostics };
}

export function resetGeneralQuestionUnderstandingForTests(): void {
  lastGeneralQuestionDiagnostics = {
    lastQuestionDimensions: [],
    lastContextNeeds: [],
    lastReasoningModes: [],
    lastCapabilitiesSelected: [],
    unavailableCapabilities: [],
    routingConfidence: 'LOW',
    routingReason: 'None',
  };
}

function updateDiagnostics(plan: QuestionRoutingPlan): void {
  lastGeneralQuestionDiagnostics = {
    lastQuestionDimensions: [...plan.dimensions],
    lastContextNeeds: [...plan.contextNeeds],
    lastReasoningModes: [...plan.reasoningModes],
    lastCapabilitiesSelected: [...plan.selectedCapabilities],
    unavailableCapabilities: [...plan.unavailableCapabilities],
    routingConfidence: plan.confidence,
    routingReason: plan.routingReason,
  };
}

export function understandGeneralQuestion(question: string): QuestionRoutingPlan {
  const plan = buildQuestionRoutingPlan(question);
  updateDiagnostics(plan);
  return plan;
}

function resolveCrossSystemCategory(
  classification: BrainClassification,
  plan: QuestionRoutingPlan,
): 'DEPENDENCY' | 'IMPACT' | 'RELATIONSHIP' {
  if (isPlanningNotImpactQuestion(plan.question)) return 'RELATIONSHIP';
  if (classification.category === 'DEPENDENCY') return 'DEPENDENCY';
  if (classification.category === 'IMPACT') return 'IMPACT';
  if (plan.dimensions.includes('DEPENDENCY')) return 'DEPENDENCY';
  if (plan.dimensions.includes('IMPACT')) return 'IMPACT';
  return 'RELATIONSHIP';
}

export function shouldGeneralRouterOwnRequest(plan: QuestionRoutingPlan): boolean {
  if (shouldAllowGenericFallback(plan)) return false;
  if (plan.primaryCapability) return true;
  if (isBroadProjectQuestion(plan.question, plan.dimensions)) return true;
  if (plan.selectedCapabilities.length > 0) return true;
  if (needsUnavailableDevelopmentContext(plan.contextNeeds)) return true;
  return plan.dimensions.some((d) => d !== 'UNKNOWN');
}

export interface GeneralRoutingDependencies {
  message: string;
  classification: BrainClassification;
  systems: BrainSystemRecord[];
  roadmap: BrainRoadmapContext;
}

export function executeGeneralQuestionRouting(
  plan: QuestionRoutingPlan,
  deps: GeneralRoutingDependencies,
): GeneralRoutingExecutionResult {
  updateDiagnostics(plan);

  const ownsResponse = shouldGeneralRouterOwnRequest(plan);
  if (!ownsResponse) {
    return {
      ownsResponse: false,
      responseText: '',
      usedCapabilities: [],
      routingPlan: plan,
    };
  }

  const usedCapabilities = [...plan.selectedCapabilities];
  const limitationMessage = buildDevelopmentLimitationMessage(plan);

  if (plan.primaryCapability === 'SHARED_MEMORY_RECALL' || plan.dimensions.includes('MEMORY')) {
    if (deps.classification.category === 'MEMORY' || plan.contextNeeds.includes('SHARED_MEMORY')) {
      const memoryResponse = formatMemoryRecallResponse(deps.message, recallRelevantMemories(deps.message));
      return {
        ownsResponse: true,
        responseText: composeGeneralAnswer({
          question: deps.message,
          routingPlan: plan,
          supplementalResponse: memoryResponse,
          limitationMessage: limitationMessage ?? undefined,
        }),
        usedCapabilities: ['SHARED_MEMORY_RECALL', ...usedCapabilities],
        routingPlan: plan,
      };
    }
  }

  if (
    !isPlanningNotImpactQuestion(deps.message) &&
    (plan.primaryCapability === 'TIMELINE_INTELLIGENCE' ||
      (plan.selectedCapabilities.includes('TIMELINE_INTELLIGENCE') && isTimelineQuestion(deps.message)))
  ) {
    const timeline = processTimelineIntelligenceRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: timeline.responseText,
      usedCapabilities: ['TIMELINE_INTELLIGENCE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'CROSS_SYSTEM_AWARENESS' &&
    !isBroadProjectQuestion(deps.message, plan.dimensions) &&
    !isPlanningNotImpactQuestion(deps.message)
  ) {
    const category = resolveCrossSystemCategory(deps.classification, plan);
    const cross = processCrossSystemAwareness(deps.message, category);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: cross.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['CROSS_SYSTEM_AWARENESS', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'PROJECT_KNOWLEDGE_REASONING' ||
    isBroadProjectQuestion(deps.message, plan.dimensions)
  ) {
    const trace = answerProjectQuestionWithTrace(deps.message);
    processProjectUnderstandingRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        reasoning: trace.reasoning,
        recommendedNextStep: trace.reasoning.recommendedNextStep,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['PROJECT_KNOWLEDGE_REASONING', 'PROJECT_UNDERSTANDING', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (limitationMessage) {
    const trace = answerProjectQuestionWithTrace(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        reasoning: trace.reasoning,
        recommendedNextStep: trace.reasoning.recommendedNextStep,
        limitationMessage,
      }),
      usedCapabilities: usedCapabilities,
      routingPlan: plan,
    };
  }

  if (plan.primaryCapability === 'ROADMAP_AWARENESS' || plan.primaryCapability === 'SYSTEM_AWARENESS') {
    const legacy = generateBrainResponse(deps.message, deps.classification, deps.systems, deps.roadmap);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: legacy,
      }),
      usedCapabilities: usedCapabilities,
      routingPlan: plan,
    };
  }

  if (plan.selectedCapabilities.length > 0) {
    const trace = answerProjectQuestionWithTrace(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        reasoning: trace.reasoning,
        recommendedNextStep: trace.reasoning.recommendedNextStep,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: usedCapabilities,
      routingPlan: plan,
    };
  }

  return {
    ownsResponse: false,
    responseText: '',
    usedCapabilities: [],
    routingPlan: plan,
  };
}

export function generalQuestionUnderstandingKey(): string {
  const d = getLastGeneralQuestionDiagnostics();
  return [
    d.lastQuestionDimensions.join(','),
    d.lastContextNeeds.join(','),
    d.lastReasoningModes.join(','),
    d.lastCapabilitiesSelected.join(','),
    d.routingConfidence,
  ].join('|');
}
