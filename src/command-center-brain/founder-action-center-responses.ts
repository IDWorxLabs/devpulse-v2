/**
 * Command Center founder action center responses — Phase 24.9.7.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessFounderActionCenter } from '../founder-action-center/index.js';
import { buildProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';

export type FounderActionCenterIntent =
  | 'WHAT_SHOULD_I_DO_NEXT'
  | 'WHAT_IS_MOST_IMPORTANT'
  | 'WHAT_SHOULD_I_REVIEW'
  | 'WHAT_IS_BLOCKING_ME'
  | 'HIGHEST_IMPACT_ACTION'
  | 'FOCUS_NEXT'
  | 'PRIORITY_LIST'
  | 'WHAT_CAN_AIDEVENGINE_DO';

const MATCHERS: ReadonlyArray<{ intent: FounderActionCenterIntent; patterns: RegExp[] }> = [
  {
    intent: 'WHAT_SHOULD_I_DO_NEXT',
    patterns: [
      /^what should i do next\??$/i,
      /^what do i do next\??$/i,
      /^what(?:'s| is) my next step\??$/i,
    ],
  },
  {
    intent: 'WHAT_IS_MOST_IMPORTANT',
    patterns: [/^what is most important\??$/i, /^what matters most\??$/i, /^what should i focus on\??$/i],
  },
  {
    intent: 'WHAT_SHOULD_I_REVIEW',
    patterns: [/^what should i review\??$/i, /^what needs my review\??$/i],
  },
  {
    intent: 'WHAT_IS_BLOCKING_ME',
    patterns: [/^what is blocking me\??$/i, /^what(?:'s| is) blocking (?:me|us)\??$/i, /^what am i blocked by\??$/i],
  },
  {
    intent: 'HIGHEST_IMPACT_ACTION',
    patterns: [
      /^what action has the highest impact\??$/i,
      /^highest impact action\??$/i,
      /^what has the biggest impact\??$/i,
    ],
  },
  {
    intent: 'FOCUS_NEXT',
    patterns: [
      /^what should aidevengine focus on next\??$/i,
      /^what should ai dev engine focus on next\??$/i,
    ],
  },
  {
    intent: 'PRIORITY_LIST',
    patterns: [/^give me a priority list\.?$/i, /^priority list\??$/i, /^show my priorities\??$/i],
  },
  {
    intent: 'WHAT_CAN_AIDEVENGINE_DO',
    patterns: [
      /^what can aidevengine do for me right now\??$/i,
      /^what can ai dev engine do for me\??$/i,
      /^what can you do for me right now\??$/i,
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

function currentActionCenter() {
  const workspace = buildProductWorkspaceSnapshot(loadValidatorScripts());
  return workspace.founderActionCenter ?? assessFounderActionCenter(workspace);
}

export function matchFounderActionCenterIntent(message: string): FounderActionCenterIntent | null {
  const normalized = message.trim().replace(/\s+/g, ' ');
  for (const entry of MATCHERS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.intent;
    }
  }
  return null;
}

function formatRecommended(plan: ReturnType<typeof currentActionCenter>): string {
  const step = plan.recommendedNextStep;
  if (!step) {
    return plan.insufficientInfoReason ?? 'No recommended next step is available from current product state.';
  }
  return [
    `Recommended next step (${step.priority}): ${step.title}`,
    `Type: ${step.type.replace('_ACTION', '').toLowerCase()}`,
    `Reason: ${step.reason}`,
    `Expected impact: ${step.expectedImpact}`,
    `Evidence: ${step.evidence}`,
  ].join('\n');
}

function formatTopActions(plan: ReturnType<typeof currentActionCenter>, limit = 5): string {
  if (!plan.topActions.length) {
    return plan.insufficientInfoReason ?? 'No actions identified from current product state.';
  }
  return plan.topActions
    .slice(0, limit)
    .map((a, i) => `${i + 1}. [${a.priority}] ${a.title} (${a.type.replace('_ACTION', '')})\n   Why: ${a.rationale}`)
    .join('\n\n');
}

function formatBlockers(plan: ReturnType<typeof currentActionCenter>): string {
  if (!plan.blockers.length) return 'No blockers detected from current product state.';
  return (
    'Blockers from current product state:\n' +
    plan.blockers
      .map((b, i) => `${i + 1}. ${b.title}\n   Impact: ${b.impact}\n   Evidence: ${b.evidence}`)
      .join('\n\n')
  );
}

function formatOpportunities(plan: ReturnType<typeof currentActionCenter>): string {
  if (!plan.opportunities.length) return 'No immediate opportunities surfaced — keep building and re-run Founder Testing.';
  return plan.opportunities.map((o, i) => `${i + 1}. ${o.title} — ${o.detail}`).join('\n');
}

export function generateFounderActionCenterResponse(intent: FounderActionCenterIntent): string {
  const plan = currentActionCenter();

  if (plan.insufficientInfo) {
    return `${plan.insufficientInfoReason}\n\nI will not fabricate actions without enough product state. Run Founder Testing and open Live Preview, then ask again.`;
  }

  switch (intent) {
    case 'WHAT_SHOULD_I_DO_NEXT':
      return `${formatRecommended(plan)}\n\nOther top actions:\n${formatTopActions(plan, 3)}`;
    case 'WHAT_IS_MOST_IMPORTANT':
      return plan.recommendedNextStep
        ? `Most important right now (${plan.recommendedNextStep.priority}): ${plan.recommendedNextStep.title}\n\n${plan.recommendedNextStep.reason}`
        : formatTopActions(plan, 1);
    case 'WHAT_SHOULD_I_REVIEW':
      return [
        'Review priorities from current product state:',
        formatTopActions(
          {
            ...plan,
            topActions: plan.topActions.filter((a) => a.type === 'REVIEW_ACTION' || a.type === 'APPROVAL_ACTION'),
          },
          5,
        ),
        plan.blockers.length ? `\nBlockers to review first:\n${formatBlockers(plan)}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
    case 'WHAT_IS_BLOCKING_ME':
      return formatBlockers(plan);
    case 'HIGHEST_IMPACT_ACTION':
      return plan.executionImpact.length
        ? `${formatRecommended(plan)}\n\nCompleting top actions is expected to:\n${plan.executionImpact.map((i) => `• ${i}`).join('\n')}`
        : formatRecommended(plan);
    case 'FOCUS_NEXT':
      return `AiDevEngine should focus on: ${plan.recommendedNextStep?.title ?? plan.topActions[0]?.title ?? 'gathering more product state'}\n\n${plan.recommendedNextStep?.reason ?? plan.topActions[0]?.rationale ?? ''}`;
    case 'PRIORITY_LIST':
      return `Action center state: ${plan.stateLabel}\n\n${formatTopActions(plan, 8)}`;
    case 'WHAT_CAN_AIDEVENGINE_DO':
      return [
        'AiDevEngine can help with these executable next steps right now:',
        formatTopActions(
          { ...plan, topActions: plan.topActions.filter((a) => a.executable) },
          5,
        ),
        plan.opportunities.length ? `\nOpportunities:\n${formatOpportunities(plan)}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
    default:
      return formatRecommended(plan);
  }
}

export function resolveFounderActionCenterResponse(message: string): string | null {
  const intent = matchFounderActionCenterIntent(message);
  if (!intent) return null;
  return generateFounderActionCenterResponse(intent);
}
