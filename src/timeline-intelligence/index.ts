/**
 * DevPulse V2 Phase 11.5 — Timeline Intelligence public API.
 */

import { buildTimelineState } from './timeline-state-model.js';
import { resetTimelineEventStoreForTests, timelineEventStoreKey } from './timeline-event-store.js';
import {
  answerTimelineQuestion,
  answerTimelineQuestionWithTrace,
  composeTimelineAnswer,
  reasonOverTimeline,
} from './timeline-reasoning-engine.js';
import { buildTimelineContext, buildTimelineAnalysisSnapshot } from './timeline-context-builder.js';
import type { TimelineIntelligenceDiagnostics } from './timeline-types.js';

export {
  TIMELINE_INTELLIGENCE_PASS_TOKEN,
  TIMELINE_INTELLIGENCE_OWNER_MODULE,
  TIMELINE_INTELLIGENCE_FEED_STAGES,
  TIMELINE_INTELLIGENCE_FEED_STAGES as TIMELINE_INTELLIGENCE_FEED,
  TIMELINE_QUESTION_SIGNALS,
  isTimelineQuestion,
  type TimelineEvent,
  type TimelineEventCategory,
  type TimelineImpactLevel,
  type TimelineState,
  type TimelineIntent,
  type TimelineReasoningContext,
  type TimelineReasoningResult,
  type TimelineIntelligenceDiagnostics,
} from './timeline-types.js';

export {
  getTimelineEvents,
  getTimelineEventByPhase,
  getTimelineEventsByCategory,
  getMostRecentEvents,
  resetTimelineEventStoreForTests,
  timelineEventStoreKey,
} from './timeline-event-store.js';

export { buildTimelineState, timelineStateKey } from './timeline-state-model.js';
export { analyzeTimelineMilestones, findPhaseIntroduction } from './timeline-milestone-analyzer.js';
export { analyzeTimelineBlockers } from './timeline-blocker-analyzer.js';
export { recommendTimelineNextSteps, getRoadmapSequence } from './timeline-next-step-engine.js';
export { buildTimelineContext, buildTimelineAnalysisSnapshot, intentKey } from './timeline-context-builder.js';
export {
  reasonOverTimeline,
  composeTimelineAnswer,
  answerTimelineQuestion,
  answerTimelineQuestionWithTrace,
} from './timeline-reasoning-engine.js';

let lastTimelineQuery: string | null = null;

export function processTimelineIntelligenceRequest(query: string): {
  responseText: string;
  state: ReturnType<typeof buildTimelineState>;
} {
  lastTimelineQuery = query;
  const trace = answerTimelineQuestionWithTrace(query);
  return {
    responseText: trace.responseText,
    state: trace.context.state,
  };
}

export function getTimelineIntelligenceDiagnostics(): TimelineIntelligenceDiagnostics {
  const state = buildTimelineState();
  return {
    currentTimelinePhase: state.currentPhase,
    completedPhaseCount: state.completedPhases.length,
    milestoneCount: state.completedMilestones.length,
    blockerCount: state.activeBlockers.length,
    lastTimelineQuery,
  };
}

export function resetTimelineIntelligenceForTests(): void {
  lastTimelineQuery = null;
  resetTimelineEventStoreForTests();
}

export function timelineIntelligenceKey(): string {
  const d = getTimelineIntelligenceDiagnostics();
  return [
    timelineEventStoreKey(),
    d.currentTimelinePhase,
    d.completedPhaseCount,
    d.milestoneCount,
    d.blockerCount,
  ].join('|');
}

export class DevPulseV2TimelineIntelligence {
  static readonly ownerModule = 'devpulse_v2_timeline_intelligence';
  static readonly passToken = 'DEVPULSE_V2_TIMELINE_INTELLIGENCE_FOUNDATION_V1_PASS';

  answer(query: string): string {
    return answerTimelineQuestion(query);
  }
}

let singleton: DevPulseV2TimelineIntelligence | null = null;

export function getDevPulseV2TimelineIntelligence(): DevPulseV2TimelineIntelligence {
  if (!singleton) singleton = new DevPulseV2TimelineIntelligence();
  return singleton;
}
