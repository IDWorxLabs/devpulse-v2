/**
 * Command Center change intelligence responses — Phase 24.9.6.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessChangeIntelligenceVisibility,
  getChangeIntelligenceHistory,
  recordWorkspaceChangeSnapshot,
} from '../change-intelligence-visibility/index.js';
import { buildProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';

export type ChangeIntelligenceIntent =
  | 'WHAT_CHANGED'
  | 'WHAT_IMPROVED'
  | 'WHAT_GOT_WORSE'
  | 'WHY_READINESS_CHANGED'
  | 'WHY_LAUNCH_DROPPED'
  | 'SINCE_LAST_TEST'
  | 'SUMMARIZE_CHANGES';

const MATCHERS: ReadonlyArray<{ intent: ChangeIntelligenceIntent; patterns: RegExp[] }> = [
  { intent: 'WHAT_CHANGED', patterns: [/^what changed\??$/i, /^what(?:'s| has) changed\??$/i] },
  { intent: 'WHAT_IMPROVED', patterns: [/^what improved\??$/i, /^what got better\??$/i] },
  { intent: 'WHAT_GOT_WORSE', patterns: [/^what got worse\??$/i, /^what regressed\??$/i] },
  {
    intent: 'WHY_READINESS_CHANGED',
    patterns: [/^why did readiness change\??$/i, /^why did the score change\??$/i],
  },
  {
    intent: 'WHY_LAUNCH_DROPPED',
    patterns: [/^why did launch readiness drop\??$/i, /^why did launch readiness decrease\??$/i],
  },
  {
    intent: 'SINCE_LAST_TEST',
    patterns: [/^what changed since my last test\??$/i, /^what changed since the last test\??$/i],
  },
  {
    intent: 'SUMMARIZE_CHANGES',
    patterns: [/^summarize recent changes\.?$/i, /^summarize changes\.?$/i],
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

function currentAssessment() {
  const history = getChangeIntelligenceHistory();
  if (history.length >= 2) {
    return assessChangeIntelligenceVisibility(history);
  }
  const workspace = buildProductWorkspaceSnapshot(loadValidatorScripts());
  recordWorkspaceChangeSnapshot(workspace, 'Command Center check');
  return assessChangeIntelligenceVisibility(getChangeIntelligenceHistory());
}

export function matchChangeIntelligenceIntent(message: string): ChangeIntelligenceIntent | null {
  const normalized = message.trim().replace(/\s+/g, ' ');
  for (const entry of MATCHERS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.intent;
    }
  }
  return null;
}

export function generateChangeIntelligenceResponse(intent: ChangeIntelligenceIntent): string {
  const assessment = currentAssessment();

  if (!assessment.hasSufficientHistory) {
    return `${assessment.insufficientHistoryReason ?? 'Insufficient history to compare changes.'}\n\nNext action: Run Founder Testing twice or refresh project surfaces after meaningful updates to build change history.`;
  }

  switch (intent) {
    case 'WHAT_CHANGED': {
      if (!assessment.recentChanges.length) {
        return 'No meaningful changes detected since the last snapshot.\n\nNext action: Continue building, then run Founder Testing again to capture the next change set.';
      }
      return assessment.recentChanges
        .slice(0, 6)
        .map((c) => `• ${c.title}: ${c.description} (${c.direction}, ${c.severity})\n  Evidence: ${c.evidence}`)
        .join('\n\n');
    }
    case 'WHAT_IMPROVED':
      if (!assessment.improvements.length) {
        return 'No improvements detected since the last snapshot.';
      }
      return assessment.improvements
        .map((c) => `• ${c.title} — ${c.evidence}`)
        .join('\n');
    case 'WHAT_GOT_WORSE':
      if (!assessment.regressions.length) {
        return 'No regressions detected since the last snapshot.';
      }
      return assessment.regressions
        .map((c) => `• ${c.title} — ${c.evidence}\n  Review first: ${c.description}`)
        .join('\n\n');
    case 'WHY_READINESS_CHANGED':
      return assessment.readinessMovementExplanation ?? assessment.scoreMovementExplanation ?? 'Readiness did not move meaningfully since the last snapshot.';
    case 'WHY_LAUNCH_DROPPED': {
      const launchRegression = assessment.regressions.find((c) => /launch/i.test(c.title));
      if (launchRegression) {
        return `${launchRegression.description}\n\nEvidence: ${launchRegression.evidence}`;
      }
      return assessment.readinessMovementExplanation ?? 'Launch readiness did not drop in the latest comparison.';
    }
    case 'SINCE_LAST_TEST': {
      const testChanges = assessment.recentChanges.filter((c) =>
        /verification|founder|preview|running|readiness/i.test(`${c.title} ${c.category}`),
      );
      if (!testChanges.length) {
        return 'No meaningful product changes detected since the last recorded snapshot.';
      }
      return testChanges.map((c) => `• ${c.title}: ${c.evidence}`).join('\n');
    }
    case 'SUMMARIZE_CHANGES':
      return [
        `${assessment.impactSummary.improvementCount} improvements`,
        `${assessment.impactSummary.regressionCount} regressions`,
        `${assessment.impactSummary.newCount} new updates`,
        '',
        'Review first:',
        ...assessment.recommendedReviewOrder.slice(0, 3).map((r, i) => `${i + 1}. ${r}`),
      ].join('\n');
    default:
      return assessment.recentChanges.map((c) => c.title).join('; ') || 'No changes detected.';
  }
}

export function resolveChangeIntelligenceResponse(message: string): string | null {
  const intent = matchChangeIntelligenceIntent(message);
  if (!intent) return null;
  return generateChangeIntelligenceResponse(intent);
}
