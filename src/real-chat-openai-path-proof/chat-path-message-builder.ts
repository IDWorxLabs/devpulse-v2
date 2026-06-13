/**
 * Chat Path Message Builder — founder-style test messages (V1).
 */

import { FOUNDER_TEST_MESSAGE } from './real-chat-openai-path-registry.js';
import type { ChatPathMessage } from './real-chat-openai-path-types.js';

let messageCounter = 0;

export function resetChatPathMessageCounterForTests(): void {
  messageCounter = 0;
}

export function buildFounderTestMessage(content: string = FOUNDER_TEST_MESSAGE): ChatPathMessage {
  messageCounter += 1;
  return {
    readOnly: true,
    messageId: `chat-path-msg-${messageCounter}`,
    content,
    founderFacing: true,
  };
}
