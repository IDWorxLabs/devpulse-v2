/**
 * Select existing engine capabilities for routing.
 */

import type {
  ContextNeed,
  QuestionDimension,
  ReasoningMode,
  SelectedCapability,
} from './general-question-types.js';
import { UNAVAILABLE_CAPABILITIES } from './general-question-types.js';
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

const CONTEXT_CAPABILITY_MAP: Partial<Record<ContextNeed, SelectedCapability>> = {
  PROJECT_PROFILE: 'PROJECT_UNDERSTANDING',
  PROJECT_FACTS: 'PROJECT_KNOWLEDGE_REASONING',
  RISK_FACTS: 'PROJECT_KNOWLEDGE_REASONING',
  MISSING_CAPABILITIES: 'PROJECT_KNOWLEDGE_REASONING',
  BLOCKERS: 'PROJECT_KNOWLEDGE_REASONING',
  SHARED_MEMORY: 'SHARED_MEMORY_RECALL',
  CROSS_SYSTEM_RELATIONSHIPS: 'CROSS_SYSTEM_AWARENESS',
  ROADMAP_STATE: 'ROADMAP_AWARENESS',
  OWNERSHIP_REGISTRY: 'SYSTEM_AWARENESS',
  RUNTIME_STATUS: 'PROJECT_KNOWLEDGE_REASONING',
  DEVELOPMENT_KNOWLEDGE: 'DEVELOPMENT_REASONING',
  DEBUG_CONTEXT: 'DEBUGGING_REASONING',
  TIMELINE_STATE: 'TIMELINE_INTELLIGENCE',
  DEPENDENCY_FACTS: 'DEPENDENCY_INTELLIGENCE',
  WORKSPACE_FACTS: 'WORKSPACE_INTELLIGENCE',
  HISTORY_FACTS: 'PROJECT_HISTORY_INTELLIGENCE',
  SUMMARIZATION_FACTS: 'PROJECT_SUMMARIZATION_ENGINE',
  PORTFOLIO_FACTS: 'PORTFOLIO_INTELLIGENCE',
  ACTION_VISIBILITY_FACTS: 'ACTION_VISIBILITY_ENGINE',
  REASONING_VISIBILITY_FACTS: 'REASONING_VISIBILITY_ENGINE',
  PROGRESS_INTELLIGENCE_FACTS: 'PROGRESS_INTELLIGENCE',
  FAILURE_VISIBILITY_FACTS: 'FAILURE_VISIBILITY_ENGINE',
  LEARNING_VISIBILITY_FACTS: 'LEARNING_VISIBILITY_ENGINE',
  EXECUTION_RUNTIME_FACTS: 'EXECUTION_RUNTIME_FOUNDATION',
  BUILD_TASK_RUNTIME_FACTS: 'BUILD_TASK_RUNTIME_FOUNDATION',
  CODE_GENERATION_RUNTIME_FACTS: 'CODE_GENERATION_RUNTIME_FOUNDATION',
  TESTING_RUNTIME_FACTS: 'TESTING_RUNTIME_FOUNDATION',
  AUTO_FIX_RUNTIME_FACTS: 'AUTO_FIX_RUNTIME_FOUNDATION',
  RUNTIME_VERIFICATION_FACTS: 'RUNTIME_VERIFICATION_LAYER',
  WORLD2_EXECUTION_ACTIVATION_FACTS: 'WORLD2_EXECUTION_ACTIVATION',
  WORLD2_BUILDER_PACKET_EXECUTION_FACTS: 'WORLD2_BUILDER_PACKET_EXECUTION',
  WORLD2_CONTROLLED_APPLY_RUNTIME_FACTS: 'WORLD2_CONTROLLED_APPLY_RUNTIME',
  WORLD2_ROLLBACK_RUNTIME_FACTS: 'WORLD2_ROLLBACK_RUNTIME',
  WORLD2_RECOVERY_RUNTIME_FACTS: 'WORLD2_RECOVERY_RUNTIME',
  WORLD2_COMPLETION_RUNTIME_FACTS: 'WORLD2_COMPLETION_RUNTIME',
  LIVE_PREVIEW_RUNTIME_FACTS: 'LIVE_PREVIEW_RUNTIME',
  PREVIEW_INTELLIGENCE_FACTS: 'PREVIEW_INTELLIGENCE',
  SELF_VISION_RUNTIME_FACTS: 'SELF_VISION_RUNTIME',
  UI_INSPECTION_ENGINE_FACTS: 'UI_INSPECTION_ENGINE',
  INTERACTION_TESTING_ENGINE_FACTS: 'INTERACTION_TESTING_ENGINE',
  VISUAL_VERIFICATION_ENGINE_FACTS: 'VISUAL_VERIFICATION_ENGINE',
  UNIFIED_VERIFICATION_LAB_RUNTIME_FACTS: 'UNIFIED_VERIFICATION_LAB_RUNTIME',
  VERIFICATION_REGISTRY_FACTS: 'VERIFICATION_REGISTRY',
  VERIFICATION_ORCHESTRATOR_FACTS: 'VERIFICATION_ORCHESTRATOR',
};

