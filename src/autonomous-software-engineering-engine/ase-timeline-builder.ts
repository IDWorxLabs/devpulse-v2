/**
 * ASE — timeline builder.
 */

import type { AseStageId, AseTimelineEvent } from './ase-types.js';

let eventCounter = 0;
const events: AseTimelineEvent[] = [];

export function resetAseTimelineForTests(): void {
  eventCounter = 0;
  events.length = 0;
}

export function appendAseTimelineEvent(input: {
  label: string;
  stageId?: AseStageId | null;
  evidenceId?: string | null;
  timestamp?: number;
}): AseTimelineEvent {
  eventCounter += 1;
  const event: AseTimelineEvent = {
    readOnly: true,
    eventId: `ase-timeline-${eventCounter}`,
    label: input.label,
    stageId: input.stageId ?? null,
    evidenceId: input.evidenceId ?? null,
    timestamp: input.timestamp ?? Date.now(),
  };
  events.push(event);
  return event;
}

export function getAseTimeline(): readonly AseTimelineEvent[] {
  return events;
}

export function mergeAseTimeline(preserved: readonly AseTimelineEvent[]): void {
  for (const event of preserved) {
    events.push(event);
  }
}

export const ASE_TIMELINE_LABELS = {
  PROMPT_RECEIVED: 'Prompt received',
  INTENT_UNDERSTOOD: 'Intent understood',
  PROMPT_CONTRACT_CREATED: 'Prompt contract created',
  CAPABILITY_PLANNING_COMPLETED: 'Capability planning completed',
  CAPABILITY_EVOLVED: 'Capability evolved',
  FEATURE_SLICE_GENERATED: 'Feature slice generated',
  FEATURE_SLICE_STABILIZED: 'Feature slice stabilized',
  BEHAVIOR_SCENARIO_PASSED: 'Behavior scenario passed',
  VIRTUAL_USER_JOURNEY_PASSED: 'Virtual user journey passed',
  DEVICE_PROFILE_PASSED: 'Device profile passed',
  INTERACTION_PROOF_PASSED: 'Interaction proof passed',
  REPAIR_ATTEMPTED: 'Repair attempted',
  REPAIR_RESOLVED: 'Repair resolved',
  IMPROVEMENT_APPLIED: 'Improvement applied',
  LAUNCH_DECISION_ISSUED: 'Launch decision issued',
  PREVIEW_UNLOCKED: 'Preview unlocked',
} as const;
