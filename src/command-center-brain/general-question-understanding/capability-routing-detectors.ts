/**
 * Capability routing detectors — registry of isXQuestion predicates.
 */

import { isBroadProjectQuestion, isPlanningNotImpactQuestion } from './question-understanding-engine.js';
import { isTimelineQuestion } from '../../timeline-intelligence/timeline-types.js';
import { isDecisionQuestion } from '../../unified-decision-layer/decision-types.js';
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
import { isVerificationReportingQuestion } from '../../verification-reporting-engine/verification-report-types.js';
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
import { isBuildStrategyEngineQuestion } from '../../build-strategy-engine/build-strategy-types.js';
import { isAutonomousBuilderFoundationQuestion } from '../../autonomous-builder/autonomous-builder-types.js';
import { isMobilePushFoundationQuestion } from '../../mobile-push/mobile-push-types.js';
import { isNotificationDeliveryFoundationQuestion } from '../../notification-delivery/notification-delivery-types.js';

export type CapabilityDetectorKey =
  | 'portfolioIntelligence'
  | 'mobileApprovalRuntimeFoundation'
  | 'buildStrategyEngine'
  | 'autonomousBuilderFoundation'
  | 'mobilePushFoundation'
  | 'notificationDeliveryFoundation'
  | 'founderInboxFoundation'
  | 'founderNotificationRuntimeFoundation'
  | 'crossDeviceRuntimeFoundation'
  | 'mobilePreviewRuntimeFoundation'
  | 'mobileChatRuntimeFoundation'
  | 'mobileCommandRuntimeFoundation'
  | 'cloudMonitoringFoundation'
  | 'cloudRecoveryFoundation'
  | 'cloudVerificationFoundation'
  | 'persistentBuildRuntimeFoundation'
  | 'workspaceHostingFoundation'
  | 'cloudRuntimeFoundation'
  | 'unifiedVerificationEntry'
  | 'verificationReportingEngine'
  | 'verificationEvidenceEngine'
  | 'verificationOrchestrator'
  | 'verificationRegistry'
  | 'unifiedVerificationLabRuntime'
  | 'visualVerificationEngine'
  | 'interactionTestingEngine'
  | 'uiInspectionEngine'
  | 'selfVisionRuntime'
  | 'previewIntelligence'
  | 'livePreviewRuntime'
  | 'world2CompletionRuntime'
  | 'world2RecoveryRuntime'
  | 'world2RollbackRuntime'
  | 'world2ControlledApplyRuntime'
  | 'world2BuilderPacketExecution'
  | 'world2ExecutionActivation'
  | 'runtimeVerificationLayer'
  | 'autoFixRuntimeFoundation'
  | 'testingRuntimeFoundation'
  | 'codeGenerationRuntimeFoundation'
  | 'buildTaskRuntimeFoundation'
  | 'executionRuntimeFoundation'
  | 'failureVisibilityDependencyChains'
  | 'dependencyIntelligenceBlockedCapabilities'
  | 'learningVisibilityEngine'
  | 'failureVisibilityEngine'
  | 'progressIntelligence'
  | 'reasoningVisibilityEngine'
  | 'actionVisibilityEngine'
  | 'unifiedDecisionLayer'
  | 'projectSummarizationEngine'
  | 'projectHistoryIntelligence'
  | 'workspaceIntelligence'
  | 'dependencyIntelligence'
  | 'vaultAware'
  | 'timelinePrimary'
  | 'timelineIntelligenceCompanion'
  | 'dependencyIntelligenceCompanion'
  | 'workspaceIntelligenceCompanion'
  | 'projectHistoryIntelligenceCompanion'
  | 'actionVisibilityCompanion'
  | 'reasoningVisibilityCompanion';

