/**
 * Foundation browser reality checks for Phase 1 stack.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { getClickabilityReport, getFirstClickableControlId } from '../shell/clickability-tracker.js';
import { SHELL_CHAT_PLACEHOLDER_MARKER } from '../shell/shell-surface.js';
import { CHAT_OWNER_MODULE, FOUNDATION_RESPONSE_TEXT } from '../chat/types.js';
import { FOUNDATION_FEED_STAGES } from '../operator-feed/types.js';
import type { SimulatedBrowserDomAdapter } from './simulated-browser-dom-adapter.js';
import type { BrowserRealityCheck } from './types.js';
import {
  CLICKABLE_TARGET_MS,
  FOUNDATION_FEED_STAGE_COUNT,
  VISIBLE_TARGET_MS,
} from './types.js';

export interface FoundationCheckContext {
  html: string;
  dom: SimulatedBrowserDomAdapter;
  userMessageText: string;
  visibleAnswerText: string;
  feedEventCount: number;
  shellVisibleMs: number | null;
  shellClickableMs: number | null;
}

function check(
  checkId: string,
  name: string,
  pass: boolean,
  expected: string,
  actual: string,
  evidence: string[],
  latencyMs?: number,
  warnInsteadOfFail = false,
): BrowserRealityCheck {
  return {
    checkId,
    name,
    status: pass ? 'PASS' : warnInsteadOfFail ? 'WARN' : 'FAIL',
    expected,
    actual,
    latencyMs,
    evidence,
  };
}

export function runFoundationBrowserChecks(ctx: FoundationCheckContext): BrowserRealityCheck[] {
  const { html, dom, userMessageText, visibleAnswerText, feedEventCount } = ctx;
  const checks: BrowserRealityCheck[] = [];

  checks.push(
    check(
      'BV-01',
      'Shell surface renders',
      dom.contains(html, 'data-devpulse-shell="true"'),
      'data-devpulse-shell present',
      dom.contains(html, 'data-devpulse-shell="true"') ? 'shell root found' : 'shell root missing',
      ['data-devpulse-shell="true"'],
    ),
  );

  checks.push(
    check(
      'BV-02',
      'Shell placeholder replaced by Chat surface',
      !html.includes(SHELL_CHAT_PLACEHOLDER_MARKER) &&
        dom.contains(html, 'data-devpulse-chat="true"'),
      'chat mounted, placeholder removed',
      html.includes(SHELL_CHAT_PLACEHOLDER_MARKER)
        ? 'placeholder still present'
        : dom.contains(html, 'data-devpulse-chat="true"')
          ? 'chat surface mounted'
          : 'chat missing',
      [SHELL_CHAT_PLACEHOLDER_MARKER, 'data-devpulse-chat="true"'],
    ),
  );

  checks.push(
    check(
      'BV-03',
      'Chat input exists',
      dom.contains(html, 'data-devpulse-chat-input="true"'),
      'chat input element',
      dom.contains(html, 'data-devpulse-chat-input="true"') ? 'input found' : 'input missing',
      ['data-devpulse-chat-input="true"'],
    ),
  );

  checks.push(
    check(
      'BV-04',
      'Send button exists',
      dom.contains(html, 'data-devpulse-chat-send="true"'),
      'send button element',
      dom.contains(html, 'data-devpulse-chat-send="true"') ? 'send found' : 'send missing',
      ['data-devpulse-chat-send="true"'],
    ),
  );

  const clickableId = getFirstClickableControlId();
  checks.push(
    check(
      'BV-05',
      'First clickable control is available',
      dom.contains(html, clickableId) || dom.contains(html, 'data-devpulse-chat-send="true"'),
      `clickable control (${clickableId} or send)`,
      dom.contains(html, clickableId) ? `${clickableId} found` : 'send button fallback',
      [clickableId, 'data-devpulse-chat-send="true"'],
    ),
  );

  checks.push(
    check(
      'BV-06',
      'Submitting a message creates user message',
      html.includes(userMessageText) && dom.query(html, /data-role="user"/).found,
      `user message: ${userMessageText}`,
      dom.query(html, /data-role="user"/).found ? 'user role present' : 'user message missing',
      [`text:${userMessageText}`, 'data-role="user"'],
    ),
  );

  const renderedAnswer = dom.extractVisibleAnswerText(html);
  checks.push(
    check(
      'BV-07',
      'Assistant answer renders visibleAnswerText',
      renderedAnswer === visibleAnswerText &&
        dom.contains(html, 'data-devpulse-visible-answer="true"'),
      visibleAnswerText,
      renderedAnswer ?? 'no visible answer in HTML',
      ['data-devpulse-visible-answer="true"'],
    ),
  );

  const feedEventsInHtml = dom.query(html, /data-devpulse-feed-visible="true"/).count;
  checks.push(
    check(
      'BV-08',
      'Inline Operator Feed renders five foundation events',
      feedEventsInHtml === FOUNDATION_FEED_STAGE_COUNT && feedEventCount === FOUNDATION_FEED_STAGE_COUNT,
      `${FOUNDATION_FEED_STAGE_COUNT} feed events`,
      `html=${feedEventsInHtml} state=${feedEventCount}`,
      FOUNDATION_FEED_STAGES.map((s) => s.stage),
    ),
  );

  const feedTextsAreNotAnswer =
    !FOUNDATION_FEED_STAGES.some((s) => s.visibleText === visibleAnswerText) &&
    renderedAnswer === visibleAnswerText;
  checks.push(
    check(
      'BV-09',
      'Feed events do not render as assistant answers',
      feedTextsAreNotAnswer && feedEventsInHtml > 0,
      'feed text distinct from assistant answer',
      `answer="${visibleAnswerText.slice(0, 30)}..." feed events=${feedEventsInHtml}`,
      ['feed uses data-devpulse-feed-visible', 'answer uses data-devpulse-visible-answer'],
    ),
  );

  const clickReport = getClickabilityReport();
  const visibleMs = ctx.shellVisibleMs ?? clickReport.visibleMs;
  const visibleMeasured = visibleMs !== null;
  checks.push({
    checkId: 'BV-10',
    name: 'Visible target is measured',
    status: !visibleMeasured
      ? 'FAIL'
      : visibleMs! <= VISIBLE_TARGET_MS
        ? 'PASS'
        : 'WARN',
    expected: `measured, <= ${VISIBLE_TARGET_MS}ms`,
    actual: visibleMeasured ? `${visibleMs}ms` : 'not measured',
    latencyMs: visibleMs ?? undefined,
    evidence: [`target=${VISIBLE_TARGET_MS}ms`],
  });

  const clickableMs = ctx.shellClickableMs ?? clickReport.clickableMs;
  const clickableMeasured = clickableMs !== null;
  checks.push({
    checkId: 'BV-11',
    name: 'Clickable target is measured',
    status: !clickableMeasured
      ? 'FAIL'
      : clickableMs! <= CLICKABLE_TARGET_MS
        ? 'PASS'
        : 'WARN',
    expected: `measured, <= ${CLICKABLE_TARGET_MS}ms`,
    actual: clickableMeasured ? `${clickableMs}ms` : 'not measured',
    latencyMs: clickableMs ?? undefined,
    evidence: [`target=${CLICKABLE_TARGET_MS}ms`],
  });

  checks.push(
    check(
      'BV-12',
      'No alternate answer field is used',
      !dom.hasForbiddenAlternateAnswerFields(html),
      'no forbidden answer fields in HTML',
      dom.hasForbiddenAlternateAnswerFields(html) ? 'forbidden field detected' : 'clean',
      ['directAnswer', 'hiddenAnswer', 'routingNarration'],
    ),
  );

  const answerOwners = listDevPulseV2Owners().filter(
    (o) => o.domain === 'chat_authority' || o.domain === 'chat_answer_authority',
  );
  const uniqueModules = new Set(answerOwners.map((o) => o.ownerModule));
  checks.push(
    check(
      'BV-13',
      'No duplicate answer authority exists',
      assertSingleAnswerAuthorityRegistered() &&
        uniqueModules.size === 1 &&
        uniqueModules.has(CHAT_OWNER_MODULE),
      `single owner: ${CHAT_OWNER_MODULE}`,
      `modules: ${[...uniqueModules].join(', ')}`,
      answerOwners.map((o) => `${o.domain}→${o.ownerModule}`),
    ),
  );

  return checks;
}

export function deriveVerificationStatus(
  checks: BrowserRealityCheck[],
  harnessWarnings: string[],
): 'PASS' | 'WARN' | 'FAIL' {
  if (checks.some((c) => c.status === 'FAIL')) return 'FAIL';
  if (checks.some((c) => c.status === 'WARN') || harnessWarnings.length > 0) return 'WARN';
  return 'PASS';
}

export { FOUNDATION_RESPONSE_TEXT };
