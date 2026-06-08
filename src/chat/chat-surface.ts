/**
 * DevPulse V2 chat surface — renders into Shell placeholder only.
 * Uses visibleAnswerText exclusively for assistant output.
 */

import { getRenderableAnswerText, type DevPulseV2Answer } from './answer-contract.js';
import { renderInlineOperatorFeed } from '../operator-feed/inline-operator-feed-surface.js';
import type { InlineOperatorFeedEvent } from '../operator-feed/types.js';
import type { ChatMessage } from './types.js';

export interface ChatSurfaceModel {
  messages: ChatMessage[];
  lastAnswer: DevPulseV2Answer | null;
  inputValue: string;
  turnFeedEvents?: InlineOperatorFeedEvent[];
}

export function renderChatSurface(model: ChatSurfaceModel): string {
  const messageList = model.messages
    .map((m) => renderMessage(m))
    .join('\n');

  const assistantArea = model.lastAnswer
    ? renderAssistantAnswerArea(model.lastAnswer)
    : '    <div class="devpulse-v2-chat-assistant-area" data-devpulse-assistant="pending"></div>';

  const feedInline =
    model.turnFeedEvents && model.turnFeedEvents.length > 0
      ? renderInlineOperatorFeed(model.turnFeedEvents)
      : '';

  return [
    '    <div class="devpulse-v2-chat" data-devpulse-chat="true">',
    '      <div class="devpulse-v2-chat-messages" data-devpulse-chat-messages="true">',
    messageList || '        <p class="devpulse-v2-chat-empty">No messages yet.</p>',
    feedInline,
    '      </div>',
    assistantArea,
    '      <form class="devpulse-v2-chat-input-row" data-devpulse-chat-form="true">',
    `        <input type="text" class="devpulse-v2-chat-input" data-devpulse-chat-input="true" value="${escapeAttr(model.inputValue)}" placeholder="Type a message" />`,
    '        <button type="submit" class="devpulse-v2-chat-send" data-devpulse-chat-send="true">Send</button>',
    '      </form>',
    '    </div>',
  ].join('\n');
}

/** Renderer uses visibleAnswerText only — no alternate prose fields. */
export function renderAssistantAnswerArea(answer: DevPulseV2Answer): string {
  const text = getRenderableAnswerText(answer);
  const status = answer.status;

  if (status === 'EMPTY') {
    return [
      '    <div class="devpulse-v2-chat-assistant-area" data-devpulse-assistant="empty">',
      '      <p class="devpulse-v2-chat-assistant-empty">No visible answer.</p>',
      '    </div>',
    ].join('\n');
  }

  if (status === 'ERROR') {
    return [
      '    <div class="devpulse-v2-chat-assistant-area" data-devpulse-assistant="error">',
      '      <p class="devpulse-v2-chat-assistant-error">Answer error.</p>',
      '    </div>',
    ].join('\n');
  }

  return [
    '    <div class="devpulse-v2-chat-assistant-area" data-devpulse-assistant="ready">',
    `      <p class="devpulse-v2-chat-assistant-text" data-devpulse-visible-answer="true">${escapeHtml(text)}</p>`,
    '    </div>',
  ].join('\n');
}

function renderMessage(message: ChatMessage): string {
  return [
    `        <div class="devpulse-v2-chat-message" data-role="${message.role}">`,
    `          <span class="devpulse-v2-chat-role">${escapeHtml(message.role)}</span>`,
    `          <span class="devpulse-v2-chat-text">${escapeHtml(message.text)}</span>`,
    `        </div>`,
  ].join('\n');
}

/** Verify rendered HTML contains only visibleAnswerText, not decoy fields. */
export function verifyRendererUsesVisibleAnswerTextOnly(
  answer: DevPulseV2Answer & { hiddenAnswer?: string },
  html: string,
): boolean {
  const visible = getRenderableAnswerText(answer);
  if (answer.hiddenAnswer && html.includes(answer.hiddenAnswer)) {
    return false;
  }
  if (visible && !html.includes(escapeHtml(visible))) {
    return false;
  }
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

export function getChatSurfaceSnapshot(model: ChatSurfaceModel): {
  html: string;
  hasMessageList: boolean;
  hasInput: boolean;
  hasSendButton: boolean;
  hasAssistantArea: boolean;
} {
  const html = renderChatSurface(model);
  return {
    html,
    hasMessageList: html.includes('data-devpulse-chat-messages'),
    hasInput: html.includes('data-devpulse-chat-input'),
    hasSendButton: html.includes('data-devpulse-chat-send'),
    hasAssistantArea: html.includes('data-devpulse-assistant'),
  };
}
