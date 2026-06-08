/**
 * Real browser reality checks — executed via Playwright against rendered HTML.
 */

import { FOUNDATION_FEED_STAGE_COUNT } from './types.js';
import type { BrowserRealityCheck } from './types.js';

export interface RealBrowserCheckContext {
  userMessageText: string;
  visibleAnswerText: string;
  feedEventCount: number;
}

export interface RealBrowserCheckPage {
  isVisible(selector: string): Promise<boolean>;
  isEnabled(selector: string): Promise<boolean>;
  count(selector: string): Promise<number>;
  textContent(selector: string): Promise<string | null>;
  bodyText(): Promise<string>;
}

function check(
  checkId: string,
  name: string,
  pass: boolean,
  expected: string,
  actual: string,
  evidence: string[],
): BrowserRealityCheck {
  return {
    checkId,
    name,
    status: pass ? 'PASS' : 'FAIL',
    expected,
    actual,
    evidence,
  };
}

export async function runRealBrowserChecks(
  page: RealBrowserCheckPage,
  ctx: RealBrowserCheckContext,
): Promise<BrowserRealityCheck[]> {
  const checks: BrowserRealityCheck[] = [];

  const shellVisible = await page.isVisible('[data-devpulse-shell="true"]');
  checks.push(
    check(
      'RB-01',
      'Shell visible in real browser',
      shellVisible,
      'shell root visible',
      shellVisible ? 'shell visible' : 'shell not visible',
      ['[data-devpulse-shell="true"]'],
    ),
  );

  const inputVisible = await page.isVisible('[data-devpulse-chat-input="true"]');
  checks.push(
    check(
      'RB-02',
      'Chat input visible in real browser',
      inputVisible,
      'chat input visible',
      inputVisible ? 'input visible' : 'input not visible',
      ['[data-devpulse-chat-input="true"]'],
    ),
  );

  const sendClickable = await page.isEnabled('[data-devpulse-chat-send="true"]');
  checks.push(
    check(
      'RB-03',
      'Send button clickable in real browser',
      sendClickable,
      'send button enabled',
      sendClickable ? 'send clickable' : 'send not clickable',
      ['[data-devpulse-chat-send="true"]'],
    ),
  );

  const userCount = await page.count(`[data-role="user"]`);
  const bodyHasUserMessage = (await page.bodyText()).includes(ctx.userMessageText);
  checks.push(
    check(
      'RB-04',
      'User message appears in real browser',
      userCount > 0 && bodyHasUserMessage,
      `user message: ${ctx.userMessageText}`,
      userCount > 0 && bodyHasUserMessage ? 'user message visible' : 'user message missing',
      ['data-role="user"', ctx.userMessageText],
    ),
  );

  const answerText = await page.textContent('[data-devpulse-visible-answer="true"]');
  checks.push(
    check(
      'RB-05',
      'Assistant visibleAnswerText appears in real browser',
      answerText === ctx.visibleAnswerText,
      ctx.visibleAnswerText,
      answerText ?? 'no visible answer',
      ['[data-devpulse-visible-answer="true"]'],
    ),
  );

  const feedVisible = await page.isVisible('[data-devpulse-inline-feed="true"]');
  checks.push(
    check(
      'RB-06',
      'Inline Operator Feed appears in real browser',
      feedVisible,
      'inline feed mount visible',
      feedVisible ? 'feed visible' : 'feed not visible',
      ['[data-devpulse-inline-feed="true"]'],
    ),
  );

  const feedEventDomCount = await page.count('[data-devpulse-feed-visible="true"]');
  checks.push(
    check(
      'RB-07',
      'Five feed events appear in real browser',
      feedEventDomCount === FOUNDATION_FEED_STAGE_COUNT &&
        ctx.feedEventCount === FOUNDATION_FEED_STAGE_COUNT,
      `${FOUNDATION_FEED_STAGE_COUNT} feed events`,
      `dom=${feedEventDomCount} state=${ctx.feedEventCount}`,
      ['[data-devpulse-feed-visible="true"]'],
    ),
  );

  const feedTexts = await page.bodyText();
  const feedIsNotAnswer =
    feedEventDomCount > 0 &&
    answerText === ctx.visibleAnswerText &&
    !feedTexts.includes(`${ctx.visibleAnswerText}${ctx.visibleAnswerText}`);
  checks.push(
    check(
      'RB-08',
      'Feed is not assistant answer in real browser',
      feedIsNotAnswer,
      'feed text distinct from assistant answer',
      `answer="${ctx.visibleAnswerText.slice(0, 30)}..." events=${feedEventDomCount}`,
      ['feed uses data-devpulse-feed-visible', 'answer uses data-devpulse-visible-answer'],
    ),
  );

  const sendStillClickable = await page.isEnabled('[data-devpulse-chat-send="true"]');
  checks.push(
    check(
      'RB-09',
      'Page remains clickable after submit in real browser',
      sendStillClickable && inputVisible,
      'send and input remain interactive',
      sendStillClickable && inputVisible ? 'controls interactive' : 'controls not interactive',
      ['[data-devpulse-chat-send="true"]', '[data-devpulse-chat-input="true"]'],
    ),
  );

  return checks;
}

export function wrapHtmlForBrowserDocument(html: string): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    '  <title>DevPulse V2 Browser Verification</title>',
    '  <style>',
    '    body { margin: 0; font-family: system-ui, sans-serif; }',
    '    .devpulse-v2-shell { min-height: 100vh; padding: 1rem; }',
    '  </style>',
    '</head>',
    '<body>',
    html,
    '</body>',
    '</html>',
  ].join('\n');
}
