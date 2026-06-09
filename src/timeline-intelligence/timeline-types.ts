/**
 * DevPulse V2 Phase 11.5 — Timeline Intelligence types.
 */

export const TIMELINE_INTELLIGENCE_PASS_TOKEN =
  'DEVPULSE_V2_TIMELINE_INTELLIGENCE_FOUNDATION_V1_PASS';
export const TIMELINE_INTELLIGENCE_OWNER_MODULE = 'devpulse_v2_timeline_intelligence';

export type TimelineEventCategory =
  | 'PHASE_STARTED'
  | 'PHASE_COMPLETED'
  | 'MILESTONE'
  | 'DECISION'
  | 'RISK'
  | 'BLOCKER'
  | 'RECOMMENDATION'
  | 'MEMORY_EVENT';

export type TimelineImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TimelineEvent {
  eventId: string;
  timestamp: number;
  phase: string;
  title: string;
  description: string;
  category: TimelineEventCategory;
  relatedSystems: string[];
  impactLevel: TimelineImpactLevel;
}

export interface TimelineState {
  completedPhases: string[];
  currentPhase: string;
  nextPhase: string;
  completedMilestones: string[];
  activeBlockers: string[];
  activeRisks: string[];
  recommendedNextSteps: string[];
}

export type TimelineIntent =
  | 'CURRENT_PHASE'
  | 'WHAT_CAME_BEFORE'
  | 'WHAT_COMES_AFTER'
  | 'COMPLETED'
  | 'BLOCKING'
  | 'MILESTONE_IMPORTANCE'
  | 'ROADMAP_SEQUENCE'
  | 'PHASE_INTRODUCTION'
  | 'RECENT_ACTIVITY'
  | 'GENERAL_TIMELINE';

export interface TimelineReasoningContext {
  query: string;
  state: TimelineState;
  events: TimelineEvent[];
  relevantEvents: TimelineEvent[];
  intent: TimelineIntent;
}

export interface TimelineReasoningResult {
  intent: TimelineIntent;
  conclusions: string[];
  supportingEvidence: string[];
  warnings: string[];
  recommendedNextStep: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  selectedEvents: TimelineEvent[];
}

export interface TimelineIntelligenceDiagnostics {
  currentTimelinePhase: string;
  completedPhaseCount: number;
  milestoneCount: number;
  blockerCount: number;
  lastTimelineQuery: string | null;
}

export const TIMELINE_INTELLIGENCE_FEED_STAGES = [
  'Loading Timeline Context',
  'Analyzing Timeline',
  'Checking Milestones',
  'Checking Blockers',
  'Generating Timeline Conclusions',
  'Response Ready',
] as const;

export const TIMELINE_QUESTION_SIGNALS = [
  'what phase are we',
  'currently in',
  'came before',
  'before shared memory',
  'before cross-system',
  'should happen after',
  'after timeline',
  'roadmap sequence',
  'phase introduced',
  'introduced shared memory',
  'introduced cross-system',
  'most recently',
  'completed recently',
  'what has been completed',
  'what was completed',
  'blocking roadmap',
  'blocking progress',
  'milestone mattered',
  'most important milestone',
  'how did we get here',
  'what changed',
  'overdue',
  'timeline',
  'what came before this',
  'what should happen next',
  'sequence should work',
] as const;

export function isTimelineQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return TIMELINE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
