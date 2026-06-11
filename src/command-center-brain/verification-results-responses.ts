/**
 * Command Center verification-results responses — Phase 24.9.5.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';
import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/index.js';
import {
  buildVerificationResultsFromWorkspace,
  getCachedVerificationResults,
} from '../verification-results-visibility/index.js';

export type VerificationResultsIntent =
  | 'WHAT_WAS_TESTED'
  | 'DID_TESTING_PASS'
  | 'WHAT_FAILED'
  | 'WHAT_FIX_NEXT'
  | 'READY_FOR_BETA'
  | 'READY_TO_LAUNCH'
  | 'SHOW_REPORT'
  | 'EXPLAIN_RESULTS';

const MATCHERS: ReadonlyArray<{ intent: VerificationResultsIntent; patterns: RegExp[] }> = [
  { intent: 'WHAT_WAS_TESTED', patterns: [/^what was tested\??$/i, /^what did aidevengine test\??$/i] },
  { intent: 'DID_TESTING_PASS', patterns: [/^did testing pass\??$/i, /^did the test pass\??$/i] },
  { intent: 'WHAT_FAILED', patterns: [/^what failed\??$/i, /^what tests failed\??$/i] },
  {
    intent: 'WHAT_FIX_NEXT',
    patterns: [/^what should i fix next\??$/i, /^what do i fix next\??$/i],
  },
  {
    intent: 'READY_FOR_BETA',
    patterns: [/^is this ready for beta\??$/i, /^ready for beta\??$/i],
  },
  {
    intent: 'READY_TO_LAUNCH',
    patterns: [/^is this ready to launch\??$/i, /^ready to launch\??$/i],
  },
  {
    intent: 'SHOW_REPORT',
    patterns: [/^show me the verification report\.?$/i, /^show verification report\??$/i],
  },
  {
    intent: 'EXPLAIN_RESULTS',
    patterns: [/^explain the latest test results\.?$/i, /^explain latest test results\??$/i],
  },
];

let cachedValidatorScripts: string[] | null = null;

function loadValidatorScripts(): string[] {
  if (cachedValidatorScripts) return cachedValidatorScripts;
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
    cachedValidatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  } catch {
    cachedValidatorScripts = [];
  }
  return cachedValidatorScripts;
}

function currentResults(): VerificationResultsVisibilityAssessment {
  const cached = getCachedVerificationResults();
  if (cached) return cached;
  const workspace = buildProductWorkspaceSnapshot(loadValidatorScripts());
  return workspace.verificationResults ?? buildVerificationResultsFromWorkspace(workspace);
}

export function matchVerificationResultsIntent(message: string): VerificationResultsIntent | null {
  const normalized = message.trim().replace(/\s+/g, ' ');
  for (const entry of MATCHERS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.intent;
    }
  }
  return null;
}

function formatSummary(v: VerificationResultsVisibilityAssessment): string {
  const s = v.summary;
  return [
    `Verification state: ${v.state}`,
    `Readiness: ${s.readinessScore}/100`,
    `Passed: ${s.passCount} | Failed: ${s.failCount} | Blocked: ${s.blockedCount} | Warnings: ${s.warningCount}`,
    s.lastRunLabel ? `Last run: ${s.lastRunLabel}` : 'Last run: none recorded',
  ].join('\n');
}

export function generateVerificationResultsResponse(intent: VerificationResultsIntent): string {
  const v = currentResults();

  if (v.state === 'NO_VERIFICATION_RUN') {
    const base = 'No verification has been run yet.\n\nRun Founder Testing from the Verification surface to produce a founder-visible test report.';
    switch (intent) {
      case 'WHAT_WAS_TESTED':
        return `${base}\n\nNext action: Run Founder Testing V4.`;
      case 'DID_TESTING_PASS':
        return `No — testing has not been run yet.\n\nNext action: Run Founder Testing V4.`;
      case 'WHAT_FAILED':
        return `No failures recorded — verification has not been run.\n\nNext action: Run Founder Testing V4.`;
      case 'WHAT_FIX_NEXT':
        return `Next action: Run Founder Testing V4 to see what to fix.`;
      case 'READY_FOR_BETA':
      case 'READY_TO_LAUNCH':
        return `Not yet — no verification run exists.\n\nNext action: Run Founder Testing V4.`;
      case 'SHOW_REPORT':
      case 'EXPLAIN_RESULTS':
        return `${base}\n\nOpen Verification for the report panel after you run Founder Testing.`;
      default:
        return base;
    }
  }

  switch (intent) {
    case 'WHAT_WAS_TESTED': {
      const areas = v.categories.map((c) => `• ${c.category} (${c.checks.length} checks)`).join('\n');
      return `${formatSummary(v)}\n\nWhat was tested:\n${areas}\n\nNext action: ${v.fixesNext[0]?.recommendedAction ?? 'Review the Verification report panel.'}`;
    }
    case 'DID_TESTING_PASS':
      if (v.state === 'VERIFICATION_FAILED') {
        return `No — ${v.summary.failCount} check(s) failed.\n\n${formatSummary(v)}\n\nNext action: ${v.fixesNext[0]?.recommendedAction ?? 'Review failed checks in Verification.'}`;
      }
      if (v.state === 'VERIFICATION_BLOCKED') {
        return `Not fully — verification was blocked (${v.summary.blockedCount} blocked check(s)).\n\n${formatSummary(v)}`;
      }
      if (v.state === 'VERIFICATION_WARNINGS') {
        return `Mostly — core checks passed with ${v.summary.warningCount} warning(s).\n\n${formatSummary(v)}`;
      }
      return `Yes — verification state is ${v.state}.\n\n${formatSummary(v)}`;

    case 'WHAT_FAILED': {
      const failed = v.categories.flatMap((c) => c.checks.filter((x) => x.status === 'FAIL' || x.status === 'BLOCKED'));
      if (!failed.length) {
        return `No failed checks recorded.\n\n${formatSummary(v)}`;
      }
      return failed
        .slice(0, 6)
        .map((f) => `• ${f.checkName} (${f.status}): ${f.meaning}\n  Evidence: ${f.evidence}`)
        .join('\n\n');
    }

    case 'WHAT_FIX_NEXT':
      if (!v.fixesNext.length) {
        return `No urgent fixes ranked.\n\n${formatSummary(v)}`;
      }
      return v.fixesNext
        .slice(0, 5)
        .map((f, i) => `${i + 1}. ${f.title}\n   Priority: ${f.priority}\n   Blocks: ${f.blocksLabel}\n   Action: ${f.recommendedAction}\n   Evidence: ${f.evidence}`)
        .join('\n\n');

    case 'READY_FOR_BETA':
      return v.betaReady
        ? `Yes — beta review is reasonable.\n\n${v.betaReadyReason}\n\n${formatSummary(v)}`
        : `Not yet.\n\n${v.betaReadyReason}\n\nNext action: ${v.fixesNext[0]?.recommendedAction ?? 'Run Founder Testing and resolve warnings.'}`;

    case 'READY_TO_LAUNCH':
      return v.launchReady
        ? `Yes — verification supports launch/beta confidence.\n\n${v.launchReadyReason}\n\n${formatSummary(v)}`
        : `Not yet.\n\n${v.launchReadyReason}\n\nNext action: ${v.fixesNext[0]?.recommendedAction ?? 'Address critical fixes first.'}`;

    case 'SHOW_REPORT':
    case 'EXPLAIN_RESULTS':
      return [
        formatSummary(v),
        v.fixesNext.length
          ? `Top fix: ${v.fixesNext[0].title} — ${v.fixesNext[0].recommendedAction}`
          : 'No ranked fixes.',
        `Beta ready: ${v.betaReady ? 'yes' : 'no'}`,
        `Launch ready: ${v.launchReady ? 'yes' : 'no'}`,
        '',
        'Open Verification for the full grouped report.',
      ].join('\n');

    default:
      return formatSummary(v);
  }
}

export function resolveVerificationResultsResponse(message: string): string | null {
  const intent = matchVerificationResultsIntent(message);
  if (!intent) return null;
  return generateVerificationResultsResponse(intent);
}
