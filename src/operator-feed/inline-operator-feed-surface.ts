/**
 * Inline Operator Feed surface — minimal inline event list inside chat turn area.
 */

import type { InlineOperatorFeedEvent } from './types.js';

export function renderInlineOperatorFeed(events: InlineOperatorFeedEvent[]): string {
  if (events.length === 0) {
    return '';
  }

  const items = events.map((event) => renderFeedEvent(event)).join('\n');

  return [
    '      <div class="devpulse-v2-inline-operator-feed" data-devpulse-inline-feed="true">',
    '        <p class="devpulse-v2-inline-feed-label">Operator Feed</p>',
    items,
    '      </div>',
  ].join('\n');
}

function renderFeedEvent(event: InlineOperatorFeedEvent): string {
  return [
    `        <div class="devpulse-v2-feed-event" data-turn-id="${escapeAttr(event.turnId)}" data-stage="${escapeAttr(event.stage)}">`,
    `          <span class="devpulse-v2-feed-stage">${escapeHtml(event.stage)}</span>`,
    `          <span class="devpulse-v2-feed-status">${escapeHtml(event.status)}</span>`,
    `          <span class="devpulse-v2-feed-visible-text" data-devpulse-feed-visible="true">${escapeHtml(event.visibleText)}</span>`,
    `        </div>`,
  ].join('\n');
}

export function getInlineFeedSurfaceSnapshot(events: InlineOperatorFeedEvent[]): {
  html: string;
  eventCount: number;
  hasInlineMount: boolean;
  allHaveVisibleText: boolean;
} {
  const html = renderInlineOperatorFeed(events);
  return {
    html,
    eventCount: events.length,
    hasInlineMount: html.includes('data-devpulse-inline-feed'),
    allHaveVisibleText: events.every((e) => e.visibleText.trim().length > 0),
  };
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
