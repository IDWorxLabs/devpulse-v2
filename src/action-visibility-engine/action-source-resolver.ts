/**
 * Action source resolver — maps queries and capabilities to originating systems.
 */

import type { SelectedCapability } from '../command-center-brain/general-question-understanding/general-question-types.js';
import { isActionVisibilityQuestion } from './action-visibility-types.js';

const CAPABILITY_SOURCE_MAP: Partial<Record<SelectedCapability, string>> = {
  UNIFIED_DECISION_LAYER: 'unified_decision_layer',
  DEPENDENCY_INTELLIGENCE: 'dependency_intelligence',
  WORKSPACE_INTELLIGENCE: 'workspace_intelligence',
  PROJECT_HISTORY_INTELLIGENCE: 'project_history_intelligence',
  PORTFOLIO_INTELLIGENCE: 'portfolio_intelligence',
  PROJECT_SUMMARIZATION_ENGINE: 'project_summarization_engine',
  PROJECT_KNOWLEDGE_REASONING: 'project_understanding_engine',
  PROJECT_UNDERSTANDING: 'project_understanding_engine',
};

export function resolveActionSourceFromCapability(capability: SelectedCapability | null): string {
  if (!capability) return 'unified_decision_layer';
  return CAPABILITY_SOURCE_MAP[capability] ?? 'unified_decision_layer';
}

export function resolveActionSourceFromQuery(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes('dependency')) return 'dependency_intelligence';
  if (lower.includes('workspace')) return 'workspace_intelligence';
  if (lower.includes('history') || lower.includes('changed')) return 'project_history_intelligence';
  if (lower.includes('portfolio') || lower.includes('projects')) return 'portfolio_intelligence';
  if (lower.includes('summar')) return 'project_summarization_engine';
  if (lower.includes('project') && !lower.includes('portfolio')) return 'project_understanding_engine';
  if (isActionVisibilityQuestion(query)) return 'unified_decision_layer';
  return 'unified_decision_layer';
}

export function displaySourceSystem(source: string): string {
  return source.replace(/_/g, ' ');
}