const DETECTOR_REGISTRY: Record<CapabilityDetectorKey, (q: string) => boolean> = {
  portfolioIntelligence: isPortfolioIntelligenceQuestion,
  mobileApprovalRuntimeFoundation: isMobileApprovalRuntimeFoundationQuestion,
  buildStrategyEngine: isBuildStrategyEngineQuestion,
  autonomousBuilderFoundation: isAutonomousBuilderFoundationQuestion,
  mobilePushFoundation: isMobilePushFoundationQuestion,
  notificationDeliveryFoundation: isNotificationDeliveryFoundationQuestion,
  founderInboxFoundation: isFounderInboxFoundationQuestion,
  founderNotificationRuntimeFoundation: isFounderNotificationRuntimeFoundationQuestion,
  crossDeviceRuntimeFoundation: isCrossDeviceRuntimeFoundationQuestion,
  mobilePreviewRuntimeFoundation: isMobilePreviewRuntimeFoundationQuestion,
  mobileChatRuntimeFoundation: isMobileChatRuntimeFoundationQuestion,
  mobileCommandRuntimeFoundation: isMobileCommandRuntimeFoundationQuestion,
  cloudMonitoringFoundation: isCloudMonitoringFoundationQuestion,
  cloudRecoveryFoundation: isCloudRecoveryFoundationQuestion,
  cloudVerificationFoundation: isCloudVerificationFoundationQuestion,
  persistentBuildRuntimeFoundation: isPersistentBuildRuntimeFoundationQuestion,
  workspaceHostingFoundation: isWorkspaceHostingFoundationQuestion,
  cloudRuntimeFoundation: isCloudRuntimeFoundationQuestion,
  unifiedVerificationEntry: isUnifiedVerificationQuestion,
  verificationReportingEngine: isVerificationReportingQuestion,
  verificationEvidenceEngine: isVerificationEvidenceQuestion,
  verificationOrchestrator: isVerificationOrchestratorQuestion,
  verificationRegistry: isVerificationRegistryQuestion,
  unifiedVerificationLabRuntime: isUvlRuntimeQuestion,
  visualVerificationEngine: isVisualVerificationQuestion,
  interactionTestingEngine: isInteractionTestingQuestion,
  uiInspectionEngine: isUiInspectionQuestion,
  selfVisionRuntime: isSelfVisionRuntimeQuestion,
  previewIntelligence: isPreviewIntelligenceQuestion,
  livePreviewRuntime: isLivePreviewQuestion,
  world2CompletionRuntime: isWorld2CompletionQuestion,
  world2RecoveryRuntime: isWorld2RecoveryQuestion,
  world2RollbackRuntime: isWorld2RollbackQuestion,
  world2ControlledApplyRuntime: isWorld2ControlledApplyQuestion,
  world2BuilderPacketExecution: isWorld2BuilderPacketExecutionQuestion,
  world2ExecutionActivation: isWorld2ExecutionActivationQuestion,
  runtimeVerificationLayer: isRuntimeVerificationLayerQuestion,
  autoFixRuntimeFoundation: isAutoFixRuntimeFoundationQuestion,
  testingRuntimeFoundation: isTestingRuntimeFoundationQuestion,
  codeGenerationRuntimeFoundation: isCodeGenerationRuntimeFoundationQuestion,
  buildTaskRuntimeFoundation: isBuildTaskRuntimeFoundationQuestion,
  executionRuntimeFoundation: isExecutionRuntimeFoundationQuestion,
  failureVisibilityDependencyChains: (q) =>
    isFailureVisibilityQuestion(q) && q.toLowerCase().includes('dependency chains are impacted'),
  dependencyIntelligenceBlockedCapabilities: (q) =>
    isDependencyIntelligenceQuestion(q) && q.toLowerCase().includes('capabilities are blocked'),
  learningVisibilityEngine: isLearningVisibilityQuestion,
  failureVisibilityEngine: isFailureVisibilityQuestion,
  progressIntelligence: isProgressIntelligenceQuestion,
  reasoningVisibilityEngine: isReasoningVisibilityQuestion,
  actionVisibilityEngine: isActionVisibilityQuestion,
  unifiedDecisionLayer: isDecisionQuestion,
  projectSummarizationEngine: isProjectSummarizationQuestion,
  projectHistoryIntelligence: isProjectHistoryIntelligenceQuestion,
  workspaceIntelligence: isWorkspaceIntelligenceQuestion,
  dependencyIntelligence: isDependencyIntelligenceQuestion,
  vaultAware: isVaultAwareQuestion,
  timelinePrimary: (q) => isTimelineQuestion(q) && !isPlanningNotImpactQuestion(q),
  timelineIntelligenceCompanion: (q) =>
    isTimelineQuestion(q) &&
    !isProjectHistoryIntelligenceQuestion(q) &&
    !isPlanningNotImpactQuestion(q) &&
    !isDecisionQuestion(q),
  dependencyIntelligenceCompanion: isDependencyIntelligenceQuestion,
  workspaceIntelligenceCompanion: isWorkspaceIntelligenceQuestion,
  projectHistoryIntelligenceCompanion: isProjectHistoryIntelligenceQuestion,
  actionVisibilityCompanion: isActionVisibilityQuestion,
  reasoningVisibilityCompanion: isReasoningVisibilityQuestion,
};

export function getCapabilityDetector(detectorKey: CapabilityDetectorKey): (q: string) => boolean {
  return DETECTOR_REGISTRY[detectorKey];
}

export {
  isBroadProjectQuestion,
  isPlanningNotImpactQuestion,
  isTimelineQuestion,
  isDecisionQuestion,
  isVaultAwareQuestion,
};