export interface CapabilitySelectionResult {
  selectedCapabilities: SelectedCapability[];
  unavailableCapabilities: SelectedCapability[];
  primaryCapability: SelectedCapability | null;
  secondaryCapabilities: SelectedCapability[];
  routingReason: string;
}

export function selectCapabilities(
  question: string,
  dimensions: QuestionDimension[],
  contextNeeds: ContextNeed[],
  reasoningModes: ReasoningMode[],
): CapabilitySelectionResult {
  const lower = question.toLowerCase();
  const selected = new Set<SelectedCapability>();
  const unavailable = new Set<SelectedCapability>();

  for (const need of contextNeeds) {
    const cap = CONTEXT_CAPABILITY_MAP[need];
    if (!cap) continue;
    if (UNAVAILABLE_CAPABILITIES.includes(cap)) {
      unavailable.add(cap);
    } else {
      selected.add(cap);
    }
  }

  if (isBroadProjectQuestion(question, dimensions)) {
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('PROJECT_UNDERSTANDING');
  }

  if (dimensions.includes('MEMORY') || lower.includes('remember') || lower.includes('recall')) {
    selected.add('SHARED_MEMORY_RECALL');
  }

  const crossSystemExplicit =
    (dimensions.includes('DEPENDENCY') || dimensions.includes('IMPACT')) &&
    !isPlanningNotImpactQuestion(question) &&
    (lower.includes('depend') ||
      lower.includes('impact') ||
      lower.includes('relationship') ||
      lower.includes('connected to'));

  if (crossSystemExplicit) {
    selected.add('CROSS_SYSTEM_AWARENESS');
  }

  if (dimensions.includes('ROADMAP') || lower.includes('roadmap') || lower.includes('phase')) {
    selected.add('ROADMAP_AWARENESS');
  }

  if (isVaultAwareQuestion(question)) {
    selected.add('PROJECT_VAULT_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('PROJECT_UNDERSTANDING');
  }

  if (isDependencyIntelligenceQuestion(question)) {
    selected.add('DEPENDENCY_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
  }

  if (isWorkspaceIntelligenceQuestion(question)) {
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('PROJECT_UNDERSTANDING');
  }

  if (isProjectHistoryIntelligenceQuestion(question)) {
    selected.add('PROJECT_HISTORY_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('PROJECT_UNDERSTANDING');
  }

  if (isPortfolioIntelligenceQuestion(question)) {
    selected.add('PORTFOLIO_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('PROJECT_UNDERSTANDING');
    selected.add('WORKSPACE_INTELLIGENCE');
  }

  if (isActionVisibilityQuestion(question)) {
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
  }

  if (isReasoningVisibilityQuestion(question)) {
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
  }

  if (isVerificationOrchestratorQuestion(question)) {
    selected.add('VERIFICATION_ORCHESTRATOR');
    selected.add('VERIFICATION_REGISTRY');
    selected.add('UNIFIED_VERIFICATION_LAB_RUNTIME');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (isVerificationRegistryQuestion(question)) {
    selected.add('VERIFICATION_REGISTRY');
    selected.add('UNIFIED_VERIFICATION_LAB_RUNTIME');
    selected.add('VISUAL_VERIFICATION_ENGINE');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (isUvlRuntimeQuestion(question)) {
    selected.add('UNIFIED_VERIFICATION_LAB_RUNTIME');
    selected.add('VISUAL_VERIFICATION_ENGINE');
    selected.add('INTERACTION_TESTING_ENGINE');
    selected.add('UI_INSPECTION_ENGINE');
    selected.add('SELF_VISION_RUNTIME');
    selected.add('LIVE_PREVIEW_RUNTIME');
    selected.add('PREVIEW_INTELLIGENCE');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (isVisualVerificationQuestion(question)) {
    selected.add('VISUAL_VERIFICATION_ENGINE');
    selected.add('INTERACTION_TESTING_ENGINE');
    selected.add('UI_INSPECTION_ENGINE');
    selected.add('SELF_VISION_RUNTIME');
    selected.add('LIVE_PREVIEW_RUNTIME');
    selected.add('PREVIEW_INTELLIGENCE');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (isInteractionTestingQuestion(question)) {
    selected.add('INTERACTION_TESTING_ENGINE');
    selected.add('UI_INSPECTION_ENGINE');
    selected.add('SELF_VISION_RUNTIME');
    selected.add('LIVE_PREVIEW_RUNTIME');
    selected.add('PREVIEW_INTELLIGENCE');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (isUiInspectionQuestion(question)) {
    selected.add('UI_INSPECTION_ENGINE');
    selected.add('SELF_VISION_RUNTIME');
    selected.add('LIVE_PREVIEW_RUNTIME');
    selected.add('PREVIEW_INTELLIGENCE');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (isSelfVisionRuntimeQuestion(question)) {
    selected.add('SELF_VISION_RUNTIME');
    selected.add('LIVE_PREVIEW_RUNTIME');
    selected.add('PREVIEW_INTELLIGENCE');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (isPreviewIntelligenceQuestion(question)) {
    selected.add('PREVIEW_INTELLIGENCE');
    selected.add('LIVE_PREVIEW_RUNTIME');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (isLivePreviewQuestion(question)) {
    selected.add('LIVE_PREVIEW_RUNTIME');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (isWorld2CompletionQuestion(question)) {
    selected.add('WORLD2_COMPLETION_RUNTIME');
    selected.add('WORLD2_RECOVERY_RUNTIME');
    selected.add('WORLD2_ROLLBACK_RUNTIME');
    selected.add('WORLD2_CONTROLLED_APPLY_RUNTIME');
    selected.add('WORLD2_BUILDER_PACKET_EXECUTION');
    selected.add('WORLD2_EXECUTION_ACTIVATION');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
  }

  if (isWorld2RecoveryQuestion(question)) {
    selected.add('WORLD2_RECOVERY_RUNTIME');
    selected.add('WORLD2_ROLLBACK_RUNTIME');
    selected.add('WORLD2_CONTROLLED_APPLY_RUNTIME');
    selected.add('WORLD2_BUILDER_PACKET_EXECUTION');
    selected.add('WORLD2_EXECUTION_ACTIVATION');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
  }

  if (isWorld2RollbackQuestion(question)) {
    selected.add('WORLD2_ROLLBACK_RUNTIME');
    selected.add('WORLD2_CONTROLLED_APPLY_RUNTIME');
    selected.add('WORLD2_BUILDER_PACKET_EXECUTION');
    selected.add('WORLD2_EXECUTION_ACTIVATION');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
  }

  if (isWorld2ControlledApplyQuestion(question)) {
    selected.add('WORLD2_CONTROLLED_APPLY_RUNTIME');
    selected.add('WORLD2_BUILDER_PACKET_EXECUTION');
    selected.add('WORLD2_EXECUTION_ACTIVATION');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
  }

  if (isWorld2BuilderPacketExecutionQuestion(question)) {
    selected.add('WORLD2_BUILDER_PACKET_EXECUTION');
    selected.add('WORLD2_EXECUTION_ACTIVATION');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('BUILD_TASK_RUNTIME_FOUNDATION');
    selected.add('CODE_GENERATION_RUNTIME_FOUNDATION');
    selected.add('TESTING_RUNTIME_FOUNDATION');
    selected.add('EXECUTION_RUNTIME_FOUNDATION');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
  }

  if (isWorld2ExecutionActivationQuestion(question)) {
    selected.add('WORLD2_EXECUTION_ACTIVATION');
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('AUTO_FIX_RUNTIME_FOUNDATION');
    selected.add('TESTING_RUNTIME_FOUNDATION');
    selected.add('CODE_GENERATION_RUNTIME_FOUNDATION');
    selected.add('BUILD_TASK_RUNTIME_FOUNDATION');
    selected.add('EXECUTION_RUNTIME_FOUNDATION');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('LEARNING_VISIBILITY_ENGINE');
    selected.add('DEPENDENCY_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
  }

  if (isRuntimeVerificationLayerQuestion(question)) {
    selected.add('RUNTIME_VERIFICATION_LAYER');
    selected.add('AUTO_FIX_RUNTIME_FOUNDATION');
    selected.add('TESTING_RUNTIME_FOUNDATION');
    selected.add('CODE_GENERATION_RUNTIME_FOUNDATION');
    selected.add('BUILD_TASK_RUNTIME_FOUNDATION');
    selected.add('EXECUTION_RUNTIME_FOUNDATION');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('LEARNING_VISIBILITY_ENGINE');
    selected.add('DEPENDENCY_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
  }

  if (isAutoFixRuntimeFoundationQuestion(question)) {
    selected.add('AUTO_FIX_RUNTIME_FOUNDATION');
    selected.add('TESTING_RUNTIME_FOUNDATION');
    selected.add('CODE_GENERATION_RUNTIME_FOUNDATION');
    selected.add('BUILD_TASK_RUNTIME_FOUNDATION');
    selected.add('EXECUTION_RUNTIME_FOUNDATION');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('LEARNING_VISIBILITY_ENGINE');
    selected.add('DEPENDENCY_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
  }

  if (isTestingRuntimeFoundationQuestion(question)) {
    selected.add('TESTING_RUNTIME_FOUNDATION');
    selected.add('CODE_GENERATION_RUNTIME_FOUNDATION');
    selected.add('BUILD_TASK_RUNTIME_FOUNDATION');
    selected.add('EXECUTION_RUNTIME_FOUNDATION');
    selected.add('DEPENDENCY_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('LEARNING_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
  }

  if (isCodeGenerationRuntimeFoundationQuestion(question)) {
    selected.add('CODE_GENERATION_RUNTIME_FOUNDATION');
    selected.add('BUILD_TASK_RUNTIME_FOUNDATION');
    selected.add('EXECUTION_RUNTIME_FOUNDATION');
    selected.add('DEPENDENCY_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('LEARNING_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
  }

  if (isBuildTaskRuntimeFoundationQuestion(question)) {
    selected.add('BUILD_TASK_RUNTIME_FOUNDATION');
    selected.add('EXECUTION_RUNTIME_FOUNDATION');
    selected.add('DEPENDENCY_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('LEARNING_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
  }

  if (isExecutionRuntimeFoundationQuestion(question)) {
    selected.add('EXECUTION_RUNTIME_FOUNDATION');
    selected.add('DEPENDENCY_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('WORKSPACE_INTELLIGENCE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('LEARNING_VISIBILITY_ENGINE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('REASONING_VISIBILITY_ENGINE');
  }

  if (isLearningVisibilityQuestion(question)) {
    selected.add('LEARNING_VISIBILITY_ENGINE');
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('REASONING_VISIBILITY_ENGINE');
    selected.add('ACTION_VISIBILITY_ENGINE');
    selected.add('PROJECT_HISTORY_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (isFailureVisibilityQuestion(question)) {
    selected.add('FAILURE_VISIBILITY_ENGINE');
    selected.add('DEPENDENCY_INTELLIGENCE');
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('UNIFIED_DECISION_LAYER');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
  }

  if (isProgressIntelligenceQuestion(question)) {
    selected.add('PROGRESS_INTELLIGENCE');
    selected.add('PROJECT_HISTORY_INTELLIGENCE');
    selected.add('PORTFOLIO_INTELLIGENCE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
  }

  if (isProjectSummarizationQuestion(question)) {
    selected.add('PROJECT_SUMMARIZATION_ENGINE');
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('PROJECT_UNDERSTANDING');
  }

  if (isDecisionQuestion(question)) {
    selected.add('UNIFIED_DECISION_LAYER');
  }

  if (
    isTimelineQuestion(question) &&
    !isProjectHistoryIntelligenceQuestion(question) &&
    !isPlanningNotImpactQuestion(question) &&
    !isDecisionQuestion(question)
  ) {
    selected.add('TIMELINE_INTELLIGENCE');
  }

  if (dimensions.includes('SYSTEM') && !isBroadProjectQuestion(question, dimensions)) {
    selected.add('SYSTEM_AWARENESS');
  }

  if (dimensions.includes('EXECUTION') && !unavailable.has('EXECUTION_REASONING')) {
    unavailable.add('EXECUTION_REASONING');
  }

  if (reasoningModes.includes('RISK_ASSESSMENT') || reasoningModes.includes('PRIORITIZATION')) {
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    if (isDecisionQuestion(question)) {
      selected.add('UNIFIED_DECISION_LAYER');
    }
  }

  if (reasoningModes.includes('PLANNING')) {
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    if (isDecisionQuestion(question)) {
      selected.add('UNIFIED_DECISION_LAYER');
    }
  }

  const selectedList = [...selected];
  let primary: SelectedCapability | null = null;
  let secondary: SelectedCapability[] = [];

  if (isPortfolioIntelligenceQuestion(question)) {
    primary = 'PORTFOLIO_INTELLIGENCE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Portfolio-oriented question — PORTFOLIO_INTELLIGENCE aggregates multi-project health, risk, priority, and comparison across all Phase 12 sources.',
    };
  }

  const lowerQuestion = question.toLowerCase();

  if (isVerificationOrchestratorQuestion(question)) {
    primary = 'VERIFICATION_ORCHESTRATOR';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Verification orchestrator question — VERIFICATION_ORCHESTRATOR coordinates execution planning, scheduling, and readiness; no verification execution, evidence generation, or auto-fix.',
    };
  }

  if (isVerificationRegistryQuestion(question)) {
    primary = 'VERIFICATION_REGISTRY';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Verification registry question — VERIFICATION_REGISTRY defines targets, ownership, dependencies, and requirements; no verification execution, orchestration, or auto-fix.',
    };
  }

  if (isUvlRuntimeQuestion(question)) {
    primary = 'UNIFIED_VERIFICATION_LAB_RUNTIME';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'UVL runtime question — UNIFIED_VERIFICATION_LAB_RUNTIME registers providers and manages verification sessions; no verification execution, evidence generation, or auto-fix.',
    };
  }

  if (isVisualVerificationQuestion(question)) {
    primary = 'VISUAL_VERIFICATION_ENGINE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Visual verification question — VISUAL_VERIFICATION_ENGINE evaluates visual outcomes and produces verification evidence; no UI modification, interaction execution, or repairs.',
    };
  }

  if (isInteractionTestingQuestion(question)) {
    primary = 'INTERACTION_TESTING_ENGINE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Interaction testing question — INTERACTION_TESTING_ENGINE builds plans, executes simulations, and records outcomes; no correctness verdicts or quality scoring.',
    };
  }

  if (isUiInspectionQuestion(question)) {
    primary = 'UI_INSPECTION_ENGINE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'UI inspection question — UI_INSPECTION_ENGINE inspects layout, navigation, loading, and responsive structures; no clicking, interaction testing, or visual verification.',
    };
  }

  if (isSelfVisionRuntimeQuestion(question)) {
    primary = 'SELF_VISION_RUNTIME';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Self vision runtime question — SELF_VISION_RUNTIME manages visual observation sessions, capture plans, and observation targets; no screenshot analysis or interaction testing.',
    };
  }

  if (isPreviewIntelligenceQuestion(question)) {
    primary = 'PREVIEW_INTELLIGENCE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Preview intelligence question — PREVIEW_INTELLIGENCE reasons about preview readiness, capabilities, limitations, and future observation plans; no browser launch or visual execution.',
    };
  }

  if (isLivePreviewQuestion(question)) {
    primary = 'LIVE_PREVIEW_RUNTIME';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Live preview question — LIVE_PREVIEW_RUNTIME represents and manages preview targets and sessions with capability tracking; no browser launch or UI inspection.',
    };
  }

  if (isWorld2CompletionQuestion(question)) {
    primary = 'WORLD2_COMPLETION_RUNTIME';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Completion question — WORLD2_COMPLETION_RUNTIME prepares completion safety plans from recovery/rollback/apply context with criteria, evidence, and verification requirements; completionAllowed remains false.',
    };
  }

  if (isWorld2RecoveryQuestion(question)) {
    primary = 'WORLD2_RECOVERY_RUNTIME';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Recovery question — WORLD2_RECOVERY_RUNTIME prepares recovery safety plans from rollback plans and failure context with strategy selection, escalation evaluation, and three-failure rule; recoveryAllowed remains false.',
    };
  }

  if (isWorld2RollbackQuestion(question)) {
    primary = 'WORLD2_ROLLBACK_RUNTIME';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Rollback question — WORLD2_ROLLBACK_RUNTIME prepares rollback safety plans from controlled apply plans with snapshot requirements and gate evaluation; rollbackAllowed remains false.',
    };
  }

  if (isWorld2ControlledApplyQuestion(question)) {
    primary = 'WORLD2_CONTROLLED_APPLY_RUNTIME';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Controlled apply question — WORLD2_CONTROLLED_APPLY_RUNTIME converts execution packets into governed apply plans with gate evaluation, risk classification, and approval recording; applyAllowed remains false.',
    };
  }

  if (isWorld2BuilderPacketExecutionQuestion(question)) {
    primary = 'WORLD2_BUILDER_PACKET_EXECUTION';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Builder packet execution question — WORLD2_BUILDER_PACKET_EXECUTION prepares governed execution packets from builder packets with validation, risk classification, and approval recording without apply operations.',
    };
  }

  if (isWorld2ExecutionActivationQuestion(question)) {
    primary = 'WORLD2_EXECUTION_ACTIVATION';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'World 2 execution activation question — WORLD2_EXECUTION_ACTIVATION evaluates governed, isolated, simulation-first activation plans with workspace isolation, governance gates, and Phase 14 runtime chain linkage without performing real execution.',
    };
  }

  if (isRuntimeVerificationLayerQuestion(question)) {
    primary = 'RUNTIME_VERIFICATION_LAYER';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Runtime verification question — RUNTIME_VERIFICATION_LAYER verifies execution, build, generation, testing, and auto-fix plans with evidence, gaps, trust assessment, and score without executing runtime actions.',
    };
  }

  if (isAutoFixRuntimeFoundationQuestion(question)) {
    primary = 'AUTO_FIX_RUNTIME_FOUNDATION';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Auto-fix planning question — AUTO_FIX_RUNTIME_FOUNDATION plans fix proposals, alternatives, rollback, verification, and simulated results linked to failures, testing, code generation, build tasks, and execution packets without applying fixes.',
    };
  }

  if (isTestingRuntimeFoundationQuestion(question)) {
    primary = 'TESTING_RUNTIME_FOUNDATION';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Testing planning question — TESTING_RUNTIME_FOUNDATION plans test cases, pass/fail criteria, evidence requirements, simulated results, and risks linked to code generation, build tasks, and execution packets without running tests.',
    };
  }

  if (isCodeGenerationRuntimeFoundationQuestion(question)) {
    primary = 'CODE_GENERATION_RUNTIME_FOUNDATION';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Code generation planning question — CODE_GENERATION_RUNTIME_FOUNDATION proposes artifacts, file changes, strategy, risks, and validation linked to build tasks and execution packets without writing project files.',
    };
  }

  if (isBuildTaskRuntimeFoundationQuestion(question)) {
    primary = 'BUILD_TASK_RUNTIME_FOUNDATION';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Build task planning question — BUILD_TASK_RUNTIME_FOUNDATION plans steps, dependencies, safety gates, and verification linked to execution packets without performing execution.',
    };
  }

  if (isExecutionRuntimeFoundationQuestion(question)) {
    primary = 'EXECUTION_RUNTIME_FOUNDATION';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Execution readiness question — EXECUTION_RUNTIME_FOUNDATION evaluates readiness, blockers, dependencies, and safety boundaries without performing execution.',
    };
  }

  if (isFailureVisibilityQuestion(question) && lowerQuestion.includes('dependency chains are impacted')) {
    primary = 'FAILURE_VISIBILITY_ENGINE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Failure impact question — FAILURE_VISIBILITY_ENGINE shows impacted dependency chains from visible failures without auto-fix.',
    };
  }

  if (isDependencyIntelligenceQuestion(question) && lowerQuestion.includes('capabilities are blocked')) {
    primary = 'DEPENDENCY_INTELLIGENCE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Blocked capabilities question — DEPENDENCY_INTELLIGENCE owns dependency-graph blocked capability advisory.',
    };
  }

  if (isLearningVisibilityQuestion(question)) {
    primary = 'LEARNING_VISIBILITY_ENGINE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Learning question — LEARNING_VISIBILITY_ENGINE shows observed patterns, recurring blockers/failures/recommendations, and memory lessons without self-learning or model modification.',
    };
  }

  if (isFailureVisibilityQuestion(question)) {
    primary = 'FAILURE_VISIBILITY_ENGINE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Failure question — FAILURE_VISIBILITY_ENGINE shows failures, severity, impact, and advisory next steps without auto-fix or execution.',
    };
  }

  if (isProgressIntelligenceQuestion(question)) {
    primary = 'PROGRESS_INTELLIGENCE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Progress question — PROGRESS_INTELLIGENCE shows completion, milestones, blockers, and portfolio progress without execution.',
    };
  }

  if (isReasoningVisibilityQuestion(question)) {
    primary = 'REASONING_VISIBILITY_ENGINE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Reasoning visibility question — REASONING_VISIBILITY_ENGINE explains evidence, sources, blockers, risks, and confidence basis without chain-of-thought.',
    };
  }

  if (isActionVisibilityQuestion(question)) {
    primary = 'ACTION_VISIBILITY_ENGINE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Action visibility question — ACTION_VISIBILITY_ENGINE explains considered actions, status, priority, and source without execution.',
    };
  }

  if (isDecisionQuestion(question)) {
    primary = 'UNIFIED_DECISION_LAYER';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Decision-oriented question — route through Unified Decision Layer for advisory build/defer/block/priority recommendations.',
    };
  }

  if (isProjectSummarizationQuestion(question)) {
    primary = 'PROJECT_SUMMARIZATION_ENGINE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Summarization-oriented question — PROJECT_SUMMARIZATION_ENGINE compresses all intelligence sources into unified summaries.',
    };
  }

  if (isProjectHistoryIntelligenceQuestion(question)) {
    primary = 'PROJECT_HISTORY_INTELLIGENCE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'History-oriented question — PROJECT_HISTORY_INTELLIGENCE is answer authority; Timeline Intelligence owns current phase separately.',
    };
  }

  if (isWorkspaceIntelligenceQuestion(question)) {
    primary = 'WORKSPACE_INTELLIGENCE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Workspace-oriented question — WORKSPACE_INTELLIGENCE is answer authority; Project Understanding supplements with enriched facts.',
    };
  }

  if (isDependencyIntelligenceQuestion(question)) {
    primary = 'DEPENDENCY_INTELLIGENCE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Dependency-oriented question — DEPENDENCY_INTELLIGENCE is answer authority; Unified Decision Layer supplements when decision signals also match.',
    };
  }

  if (isVaultAwareQuestion(question)) {
    primary = 'PROJECT_KNOWLEDGE_REASONING';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Vault-aware project question — PROJECT_VAULT_INTELLIGENCE supplements Project Knowledge Reasoning; 11.4 remains answer authority.',
    };
  }

  if (isTimelineQuestion(question) && !isPlanningNotImpactQuestion(question)) {
    primary = 'TIMELINE_INTELLIGENCE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Timeline-oriented question — route through Timeline Intelligence for past/present/future understanding.',
    };
  }

  if (isBroadProjectQuestion(question, dimensions)) {
    primary = 'PROJECT_KNOWLEDGE_REASONING';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Broad project understanding question — route through Project Knowledge Reasoning with available facts.',
    };
  }

  if (selected.has('SHARED_MEMORY_RECALL') && dimensions.includes('MEMORY')) {
    primary = 'SHARED_MEMORY_RECALL';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason: 'Memory recall question — route through Shared Memory layer.',
    };
  }

  if (selected.has('CROSS_SYSTEM_AWARENESS') && crossSystemExplicit) {
    primary = 'CROSS_SYSTEM_AWARENESS';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason: 'Cross-system relationship/dependency/impact — route through Cross-System Awareness.',
    };
  }

  if (selected.has('PROJECT_KNOWLEDGE_REASONING')) {
    primary = 'PROJECT_KNOWLEDGE_REASONING';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason: 'Project facts can answer this question — Project Knowledge Reasoning primary.',
    };
  }

  if (selected.has('ROADMAP_AWARENESS')) {
    primary = 'ROADMAP_AWARENESS';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason: 'Roadmap-oriented question — combine roadmap awareness with project facts.',
    };
  }

  if (selectedList.length > 0) {
    primary = selectedList[0] ?? null;
    secondary = selectedList.slice(1);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason: 'Selected capabilities from context needs and dimensions.',
    };
  }

  return {
    selectedCapabilities: [],
    unavailableCapabilities: [...unavailable],
    primaryCapability: null,
    secondaryCapabilities: [],
    routingReason: 'No capability selected — generic fallback may apply if no facts apply.',
  };
}

export function computeRoutingConfidence(
  dimensions: QuestionDimension[],
  selectedCapabilities: SelectedCapability[],
): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (dimensions.includes('UNKNOWN') && selectedCapabilities.length === 0) return 'LOW';
  if (selectedCapabilities.includes('PROJECT_KNOWLEDGE_REASONING')) return 'HIGH';
  if (selectedCapabilities.length >= 2) return 'MEDIUM';
  if (selectedCapabilities.length === 1) return 'MEDIUM';
  return 'LOW';
}
