/**
 * Timeline reasoning engine — answers past/present/future timeline questions.
 */

import { analyzeTimelineBlockers } from './timeline-blocker-analyzer.js';
import { analyzeTimelineMilestones, findPhaseIntroduction } from './timeline-milestone-analyzer.js';
import { getRoadmapSequence, recommendTimelineNextSteps } from './timeline-next-step-engine.js';
import { getMostRecentEvents } from './timeline-event-store.js';
import { buildTimelineContext } from './timeline-context-builder.js';
import type { TimelineReasoningContext, TimelineReasoningResult } from './timeline-types.js';

function buildConclusions(context: TimelineReasoningContext): string[] {
  const { state, intent } = context;
  const milestones = analyzeTimelineMilestones(context.events, state);
  const blockers = analyzeTimelineBlockers(state, context.events);
  const next = recommendTimelineNextSteps(state);
  const conclusions: string[] = [];

  switch (intent) {
    case 'CURRENT_PHASE':
      conclusions.push(`DevPulse V2 is currently in ${state.currentPhase}.`);
      conclusions.push(`Next planned phase: ${state.nextPhase}.`);
      break;
    case 'WHAT_CAME_BEFORE': {
      const lower = context.query.toLowerCase();
      if (lower.includes('shared memory')) {
        const intro = findPhaseIntroduction(context.events, 'shared memory');
        const idx = state.completedPhases.findIndex((p) => p.toLowerCase().includes('shared memory'));
        const before = idx > 0 ? state.completedPhases[idx - 1] : state.completedPhases[state.completedPhases.length - 2];
        conclusions.push(
          intro
            ? `Shared Memory was introduced in ${intro.phase} — ${intro.title}.`
            : 'Shared Memory was introduced in Phase 11.3.',
        );
        if (before) conclusions.push(`The phase immediately before Shared Memory was ${before}.`);
      } else if (lower.includes('cross-system')) {
        const intro = findPhaseIntroduction(context.events, 'cross-system');
        conclusions.push(
          intro
            ? `Cross-System Awareness was introduced in ${intro.phase} — ${intro.title}.`
            : 'Cross-System Awareness was introduced in Phase 11.2.',
        );
      } else {
        const prior = state.completedPhases[state.completedPhases.length - 1];
        conclusions.push(`The phase immediately before the current phase was ${prior ?? 'unknown'}.`);
      }
      break;
    }
    case 'WHAT_COMES_AFTER':
      conclusions.push(`After ${state.currentPhase}, the roadmap points to ${state.nextPhase}.`);
      conclusions.push(next.summary);
      break;
    case 'COMPLETED':
      conclusions.push(`${state.completedPhases.length} phases completed.`);
      conclusions.push(`Recent completion focus: ${milestones.recentMilestones[0]?.title ?? state.currentPhase}.`);
      break;
    case 'BLOCKING':
      conclusions.push(blockers.summary);
      if (blockers.primaryBlocker) conclusions.push(`Primary blocker: ${blockers.primaryBlocker}`);
      break;
    case 'MILESTONE_IMPORTANCE':
      if (milestones.mostImportant) {
        conclusions.push(
          `The most important milestone registered is ${milestones.mostImportant.title} (${milestones.mostImportant.phase}) — ${milestones.mostImportant.description}`,
        );
      }
      break;
    case 'ROADMAP_SEQUENCE':
      conclusions.push('Roadmap sequence follows validated foundation phases in order.');
      for (const phase of getRoadmapSequence(state).slice(-4)) {
        conclusions.push(`• ${phase}`);
      }
      break;
    case 'PHASE_INTRODUCTION': {
      const feature = context.query.toLowerCase().includes('shared memory')
        ? 'shared memory'
        : context.query.toLowerCase().includes('cross-system')
          ? 'cross-system'
          : context.query.split(' ').slice(-2).join(' ');
      const intro = findPhaseIntroduction(context.events, feature);
      conclusions.push(
        intro
          ? `${intro.title} was introduced in ${intro.phase}: ${intro.description}`
          : `No exact phase introduction found for "${feature}" — check completed phases list.`,
      );
      break;
    }
    case 'RECENT_ACTIVITY': {
      const recent = getMostRecentEvents(3);
      conclusions.push(`Most recent timeline activity: ${recent[0]?.title ?? 'none registered'}.`);
      for (const e of recent.slice(0, 3)) {
        conclusions.push(`• ${e.title} (${e.phase})`);
      }
      break;
    }
    default:
      conclusions.push(`Timeline spans ${state.completedPhases.length} completed phases through ${state.currentPhase}.`);
      conclusions.push(next.summary);
  }

  return conclusions.slice(0, 6);
}

function computeConfidence(context: TimelineReasoningContext): TimelineReasoningResult['confidence'] {
  if (context.relevantEvents.length >= 6) return 'HIGH';
  if (context.relevantEvents.length >= 3) return 'MEDIUM';
  return 'LOW';
}

export function reasonOverTimeline(context: TimelineReasoningContext): TimelineReasoningResult {
  const blockers = analyzeTimelineBlockers(context.state, context.events);
  const next = recommendTimelineNextSteps(context.state);
  const conclusions = buildConclusions(context);

  const supportingEvidence = context.relevantEvents.slice(0, 8).map(
    (e) => `${e.title} (${e.phase}, ${e.category}): ${e.description}`,
  );

  if (supportingEvidence.length === 0) {
    supportingEvidence.push(
      ...context.state.completedPhases.slice(-5).map((p) => `Completed phase: ${p}`),
    );
  }

  return {
    intent: context.intent,
    conclusions,
    supportingEvidence,
    warnings: blockers.blockers.slice(0, 3),
    recommendedNextStep: next.recommendedNextStep,
    confidence: computeConfidence(context),
    selectedEvents: context.relevantEvents.slice(0, 8),
  };
}

export function composeTimelineAnswer(result: TimelineReasoningResult): string {
  const lines: string[] = [
    'Timeline Intelligence Response',
    `Intent: ${result.intent.replace(/_/g, ' ')}`,
    `Confidence: ${result.confidence}`,
    '',
    'Conclusion:',
    result.conclusions[0] ?? 'Timeline conclusion from registered events.',
    '',
    'Reasoning:',
  ];

  for (const c of result.conclusions.slice(1)) {
    lines.push(`• ${c}`);
  }

  lines.push('', 'Supporting Timeline Facts:');
  for (const fact of result.supportingEvidence.slice(0, 8)) {
    lines.push(`• ${fact}`);
  }

  lines.push('', 'Next Step / Limitation:');
  lines.push(result.recommendedNextStep);
  lines.push('Timeline Intelligence is understanding only — no execution, file changes, or persistence.');

  if (result.warnings.length > 0) {
    lines.push('', 'Active Blockers / Risks:');
    for (const w of result.warnings) {
      lines.push(`• ${w}`);
    }
  }

  return lines.join('\n');
}

export function answerTimelineQuestion(query: string): string {
  const context = buildTimelineContext(query);
  const result = reasonOverTimeline(context);
  return composeTimelineAnswer(result);
}

export function answerTimelineQuestionWithTrace(query: string): {
  context: TimelineReasoningContext;
  result: TimelineReasoningResult;
  responseText: string;
} {
  const context = buildTimelineContext(query);
  const result = reasonOverTimeline(context);
  return {
    context,
    result,
    responseText: composeTimelineAnswer(result),
  };
}
