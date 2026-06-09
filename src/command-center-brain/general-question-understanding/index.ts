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
import { processUnifiedDecisionLayerRequest } from '../../unified-decision-layer/index.js';
import { isVaultAwareQuestion } from '../../project-vault-intelligence/project-vault-intelligence-types.js';
import { processDependencyIntelligenceRequest } from '../../dependency-intelligence/index.js';
import { isDependencyIntelligenceQuestion } from '../../dependency-intelligence/dependency-intelligence-types.js';
import { processWorkspaceIntelligenceRequest } from '../../workspace-intelligence/index.js';
import { isWorkspaceIntelligenceQuestion } from '../../workspace-intelligence/workspace-intelligence-types.js';
import { processProjectHistoryIntelligenceRequest } from '../../project-history-intelligence/index.js';
import { isProjectHistoryIntelligenceQuestion } from '../../project-history-intelligence/project-history-intelligence-types.js';
import { processProjectSummarizationRequest } from '../../project-summarization-engine/index.js';
import { isProjectSummarizationQuestion } from '../../project-summarization-engine/project-summarization-types.js';
import { processPortfolioIntelligenceRequest } from '../../portfolio-intelligence/index.js';
import { isPortfolioIntelligenceQuestion } from '../../portfolio-intelligence/portfolio-intelligence-types.js';
import { processActionVisibilityRequest } from '../../action-visibility-engine/index.js';
import { isActionVisibilityQuestion } from '../../action-visibility-engine/action-visibility-types.js';
import { processReasoningVisibilityRequest } from '../../reasoning-visibility-engine/index.js';
import { isReasoningVisibilityQuestion } from '../../reasoning-visibility-engine/reasoning-visibility-types.js';
import { processProgressIntelligenceRequest } from '../../progress-intelligence/index.js';
import { isProgressIntelligenceQuestion } from '../../progress-intelligence/progress-intelligence-types.js';
import { processFailureVisibilityRequest } from '../../failure-visibility-engine/index.js';
import { isFailureVisibilityQuestion } from '../../failure-visibility-engine/failure-visibility-types.js';
import { processLearningVisibilityRequest } from '../../learning-visibility-engine/index.js';
import { isLearningVisibilityQuestion } from '../../learning-visibility-engine/learning-visibility-types.js';
import { processExecutionRuntimeRequest } from '../../execution-runtime/index.js';
import { isExecutionRuntimeFoundationQuestion } from '../../execution-runtime/execution-runtime-types.js';
import { processBuildTaskRuntimeRequest } from '../../build-task-runtime/index.js';
import { isBuildTaskRuntimeFoundationQuestion } from '../../build-task-runtime/build-task-runtime-types.js';
import { processCodeGenerationRuntimeRequest } from '../../code-generation-runtime/index.js';
import { isCodeGenerationRuntimeFoundationQuestion } from '../../code-generation-runtime/code-generation-runtime-types.js';
import { processTestingRuntimeRequest } from '../../testing-runtime/index.js';
import { isTestingRuntimeFoundationQuestion } from '../../testing-runtime/testing-runtime-types.js';
import { processAutoFixRuntimeRequest } from '../../auto-fix-runtime/index.js';
import { isAutoFixRuntimeFoundationQuestion } from '../../auto-fix-runtime/auto-fix-runtime-types.js';
import { processRuntimeVerificationRequest } from '../../runtime-verification-layer/index.js';
import { isRuntimeVerificationLayerQuestion } from '../../runtime-verification-layer/runtime-verification-types.js';
import { processWorld2ExecutionActivationRequest } from '../../world2-execution-activation/index.js';
import { isWorld2ExecutionActivationQuestion } from '../../world2-execution-activation/world2-execution-activation-types.js';
import { processBuilderPacketExecutionRequest } from '../../world2-builder-packet-execution/index.js';
import { isWorld2BuilderPacketExecutionQuestion } from '../../world2-builder-packet-execution/types.js';
import { processControlledApplyRequest } from '../../world2-controlled-apply-runtime/index.js';
import { isWorld2ControlledApplyQuestion } from '../../world2-controlled-apply-runtime/types.js';
import { processRollbackRequest } from '../../world2-rollback-runtime/index.js';
import { isWorld2RollbackQuestion } from '../../world2-rollback-runtime/types.js';
import { processRecoveryRequest } from '../../world2-recovery-runtime/index.js';
import { isWorld2RecoveryQuestion } from '../../world2-recovery-runtime/types.js';
import { processCompletionRequest } from '../../world2-completion-runtime/index.js';
import { isWorld2CompletionQuestion } from '../../world2-completion-runtime/types.js';
import { processLivePreviewRequest } from '../../live-preview-runtime/index.js';
import { isLivePreviewQuestion } from '../../live-preview-runtime/types.js';
import { processPreviewIntelligenceRequest } from '../../preview-intelligence/index.js';
import { isPreviewIntelligenceQuestion } from '../../preview-intelligence/types.js';
import { processSelfVisionRuntimeRequest } from '../../self-vision-runtime/index.js';
import { isSelfVisionRuntimeQuestion } from '../../self-vision-runtime/types.js';
import { processUiInspectionRequest } from '../../ui-inspection-engine/index.js';
import { isUiInspectionQuestion } from '../../ui-inspection-engine/types.js';
import { processInteractionTestingRequest } from '../../interaction-testing-engine/index.js';
import { isInteractionTestingQuestion } from '../../interaction-testing-engine/types.js';
import { processVisualVerificationRequest } from '../../visual-verification-engine/index.js';
import { isVisualVerificationQuestion } from '../../visual-verification-engine/types.js';
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
    plan.primaryCapability === 'PORTFOLIO_INTELLIGENCE' ||
    (plan.selectedCapabilities.includes('PORTFOLIO_INTELLIGENCE') && isPortfolioIntelligenceQuestion(deps.message))
  ) {
    const port = processPortfolioIntelligenceRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: port.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['PORTFOLIO_INTELLIGENCE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'VISUAL_VERIFICATION_ENGINE' ||
    (plan.selectedCapabilities.includes('VISUAL_VERIFICATION_ENGINE') &&
      isVisualVerificationQuestion(deps.message))
  ) {
    const verification = processVisualVerificationRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: verification.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['VISUAL_VERIFICATION_ENGINE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'INTERACTION_TESTING_ENGINE' ||
    (plan.selectedCapabilities.includes('INTERACTION_TESTING_ENGINE') &&
      isInteractionTestingQuestion(deps.message))
  ) {
    const interaction = processInteractionTestingRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: interaction.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['INTERACTION_TESTING_ENGINE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'UI_INSPECTION_ENGINE' ||
    (plan.selectedCapabilities.includes('UI_INSPECTION_ENGINE') &&
      isUiInspectionQuestion(deps.message))
  ) {
    const inspection = processUiInspectionRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: inspection.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['UI_INSPECTION_ENGINE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'SELF_VISION_RUNTIME' ||
    (plan.selectedCapabilities.includes('SELF_VISION_RUNTIME') &&
      isSelfVisionRuntimeQuestion(deps.message))
  ) {
    const selfVision = processSelfVisionRuntimeRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: selfVision.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['SELF_VISION_RUNTIME', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'PREVIEW_INTELLIGENCE' ||
    (plan.selectedCapabilities.includes('PREVIEW_INTELLIGENCE') &&
      isPreviewIntelligenceQuestion(deps.message))
  ) {
    const intelligence = processPreviewIntelligenceRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: intelligence.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['PREVIEW_INTELLIGENCE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'LIVE_PREVIEW_RUNTIME' ||
    (plan.selectedCapabilities.includes('LIVE_PREVIEW_RUNTIME') &&
      isLivePreviewQuestion(deps.message))
  ) {
    const preview = processLivePreviewRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: preview.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['LIVE_PREVIEW_RUNTIME', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'WORLD2_COMPLETION_RUNTIME' ||
    (plan.selectedCapabilities.includes('WORLD2_COMPLETION_RUNTIME') &&
      isWorld2CompletionQuestion(deps.message))
  ) {
    const completion = processCompletionRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: completion.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['WORLD2_COMPLETION_RUNTIME', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'WORLD2_RECOVERY_RUNTIME' ||
    (plan.selectedCapabilities.includes('WORLD2_RECOVERY_RUNTIME') &&
      isWorld2RecoveryQuestion(deps.message))
  ) {
    const recovery = processRecoveryRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: recovery.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['WORLD2_RECOVERY_RUNTIME', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'WORLD2_ROLLBACK_RUNTIME' ||
    (plan.selectedCapabilities.includes('WORLD2_ROLLBACK_RUNTIME') &&
      isWorld2RollbackQuestion(deps.message))
  ) {
    const rollback = processRollbackRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: rollback.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['WORLD2_ROLLBACK_RUNTIME', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'WORLD2_CONTROLLED_APPLY_RUNTIME' ||
    (plan.selectedCapabilities.includes('WORLD2_CONTROLLED_APPLY_RUNTIME') &&
      isWorld2ControlledApplyQuestion(deps.message))
  ) {
    const controlledApply = processControlledApplyRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: controlledApply.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['WORLD2_CONTROLLED_APPLY_RUNTIME', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'WORLD2_BUILDER_PACKET_EXECUTION' ||
    (plan.selectedCapabilities.includes('WORLD2_BUILDER_PACKET_EXECUTION') &&
      isWorld2BuilderPacketExecutionQuestion(deps.message))
  ) {
    const packetExec = processBuilderPacketExecutionRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: packetExec.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['WORLD2_BUILDER_PACKET_EXECUTION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'WORLD2_EXECUTION_ACTIVATION' ||
    (plan.selectedCapabilities.includes('WORLD2_EXECUTION_ACTIVATION') &&
      isWorld2ExecutionActivationQuestion(deps.message))
  ) {
    const activation = processWorld2ExecutionActivationRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: activation.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['WORLD2_EXECUTION_ACTIVATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'RUNTIME_VERIFICATION_LAYER' ||
    (plan.selectedCapabilities.includes('RUNTIME_VERIFICATION_LAYER') &&
      isRuntimeVerificationLayerQuestion(deps.message))
  ) {
    const verification = processRuntimeVerificationRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: verification.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['RUNTIME_VERIFICATION_LAYER', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'AUTO_FIX_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('AUTO_FIX_RUNTIME_FOUNDATION') &&
      isAutoFixRuntimeFoundationQuestion(deps.message))
  ) {
    const autoFix = processAutoFixRuntimeRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: autoFix.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['AUTO_FIX_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'TESTING_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('TESTING_RUNTIME_FOUNDATION') &&
      isTestingRuntimeFoundationQuestion(deps.message))
  ) {
    const testing = processTestingRuntimeRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: testing.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['TESTING_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'CODE_GENERATION_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('CODE_GENERATION_RUNTIME_FOUNDATION') &&
      isCodeGenerationRuntimeFoundationQuestion(deps.message))
  ) {
    const codeGen = processCodeGenerationRuntimeRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: codeGen.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['CODE_GENERATION_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'BUILD_TASK_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('BUILD_TASK_RUNTIME_FOUNDATION') &&
      isBuildTaskRuntimeFoundationQuestion(deps.message))
  ) {
    const buildTask = processBuildTaskRuntimeRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: buildTask.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['BUILD_TASK_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'EXECUTION_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('EXECUTION_RUNTIME_FOUNDATION') &&
      isExecutionRuntimeFoundationQuestion(deps.message))
  ) {
    const execution = processExecutionRuntimeRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: execution.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['EXECUTION_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'LEARNING_VISIBILITY_ENGINE' ||
    (plan.selectedCapabilities.includes('LEARNING_VISIBILITY_ENGINE') && isLearningVisibilityQuestion(deps.message))
  ) {
    const learning = processLearningVisibilityRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: learning.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['LEARNING_VISIBILITY_ENGINE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'FAILURE_VISIBILITY_ENGINE' ||
    (plan.selectedCapabilities.includes('FAILURE_VISIBILITY_ENGINE') && isFailureVisibilityQuestion(deps.message))
  ) {
    const failure = processFailureVisibilityRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: failure.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['FAILURE_VISIBILITY_ENGINE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'PROGRESS_INTELLIGENCE' ||
    (plan.selectedCapabilities.includes('PROGRESS_INTELLIGENCE') && isProgressIntelligenceQuestion(deps.message))
  ) {
    const progress = processProgressIntelligenceRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: progress.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['PROGRESS_INTELLIGENCE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'REASONING_VISIBILITY_ENGINE' ||
    (plan.selectedCapabilities.includes('REASONING_VISIBILITY_ENGINE') && isReasoningVisibilityQuestion(deps.message))
  ) {
    const reasoning = processReasoningVisibilityRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: reasoning.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['REASONING_VISIBILITY_ENGINE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'ACTION_VISIBILITY_ENGINE' ||
    (plan.selectedCapabilities.includes('ACTION_VISIBILITY_ENGINE') && isActionVisibilityQuestion(deps.message))
  ) {
    const action = processActionVisibilityRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: action.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['ACTION_VISIBILITY_ENGINE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (plan.primaryCapability === 'UNIFIED_DECISION_LAYER' || plan.selectedCapabilities.includes('UNIFIED_DECISION_LAYER')) {
    const decision = processUnifiedDecisionLayerRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: decision.responseText,
      usedCapabilities: ['UNIFIED_DECISION_LAYER', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'PROJECT_SUMMARIZATION_ENGINE' ||
    (plan.selectedCapabilities.includes('PROJECT_SUMMARIZATION_ENGINE') && isProjectSummarizationQuestion(deps.message))
  ) {
    const sum = processProjectSummarizationRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: sum.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['PROJECT_SUMMARIZATION_ENGINE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'PROJECT_HISTORY_INTELLIGENCE' ||
    (plan.selectedCapabilities.includes('PROJECT_HISTORY_INTELLIGENCE') && isProjectHistoryIntelligenceQuestion(deps.message))
  ) {
    const hist = processProjectHistoryIntelligenceRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: hist.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['PROJECT_HISTORY_INTELLIGENCE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'WORKSPACE_INTELLIGENCE' ||
    (plan.selectedCapabilities.includes('WORKSPACE_INTELLIGENCE') && isWorkspaceIntelligenceQuestion(deps.message))
  ) {
    const ws = processWorkspaceIntelligenceRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: ws.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['WORKSPACE_INTELLIGENCE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'DEPENDENCY_INTELLIGENCE' ||
    (plan.selectedCapabilities.includes('DEPENDENCY_INTELLIGENCE') && isDependencyIntelligenceQuestion(deps.message))
  ) {
    const dep = processDependencyIntelligenceRequest(deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: dep.responseText,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['DEPENDENCY_INTELLIGENCE', ...usedCapabilities],
      routingPlan: plan,
    };
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
    const vaultCaps = isVaultAwareQuestion(deps.message) || plan.selectedCapabilities.includes('PROJECT_VAULT_INTELLIGENCE')
      ? (['PROJECT_VAULT_INTELLIGENCE'] as const)
      : [];
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        reasoning: trace.reasoning,
        recommendedNextStep: trace.reasoning.recommendedNextStep,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['PROJECT_KNOWLEDGE_REASONING', 'PROJECT_UNDERSTANDING', ...vaultCaps, ...usedCapabilities],
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
