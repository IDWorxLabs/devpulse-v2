/**
 * Command Center founder sensemaking responses — Phase 24.9.8.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';

export type FounderSensemakingIntent =
  | 'WHAT_DOES_NOT_MAKE_SENSE'
  | 'WHERE_CONFUSION'
  | 'WHAT_TO_SIMPLIFY'
  | 'SCREEN_OVERLAP'
  | 'TRUST_RISKS'
  | 'IMPROVE_NEXT';

const MATCHERS: ReadonlyArray<{ intent: FounderSensemakingIntent; patterns: RegExp[] }> = [
  {
    intent: 'WHAT_DOES_NOT_MAKE_SENSE',
    patterns: [/^what(?:'s| does) not make sense\??$/i, /^what doesn'?t make sense\??$/i],
  },
  {
    intent: 'WHERE_CONFUSION',
    patterns: [
      /^where are users likely to get confused\??$/i,
      /^where might founders get confused\??$/i,
      /^what(?:'s| is) confusing\??$/i,
    ],
  },
  {
    intent: 'WHAT_TO_SIMPLIFY',
    patterns: [/^what should we simplify\??$/i, /^what can we simplify\??$/i],
  },
  {
    intent: 'SCREEN_OVERLAP',
    patterns: [/^what screens overlap\??$/i, /^which screens overlap\??$/i, /^do any screens overlap\??$/i],
  },
  {
    intent: 'TRUST_RISKS',
    patterns: [/^what hurts trust\??$/i, /^what are the trust risks\??$/i, /^what reduces trust\??$/i],
  },
  {
    intent: 'IMPROVE_NEXT',
    patterns: [
      /^what should we improve next\??$/i,
      /^what coherence issues should we fix\??$/i,
      /^top recommended upgrades\??$/i,
    ],
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

function currentSensemaking() {
  const workspace = buildProductWorkspaceSnapshot(loadValidatorScripts());
  return workspace.founderSensemaking;
}

export function matchFounderSensemakingIntent(message: string): FounderSensemakingIntent | null {
  const normalized = message.trim().replace(/\s+/g, ' ');
  for (const entry of MATCHERS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.intent;
    }
  }
  return null;
}

function formatFindings(
  items: ReturnType<typeof currentSensemaking>['findings'],
  limit = 5,
): string {
  if (!items.length) return 'No major coherence issues detected from current product state.';
  return items
    .slice(0, limit)
    .map(
      (f, i) =>
        `${i + 1}. [${f.severity}] ${f.whatDoesNotMakeSense}\n   Why it matters: ${f.whyItMatters}\n   Upgrade: ${f.recommendedUpgrade}`,
    )
    .join('\n\n');
}

function formatUpgrades(plan: ReturnType<typeof currentSensemaking>): string {
  if (!plan.recommendedUpgrades.length) {
    return plan.insufficientInfoReason ?? 'No upgrade recommendations yet — product coherence looks acceptable.';
  }
  return plan.recommendedUpgrades
    .slice(0, 6)
    .map((u, i) => `${i + 1}. [${u.priority}] ${u.title}\n   Expected impact: ${u.expectedImpact}`)
    .join('\n\n');
}

export function generateFounderSensemakingResponse(intent: FounderSensemakingIntent): string {
  const plan = currentSensemaking();
  if (!plan) {
    return 'Product coherence analysis is not available yet. Load the workspace and try again.';
  }

  const header = `Founder Sensemaking: ${plan.founderSensemakingScore}/100 | Product Coherence: ${plan.productCoherenceScore}/100`;

  if (plan.insufficientInfo) {
    return `${header}\n\n${plan.insufficientInfoReason}\n\nRun Founder Testing and open Verification for a fuller coherence read.`;
  }

  switch (intent) {
    case 'WHAT_DOES_NOT_MAKE_SENSE':
      return `${header}\n\nWhat doesn't make sense:\n${formatFindings(plan.findings, 6)}`;
    case 'WHERE_CONFUSION':
      return `${header}\n\nTop confusion risks:\n${
        plan.topConfusionRisks.length
          ? formatFindings(plan.topConfusionRisks, 4)
          : 'No HIGH confusion risks from current analysis.'
      }`;
    case 'WHAT_TO_SIMPLIFY':
      return `${header}\n\nSimplify these areas first:\n${formatFindings(
        plan.findings.filter((f) => f.type === 'REDUNDANCY' || f.type === 'CONFUSION'),
        5,
      )}`;
    case 'SCREEN_OVERLAP':
      return `${header}\n\nOverlapping destinations:\n${formatFindings(
        plan.findings.filter((f) => f.type === 'REDUNDANCY'),
        5,
      )}`;
    case 'TRUST_RISKS':
      return `${header}\n\nTrust risks:\n${
        plan.topTrustRisks.length
          ? formatFindings(plan.topTrustRisks, 4)
          : 'No major trust risks flagged.'
      }`;
    case 'IMPROVE_NEXT':
      return `${header}\n\nRecommended upgrades:\n${formatUpgrades(plan)}`;
    default:
      return `${header}\n\n${formatFindings(plan.findings, 4)}`;
  }
}

export function resolveFounderSensemakingResponse(message: string): string | null {
  const intent = matchFounderSensemakingIntent(message);
  if (!intent) return null;
  return generateFounderSensemakingResponse(intent);
}
