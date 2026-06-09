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
  [['depend', 'dependency', 'upstream', 'downstream', 'what breaks if', 'missing dependency'], 'DEPENDENCY_FACTS'],
  [['depend', 'dependency', 'relationship', 'connected to'], 'CROSS_SYSTEM_RELATIONSHIPS'],
  [['roadmap', 'phase', 'cloud runtime'], 'ROADMAP_STATE'],
  [['timeline', 'came before', 'most recently', 'milestone'], 'TIMELINE_STATE'],
  [['debug', 'bug', 'error'], 'DEBUG_CONTEXT'],
  [['implement', 'code', 'refactor'], 'DEVELOPMENT_KNOWLEDGE'],
  [['project vault', 'saved project', 'stored project', 'vault facts', 'from vault'], 'VAULT_FACTS'],
  [['workspace', 'active workspace', 'active project', 'workspace boundary', 'workspace mismatch', 'context leakage'], 'WORKSPACE_FACTS'],
  [['history', 'evolution', 'checkpoint', 'rollback', 'restored', 'milestone', 'introduced', 'evolved', 'what changed recently', 'what changed during'], 'HISTORY_FACTS'],
  [['summary', 'summarize', 'overview', 'executive summary', 'technical summary', 'founder summary', 'onboarding', 'project health'], 'SUMMARIZATION_FACTS'],
  [['portfolio', 'what projects exist', 'healthiest project', 'riskiest project', 'compare project', 'active projects', 'portfolio summary', 'projects need attention'], 'PORTFOLIO_FACTS'],
  [['recommended action', 'blocked action', 'deferred action', 'what should we do', 'what is recommended', 'next action', 'action comes from', 'highest priority action'], 'ACTION_VISIBILITY_FACTS'],
  [['why recommended', 'why blocked', 'why deferred', 'why confidence', 'what evidence', 'systems contributed', 'risks were considered', 'blockers were considered', 'reasoning'], 'REASONING_VISIBILITY_FACTS'],
  [['how far', 'percentage complete', 'what remains', 'what is blocked', 'next milestone', 'furthest along', 'behind schedule', 'progress', 'completion', 'remaining'], 'PROGRESS_INTELLIGENCE_FACTS'],
  [['what failed', 'failures exist', 'most severe failure', 'capabilities are blocked', 'dependency chains are impacted', 'failure', 'failed', 'error', 'problem', 'issue', 'severity', 'impact'], 'FAILURE_VISIBILITY_FACTS'],
  [['what did we learn', 'recurring blockers', 'recurring failures', 'recurring recommendations', 'what should we remember', 'what should improve', 'learned', 'learning', 'patterns', 'recurring', 'remember', 'improve', 'observed', 'lessons'], 'LEARNING_VISIBILITY_FACTS'],
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
