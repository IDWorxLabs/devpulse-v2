/**
 * Operator Feed stage mapper — maps routing capabilities to visibility stages.
 */

import type { SelectedCapability } from '../command-center-brain/general-question-understanding/general-question-types.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

const CAPABILITY_STAGE_MAP: Partial<Record<SelectedCapability, OperatorFeedStage[]>> = {
  UNIFIED_DECISION_LAYER: [
    'Loading Context',
    'Reading Dependency Intelligence',
    'Evaluating Risks',
    'Generating Recommendation',
    'Response Ready',
  ],
  PORTFOLIO_INTELLIGENCE: [
    'Loading Portfolio',
    'Reading Project Inventory',
    'Computing Health',
    'Generating Portfolio Summary',
    'Response Ready',
  ],
  PROJECT_SUMMARIZATION_ENGINE: [
    'Loading Context',
    'Reading Summaries',
    'Generating Response',
    'Response Ready',
  ],
  PROJECT_HISTORY_INTELLIGENCE: [
    'Loading Context',
    'Reading History Intelligence',
    'Generating Response',
    'Response Ready',
  ],
  WORKSPACE_INTELLIGENCE: [
    'Loading Context',
    'Reading Workspace Intelligence',
    'Generating Response',
    'Response Ready',
  ],
  DEPENDENCY_INTELLIGENCE: [
    'Loading Context',
    'Reading Dependency Intelligence',
    'Generating Response',
    'Response Ready',
  ],
  PROJECT_VAULT_INTELLIGENCE: [
    'Loading Context',
    'Reading Vault Intelligence',
    'Reading Vault Facts',
    'Generating Response',
    'Response Ready',
  ],
  PROJECT_KNOWLEDGE_REASONING: [
    'Loading Context',
    'Reading Project Facts',
    'Reading Vault Facts',
    'Generating Project Answer',
    'Response Ready',
  ],
  PROJECT_UNDERSTANDING: [
    'Loading Context',
    'Reading Project Understanding',
    'Reading Project Facts',
    'Generating Project Answer',
    'Response Ready',
  ],
  TIMELINE_INTELLIGENCE: [
    'Loading Context',
    'Reading History Intelligence',
    'Generating Response',
    'Response Ready',
  ],
  SHARED_MEMORY_RECALL: [
    'Loading Context',
    'Reading Shared Memory',
    'Generating Response',
    'Response Ready',
  ],
  ACTION_VISIBILITY_ENGINE: [
    'Action Identified',
    'Action Evaluated',
    'Action Recommended',
    'Response Ready',
  ],
  REASONING_VISIBILITY_ENGINE: [
    'Reasoning Started',
    'Evidence Collected',
    'Risks Evaluated',
    'Blockers Evaluated',
    'Confidence Calculated',
    'Reasoning Ready',
    'Response Ready',
  ],
  PROGRESS_INTELLIGENCE: [
    'Progress Evaluation Started',
    'Milestones Evaluated',
    'Blockers Evaluated',
    'Progress Calculated',
    'Progress Ready',
    'Response Ready',
  ],
  FAILURE_VISIBILITY_ENGINE: [
    'Failure Detected',
    'Failure Evaluated',
    'Severity Calculated',
    'Impact Evaluated',
    'Next Step Generated',
    'Failure Ready',
    'Response Ready',
  ],
  LEARNING_VISIBILITY_ENGINE: [
    'Learning Analysis Started',
    'Patterns Evaluated',
    'Failures Evaluated',
    'Recommendations Evaluated',
    'Learning Ready',
    'Response Ready',
  ],
  EXECUTION_RUNTIME_FOUNDATION: [
    'Execution Evaluation Started',
    'Readiness Evaluation',
    'Dependency Check',
    'Safety Check',
    'Execution Readiness Ready',
    'Response Ready',
  ],
  BUILD_TASK_RUNTIME_FOUNDATION: [
    'Build Task Planning Started',
    'Task Request Parsed',
    'Dependencies Resolved',
    'Safety Gates Evaluated',
    'Verification Plan Created',
    'Build Task Plan Ready',
    'Response Ready',
  ],
  CODE_GENERATION_RUNTIME_FOUNDATION: [
    'Code Generation Planning Started',
    'Generation Request Parsed',
    'Artifact Proposals Created',
    'Change Proposals Created',
    'Generation Risks Evaluated',
    'Validation Plan Created',
    'Code Generation Plan Ready',
    'Response Ready',
  ],
  TESTING_RUNTIME_FOUNDATION: [
    'Testing Planning Started',
    'Testing Request Parsed',
    'Test Cases Created',
    'Evidence Requirements Created',
    'Test Risks Evaluated',
    'Simulated Results Created',
    'Testing Plan Ready',
    'Response Ready',
  ],
  AUTO_FIX_RUNTIME_FOUNDATION: [
    'Auto Fix Planning Started',
    'Failure Analysis Complete',
    'Fix Proposals Created',
    'Alternatives Evaluated',
    'Risks Evaluated',
    'Rollback Plan Created',
    'Verification Plan Created',
    'Auto Fix Plan Ready',
    'Response Ready',
  ],
  RUNTIME_VERIFICATION_LAYER: [
    'Runtime Verification Started',
    'Verification Evidence Collected',
    'Verification Gaps Evaluated',
    'Trust Assessment Calculated',
    'Verification Score Calculated',
    'Runtime Verification Report Ready',
    'Response Ready',
  ],
};

