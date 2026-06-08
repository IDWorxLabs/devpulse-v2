/**
 * Operator Feed verification — pipeline event ordering and activation checks.
 */

import { OPERATOR_FEED_EVENT_SEQUENCE } from '../brain-types.js';
import type { OperatorFeedEvent, OperatorFeedEventType } from '../brain-types.js';

export const FEED_STAGE_DELAY_MS = 180;

export interface FeedVerificationResult {
  feedActivated: boolean;
  stagesOrdered: boolean;
  stageCount: number;
  expectedStages: readonly OperatorFeedEventType[];
  actualStages: OperatorFeedEventType[];
  lastFailureReason: string | null;
}

export function verifyOperatorFeedEvents(events: OperatorFeedEvent[] | undefined | null): FeedVerificationResult {
  const expectedStages = OPERATOR_FEED_EVENT_SEQUENCE;
  if (!events || events.length === 0) {
    return {
      feedActivated: false,
      stagesOrdered: false,
      stageCount: 0,
      expectedStages,
      actualStages: [],
      lastFailureReason: 'Operator Feed events missing — feed not activated',
    };
  }

  const actualStages = events.map((e) => e.eventType);
  const stagesOrdered =
    actualStages.length === expectedStages.length &&
    expectedStages.every((stage, index) => actualStages[index] === stage);

  return {
    feedActivated: true,
    stagesOrdered,
    stageCount: actualStages.length,
    expectedStages,
    actualStages,
    lastFailureReason: stagesOrdered ? null : 'Operator Feed stages out of order or incomplete',
  };
}

export function mapFeedEventToSection(eventType: OperatorFeedEventType): string {
  switch (eventType) {
    case 'Classifying Request':
      return 'Planning';
    case 'Checking Systems':
      return 'Execution';
    case 'Checking Roadmap':
      return 'Verification';
    case 'Generating Response':
      return 'Approvals';
    case 'Response Ready':
      return 'Learning';
    default:
      return 'Planning';
  }
}

export function feedEventSequenceKey(events: OperatorFeedEvent[]): string {
  return events.map((e) => e.eventType).join('→');
}
