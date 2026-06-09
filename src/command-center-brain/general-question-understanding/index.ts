/**
 * General Question Understanding & Reasoning Router — Phase 11.4C orchestration.
 */

import type { BrainClassification, BrainRoadmapContext, BrainSystemRecord } from '../brain-types.js';
import { generateBrainResponse } from '../brain-response-generator.js';
import { processCrossSystemAwareness } from '../cross-system-awareness/index.js';
import { formatMemoryRecallResponse, recallRelevantMemories } from '../../shared-memory/index.js';
import { answerProjectQuestionWithTrace, processProjectUnderstandingRequest } from '../../project-understanding/index.js';
import { isTimelineQuestion } from '../../timeline-intelligence/timeline-types.js';
import { isVaultAwareQuestion } from '../../project-vault-intelligence/project-vault-intelligence-types.js';
import { isDependencyIntelligenceQuestion } from '../../dependency-intelligence/dependency-intelligence-types.js';
import { isWorkspaceIntelligenceQuestion } from '../../workspace-intelligence/workspace-intelligence-types.js';
import { isProjectHistoryIntelligenceQuestion } from '../../project-history-intelligence/project-history-intelligence-types.js';
import { isProjectSummarizationQuestion } from '../../project-summarization-engine/project-summarization-types.js';
import { isPortfolioIntelligenceQuestion } from '../../portfolio-intelligence/portfolio-intelligence-types.js';
import { isActionVisibilityQuestion } from '../../action-visibility-engine/action-visibility-types.js';
import { isReasoningVisibilityQuestion } from '../../reasoning-visibility-engine/reasoning-visibility-types.js';
import { isProgressIntelligenceQuestion } from '../../progress-intelligence/progress-intelligence-types.js';
import { isFailureVisibilityQuestion } from '../../failure-visibility-engine/failure-visibility-types.js';
import { isLearningVisibilityQuestion } from '../../learning-visibility-engine/learning-visibility-types.js';
import { isExecutionRuntimeFoundationQuestion } from '../../execution-runtime/execution-runtime-types.js';
import { isBuildTaskRuntimeFoundationQuestion } from '../../build-task-runtime/build-task-runtime-types.js';
import { isCodeGenerationRuntimeFoundationQuestion } from '../../code-generation-runtime/code-generation-runtime-types.js';
import { isTestingRuntimeFoundationQuestion } from '../../testing-runtime/testing-runtime-types.js';
import { isAutoFixRuntimeFoundationQuestion } from '../../auto-fix-runtime/auto-fix-runtime-types.js';
import { isRuntimeVerificationLayerQuestion } from '../../runtime-verification-layer/runtime-verification-types.js';
import { isWorld2ExecutionActivationQuestion } from '../../world2-execution-activation/world2-execution-activation-types.js';
import { isWorld2BuilderPacketExecutionQuestion } from '../../world2-builder-packet-execution/types.js';
import { isWorld2ControlledApplyQuestion } from '../../world2-controlled-apply-runtime/types.js';
import { isWorld2RollbackQuestion } from '../../world2-rollback-runtime/types.js';
import { isWorld2RecoveryQuestion } from '../../world2-recovery-runtime/types.js';
import { isWorld2CompletionQuestion } from '../../world2-completion-runtime/types.js';
import { isLivePreviewQuestion } from '../../live-preview-runtime/types.js';
import { isPreviewIntelligenceQuestion } from '../../preview-intelligence/types.js';
import { isSelfVisionRuntimeQuestion } from '../../self-vision-runtime/types.js';
import { isUiInspectionQuestion } from '../../ui-inspection-engine/types.js';
import { isInteractionTestingQuestion } from '../../interaction-testing-engine/types.js';
import { isVisualVerificationQuestion } from '../../visual-verification-engine/types.js';
import { isUvlRuntimeQuestion } from '../../unified-verification-lab/types.js';
import { isVerificationRegistryQuestion } from '../../verification-registry/types.js';
import { isVerificationOrchestratorQuestion } from '../../verification-orchestrator/types.js';
import { isVerificationEvidenceQuestion } from '../../verification-evidence-engine/verification-evidence-types.js';
import { isUnifiedVerificationQuestion } from '../../unified-verification-entry/unified-verification-types.js';
import { isCloudRuntimeFoundationQuestion } from '../../cloud-runtime/cloud-runtime-types.js';
import { isWorkspaceHostingFoundationQuestion } from '../../workspace-hosting/workspace-hosting-types.js';
import { isPersistentBuildRuntimeFoundationQuestion } from '../../persistent-build-runtime/persistent-build-types.js';
import { isCloudVerificationFoundationQuestion } from '../../cloud-verification/cloud-verification-types.js';
import { isCloudRecoveryFoundationQuestion } from '../../cloud-recovery/cloud-recovery-types.js';
import { isCloudMonitoringFoundationQuestion } from '../../cloud-monitoring/cloud-monitoring-types.js';
import { isMobileCommandRuntimeFoundationQuestion } from '../../mobile-command-runtime/mobile-command-types.js';
import { isMobileChatRuntimeFoundationQuestion } from '../../mobile-chat-runtime/mobile-chat-types.js';
import { isMobilePreviewRuntimeFoundationQuestion } from '../../mobile-preview-runtime/mobile-preview-types.js';
import { isMobileApprovalRuntimeFoundationQuestion } from '../../mobile-approval-runtime/mobile-approval-types.js';
import { isCrossDeviceRuntimeFoundationQuestion } from '../../cross-device-runtime/cross-device-types.js';
import { isFounderNotificationRuntimeFoundationQuestion } from '../../founder-notification-runtime/founder-notification-types.js';
import { isFounderInboxFoundationQuestion } from '../../founder-inbox/founder-inbox-types.js';
import { isAutonomousBuilderFoundationQuestion } from '../../autonomous-builder/autonomous-builder-types.js';
import { isMobilePushFoundationQuestion } from '../../mobile-push/mobile-push-types.js';
import { isNotificationDeliveryFoundationQuestion } from '../../notification-delivery/notification-delivery-types.js';
import { isVerificationReportingQuestion } from '../../verification-reporting-engine/verification-report-types.js';
import {
  getRouteHandlerSync,
  processUnifiedDecisionLayerRequest,
  type RouteGroup,
} from './lazy-route-loader.js';
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