const DEFAULT_STAGES: OperatorFeedStage[] = [
  'Loading Context',
  'Reading Project Understanding',
  'Generating Response',
  'Response Ready',
];

export function mapCapabilityToFeedStages(
  primaryCapability: SelectedCapability | null,
  supplementalCapabilities: SelectedCapability[] = [],
): OperatorFeedStage[] {
  if (!primaryCapability) return [...DEFAULT_STAGES];

  const base = CAPABILITY_STAGE_MAP[primaryCapability] ?? DEFAULT_STAGES;
  const stages = new Set<OperatorFeedStage>(base);

  if (supplementalCapabilities.includes('SHARED_MEMORY_RECALL')) {
    stages.add('Reading Shared Memory');
  }
  if (supplementalCapabilities.includes('PROJECT_VAULT_INTELLIGENCE')) {
    stages.add('Reading Vault Intelligence');
  }
  if (supplementalCapabilities.includes('DEPENDENCY_INTELLIGENCE')) {
    stages.add('Reading Dependency Intelligence');
  }

  const ordered = [...base];
  for (const stage of stages) {
    if (!ordered.includes(stage)) ordered.splice(ordered.length - 1, 0, stage);
  }

  if (!ordered.includes('Response Ready')) ordered.push('Response Ready');
  return ordered;
}

export function sourceSystemForCapability(capability: SelectedCapability | null): string {
  if (!capability) return 'command_center_brain';
  const map: Partial<Record<SelectedCapability, string>> = {
    UNIFIED_DECISION_LAYER: 'unified_decision_layer',
    PORTFOLIO_INTELLIGENCE: 'portfolio_intelligence',
    PROJECT_SUMMARIZATION_ENGINE: 'project_summarization_engine',
    PROJECT_HISTORY_INTELLIGENCE: 'project_history_intelligence',
    WORKSPACE_INTELLIGENCE: 'workspace_intelligence',
    DEPENDENCY_INTELLIGENCE: 'dependency_intelligence',
    PROJECT_VAULT_INTELLIGENCE: 'project_vault_intelligence',
    PROJECT_KNOWLEDGE_REASONING: 'project_understanding_engine',
    PROJECT_UNDERSTANDING: 'project_understanding_engine',
    TIMELINE_INTELLIGENCE: 'timeline_intelligence',
    SHARED_MEMORY_RECALL: 'shared_memory_layer',
    ACTION_VISIBILITY_ENGINE: 'action_visibility_engine',
    REASONING_VISIBILITY_ENGINE: 'reasoning_visibility_engine',
    PROGRESS_INTELLIGENCE: 'progress_intelligence',
    FAILURE_VISIBILITY_ENGINE: 'failure_visibility_engine',
    LEARNING_VISIBILITY_ENGINE: 'learning_visibility_engine',
    EXECUTION_RUNTIME_FOUNDATION: 'execution_runtime',
    BUILD_TASK_RUNTIME_FOUNDATION: 'build_task_runtime',
    CODE_GENERATION_RUNTIME_FOUNDATION: 'code_generation_runtime',
    TESTING_RUNTIME_FOUNDATION: 'testing_runtime',
    AUTO_FIX_RUNTIME_FOUNDATION: 'auto_fix_runtime',
    RUNTIME_VERIFICATION_LAYER: 'runtime_verification_layer',
  };
  return map[capability] ?? 'command_center_brain';
}

export function sourceSystemsForStages(stages: OperatorFeedStage[]): string[] {
  const systems = new Set<string>(['operator_feed']);
  for (const stage of stages) {
    if (stage.includes('Memory')) systems.add('shared_memory_layer');
    if (stage.includes('Project Understanding') || stage.includes('Project Facts')) {
      systems.add('project_understanding_engine');
    }
    if (stage.includes('Vault')) systems.add('project_vault_intelligence');
    if (stage.includes('Dependency')) systems.add('dependency_intelligence');
    if (stage.includes('Workspace')) systems.add('workspace_intelligence');
    if (stage.includes('History')) systems.add('project_history_intelligence');
    if (stage.includes('Summaries')) systems.add('project_summarization_engine');
    if (stage.includes('Portfolio') || stage.includes('Inventory') || stage.includes('Computing Health')) {
      systems.add('portfolio_intelligence');
    }
    if (stage.includes('Recommendation') || stage.includes('Evaluating Risks')) {
      systems.add('unified_decision_layer');
    }
    if (stage.includes('Action')) {
      systems.add('action_visibility_engine');
    }
    if (stage.includes('Reasoning') || stage.includes('Evidence') || stage.includes('Confidence')) {
      systems.add('reasoning_visibility_engine');
    }
    if (stage.includes('Progress') || stage.includes('Milestones Evaluated')) {
      systems.add('progress_intelligence');
    }
    if (stage.includes('Failure') || stage.includes('Severity Calculated') || stage.includes('Next Step Generated')) {
      systems.add('failure_visibility_engine');
    }
    if (stage.includes('Learning') || stage.includes('Patterns Evaluated') || stage.includes('Recommendations Evaluated')) {
      systems.add('learning_visibility_engine');
    }
  }
  systems.add('command_center_brain');
  return [...systems];
}
