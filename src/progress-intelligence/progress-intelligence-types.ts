/**
 * DevPulse V2 Phase 13.4 — Progress Intelligence types.
 * Visibility only — progress, completion, and milestone advisory without execution.
 */

export const PROGRESS_INTELLIGENCE_PASS_TOKEN =
  'DEVPULSE_V2_PROGRESS_INTELLIGENCE_FOUNDATION_V1_PASS';
export const PROGRESS_INTELLIGENCE_OWNER_MODULE = 'devpulse_v2_progress_intelligence';

export type ProgressConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProgressStatusLevel = 'COMPLETE' | 'IN_PROGRESS' | 'BLOCKED' | 'NOT_STARTED' | 'DEFERRED';

export interface ProgressMilestone {
  milestoneId: string;
  title: string;
  completed: boolean;
  phase: string;
  visibilityOnly: true;
}

export interface ProgressBlocker {
  blockerId: string;
  summary: string;
  projectId: string;
  visibilityOnly: true;
}

export interface ProgressStatus {
  statusId: string;
  level: ProgressStatusLevel;
  summary: string;
  visibilityOnly: true;
}

export interface ProgressRecord {
  progressId: string;
  projectId: string;
  projectName: string;
  phase: string;
  completed: string[];
  remaining: string[];
  blocked: string[];
  percentComplete: number;
  confidence: ProgressConfidence;
  milestone: string;
  nextMilestone: string;
  summary: string;
  aheadOfSchedule: boolean;
  behindSchedule: boolean;
  visibilityOnly: true;
}

export interface ProgressAnalysis {
  query: string;
  records: ProgressRecord[];
  milestones: ProgressMilestone[];
  blockers: ProgressBlocker[];
  statuses: ProgressStatus[];
  averageCompletion: number;
  highestCompletion: ProgressRecord | null;
  lowestCompletion: ProgressRecord | null;
}

export interface ProgressIntelligenceResult {
  query: string;
  analysis: ProgressAnalysis;
  responseText: string;
}

export interface ProgressIntelligenceDiagnostics {
  progressIntelligenceActive: boolean;
  projectProgressCount: number;
  averageCompletion: number;
  highestCompletion: number;
  lowestCompletion: number;
  lastProgressQuery: string | null;
}

export const PROGRESS_QUESTION_SIGNALS = [
  'how far',
  'percentage complete',
  'percent complete',
  'what is complete',
  'what remains',
  'milestone comes next',
  'milestone is next',
  'next milestone',
  'what milestone',
  'furthest along',
  'furthest along',
  'behind schedule',
  'ahead of schedule',
  'ahead or behind',
  'project is behind',
  'project is furthest',
  'which project is behind',
  'which project is furthest',
  'progress',
  'completion',
  'remaining',
  'incomplete',
  'in progress',
  'how complete',
  'what is blocked',
] as const;

export const FORBIDDEN_PROGRESS_DUPLICATES = [
  'progress_brain',
  'completion_brain',
  'brain_v2',
  'progress_tracker',
  'completion_engine',
  'milestone_tracker',
  'second_progress_intelligence',
] as const;

export function isProgressIntelligenceQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (lower.includes('what is blocked')) return true;

  const matches = PROGRESS_QUESTION_SIGNALS.some((s) => lower.includes(s));
  if (!matches) return false;

  if (lower.includes('summarize') && lower.includes('milestone')) return false;
  if (lower.startsWith('why ') || (lower.includes(' why ') && !lower.includes('how far'))) return false;
  if (lower.includes('action') && lower.includes('blocked')) return false;
  if (lower.includes('what projects exist') || lower.includes('portfolio summary')) return false;
  if (lower.includes('what changed') || lower.includes('history')) return false;

  if (lower.includes('what is blocked') || lower.includes('what remains') || lower.includes('how far')) {
    return true;
  }

  return true;
}
