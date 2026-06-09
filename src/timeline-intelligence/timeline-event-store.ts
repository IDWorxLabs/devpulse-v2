/**
 * Timeline event store — in-memory seeded DevPulse V2 history. No persistence.
 */

import type { TimelineEvent, TimelineEventCategory, TimelineImpactLevel } from './timeline-types.js';

let eventCounter = 0;

function nextEventId(): string {
  eventCounter += 1;
  return `tl-evt-${eventCounter.toString().padStart(4, '0')}`;
}

function evt(
  timestamp: number,
  phase: string,
  title: string,
  description: string,
  category: TimelineEventCategory,
  relatedSystems: string[],
  impactLevel: TimelineImpactLevel,
): TimelineEvent {
  return {
    eventId: nextEventId(),
    timestamp,
    phase,
    title,
    description,
    category,
    relatedSystems,
    impactLevel,
  };
}

const BASE_TS = 1_700_000_000_000;

function seedTimelineEvents(): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let t = BASE_TS;

  const phase = (
    label: string,
    title: string,
    description: string,
    systems: string[],
    impact: TimelineImpactLevel = 'HIGH',
  ): void => {
    events.push(evt(t, label, `${title} started`, description, 'PHASE_STARTED', systems, impact));
    t += 86_400_000;
    events.push(
      evt(
        t,
        label,
        `${title} completed`,
        `${title} foundation validated — intelligence only, no execution.`,
        'PHASE_COMPLETED',
        systems,
        impact,
      ),
    );
    events.push(
      evt(
        t,
        label,
        title,
        `${title} registered as a completed foundation milestone.`,
        'MILESTONE',
        systems,
        impact,
      ),
    );
    t += 86_400_000;
  };

  phase('Phase 6', 'Governance Stack', 'Execution authority, verification loops, evidence ledger, and founder approval gates.', ['Governance Stack'], 'CRITICAL');
  phase('Phase 7', 'World 2 Foundations', 'Workspace, simulation, builder, and completion verifier planning foundations.', ['World 2', 'Builder'], 'HIGH');
  phase('Phase 8', 'Mobile Command Foundations', 'Mobile command surface and control foundations without live mobile execution.', ['Mobile Command'], 'MEDIUM');
  phase('Phase 9', 'Self-Evolution Foundations', 'Self-evolution planning and governance hooks.', ['Self-Evolution'], 'MEDIUM');
  phase('Phase 10.1', 'Experience Layer', 'Experience layer foundation for founder-facing surfaces.', ['Experience Layer'], 'MEDIUM');
  phase('Phase 10.2', 'Trust Engine', 'Unified trust signal aggregation from evidence and verification systems.', ['Trust Engine'], 'HIGH');
  phase('Phase 10.3', 'Founder Reality Surface', 'Founder visibility surface for architecture and runtime diagnostics.', ['Founder Reality Surface'], 'HIGH');
  phase('Phase 10.3.1', 'Runtime Shell', 'Command Center runtime shell for local brain and chat.', ['Command Center Runtime Shell'], 'HIGH');
  phase('Phase 11.1', 'Unified Command Center Brain', 'Local intelligence orchestration layer — thinks, does not execute.', ['Command Center Brain'], 'CRITICAL');
  phase('Phase 11.2', 'Cross-System Awareness', 'Relationship, dependency, and impact understanding across systems.', ['Cross-System Awareness'], 'HIGH');
  phase('Phase 11.3', 'Shared Memory', 'In-memory structured facts, decisions, and observations for the brain.', ['Shared Memory Layer'], 'HIGH');
  phase('Phase 11.4', 'Project Understanding', 'Structured project profile, gaps, risks, and status comprehension.', ['Project Understanding Engine'], 'HIGH');
  phase('Phase 11.4B', 'Project Knowledge Reasoning', 'Fact-driven project reasoning pipeline replacing keyword routes.', ['Project Understanding Engine'], 'HIGH');
  phase('Phase 11.4C', 'General Question Understanding', 'General reasoning router above legacy classifier patterns.', ['General Question Understanding'], 'HIGH');

  events.push(
    evt(
      t,
      'Phase 11.5',
      'Timeline Intelligence Foundation started',
      'Timeline understanding for past, present, and future project progression.',
      'PHASE_STARTED',
      ['Timeline Intelligence'],
      'HIGH',
    ),
  );

  events.push(
    evt(
      t + 43_200_000,
      'Phase 11.4C',
      'Execution deferral decision',
      'Execution runtime remains disconnected until intelligence foundations complete.',
      'DECISION',
      ['Governance Stack', 'Command Center Brain'],
      'CRITICAL',
    ),
  );

  events.push(
    evt(
      t + 43_200_000,
      'Phase 11.4',
      'Execution blocked until intelligence complete',
      'Execution must not start until intelligence layers are complete.',
      'BLOCKER',
      ['Command Center Brain'],
      'CRITICAL',
    ),
  );

  events.push(
    evt(
      t + 43_200_000,
      'Phase 11.4',
      'Cloud runtime deferred',
      'Cloud runtime must wait until local runtime understanding is stable.',
      'BLOCKER',
      ['Command Center Runtime Shell'],
      'HIGH',
    ),
  );

  events.push(
    evt(
      t + 43_200_000,
      'Phase 11.4',
      'Premature execution risk',
      'Premature execution could bypass governance gates.',
      'RISK',
      ['Governance Stack'],
      'CRITICAL',
    ),
  );

  events.push(
    evt(
      t + 43_200_000,
      'Phase 11.4',
      'Proceed to Timeline Intelligence',
      'Complete Project Understanding validation, then build Timeline Intelligence — intelligence only.',
      'RECOMMENDATION',
      ['Project Understanding Engine'],
      'HIGH',
    ),
  );

  events.push(
    evt(
      t + 43_200_000,
      'Phase 11.3',
      'Shared Memory layer validated',
      'Shared memory recall integrated into Command Center Brain.',
      'MEMORY_EVENT',
      ['Shared Memory Layer'],
      'MEDIUM',
    ),
  );

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

let timelineEvents: TimelineEvent[] = seedTimelineEvents();

export function getTimelineEvents(): readonly TimelineEvent[] {
  return timelineEvents;
}

export function getTimelineEventByPhase(phaseQuery: string): TimelineEvent[] {
  const lower = phaseQuery.toLowerCase();
  return timelineEvents.filter(
    (e) => e.phase.toLowerCase().includes(lower) || e.title.toLowerCase().includes(lower),
  );
}

export function getTimelineEventsByCategory(category: TimelineEventCategory): TimelineEvent[] {
  return timelineEvents.filter((e) => e.category === category);
}

export function getMostRecentEvents(limit = 5): TimelineEvent[] {
  return [...timelineEvents].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export function resetTimelineEventStoreForTests(): void {
  eventCounter = 0;
  timelineEvents = seedTimelineEvents();
}

export function timelineEventStoreKey(): string {
  return `${timelineEvents.length}:${timelineEvents[timelineEvents.length - 1]?.eventId ?? 'none'}`;
}
