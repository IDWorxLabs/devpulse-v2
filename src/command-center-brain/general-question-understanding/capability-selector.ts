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