function invokeRouteHandler(group: RouteGroup, message: string): string {
  return getRouteHandlerSync(group)(message).responseText;
}

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
export { CONTEXT_CAPABILITY_MAP, getCapabilityRoutingTable, PRIMARY_ROUTE_ENTRIES } from './capability-routing-table.js';
export { getCapabilityDetector } from './capability-routing-detectors.js';
export { buildCapabilityRouteIndex, queryCapabilityRouteIndex, validateCapabilityRouteIndex } from './capability-route-index.js';
export {
  getRouteHandlerSync,
  loadRouteHandler,
  loadRouteGroup,
  getLazyRouteLoaderStats,
  detectRouteLoaderMismatch,
  HOT_ROUTE_GROUPS,
  LAZY_ROUTE_GROUPS,
} from './lazy-route-loader.js';
export {
  getCachedRoutingDecision,
  setCachedRoutingDecision,
  clearRoutingPerformanceCache,
  getRoutingPerformanceCacheStats,
  MAX_CACHE_SIZE,
} from './routing-performance-cache.js';
export { runBrainRoutingPerformanceDiagnostics } from './brain-routing-performance-diagnostics.js';
export { buildAllBrainRoutingPerformanceReports, buildBrainRoutingPerformanceReport } from './brain-routing-performance-report-builder.js';

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
    const port = invokeRouteHandler('portfolio-intelligence', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: port,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['PORTFOLIO_INTELLIGENCE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'MOBILE_APPROVAL_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('MOBILE_APPROVAL_RUNTIME_FOUNDATION') &&
      isMobileApprovalRuntimeFoundationQuestion(deps.message))
  ) {
    const mobileApproval = invokeRouteHandler('mobile-approval', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: mobileApproval,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['MOBILE_APPROVAL_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'AUTONOMOUS_BUILDER_FOUNDATION' ||
    (plan.selectedCapabilities.includes('AUTONOMOUS_BUILDER_FOUNDATION') &&
      isAutonomousBuilderFoundationQuestion(deps.message))
  ) {
    const autonomousBuilder = invokeRouteHandler('autonomous-builder', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: autonomousBuilder,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['AUTONOMOUS_BUILDER_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'MOBILE_PUSH_FOUNDATION' ||
    (plan.selectedCapabilities.includes('MOBILE_PUSH_FOUNDATION') &&
      isMobilePushFoundationQuestion(deps.message))
  ) {
    const mobilePush = invokeRouteHandler('mobile-push', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: mobilePush,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['MOBILE_PUSH_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'NOTIFICATION_DELIVERY_FOUNDATION' ||
    (plan.selectedCapabilities.includes('NOTIFICATION_DELIVERY_FOUNDATION') &&
      isNotificationDeliveryFoundationQuestion(deps.message))
  ) {
    const notificationDelivery = invokeRouteHandler('notification-delivery', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: notificationDelivery,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['NOTIFICATION_DELIVERY_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'FOUNDER_INBOX_FOUNDATION' ||
    (plan.selectedCapabilities.includes('FOUNDER_INBOX_FOUNDATION') &&
      isFounderInboxFoundationQuestion(deps.message))
  ) {
    const founderInbox = invokeRouteHandler('founder-inbox', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: founderInbox,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['FOUNDER_INBOX_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION') &&
      isFounderNotificationRuntimeFoundationQuestion(deps.message))
  ) {
    const founderNotification = invokeRouteHandler('founder-notification', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: founderNotification,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'CROSS_DEVICE_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('CROSS_DEVICE_RUNTIME_FOUNDATION') &&
      isCrossDeviceRuntimeFoundationQuestion(deps.message))
  ) {
    const crossDevice = invokeRouteHandler('cross-device', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: crossDevice,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['CROSS_DEVICE_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'MOBILE_PREVIEW_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('MOBILE_PREVIEW_RUNTIME_FOUNDATION') &&
      isMobilePreviewRuntimeFoundationQuestion(deps.message))
  ) {
    const mobilePreview = invokeRouteHandler('mobile-preview', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: mobilePreview,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['MOBILE_PREVIEW_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'MOBILE_CHAT_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('MOBILE_CHAT_RUNTIME_FOUNDATION') &&
      isMobileChatRuntimeFoundationQuestion(deps.message))
  ) {
    const mobileChat = invokeRouteHandler('mobile-chat', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: mobileChat,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['MOBILE_CHAT_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'MOBILE_COMMAND_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('MOBILE_COMMAND_RUNTIME_FOUNDATION') &&
      isMobileCommandRuntimeFoundationQuestion(deps.message))
  ) {
    const mobileCommand = invokeRouteHandler('mobile-command', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: mobileCommand,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['MOBILE_COMMAND_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'CLOUD_MONITORING_FOUNDATION' ||
    (plan.selectedCapabilities.includes('CLOUD_MONITORING_FOUNDATION') &&
      isCloudMonitoringFoundationQuestion(deps.message))
  ) {
    const cloudMonitoring = invokeRouteHandler('cloud-monitoring', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: cloudMonitoring,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['CLOUD_MONITORING_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'CLOUD_RECOVERY_FOUNDATION' ||
    (plan.selectedCapabilities.includes('CLOUD_RECOVERY_FOUNDATION') &&
      isCloudRecoveryFoundationQuestion(deps.message))
  ) {
    const cloudRecovery = invokeRouteHandler('cloud-recovery', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: cloudRecovery,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['CLOUD_RECOVERY_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'CLOUD_VERIFICATION_FOUNDATION' ||
    (plan.selectedCapabilities.includes('CLOUD_VERIFICATION_FOUNDATION') &&
      isCloudVerificationFoundationQuestion(deps.message))
  ) {
    const cloudVerification = invokeRouteHandler('cloud-verification', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: cloudVerification,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['CLOUD_VERIFICATION_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'PERSISTENT_BUILD_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('PERSISTENT_BUILD_RUNTIME_FOUNDATION') &&
      isPersistentBuildRuntimeFoundationQuestion(deps.message))
  ) {
    const persistentBuild = invokeRouteHandler('persistent-build', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: persistentBuild,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['PERSISTENT_BUILD_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'WORKSPACE_HOSTING_FOUNDATION' ||
    (plan.selectedCapabilities.includes('WORKSPACE_HOSTING_FOUNDATION') &&
      isWorkspaceHostingFoundationQuestion(deps.message))
  ) {
    const hosting = invokeRouteHandler('workspace-hosting', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: hosting,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['WORKSPACE_HOSTING_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'CLOUD_RUNTIME_FOUNDATION' ||
    (plan.selectedCapabilities.includes('CLOUD_RUNTIME_FOUNDATION') &&
      isCloudRuntimeFoundationQuestion(deps.message))
  ) {
    const cloud = invokeRouteHandler('cloud-runtime', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: cloud,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['CLOUD_RUNTIME_FOUNDATION', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'UNIFIED_VERIFICATION_ENTRY' ||
    (plan.selectedCapabilities.includes('UNIFIED_VERIFICATION_ENTRY') &&
      isUnifiedVerificationQuestion(deps.message))
  ) {
    const uvent = invokeRouteHandler('unified-verification', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: uvent,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['UNIFIED_VERIFICATION_ENTRY', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'VERIFICATION_REPORTING_ENGINE' ||
    (plan.selectedCapabilities.includes('VERIFICATION_REPORTING_ENGINE') &&
      isVerificationReportingQuestion(deps.message))
  ) {
    const vrpt = invokeRouteHandler('verification-reporting', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: vrpt,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['VERIFICATION_REPORTING_ENGINE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'VERIFICATION_EVIDENCE_ENGINE' ||
    (plan.selectedCapabilities.includes('VERIFICATION_EVIDENCE_ENGINE') &&
      isVerificationEvidenceQuestion(deps.message))
  ) {
    const vevid = invokeRouteHandler('verification-evidence', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: vevid,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['VERIFICATION_EVIDENCE_ENGINE', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'VERIFICATION_ORCHESTRATOR' ||
    (plan.selectedCapabilities.includes('VERIFICATION_ORCHESTRATOR') &&
      isVerificationOrchestratorQuestion(deps.message))
  ) {
    const vorch = invokeRouteHandler('verification-orchestrator', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: vorch,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['VERIFICATION_ORCHESTRATOR', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'VERIFICATION_REGISTRY' ||
    (plan.selectedCapabilities.includes('VERIFICATION_REGISTRY') &&
      isVerificationRegistryQuestion(deps.message))
  ) {
    const vreg = invokeRouteHandler('verification-registry', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: vreg,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['VERIFICATION_REGISTRY', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'UNIFIED_VERIFICATION_LAB_RUNTIME' ||
    (plan.selectedCapabilities.includes('UNIFIED_VERIFICATION_LAB_RUNTIME') &&
      isUvlRuntimeQuestion(deps.message))
  ) {
    const uvlRuntime = invokeRouteHandler('uvl-runtime', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: uvlRuntime,
        limitationMessage: limitationMessage ?? undefined,
      }),
      usedCapabilities: ['UNIFIED_VERIFICATION_LAB_RUNTIME', ...usedCapabilities],
      routingPlan: plan,
    };
  }

  if (
    plan.primaryCapability === 'VISUAL_VERIFICATION_ENGINE' ||
    (plan.selectedCapabilities.includes('VISUAL_VERIFICATION_ENGINE') &&
      isVisualVerificationQuestion(deps.message))
  ) {
    const verification = invokeRouteHandler('visual-verification', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: verification,
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
    const interaction = invokeRouteHandler('interaction-testing', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: interaction,
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
    const inspection = invokeRouteHandler('ui-inspection', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: inspection,
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
    const selfVision = invokeRouteHandler('self-vision', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: selfVision,
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
    const intelligence = invokeRouteHandler('preview-intelligence', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: intelligence,
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
    const preview = invokeRouteHandler('live-preview', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: preview,
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
    const completion = invokeRouteHandler('world2-completion', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: completion,
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
    const recovery = invokeRouteHandler('world2-recovery', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: recovery,
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
    const rollback = invokeRouteHandler('world2-rollback', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: rollback,
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
    const controlledApply = invokeRouteHandler('world2-controlled-apply', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: controlledApply,
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
    const packetExec = invokeRouteHandler('world2-builder-packet', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: packetExec,
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
    const activation = invokeRouteHandler('world2-execution-activation', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: activation,
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
    const verification = invokeRouteHandler('runtime-verification', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: verification,
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
    const autoFix = invokeRouteHandler('auto-fix', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: autoFix,
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
    const testing = invokeRouteHandler('testing-runtime', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: testing,
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
    const codeGen = invokeRouteHandler('code-generation', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: codeGen,
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
    const buildTask = invokeRouteHandler('build-task', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: buildTask,
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
    const execution = invokeRouteHandler('execution-runtime', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: execution,
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
    const learning = invokeRouteHandler('learning-visibility', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: learning,
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
    const failure = invokeRouteHandler('failure-visibility', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: failure,
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
    const progress = invokeRouteHandler('progress-intelligence', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: progress,
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
    const reasoning = invokeRouteHandler('reasoning-visibility', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: reasoning,
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
    const action = invokeRouteHandler('action-visibility', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: action,
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
    const sum = invokeRouteHandler('project-summarization', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: sum,
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
    const hist = invokeRouteHandler('project-history', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: hist,
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
    const ws = invokeRouteHandler('workspace-intelligence', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: ws,
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
    const dep = invokeRouteHandler('dependency-intelligence', deps.message);
    return {
      ownsResponse: true,
      responseText: composeGeneralAnswer({
        question: deps.message,
        routingPlan: plan,
        supplementalResponse: dep,
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
    const timeline = invokeRouteHandler('timeline', deps.message);
    return {
      ownsResponse: true,
      responseText: timeline,
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
