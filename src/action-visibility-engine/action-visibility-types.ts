/**
 * DevPulse V2 Phase 13.2 — Action Visibility Engine types.
 * Visibility only — describes considered actions, does not execute them.
 */

export const ACTION_VISIBILITY_ENGINE_PASS_TOKEN =
  'DEVPULSE_V2_ACTION_VISIBILITY_ENGINE_FOUNDATION_V1_PASS';
export const ACTION_VISIBILITY_ENGINE_OWNER_MODULE = 'devpulse_v2_action_visibility_engine';

export type ActionStatus =
  | 'Suggested'
  | 'Recommended'
  | 'Blocked'
  | 'Deferred'
  | 'Waiting'
  | 'Completed'
  | 'Rejected';

export type ActionConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ActionCandidate {
  actionId: string;
  title: string;
  description: string;
  sourceSystem: string;
  status: ActionStatus;
  priority: number;
  confidence: ActionConfidence;
  blocked: boolean;
  deferred: boolean;
  recommended: boolean;
  reason: string;
  visibilityOnly: true;
}

export interface ActionRecommendation {
  recommendationId: string;
  actionId: string;
  title: string;
  sourceSystem: string;
  status: ActionStatus;
  priority: number;
  confidence: ActionConfidence;
  reason: string;
  visibilityOnly: true;
}

export interface ActionVisibilityRecord {
  recordId: string;
  query: string;
  action: ActionCandidate;
  recommendation: ActionRecommendation | null;
  reasoningId: string | null;
  progressId: string | null;
  failureIds: string[];
  evaluatedAt: number;
  visibilityOnly: true;
}

export interface ActionVisibilityResult {
  query: string;
  records: ActionVisibilityRecord[];
  candidates: ActionCandidate[];
  responseText: string;
}

export interface ActionVisibilityDiagnostics {
  actionVisibilityActive: boolean;
  actionCount: number;
  recommendedCount: number;
  blockedCount: number;
  deferredCount: number;
  lastAction: string | null;
  lastActionSource: string | null;
  lastQuery: string | null;
}

export const ACTION_VISIBILITY_QUESTION_SIGNALS = [
  'recommended action',
  'next action',
  'blocked action',
  'actions are blocked',
  'deferred action',
  'actions are deferred',
  'what should we do',
  'what is recommended',
  'action has highest priority',
  'highest priority action',
  'action comes from',
  'comes from dependency',
  'action visibility',
  'what action',
  'which action',
  'actions are waiting',
  'has it completed',
  'action status',
] as const;

export const ACTION_SOURCE_SYSTEMS = [
  'unified_decision_layer',
  'project_understanding_engine',
  'dependency_intelligence',
  'workspace_intelligence',
  'project_history_intelligence',
  'portfolio_intelligence',
  'project_summarization_engine',
] as const;

export const FORBIDDEN_ACTION_VISIBILITY_DUPLICATES = [
  'action_brain',
  'action_runtime',
  'execution_runtime',
  'brain_v2',
  'action_feed',
  'action_execution',
  'second_action_visibility',
] as const;

export function isActionVisibilityQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  const matches = ACTION_VISIBILITY_QUESTION_SIGNALS.some((s) => lower.includes(s));
  if (!matches) return false;

  if (
    (lower.includes('what should we build') || lower.includes('build next')) &&
    !lower.includes('what should we do')
  ) {
    return false;
  }

  return true;
}
