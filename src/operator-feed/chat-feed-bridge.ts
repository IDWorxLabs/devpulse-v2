/**
 * Bridge — attaches foundation feed events to Chat Authority submit flow.
 * Feed observes turn progress; Chat Authority remains answer owner.
 */

import type { DevPulseV2Answer } from '../chat/answer-contract.js';
import type { DevPulseV2InlineOperatorFeedAuthority } from './inline-operator-feed-authority.js';
import { FOUNDATION_FEED_STAGES, type InlineOperatorFeedEvent } from './types.js';

export interface ChatFeedBridgeResult {
  turnId: string;
  events: InlineOperatorFeedEvent[];
  answer: DevPulseV2Answer;
}

export interface ChatFeedBridgeOptions {
  turnId: string;
  feedAuthority: DevPulseV2InlineOperatorFeedAuthority;
  generateAnswer: () => DevPulseV2Answer;
}

/**
 * Emit foundation feed stages for a chat turn.
 * Does not modify answer text or create assistant messages.
 */
export async function runFoundationFeedForTurn(
  options: ChatFeedBridgeOptions,
): Promise<ChatFeedBridgeResult> {
  const { turnId, feedAuthority, generateAnswer } = options;
  const events: InlineOperatorFeedEvent[] = [];

  for (let i = 0; i < 3; i += 1) {
    const def = FOUNDATION_FEED_STAGES[i];
    events.push(
      await feedAuthority.publishEvent(turnId, def.stage, def.visibleText, def.finalStatus),
    );
  }

  const answer = generateAnswer();

  for (let i = 3; i < FOUNDATION_FEED_STAGES.length; i += 1) {
    const def = FOUNDATION_FEED_STAGES[i];
    events.push(
      await feedAuthority.publishEvent(turnId, def.stage, def.visibleText, def.finalStatus),
    );
  }

  return { turnId, events, answer };
}

/** Verify feed events are not assistant answer content. */
export function feedEventsAreNotAssistantAnswers(
  events: InlineOperatorFeedEvent[],
  answer: DevPulseV2Answer,
): boolean {
  if (answer.status !== 'READY') {
    return true;
  }
  return !events.some((e) => e.visibleText === answer.visibleAnswerText);
}

/** Verify feed did not alter answer visible text. */
export function feedDidNotModifyAnswer(
  before: DevPulseV2Answer,
  after: DevPulseV2Answer,
): boolean {
  return (
    before.visibleAnswerText === after.visibleAnswerText &&
    before.status === after.status &&
    before.source === after.source
  );
}

export function createTurnIdFromMessage(messageId: string): string {
  return `turn-${messageId}`;
}
