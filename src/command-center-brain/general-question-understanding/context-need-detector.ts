/**
 * Determine context needs from dimensions and question signals.
 */

import type { ContextNeed, QuestionDimension } from './general-question-types.js';

const DIMENSION_CONTEXT_MAP: Partial<Record<QuestionDimension, ContextNeed[]>> = {
  PROJECT: ['PROJECT_PROFILE', 'PROJECT_FACTS', 'RISK_FACTS', 'MISSING_CAPABILITIES', 'BLOCKERS'],
  SYSTEM: ['OWNERSHIP_REGISTRY', 'RUNTIME_STATUS'],
  ROADMAP: ['ROADMAP_STATE', 'PROJECT_FACTS', 'TIMELINE_STATE'],
  RISK: ['RISK_FACTS', 'MISSING_CAPABILITIES', 'BLOCKERS'],
  DEPENDENCY: ['CROSS_SYSTEM_RELATIONSHIPS', 'PROJECT_FACTS'],
  IMPACT: ['CROSS_SYSTEM_RELATIONSHIPS', 'PROJECT_FACTS'],
  MEMORY: ['SHARED_MEMORY'],
  ARCHITECTURE: ['PROJECT_FACTS', 'OWNERSHIP_REGISTRY', 'CROSS_SYSTEM_RELATIONSHIPS'],
  PLANNING: ['PROJECT_FACTS', 'ROADMAP_STATE', 'RISK_FACTS', 'MISSING_CAPABILITIES'],
  DEVELOPMENT: ['DEVELOPMENT_KNOWLEDGE', 'PROJECT_FACTS'],
  DEBUGGING: ['DEBUG_CONTEXT', 'PROJECT_FACTS'],
  EXECUTION: ['RUNTIME_STATUS', 'PROJECT_FACTS', 'ROADMAP_STATE'],
};

const QUESTION_CONTEXT_SIGNALS: Array<[readonly string[], ContextNeed]> = [
  [['weakness', 'weak at', 'strong at', 'holding back'], 'RISK_FACTS'],
  [['missing capability', 'gap', 'not built yet'], 'MISSING_CAPABILITIES'],
  [['blocker', 'holding back'], 'BLOCKERS'],
  [['execution not connected', 'runtime', 'not connected'], 'RUNTIME_STATUS'],
  [['remember', 'recall', 'last time'], 'SHARED_MEMORY'],
  [['depend', 'dependency'], 'CROSS_SYSTEM_RELATIONSHIPS'],
  [['roadmap', 'phase', 'cloud runtime'], 'ROADMAP_STATE'],
  [['timeline', 'came before', 'most recently', 'milestone'], 'TIMELINE_STATE'],
  [['debug', 'bug', 'error'], 'DEBUG_CONTEXT'],
  [['implement', 'code', 'refactor'], 'DEVELOPMENT_KNOWLEDGE'],
];

export function detectContextNeeds(
  question: string,
  dimensions: QuestionDimension[],
): ContextNeed[] {
  const lower = question.toLowerCase();
  const needs = new Set<ContextNeed>();

  for (const dim of dimensions) {
    const mapped = DIMENSION_CONTEXT_MAP[dim];
    if (mapped) {
      for (const need of mapped) needs.add(need);
    }
  }

  for (const [signals, need] of QUESTION_CONTEXT_SIGNALS) {
    if (signals.some((s) => lower.includes(s))) {
      needs.add(need);
    }
  }

  if (dimensions.includes('PROJECT') && needs.size === 0) {
    needs.add('PROJECT_PROFILE');
    needs.add('PROJECT_FACTS');
  }

  return [...needs];
}

export function needsUnavailableDevelopmentContext(contextNeeds: ContextNeed[]): boolean {
  return contextNeeds.includes('DEVELOPMENT_KNOWLEDGE') || contextNeeds.includes('DEBUG_CONTEXT');
}
