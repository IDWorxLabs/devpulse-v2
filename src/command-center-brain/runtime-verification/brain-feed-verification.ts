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
  const hasMemoryStages =
    actualStages.includes('Loading Memory') &&
    actualStages.includes('Searching Memory') &&
    actualStages.includes('Memory Context Ready');
  const stagesOrdered =
    actualStages[0] === 'Classifying Request' &&
    actualStages[actualStages.length - 1] === 'Response Ready' &&
    hasMemoryStages;

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
    case 'Understanding Question':
    case 'Selecting Reasoning Mode':
    case 'Loading Project Context':
    case 'Loading Timeline Context':
    case 'Loading Decision Context':
      return 'Planning';
    case 'Gathering Facts':
    case 'Analyzing Project Status':
    case 'Checking Systems':
    case 'Analyzing Timeline':
    case 'Evaluating Options':
      return 'Execution';
    case 'Loading Memory':
    case 'Searching Memory':
    case 'Memory Context Ready':
    case 'Evaluating Risks':
    case 'Checking Roadmap':
    case 'Detecting Context Needs':
    case 'Checking Project Gaps':
    case 'Checking Milestones':
    case 'Checking Risks':
      return 'Verification';
    case 'Analyzing Dependencies':
    case 'Checking Dependencies':
    case 'Performing Impact Analysis':
    case 'Checking Project Risks':
    case 'Selecting Capabilities':
    case 'Checking Blockers':
    case 'Ranking Priorities':
      return 'Approvals';
    case 'Generating Conclusions':
    case 'Generating Response':
    case 'Response Ready':
    case 'Gathering Relevant Facts':
    case 'Composing Answer':
    case 'Project Recommendation Ready':
    case 'Generating Timeline Conclusions':
    case 'Generating Recommendation':
    case 'Understanding Project':
      return 'Learning';
    case 'Loading Relationships':
      return 'Verification';
    default:
      return 'Planning';
  }
}

export function feedEventSequenceKey(events: OperatorFeedEvent[]): string {
  return events.map((e) => e.eventType).join('→');
}
