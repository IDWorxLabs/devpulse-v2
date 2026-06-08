/**
 * Foundation trust checks — evidence-based, observes existing authorities only.
 */

import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { VISIBLE_TARGET_MS, CLICKABLE_TARGET_MS } from '../browser-verification/types.js';
import type { TrustCheck, TrustEvidence, TrustStatus } from './types.js';

export interface TrustCheckContext {
  evidence: TrustEvidence[];
  shellVisible: boolean;
  shellClickable: boolean;
  shellVisibleMs: number | null;
  shellClickableMs: number | null;
  singleAnswerAuthority: boolean;
  visibleAnswerTextUsed: boolean;
  visibleAnswerText: string | null;
  inlineFeedVisible: boolean;
  feedEventCount: number;
  feedDistinctFromAnswer: boolean;
  realBrowserAttached: boolean;
  soakFoundationReady: boolean;
  taskGovernorUsedForVisiblePath: boolean;
  foundationEnforcementPassed: boolean;
}

function findEvidenceId(
  evidence: TrustEvidence[],
  source: TrustEvidence['source'],
): string {
  return evidence.find((e) => e.source === source)?.evidenceId ?? `${source.toLowerCase()}-missing`;
}

function check(
  checkId: string,
  name: string,
  pass: boolean,
  reason: string,
  evidenceIds: string[],
  warnInsteadOfFail = false,
): TrustCheck {
  let status: TrustStatus = 'PASS';
  if (!pass) status = warnInsteadOfFail ? 'WARN' : 'FAIL';
  return { checkId, name, status, reason, evidenceIds };
}

export function runFoundationTrustChecks(ctx: TrustCheckContext): TrustCheck[] {
  const { evidence } = ctx;
  const shellEv = findEvidenceId(evidence, 'SHELL_AUTHORITY');
  const chatEv = findEvidenceId(evidence, 'CHAT_AUTHORITY');
  const feedEv = findEvidenceId(evidence, 'INLINE_OPERATOR_FEED');
  const browserEv = findEvidenceId(evidence, 'BROWSER_VERIFICATION');
  const governorEv = findEvidenceId(evidence, 'TASK_GOVERNOR');
  const foundationEv = findEvidenceId(evidence, 'FOUNDATION_ENFORCEMENT');

  const checks: TrustCheck[] = [];

  checks.push(
    check(
      'TE-01',
      'Shell is visible',
      ctx.shellVisible,
      ctx.shellVisible
        ? ctx.shellVisibleMs !== null
          ? `Shell visible in ${ctx.shellVisibleMs}ms (target <= ${VISIBLE_TARGET_MS}ms)`
          : 'Shell marked visible'
        : 'Shell visibility not confirmed',
      [shellEv, browserEv],
      ctx.shellVisible && ctx.shellVisibleMs !== null && ctx.shellVisibleMs > VISIBLE_TARGET_MS,
    ),
  );

  checks.push(
    check(
      'TE-02',
      'Shell is clickable',
      ctx.shellClickable,
      ctx.shellClickable
        ? ctx.shellClickableMs !== null
          ? `Shell clickable in ${ctx.shellClickableMs}ms (target <= ${CLICKABLE_TARGET_MS}ms)`
          : 'Shell marked clickable'
        : 'Shell clickability not confirmed',
      [shellEv, browserEv],
      ctx.shellClickable &&
        ctx.shellClickableMs !== null &&
        ctx.shellClickableMs > CLICKABLE_TARGET_MS,
    ),
  );

  checks.push(
    check(
      'TE-03',
      'Chat Authority is single answer authority',
      ctx.singleAnswerAuthority,
      ctx.singleAnswerAuthority
        ? `Single owner: ${CHAT_OWNER_MODULE}`
        : 'Duplicate or missing answer authority',
      [chatEv, foundationEv],
    ),
  );

  checks.push(
    check(
      'TE-04',
      'Assistant answer uses visibleAnswerText',
      ctx.visibleAnswerTextUsed,
      ctx.visibleAnswerTextUsed
        ? `visibleAnswerText present: "${ctx.visibleAnswerText?.slice(0, 40)}..."`
        : 'visibleAnswerText not confirmed on assistant answer',
      [chatEv, browserEv],
    ),
  );

  checks.push(
    check(
      'TE-05',
      'Inline Operator Feed is visible',
      ctx.inlineFeedVisible,
      ctx.inlineFeedVisible
        ? `${ctx.feedEventCount} foundation feed events visible`
        : 'Inline Operator Feed not visible',
      [feedEv, browserEv],
    ),
  );

  checks.push(
    check(
      'TE-06',
      'Feed does not become assistant answer',
      ctx.feedDistinctFromAnswer,
      ctx.feedDistinctFromAnswer
        ? 'Feed events distinct from assistant visibleAnswerText'
        : 'Feed may overlap assistant answer text',
      [feedEv, chatEv],
    ),
  );

  checks.push(
    check(
      'TE-07',
      'Browser runner is real-browser attached',
      ctx.realBrowserAttached,
      ctx.realBrowserAttached
        ? 'Real browser runner attached via Playwright'
        : 'Simulated browser only — real browser runner not attached',
      [browserEv],
      !ctx.realBrowserAttached,
    ),
  );

  checks.push(
    check(
      'TE-08',
      'Phase 1 soak status is foundation-ready',
      ctx.soakFoundationReady,
      ctx.soakFoundationReady
        ? 'Phase 1 soak reports FOUNDATION_READY'
        : 'Phase 1 soak not foundation-ready (real browser or cycles may be pending)',
      [browserEv],
      !ctx.soakFoundationReady,
    ),
  );

  checks.push(
    check(
      'TE-09',
      'Task Governor is used for visible path work',
      ctx.taskGovernorUsedForVisiblePath,
      ctx.taskGovernorUsedForVisiblePath
        ? 'P0/P1 tasks scheduled on visible user path'
        : 'Task Governor not used for visible path work',
      [governorEv, chatEv],
    ),
  );

  checks.push(
    check(
      'TE-10',
      'Foundation Enforcement passes',
      ctx.foundationEnforcementPassed,
      ctx.foundationEnforcementPassed
        ? 'Constitutional validation passed for Phase 2 trust observation'
        : 'Foundation Enforcement violations detected',
      [foundationEv],
    ),
  );

  return checks;
}

export function calculateTrustScore(checks: TrustCheck[]): number {
  if (checks.length === 0) return 0;
  const points = checks.reduce((sum, c) => {
    if (c.status === 'PASS') return sum + 10;
    if (c.status === 'WARN') return sum + 5;
    return sum;
  }, 0);
  return Math.round((points / (checks.length * 10)) * 100);
}

export function deriveTrustConfidence(
  trustScore: number,
  checks: TrustCheck[],
): 'LOW' | 'MEDIUM' | 'HIGH' {
  const failCount = checks.filter((c) => c.status === 'FAIL').length;
  if (failCount > 0 || trustScore < 55) return 'LOW';
  if (trustScore >= 85 && failCount === 0) return 'HIGH';
  return 'MEDIUM';
}

export function deriveTrustStatus(checks: TrustCheck[]): TrustStatus {
  if (checks.some((c) => c.status === 'FAIL')) return 'FAIL';
  if (checks.some((c) => c.status === 'WARN')) return 'WARN';
  return 'PASS';
}
